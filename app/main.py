from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from models import Item, Catalog, Collection
import os

from fastapi.middleware.cors import CORSMiddleware

from fastapi.responses import JSONResponse
# from crud import get_items, get_catalogs, get_collections, get_properties
# from schemas import ItemCreate, ItemResponse

# Get database connection info from environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:password@db/metadata_database")

# Initialize SQLAlchemy components
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Create FastAPI instance
app = FastAPI()

origins = ["*"]
app.add.middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

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
def get_item(item_id: int):
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

############################################################################################################
##### Core API endpoints
############################################################################################################

@app.get("/")
def get_catalog():
    db = SessionLocal()
    try:
        catalog = db.query(Catalog).first()
        if catalog is None:
            return {"error": "Catalog not found"}
        return catalog
    finally:
        db.close()

@app.get("/conformance")
def get_conformance():
    return JSONResponse(
        content={
            "conformsTo": [
                "http://api.stacspec.org/v1.0.0/core",
                "https://stac-extensions.github.io/mlm/v1.3.0/schema.json"
            ]
        }
    )


@app.get("/collections/{collection_id}/items/{item_id}")
def get_collection_item(collection_id: int, item_id: int):
    db = SessionLocal()
    try:
        item = db.query(Item).filter(Item.id == item_id, Item.collection_id == collection_id).first()
        if item is None:
            return {"error": "Item not found"}
        return item
    finally:
        db.close()

@app.get("/search")
def search():
    return {"message": "Search for items here"}

@app.get("/collections")
def get_all_collections():
    db = SessionLocal()
    try:
        collections = db.query(Collection).all()
        return collections
    except Exception as e:
        return {"error: " + str(e)}
    finally:
        db.close()

@app.get("/collections/{collection_id}")
def get_collections(collection_id: int):
    db = SessionLocal()
    collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if collection is None:
        return {"error": "Collection not found"}
    return collection

@app.get("/collections/{collection_id}/items")
def get_collection_items(collection_id: int):
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



