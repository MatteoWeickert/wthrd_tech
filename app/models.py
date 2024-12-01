from sqlalchemy import (
    Column, Integer, String, Boolean, BigInteger, JSON, ARRAY, Text, TIMESTAMP, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db import Base

class Catalog(Base):
    """
    Represents the 'catalogs' table in the database.
    """
    __tablename__ = "catalogs"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False, default="Catalog")
    stac_version = Column(String, nullable=False)
    stac_extensions = Column(ARRAY(String))  # List of extension identifiers
    title = Column(String)
    description = Column(Text, nullable=False)
    links = Column(JSON)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    collections = relationship("Collection", back_populates="catalog")

class Collection(Base):
    """
    Represents the 'collections' table in the database.
    """
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False, default="Collection")
    stac_version = Column(String, nullable=False)
    stac_extensions = Column(ARRAY(String))  # List of extension identifiers
    title = Column(String)
    description = Column(Text, nullable=False)
    license = Column(String, nullable=False)
    extent = Column(JSON, nullable=False)
    links = Column(JSON)
    catalog_id = Column(Integer, ForeignKey("catalogs.id"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    catalog = relationship("Catalog", back_populates="collections")
    items = relationship("Item", back_populates="collection")

class Item(Base):
    """
    Represents the 'items' table in the database.
    """
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False, default="Feature")
    stac_version = Column(String, nullable=False)
    stac_extensions = Column(ARRAY(String))  # List of extension identifiers
    geometry = Column(JSON)  # GeoJSON geometry object
    bbox = Column(ARRAY(BigInteger))  # Bounding Box (Array of coordinates)
    properties = Column(JSON, nullable=False)
    links = Column(JSON, nullable=False)
    assets = Column(JSON, nullable=False)
    collection_id = Column(Integer, ForeignKey("collections.id"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    collection = relationship("Collection", back_populates="items")

class Properties(Base):
    """
    Represents the 'properties' table in the database.
    """
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)  # REQUIRED: Model name
    architecture = Column(String(255), nullable=False)  # REQUIRED: Architecture name
    tasks = Column(ARRAY(Text), nullable=False)  # REQUIRED: List of tasks
    framework = Column(String(100), nullable=False)  # REQUIRED: Framework used
    framework_version = Column(String(50))  # Framework version
    memory_size = Column(BigInteger)  # Inference memory size in bytes
    total_parameters = Column(BigInteger)  # Total number of parameters
    pretrained = Column(Boolean, nullable=False, default=False)  # Pretrained or not
    pretrained_source = Column(Text)  # Source of pretraining
    batch_size_suggestion = Column(Integer)  # Suggested batch size
    accelerator = Column(String(100))  # Intended computational hardware
    accelerator_constrained = Column(Boolean, default=False)  # Accelerator-specific
    accelerator_summary = Column(Text)  # Accelerator description
    accelerator_count = Column(Integer)  # Number of accelerators required
    input = Column(JSON, nullable=False)  # REQUIRED: Input structure
    output = Column(JSON, nullable=False)  # REQUIRED: Output structure
    hyperparameters = Column(JSON)  # Model hyperparameters
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)  # Reference to the item that this record is associated with
    created_at = Column(TIMESTAMP, server_default=func.now())  # Auto-filled creation timestamp
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())  # Auto-updated timestamp

    item = relationship("Item", backref="models")
