from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from models import Item, Catalog, Collection, Properties
import os
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

@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI Server for the STAC Catalog!"}

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






# @app.post("/items/", response_model = ItemResponse)
# def add_new_item(item: ItemCreate):
#     db = SessionLocal()
#     new_item = add_item(db, item.dict())