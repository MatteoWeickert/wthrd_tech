from sqlalchemy import (
    Column, Integer, String, Boolean, BigInteger, JSON, ARRAY, Text, TIMESTAMP, ForeignKey, Float
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db import Base

class Catalog(Base):
    """
    Represents the 'catalogs' table in the database.
    """
    __tablename__ = "catalogs"

    id = Column(String(50), primary_key=True, index=True)
    type = Column(Text, nullable=False, default="Catalog")
    stac_version = Column(Text, nullable=False)
    stac_extensions = Column(ARRAY(Text))  # List of extension identifiers
    title = Column(Text)
    description = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    # conformsTo = Column(JSON)

    collections = relationship("Collection", back_populates="catalog")

class Collection(Base):
    """
    Represents the 'collections' table in the database.
    """
    __tablename__ = "collections"

    id = Column(String(50), primary_key=True, index=True)
    type = Column(String, nullable=False, default="Collection")
    stac_version = Column(String, nullable=False)
    stac_extensions = Column(ARRAY(String))  # List of extension identifiers
    title = Column(String)
    description = Column(Text, nullable=False)
    license = Column(String, nullable=False)
    extent = Column(JSON, nullable=False)
    catalog_id = Column(String, ForeignKey("catalogs.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    creator_username = Column(String)
    ispublic = Column(Boolean)    
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    catalog = relationship("Catalog", back_populates="collections")
    items = relationship("Item", back_populates="collection")

class Item(Base):
    """
    Represents the 'items' table in the database.
    """
    __tablename__ = "items"

    id = Column(String(50), primary_key=True, index=True)
    type = Column(String, nullable=False, default="Feature")
    stac_version = Column(String, nullable=False)
    stac_extensions = Column(ARRAY(String))  # List of extension identifiers
    geometry = Column(JSON)  # GeoJSON geometry object
    bbox = Column(ARRAY(Float))  # Bounding Box (Array of coordinates)
    properties = Column(JSON, nullable=False)
    links = Column(ARRAY(JSON), nullable=False)
    assets = Column(JSON, nullable=False)
    collection_id = Column(String, ForeignKey("collections.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    creator_username = Column(String)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    color = Column(String, nullable=True)

    collection = relationship("Collection", back_populates="items")

class User(Base):
    """
    Represents the 'users' table in the database.
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True)
    prename = Column(String)
    lastname = Column(String)
    email = Column(String, unique=True)
    hashed_password = Column(String)
    created_collections = Column(JSON)
    created_items = Column(JSON)
