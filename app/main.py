from fastapi import FastAPI, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
from sqlalchemy import create_engine, and_, or_ 
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from models import Item, Catalog, Collection
import os, datetime
from schemas import ItemCreate


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

origins = ["*"]
app.add_middleware(
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

@app.post("/addItem/")
def add_item(item: ItemCreate):
    db = SessionLocal()
    new_item = Item(
        id = item.id,
        type = item.type,
        stac_version = item.stac_version,
        stac_extensions = item.stac_extensions,
        geometry = item.geometry,
        bbox = item.bbox,
        properties = item.properties,
        links = item.links,
        assets = item.assets,
        collection_id = item.collection_id,
        created_at = item.created_at,
        updated_at = item.updated_at
    )
    try:
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        return {"message": "Item added successfully", "item_id": new_item.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error adding item: {str(e)}")


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
            "https://stac-extensions.github.io/mlm/v1.3.0/schema.json"
        ]
        
        # Wandelt das Catalog-Objekt in ein Dictionary (z. B. mit einer Methode oder mit vars())
        catalog_dict = catalog.__dict__.copy()
        
        # Füge das neue Attribut hinzu
        catalog_dict["conformsTo"] = conforms_to

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
    collections: Optional[List[str]] = Query(None),  # Der Wert in Klammern (hier: None) steht für die Default-Werte die eingesetzt werden, falls der Suchparameter nicht angegeben wird
    bbox: Optional[List[float]] = Query(None),  # [west, south, east, north]
    datetime_range: Optional[str] = Query(None),  # ISO8601 Zeitraum, z. B. "2023-01-01T00:00:00Z/2023-01-31T23:59:59Z"
    # intersects: Optional[dict] = Query(None),
    limit: Optional[int] = Query(10),
    # filter: theoretisch noch required
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
                    Item.bbox[0] <= east,  # west <= east
                    Item.bbox[2] >= west,  # east >= west
                    Item.bbox[1] <= north, # south <= north
                    Item.bbox[3] >= south # north >= south
                )
            )

        # Filter nach Zeit
        if datetime_range:
            try:
                if "/" in datetime_range:
                    start_time, end_time = datetime_range.split("/")
                    start_time = datetime.datetime.fromisoformat(start_time.replace("Z", ""))
                    end_time = datetime.datetime.fromisoformat(end_time.replace("Z", ""))
                else:
                    start_time = datetime.datetime.fromisoformat(datetime_range.replace("Z", ""))
                    end_time = start_time
                query = query.filter(
                    and_(
                        Item.properties["datetime"].astext.cast(datetime.datetime) >= start_time,
                        Item.properties["datetime"].astext.cast(datetime.datetime) <= end_time
                    )
                )
            except ValueError:
                raise HTTPException(
                    status_code=400, detail="Invalid datetime format. Use ISO8601 format."
                )
            
        # Begrenze die Anzahl der Ergebnisse
        query = query.limit(limit)

        # Ergebnisse abrufen
        items = query.all()

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
                "updated_at": item.updated_at
            }
            for item in items
        ]

        return {"type": "FeatureCollection", 
                "features": features, 
                "links": 
                [
                    {
                        "rel": "self",
                        "href": "http://localhost:8000/search"
                    }
                ]}
    
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
        return collections
    except Exception as e:
        return {"error: " + str(e)}
    finally:
        db.close()

@app.get("/collections/{collection_id}")
def get_collections(collection_id: str):
    db = SessionLocal()
    collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if collection is None:
        return {"error": "Collection not found"}
    return collection

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



