from fastapi import FastAPI, HTTPException, Query, status, Depends
import logging
from fastapi.security import OAuth2PasswordBearer
from typing import Optional, List, Annotated
from pydantic import BaseModel
from sqlalchemy import create_engine, and_, or_ 
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from models import Item, Catalog, Collection, User
import os
import datetime as dt
from schemas import ItemCreate, CollectionCreate
import auth
from auth import get_current_user
from sqlalchemy.sql.expression import cast
from sqlalchemy.types import String
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Get database connection info from environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:password@postgres/metadata_database")

# Initialize SQLAlchemy components
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Create FastAPI instance
app = FastAPI()
app.include_router(auth.router)

origins = ["http://localhost:8082"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# UserDatabase
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token", auto_error=False)


@app.get("/user", status_code=status.HTTP_200_OK)
async def user(token: Optional[str] = Depends(oauth2_scheme)):
    if token is None:
        return {'username': None, 'id': None}
    
    current_user = await get_current_user(token)
    if current_user is None:
        return {'username': None, 'id': None}
    
    return current_user

# Example database operation
@app.get("/items")
def get_all_items():
    db = SessionLocal()
    try:
        items = db.query(Item).all()
        return items
    except Exception as e:
        return {"error: " + str(e)}
    finally:
        db.close()

@app.get("/items/{item_id}")
def get_item(item_id: str):
    db = SessionLocal()
    item = db.query(Item).filter(Item.id == item_id).first()
    if item is None:
        return {"error": "Item not found"}
    return item

@app.get("/catalogs")
def get_all_catalogs():
    db = SessionLocal()
    try:
        catalogs = db.query(Catalog).all()
        return catalogs
    except Exception as e:
        return {"error: " + str(e)}
    finally:
        db.close()

@app.get("/catalogs/{catalog_id}")
def get_catalogs(catalog_id: int):
    db = SessionLocal()
    catalog = db.query(Catalog).filter(Catalog.id == catalog_id).first()
    if catalog is None:
        return {"error": "Catalog not found"}
    return catalog

@app.post("/addCollection/")
def add_collection(collection: CollectionCreate, user: user_dependency):
    
    if user is None:
        raise HTTPException(status_code=401, detail="Authentifikation fehlgeschlagen")

    db = SessionLocal()
    
    try:
        # Serialisieren der Eingabedaten, einschließlich der Assets
        collection_data = collection.dict()  # Die überschriebenen `dict`-Methode sorgt für korrekte Serialisierung
        new_collection = Collection(
            id=collection_data["id"],
            type=collection_data["type"],
            stac_version=collection_data["stac_version"],
            stac_extensions=collection_data["stac_extensions"],
            title=collection_data["title"],
            description=collection_data["description"],
            license=collection_data["license"],
            extent=collection_data["extent"],
            catalog_id=collection_data["catalog_id"],
            created_at=collection_data["created_at"],
            updated_at=collection_data["updated_at"]
        )
        
        db.add(new_collection)
        db.commit()
        db.refresh(new_collection)
        return {"message": "Collection added successfully", "collection_id": new_collection.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error adding collection: {str(e)}")
    finally:
        db.close()



@app.post("/addItem/")
def add_item(item: ItemCreate, user: user_dependency):

    if user is None:
        raise HTTPException(status_code=401, detail="Authentifikation fehlgeschlagen")
    
    db = SessionLocal()
    
    try:
        # Serialisieren der Eingabedaten, einschließlich der Assets
        item_data = item.dict()  # Die überschriebenen `dict`-Methode sorgt für korrekte Serialisierung
        new_item = Item(
            id=item_data["id"],
            type=item_data["type"],
            stac_version=item_data["stac_version"],
            stac_extensions=item_data["stac_extensions"],
            geometry=item_data["geometry"],
            bbox=item_data["bbox"],
            properties=item_data["properties"],
            links=item_data["links"],
            assets=item_data["assets"],  # assets ist jetzt ein JSON-serialisierbares Dictionary
            collection_id=item_data["collection_id"],
            created_at=item_data["created_at"],
            updated_at=item_data["updated_at"],
            color=item_data["color"]
        )
        
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        return {"message": "Item added successfully", "item_id": new_item.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error adding item: {str(e)}")
    finally:
        db.close()


############################################################################################################
##### Core STAC API endpoints
############################################################################################################

@app.get("/")
def get_catalog():
    db = SessionLocal()
    try:
        catalog = db.query(Catalog).first()
        if catalog is None:
            return {"error": "Catalog not found"}
        # Fügt conformsTo dynamisch als Attribut hinzu
        conforms_to = [
            "http://api.stacspec.org/v1.0.0/core",
            "http://api.stacspec.org/v1.0.0/collections",
            "http://api.stacspec.org/v1.0.0/item-search",
            "http://api.stacspec.org/v1.0.0/features"
        ]

        collections = db.query(Collection).filter(Collection.catalog_id == catalog.id).all()
        links = [
            {"rel": "self", "type": "application/json", "href": "http://localhost:8000/"},
            {"rel": "root", "type": "application/json", "href": "http://localhost:8000/"},
            {"rel": "conformance", "type": "application/json", "href": "http://localhost:8000/conformance"},
            {"rel": "data", "type": "application/json", "href": "http://localhost:8000/collections"},
            {"rel": "search", "type": "application/geo+json",  "method": "POST", "href": "http://localhost:8000/search"},
            {"rel": "search", "type": "application/geo+json",  "method": "GET", "href": "http://localhost:8000/search"}
        ]
        for collection in collections:
            links.append({
                "rel": "child",
                "type": "application/json",
                "title": collection.title,
                "href": f"http://localhost:8000/collections/{collection.id}"
            })
        
        # Wandelt das Catalog-Objekt in ein Dictionary (z. B. mit einer Methode oder mit vars())
        catalog_dict = catalog.__dict__.copy()
        
        catalog_dict["conformsTo"] = conforms_to
        catalog_dict["links"] = links

        # Rückgabe als JSON-kompatible Daten
        return catalog_dict
    finally:
        db.close()

@app.get("/conformance")
def get_conformance():
    return JSONResponse(
        content={
            "conformsTo": [
                "http://api.stacspec.org/v1.0.0/core",
                "http://api.stacspec.org/v1.0.0/collections",
                "http://api.stacspec.org/v1.0.0/item-search",
                "http://api.stacspec.org/v1.0.0/features",
                "https://stac-extensions.github.io/mlm/v1.3.0/schema.json"
            ]
        }
    )


@app.get("/collections/{collection_id}/items/{item_id}")
def get_collection_item(collection_id: str, item_id: str):

    db = SessionLocal()
    try:
        item = db.query(Item).filter(Item.id == item_id, Item.collection_id == collection_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        return item
    finally:
        db.close()


# get "search"-Route is required

@app.get("/search")
def search(
    collections: Optional[str] = Query(
        None,
        description="Filter items by collections. Provide a comma-separated string of collection IDs (e.g., 'collection1,collection2')."
    ),
    bbox: Optional[str] = Query(
        None,
        description="Filter items by bounding box. Provide a bounding box as a comma-separated string in the format 'west,south,east,north'. Values are in degrees, with longitude between -180 and 180, and latitude between -90 and 90."
    ),
    datetime: Optional[str] = Query(
        None,
        description="Filter items by datetime. Provide a single ISO 8601 datetime string (e.g., '2022-01-01T00:00:00') or a range in the format 'start_datetime/end_datetime' (e.g., '2022-01-01T00:00:00/2022-01-31T23:59:59')."
    ),
    limit: Optional[int] = Query(
        10,
        description="Limit the number of items returned. Default is 10. Specify an integer value for the desired number of results."
    ),
    offset: Optional[int] = Query(
        0,
        description="Offset for pagination. Specify an integer to skip a certain number of results. Default is 0, which means starting from the first result."
    ),
):
    datetime_param = datetime  # Umbenennen des datetime-Parameters innerhalb der Funktion
    db = SessionLocal()
    try:
        query = db.query(Item)

        # Filter by collections
        if collections:
            collection_list = collections.split(",")
            query = query.filter(Item.collection_id.in_(collection_list))

        # Filter by bounding box
        # Filter by bounding box
        if bbox:
            try:
                logger.debug(f"Bounding box: {bbox}")
                # Parsen und Validieren der BBOX
                bbox_values = [float(value) for value in bbox.split(",")]
                logger.debug(f"Parsed bounding box values: {bbox_values}")
                
                if len(bbox_values) != 4:
                    logger.warning(f"Invalid bbox length: {len(bbox_values)}")
                    raise HTTPException(
                        status_code=400,
                        detail="Bounding box must have exactly 4 values: west,south,east,north"
                    )
                
                west, south, east, north = bbox_values

                # Wertebereiche prüfen
                if not (-180 <= west <= 180 and -90 <= south <= 90 and -180 <= east <= 180 and -90 <= north <= 90):
                    logger.warning(f"Invalid bbox values: {bbox_values}")
                    raise HTTPException(
                        status_code=400,
                        detail="Bounding box values must be within valid ranges: longitude (-180 to 180), latitude (-90 to 90)"
                    )

                # Filter anwenden
                logger.debug("Applying bbox filter")
                query = query.filter(
                    and_(
                        Item.bbox[1] <= east,
                        Item.bbox[3] >= west,
                        Item.bbox[2] <= north,
                        Item.bbox[4] >= south
                    )
                )

            except ValueError as ve:
                logger.error(f"ValueError while processing bbox: {ve}")
                raise HTTPException(
                    status_code=400,
                    detail="Bounding box values must be numeric and in the format: west,south,east,north"
                )
            
            except HTTPException as he:
                logger.error(f"HTTPException encountered: {he.detail}")
                raise he  # Weiterreichen der HTTPException
            
            except Exception as e:
                logger.error(f"Unexpected error while processing bbox: {e}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Unexpected server error: {str(e)}"
                )

        # Filter by datetime
        if datetime_param:
            try:
                logger.debug(f"Received datetime parameter: {datetime_param}")

                # Überprüfen, ob ein Zeitraum oder ein einzelner Zeitpunkt übergeben wurde
                if "/" in datetime_param:
                    logger.debug("Datetime parameter is a range")
                    start_time, end_time = datetime_param.split("/")
                    
                    # Entferne das 'Z' am Ende des Datumsstrings, wenn es vorhanden ist
                    start_time = start_time.replace("Z", "")
                    end_time = end_time.replace("Z", "")
                    
                    # Konvertiere Zeitstrings in datetime-Objekte (falls vorhanden)
                    start_time = dt.datetime.fromisoformat(start_time) if start_time else None
                    end_time = dt.datetime.fromisoformat(end_time) if end_time else None
                    
                    logger.debug(f"Parsed datetime range: start_time={start_time}, end_time={end_time}")
                else:
                    logger.debug("Datetime parameter is a single timestamp")
                    # Entferne das 'Z' am Ende des Datumsstrings, wenn es vorhanden ist
                    datetime_param = datetime_param.replace("Z", "")
                    
                    start_time = dt.datetime.fromisoformat(datetime_param)
                    end_time = start_time
                    
                    logger.debug(f"Parsed single datetime: start_time={start_time}, end_time={end_time}")

                # Filter für start_time und end_time anwenden
                if start_time and end_time:
                    logger.debug(f"Applying datetime range filter: start_time={start_time}, end_time={end_time}")
                    query = query.filter(
                        and_(
                            cast(Item.properties["datetime"], String) >= start_time.isoformat(),
                            cast(Item.properties["datetime"], String) <= end_time.isoformat()
                        )
                    )
                elif start_time:
                    logger.debug(f"Applying filter for start_time only: {start_time}")
                    query = query.filter(cast(Item.properties["datetime"], String) >= start_time.isoformat())
                elif end_time:
                    logger.debug(f"Applying filter for end_time only: {end_time}")
                    query = query.filter(cast(Item.properties["datetime"], String) <= end_time.isoformat())

            # Fehlerhafte Eingaben behandeln
            except ValueError as e:
                logger.error(f"ValueError while processing datetime: {e}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid datetime format. Use 'YYYY-MM-DDTHH:MM:SS'. Error: {e}"
                )
            except Exception as e:
                # Allgemeiner Fehler, aber mit spezifischer Fehlermeldung für datetime
                logger.error(f"Unexpected error while processing datetime: {e}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Unexpected error while processing datetime. Please check the datetime format and try again. Error: {str(e)}"
                )



        # Pagination
        query = query.offset(offset).limit(limit)

        # Get items
        items = query.all()
        if not items:
            return {"type": "FeatureCollection", "features": [], "links": []}

        # Build features
        features = [
            {
                "type": "Feature",
                "stac_version": "1.0.0",
                "stac_extensions": item.stac_extensions or [],
                "id": item.id,
                "geometry": item.geometry,
                "bbox": item.bbox,
                "properties": item.properties,
                "collection": item.collection_id,
                "assets": item.assets,
                "links": item.links or []
            }
            for item in items
        ]

        # Pagination links
        next_offset = offset + limit
        has_more_results = len(items) == limit
        query_params = f"&collections={collections}" if collections else ""
        query_params += f"&bbox={bbox}" if bbox else ""
        query_params += f"&datetime={datetime_param}" if datetime_param else ""
        query_params += f"&limit={limit}" if limit else ""
        query_params += f"&offset={offset}" if offset else ""

        links = [
            {"rel": "root", "type": "application/json", "href": "http://localhost:8000/"},
            {"rel": "self", "type": "application/geo+json", "href": f"http://localhost:8000/search?{query_params}"},
        ]
        if has_more_results:
            links.append({
                "rel": "next",
                "type": "application/geo+json",
                "href": f"http://localhost:8000/search?limit={limit}&offset={next_offset}{query_params}"
            })
        logger.info(f"Number of results: {len(features)}")
        return {
            "type": "FeatureCollection",
            "features": features,
            "links": links
        }

    except Exception as e:
        print(f"Server error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal Server Error: {e}"
        )
    finally:
        db.close()


class SearchQuery(BaseModel):
    bbox: Optional[List[float]] = [-180,-90,180,90]
    datetime: Optional[str] = None
    collections: Optional[List[str]] = None
    ids: Optional[List[str]] = None
    limit: Optional[int] = 10

@app.post("/search")
async def search_items(query: SearchQuery):
    results = []
    db = SessionLocal()
    try:
        # Validate bbox if provided
        if query.bbox:
            if len(query.bbox) != 4:
                raise HTTPException(status_code=400, detail="bbox must contain exactly 4 values")
            
            west, south, east, north = query.bbox
            
            # Check if west is less than east and south is less than north
            if west >= east:
                raise HTTPException(status_code=400, detail="Western longitude must be less than eastern longitude")
            if south >= north:
                raise HTTPException(status_code=400, detail="Southern latitude must be less than northern latitude")
            
            # Check if values are within valid range
            if not (-180 <= west <= 180 and -180 <= east <= 180):
                raise HTTPException(status_code=400, detail="Longitude values must be between -180 and 180")
            if not (-90 <= south <= 90 and -90 <= north <= 90):
                raise HTTPException(status_code=400, detail="Latitude values must be between -90 and 90")

        items_all = db.query(Item).all()
        for item in items_all:
            if query.collections and item.collection_id not in query.collections:
                continue
            if query.ids and item.id not in query.ids:
                continue
            if query.bbox:
                item_bbox = item.bbox
                if not (
                    item_bbox[0] <= query.bbox[2] and  # west <= east
                    item_bbox[2] >= query.bbox[0] and  # east >= west
                    item_bbox[1] <= query.bbox[3] and  # south <= north
                    item_bbox[3] >= query.bbox[1]      # north >= south
                ):
                    print(f"Item mit der ID {item.id} wurde nicht hinzugefügt")
                    continue
            if query.datetime:
                item_time = item.properties["datetime"]
                if not item_time or not datetime_filter(item_time, query.datetime):
                    continue
            results.append(item)
    except HTTPException as he:
        raise he
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()
    
    print(f"Anzahl der Ergebnisse: {len(results)}")
    return {"type": "FeatureCollection", "features": results}

def datetime_filter(item_time, query_time_range):
    start, end = query_time_range.split("/")
    start = start if start != ".." else None
    end = end if end != ".." else None
    return (not start or item_time >= start) and (not end or item_time <= end)

@app.get("/collections")
def get_all_collections():
    db = SessionLocal()
    try:
        collections = db.query(Collection).all()
        if collections is None:
            return {"error": "Collections not found"}
        for collection in collections:
            collection.links = [
                {"rel": "self", "type": "application/json", "href": f"http://localhost:8000/collections/{collection.id}"},
                {"rel": "items", "type": "application/json", "href": f"http://localhost:8000/collections/{collection.id}/items"},
                {"rel": "parent", "type": "application/json", "href": "http://localhost:8000/"},
                {"rel": "root", "type": "application/json", "href": "http://localhost:8000/"}
            ]
            items = db.query(Item).filter(Item.collection_id == collection.id).all()
            for item in items:
                collection.links.append(
                    {"rel": "item", "type": "application/json", "href": f"http://localhost:8000/collections/{collection.id}/items/{item.id}"}
                )
        return {"collections": collections}
    except Exception as e:
        return {"error: " + str(e)}
    finally:
        db.close()

@app.get("/collections/{collection_id}")
def get_collections(collection_id: str):
    db = SessionLocal()
    try:
        collection = db.query(Collection).filter(Collection.id == collection_id).first()
        if collection is None:
            return {"error": "Collection not found"}
        collection.links = [
                {"rel": "self", "type": "application/json", "href": f"http://localhost:8000/collections/{collection.id}"},
                {"rel": "items", "type": "application/json", "href": f"http://localhost:8000/collections/{collection.id}/items"},
                {"rel": "parent", "type": "application/json", "href": "http://localhost:8000/"},
                {"rel": "root", "type": "application/json", "href": "http://localhost:8000/"}
            ]
        items = db.query(Item).filter(Item.collection_id == collection.id).all()
        for item in items:
            collection.links.append(
                {"rel": "item", "type": "application/json", "href": f"http://localhost:8000/collections/{collection.id}/items/{item.id}"}
            )
        return collection
    except Exception as e:
        return {"error: " + str(e)}
    finally:
        db.close()


@app.get("/collections/{collection_id}/items")
def get_collection_items(collection_id: str):
    db = SessionLocal()
    try:
        items = db.query(Item).filter(Item.collection_id == collection_id).all()
        return {"type": "FeatureCollection", "features": items, "links": [
            {"rel": "self", "type": "application/json", "href": f"http://localhost:8000/collections/{collection_id}/items"},
            {"rel": "root", "type": "application/json", "href": "http://localhost:8000/"},
            {"rel": "parent", "type": "application/json", "href": f"http://localhost:8000/collections/{collection_id}"}]
            }
    finally:
        db.close()

@app.get("/queryables")
def get_queryables():
    return {
        "title": "Queryables for the STAC API",
        "type": "object",
        "properties": {
            "id": {
                "title": "ID",
                "type": "string",
                "description": "The unique identifier of an Item."
            },
            "bbox": {
                "title": "Bounding Box",
                "type": "array",
                "items": {"type": "number"},
                "minItems": 4,
                "maxItems": 6,
                "description": "A spatial bounding box for the search."
            },
            "datetime": {
                "title": "Datetime",
                "type": "string",
                "format": "date-time",
                "description": "The temporal range for the search."
            },
            "collections": {
                "title": "Collections",
                "type": "array",
                "items": {"type": "string"},
                "description": "A list of collection IDs to filter by."
            },
            "mlm:framework": {
                "title": "Machine Learning Framework",
                "type": "string",
                "description": "The machine learning framework used by the model (e.g., TensorFlow, PyTorch)."
            },
            "mlm:total_parameters": {
                "title": "Total Parameters",
                "type": "integer",
                "description": "The total number of parameters in the machine learning model."
            },
            "mlm:pretrained": {
                "title": "Pretrained",
                "type": "boolean",
                "description": "Indicates whether the model is pretrained."
            }
        }
    }



