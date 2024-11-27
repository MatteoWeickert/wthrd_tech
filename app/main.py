from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from models import Item
import os
from crud import get_items, add_item
from schemas import ItemCreate, ItemResponse

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
        items = get_items(db)
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

@app.post("/items/", response_model = ItemResponse)
def add_new_item(item: ItemCreate):
    db = SessionLocal()
    new_item = add_item(db, item.dict())