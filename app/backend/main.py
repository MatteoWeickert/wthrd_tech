from fastapi import FastAPI, HTTPException, Query, status, Depends
import logging
from fastapi.security import OAuth2PasswordBearer
from typing import Optional, List, Annotated
from pydantic import BaseModel, ValidationError
from sqlalchemy import create_engine, and_, or_ 
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import IntegrityError
from psycopg2.errors import ForeignKeyViolation, UniqueViolation
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

# Set up logging for debugging
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

# Configure CORS to allow requests from specific frontend origins
origins = ["http://localhost:8082",
           "http://localhost:8083"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependencies for authentication and database session
db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token", auto_error=False)


@app.get("/user", status_code=status.HTTP_200_OK)
async def user(token: Optional[str] = Depends(oauth2_scheme)):
    """
    Retrieves the currently authenticated user based on the provided token.
    If no token is provided or authentication fails, returns a default response.
    """
    if token is None:
        return {'username': None, 'id': None}
    
    current_user = await get_current_user(token)
    if current_user is None:
        return {'username': None, 'id': None}
    
    return current_user

@app.get("/items")
def get_all_items():
    """
    Retrieves all items from the database.
    """
    db = SessionLocal()
    try:
        items = db.query(Item).all()
        return items
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

@app.get("/items/{item_id}")
def get_item(item_id: str):
    """
    Retrieves a single item by its ID.
    If the item does not exist, returns an error.
    """
    db = SessionLocal()
    item = db.query(Item).filter(Item.id == item_id).first()
    if item is None:
        return {"error": "Item not found"}
    return item

@app.get("/catalogs")
def get_all_catalogs():
    """
    Retrieves all catalogs from the database.
    """
    db = SessionLocal()
    try:
        catalogs = db.query(Catalog).all()
        return catalogs
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

@app.get("/catalogs/{catalog_id}")
def get_catalogs(catalog_id: int):
    """
    Retrieves a single catalog by its ID.
    If the catalog does not exist, returns an error.
    """
    db = SessionLocal()
    catalog = db.query(Catalog).filter(Catalog.id == catalog_id).first()
    if catalog is None:
        return {"error": "Catalog not found"}
    return catalog

@app.post("/addCollection/")
def add_collection(collection: CollectionCreate, user: user_dependency):
    """
    Adds a new collection to the database.
    Ensures the user is authenticated and handles errors such as duplicate IDs.
    """
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication failed")

    db = SessionLocal()
    
    try:
        # Convert input data to dictionary
        collection_data = collection.dict()
        
        # Create a new Collection object
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
            creator_id=user["id"],
            creator_username=user["username"],
            ispublic=collection_data["ispublic"],
            created_at=collection_data["created_at"],
            updated_at=collection_data["updated_at"]
        )
        
        db.add(new_collection)
        db.commit()
        db.refresh(new_collection)
        return {"message": "Collection added successfully", "collection_id": new_collection.id}
    
    except IntegrityError as e:
        if isinstance(e.orig, UniqueViolation):
            raise HTTPException(
                status_code=422, 
                detail=f"Collection with ID '{collection_data['id']}' already exists. Please choose a different ID."
            )
        else:
            raise HTTPException(status_code=500, detail=f"Error adding Collection: {str(e)}")
    
    except ValidationError as ve:
        print("Validation error:", ve.errors())
        raise HTTPException(status_code=422, detail=ve.errors())    
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error adding collection: {str(e)}")
    
    finally:
        db.close()

@app.post("/addItem/")
def add_item(item: ItemCreate, user: user_dependency):
    """
    Adds a new item to the database.
    Ensures the user is authenticated and handles errors such as foreign key violations.
    """
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication failed")
    
    db = SessionLocal()
    
    try:
        # Convert input data to dictionary
        item_data = item.dict()
        
        # Create a new Item object
        new_item = Item(
            id=item_data["id"],
            type=item_data["type"],
            stac_version=item_data["stac_version"],
            stac_extensions=item_data["stac_extensions"],
            geometry=item_data["geometry"],
            bbox=item_data["bbox"],
            properties=item_data["properties"],
            links=item_data["links"],
            assets=item_data["assets"],
            collection_id=item_data["collection_id"],
            creator_id=user["id"],
            creator_username=user["username"],
            created_at=item_data["created_at"],
            updated_at=item_data["updated_at"],
            color=item_data["color"]
        )
        
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        return {"message": "Item added successfully", "item_id": new_item.id}
    
    except IntegrityError as e:
        if isinstance(e.orig, ForeignKeyViolation):
            raise HTTPException(
                status_code=422, 
                detail=f"Collection with ID '{item_data['collection_id']}' does not exist. Please choose an existing one or create a new one."
            )
        elif isinstance(e.orig, UniqueViolation):
            raise HTTPException(
                status_code=422, 
                detail=f"Item with ID '{item_data['id']}' already exists. Please choose a different Item ID."
            )
        else:
            raise HTTPException(status_code=500, detail=f"Error adding item: {str(e)}")
    
    except ValidationError as ve:
        print("Validation error:", ve.errors())
        raise HTTPException(status_code=422, detail=ve.errors())    
    
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
    """
    Retrieves the STAC catalog from the database and returns it as a JSON response.
    If no catalog is found, an error message is returned.
    """
    db = SessionLocal()
    try:
        catalog = db.query(Catalog).first()
        if catalog is None:
            return {"error": "Catalog not found"}

        # STAC API conformance URLs
        conforms_to = [
            "http://api.stacspec.org/v1.0.0/core",
            "http://api.stacspec.org/v1.0.0/collections",
            "http://api.stacspec.org/v1.0.0/item-search",
            "http://api.stacspec.org/v1.0.0/features"
        ]

        # Retrieve all collections related to the catalog
        collections = db.query(Collection).filter(Collection.catalog_id == catalog.id).all()

        # Define catalog-level links
        links = [
            {"rel": "self", "type": "application/json", "href": "http://localhost:8000/"},
            {"rel": "root", "type": "application/json", "href": "http://localhost:8000/"},
            {"rel": "conformance", "type": "application/json", "href": "http://localhost:8000/conformance"},
            {"rel": "data", "type": "application/json", "href": "http://localhost:8000/collections"},
            {"rel": "search", "type": "application/geo+json", "method": "POST", "href": "http://localhost:8000/search"},
            {"rel": "search", "type": "application/geo+json", "method": "GET", "href": "http://localhost:8000/search"}
        ]

        # Add links for each collection
        for collection in collections:
            links.append({
                "rel": "child",
                "type": "application/json",
                "title": collection.title,
                "href": f"http://localhost:8000/collections/{collection.id}"
            })
        
        # Convert catalog object to a dictionary
        catalog_dict = catalog.__dict__.copy()
        catalog_dict["conformsTo"] = conforms_to
        catalog_dict["links"] = links

        return catalog_dict  # Return catalog as a JSON response
    finally:
        db.close()


@app.get("/conformance")
def get_conformance():
    """
    Returns the API's conformance to various STAC specifications.
    """
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
    """
    Retrieves a specific STAC item from a collection using collection ID and item ID.
    Returns the item if found, otherwise raises a 404 error.
    """
    db = SessionLocal()
    try:
        item = db.query(Item).filter(Item.id == item_id, Item.collection_id == collection_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        return item
    finally:
        db.close()


@app.get("/search")
def search(
    collections: Optional[str] = Query(None, description="Comma-separated list of collection IDs."),
    bbox: Optional[str] = Query(None, description="Bounding box filter (west,south,east,north)."),
    datetime: Optional[str] = Query(None, description="ISO 8601 datetime filter (single or range)."),
    limit: Optional[int] = Query(10, description="Number of results to return."),
    offset: Optional[int] = Query(0, description="Pagination offset."),
):
    """
    Searches for STAC items based on filters such as collections, bounding box, and datetime.
    Supports pagination using limit and offset parameters.
    """
    datetime_param = datetime  # Rename to avoid shadowing built-in datetime module
    db = SessionLocal()
    try:
        query = db.query(Item)

        # Filter by collections
        if collections:
            collection_list = collections.split(",")
            query = query.filter(Item.collection_id.in_(collection_list))

        # Filter by bounding box
        if bbox:
            try:
                logger.debug(f"Bounding box: {bbox}")
                bbox_values = [float(value) for value in bbox.split(",")]
                
                if len(bbox_values) != 4:
                    raise HTTPException(
                        status_code=400,
                        detail="Bounding box must have exactly 4 values: west,south,east,north"
                    )

                west, south, east, north = bbox_values

                # Ensure bounding box values are within valid latitude/longitude ranges
                if not (-180 <= west <= 180 and -90 <= south <= 90 and -180 <= east <= 180 and -90 <= north <= 90):
                    raise HTTPException(
                        status_code=400,
                        detail="Bounding box values must be within valid ranges."
                    )

                # Apply bounding box filter
                query = query.filter(
                    and_(
                        Item.bbox[1] <= east,
                        Item.bbox[3] >= west,
                        Item.bbox[2] <= north,
                        Item.bbox[4] >= south
                    )
                )

            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Bounding box values must be numeric."
                )

        # Filter by datetime
        if datetime_param:
            try:
                logger.debug(f"Received datetime parameter: {datetime_param}")

                if "/" in datetime_param:
                    start_time, end_time = datetime_param.split("/")
                    start_time = start_time.replace("Z", "")
                    end_time = end_time.replace("Z", "")
                    
                    start_time = dt.datetime.fromisoformat(start_time) if start_time else None
                    end_time = dt.datetime.fromisoformat(end_time) if end_time else None
                else:
                    datetime_param = datetime_param.replace("Z", "")
                    start_time = dt.datetime.fromisoformat(datetime_param)
                    end_time = start_time

                if start_time and end_time:
                    query = query.filter(
                        and_(
                            cast(Item.properties["datetime"], String) >= start_time.isoformat(),
                            cast(Item.properties["datetime"], String) <= end_time.isoformat()
                        )
                    )

            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid datetime format. Use 'YYYY-MM-DDTHH:MM:SS'."
                )

        # Apply pagination
        query = query.offset(offset).limit(limit)

        # Retrieve results
        items = query.all()
        if not items:
            return {"type": "FeatureCollection", "features": [], "links": []}

        # Construct STAC feature response
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

        # Create pagination links
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

        return {
            "type": "FeatureCollection",
            "features": features,
            "links": links
        }
    finally:
        db.close()

# Define the search query model with optional filters
class SearchQuery(BaseModel):
    bbox: Optional[List[float]] = [-180, -90, 180, 90]  # Default global bounding box
    datetime: Optional[str] = None  # Temporal filter
    collections: Optional[List[str]] = None  # Collection filter
    ids: Optional[List[str]] = None  # Item ID filter
    limit: Optional[int] = 10  # Limit on results

@app.post("/search")
async def search_items(query: SearchQuery):
    """
    Search for items based on bounding box, datetime, collections, and IDs.
    """
    results = []
    db = SessionLocal()
    try:
        # Validate bbox values
        if query.bbox:
            if len(query.bbox) != 4:
                raise HTTPException(status_code=400, detail="bbox must contain exactly 4 values")

            west, south, east, north = query.bbox
            if west >= east or south >= north:
                raise HTTPException(status_code=400, detail="Invalid bbox coordinates")
            if not (-180 <= west <= 180 and -180 <= east <= 180 and -90 <= south <= 90 and -90 <= north <= 90):
                raise HTTPException(status_code=400, detail="BBox values out of range")

        # Filter items from the database based on query parameters
        items_all = db.query(Item).all()
        for item in items_all:
            if query.collections and item.collection_id not in query.collections:
                continue
            if query.ids and item.id not in query.ids:
                continue
            if query.bbox:
                item_bbox = item.bbox
                if not (
                    item_bbox[0] <= query.bbox[2] and 
                    item_bbox[2] >= query.bbox[0] and  
                    item_bbox[1] <= query.bbox[3] and  
                    item_bbox[3] >= query.bbox[1]      
                ):
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
    
    return {"type": "FeatureCollection", "features": results}

def datetime_filter(item_time, query_time_range):
    """
    Filter items based on datetime range.
    """
    start, end = query_time_range.split("/")
    start = start if start != ".." else None
    end = end if end != ".." else None
    return (not start or item_time >= start) and (not end or item_time <= end)

@app.get("/collections")
def get_all_collections():
    """
    Retrieve all available collections with metadata and links.
    """
    db = SessionLocal()
    try:
        collections = db.query(Collection).all()
        if not collections:
            return {"error": "Collections not found"}
        
        for collection in collections:
            # Generate links for collection and its items
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

            # Compute spatial and temporal extent
            if items:
                west, south, east, north = items[0].bbox
                start_time = end_time = items[0].properties["datetime"]
                for item in items[1:]:
                    bbox = item.bbox
                    west, south, east, north = min(west, bbox[0]), min(south, bbox[1]), max(east, bbox[2]), max(north, bbox[3])
                    start_time = min(item.properties["datetime"], start_time)
                    end_time = max(item.properties["datetime"], end_time)
                
                collection.extent = {"spatial": [west, south, east, north], "temporal": [start_time, end_time]}
        
        return {"collections": collections}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

@app.get("/collections/{collection_id}")
def get_collections(collection_id: str):
    """
    Retrieve metadata for a specific collection.
    """
    db = SessionLocal()
    try:
        collection = db.query(Collection).filter(Collection.id == collection_id).first()
        if not collection:
            return {"error": "Collection not found"}
        
        # Generate links for the collection
        collection.links = [
            {"rel": "self", "type": "application/json", "href": f"http://localhost:8000/collections/{collection.id}"},
            {"rel": "items", "type": "application/json", "href": f"http://localhost:8000/collections/{collection.id}/items"},
            {"rel": "parent", "type": "application/json", "href": "http://localhost:8000/"},
            {"rel": "root", "type": "application/json", "href": "http://localhost:8000/"}
        ]
        
        # Retrieve items in the collection and update extent
        items = db.query(Item).filter(Item.collection_id == collection.id).all()
        for item in items:
            collection.links.append(
                {"rel": "item", "type": "application/json", "href": f"http://localhost:8000/collections/{collection.id}/items/{item.id}"}
            )
        
        if items:
            west, south, east, north = items[0].bbox
            start_time = end_time = items[0].properties["datetime"]
            for item in items[1:]:
                bbox = item.bbox
                west, south, east, north = min(west, bbox[0]), min(south, bbox[1]), max(east, bbox[2]), max(north, bbox[3])
                start_time = min(item.properties["datetime"], start_time)
                end_time = max(item.properties["datetime"], end_time)
            
            collection.extent = {"spatial": [west, south, east, north], "temporal": [start_time, end_time]}
        
        return collection
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

@app.get("/collections/{collection_id}/items")
def get_collection_items(collection_id: str):
    """
    Retrieve all items within a specific collection.
    """
    db = SessionLocal()
    try:
        items = db.query(Item).filter(Item.collection_id == collection_id).all()
        return {
            "type": "FeatureCollection",
            "features": items,
            "links": [
                {"rel": "self", "type": "application/json", "href": f"http://localhost:8000/collections/{collection_id}/items"},
                {"rel": "root", "type": "application/json", "href": "http://localhost:8000/"},
                {"rel": "parent", "type": "application/json", "href": f"http://localhost:8000/collections/{collection_id}"}
            ]
        }
    finally:
        db.close()

@app.get("/queryables")
def get_queryables():
    """
    Define the queryable properties for the STAC API.
    """
    return {
        "title": "Queryables for the STAC API",
        "type": "object",
        "properties": {
            "ids": {"title": "ID", "type": "string", "description": "Unique identifier of an item."},
            "bbox": {"title": "Bounding Box", "type": "array", "items": {"type": "number"}, "minItems": 4, "maxItems": 6},
            "datetime": {"title": "Datetime", "type": "string", "format": "date-time"},
            "collections": {"title": "Collections", "type": "array", "items": {"type": "string"}},
        }
    }