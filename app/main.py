from fastapi import FastAPI, HTTPException, Query, status, Depends
from typing import Optional, List, Annotated
from pydantic import BaseModel
from sqlalchemy import create_engine, and_, or_ 
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from models import Item, Catalog, Collection, User
import os, datetime
from schemas import ItemCreate, CollectionCreate
import auth
from auth import get_current_user

from sqlalchemy.sql.expression import cast
from sqlalchemy.types import String


from fastapi.middleware.cors import CORSMiddleware

from fastapi.responses import JSONResponse
# from crud import get_items, get_catalogs, get_collections, get_properties
# from schemas import ItemCreate, ItemResponse

# Get database connection info from environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:password@postgres/metadata_database")

# Initialize SQLAlchemy components
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Create FastAPI instance
app = FastAPI()
app.include_router(auth.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


@app.get("/user", status_code=status.HTTP_200_OK)
async def user(current_user: dict = Depends(get_current_user)):
    if current_user is None:
        return {'username': 'null', 'id': 'null'}
    
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
            {"href": "http://localhost:8000/", "type": "application/json", "rel": "self"},
            {"href": "http://localhost:8000/", "type": "application/json", "rel": "root"},
            {"href": "http://localhost:8000/conformance", "type": "application/json", "rel": "conformance"},
            {"href": "http://localhost:8000/collections", "type": "application/json", "rel": "data"}
        ]
        for collection in collections:
            links.append({
                "rel": "child",
                "type": "application/json",
                "href": f"http://localhost:8000/collections/{collection.id}",
                "title": collection.title
            })
        
        # Wandelt das Catalog-Objekt in ein Dictionary (z. B. mit einer Methode oder mit vars())
        catalog_dict = catalog.__dict__.copy()
        
        catalog_dict["conformsTo"] = conforms_to
        # catalog_dict["links"] = links

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
        if item is None:
            return {"error": "Item not found"}
        return item
    finally:
        db.close()

# # Eingabeschema für die Suche
# class SearchRequest(BaseModel):
#     collections: Optional[List[str]] = None  # Eine Liste
#     bbox: Optional[List[float]] = None  # [west, south, east, north]
#     datetime: Optional[str] = None  # ISO8601 Zeitraum, z. B. "2023-01-01T00:00:00Z/2023-01-31T23:59:59Z"
#     intersects: Optional[dict] = None
#     limit: Optional[int]

# get "search"-Route is required
@app.get("/search")
def search(
    collections: Optional[List[str]] = Query(None),
    bbox: Optional[List[float]] = Query(None),
    datetime_range: Optional[str] = Query(None),
    limit: Optional[int] = Query(10),
):
    db = SessionLocal()
    try:
        query = db.query(Item)

        # Filter nach Collections
        if collections:
            query = query.filter(Item.collection_id.in_(collections))
        
        # Filter nach Bounding Box
        if bbox:
            if len(bbox) != 4:
                raise HTTPException(
                    status_code=400, detail="Bounding box must have exactly 4 values: [west, south, east, north]"
                )
            west, south, east, north = bbox
            query = query.filter(
                and_(
                    Item.bbox[1] >= west,
                    Item.bbox[2] >= south,
                    Item.bbox[3] <= east,
                    Item.bbox[4] <= north
                )
            )

        # Filter nach Zeitspanne
        if datetime_range:
            try:
                if "/" in datetime_range:  # Geschlossene Zeitspanne
                    start_time, end_time = datetime_range.split("/")
                    start_time = datetime.datetime.strptime(start_time, "%Y-%m-%dT%H:%M:%S")
                    end_time = datetime.datetime.strptime(end_time, "%Y-%m-%dT%H:%M:%S")
                else:  # Einzelzeitpunkt
                    start_time = datetime.datetime.strptime(datetime_range, "%Y-%m-%dT%H:%M:%S")
                    end_time = start_time
                
                # Debugging-Hilfen
                print(f"Startzeit: {start_time}, Endzeit: {end_time}")
                
                # Filter hinzufügen
                query = query.filter(
                    and_(
                        cast(Item.properties["datetime"], String) >= start_time.isoformat(),
                        cast(Item.properties["datetime"], String) <= end_time.isoformat()
                    )
                )
            except ValueError as e:
                raise HTTPException(
                    status_code=400, detail=f"Invalid datetime format. Use 'YYYY-MM-DDTHH:MM:SS' format. Error: {e}"
                )

        # Begrenze die Anzahl der Ergebnisse
        query = query.limit(limit)

        # Ergebnisse abrufen
        items = query.all()
        if not items:
            return {"type": "FeatureCollection", "features": [], "links": []}

        # Ergebnisse in GeoJSON-FeatureCollection umwandeln
        features = [
            {
                "type": "Feature",
                "id": item.id,
                "stac_extensions": item.stac_extensions,
                "stac_version": item.stac_version,
                "geometry": item.geometry,
                "properties": item.properties,
                "bbox": item.bbox,
                "collection_id": item.collection_id,
                "links": item.links,
                "assets": item.assets,
                "created_at": item.created_at,
                "updated_at": item.updated_at,
            }
            for item in items
        ]

        return {
            "type": "FeatureCollection",
            "features": features,
            "links": [
                {
                    "rel": "self",
                    "href": "http://localhost:8000/search"
                }
            ]
        }

    except Exception as e:
        print(f"Server-Fehler: {e}")
        raise HTTPException(
            status_code=500, detail=f"Internal Server Error: {e}"
        )
    finally:
        db.close()


@app.post("/search")
def search_post(body: dict):
    return search(**body)

# @app.post("/search")
# def search(criteria: SearchRequest):
#     db = SessionLocal()
#     query = db.query(Item)
#     if(criteria.collections): 
#         query = query.filter(Item.collection_id.in_(criteria.collections))

#     # erhalte ergebnisse
#     items = query.all()

#     # JSON-kompatible Ausgabe erstellen
#     results = [
#         {
#             "id": item.id,
#             "type": item.type,
#             "stac_version": item.stac_version,
#             "stac_extensions": item.stac_extensions,
#             "geometry": item.geometry,
#             "bbox": item.bbox,
#             "properties": item.properties,
#             "links": item.links,
#             "assets": item.assets,
#             "collection_id": item.collection_id,
#             "created_at": item.created_at,
#             "updated_at": item.updated_at
#         }
#         for item in items
#     ]

#     return {"type": "FeatureCollection", "features": results}

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
                    {"rel": "child", "type": "application/json", "href": f"http://localhost:8000/collections/{collection.id}/items/{item.id}"}
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
                {"rel": "child", "type": "application/json", "href": f"http://localhost:8000/collections/{collection.id}/items/{item.id}"}
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
        return items
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



