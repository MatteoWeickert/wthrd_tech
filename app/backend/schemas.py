# Datei zur Implementierung der Eingabe und Antwort Restriktionen an die Datenbank
# SQLAlchmey macht Vorgaben für die Datenbank (Eigenschaften etc.), Pydantic prüft die Eingaben des Nutzers an FastAPI und die Rückgabe an den Nutzer

from pydantic import BaseModel, Field, validator
import re
from typing import List, Dict, Any, Optional
from datetime import datetime

class Asset(BaseModel):
    href: str = Field(..., description="URI to the asset object. Relative and absolute URIs are allowed.")
    title: Optional[str] = Field(None, description="Displayed title for clients and users.")
    description: Optional[str] = Field(None, description="A description of the Asset providing additional details.")
    type: Optional[str] = Field(None, description="Media type of the asset.")
    roles: Optional[List[str]] = Field(None, description="The semantic roles of the asset.")

    @validator("href")
    def validate_href(cls, value):
        if not isinstance(value, str) or not value.strip():
            raise ValueError("The 'href' field must be a non-empty string.")
        return value

    def to_dict(self):  
        return self.dict()

class ItemCreate(BaseModel):
    id: str = Field(..., min_length=1, description="The id cannot be empty")
    type: str = Field("Feature", const=True, description="The type must always be 'Feature'")  # "type" muss immer "Feature" sein
    stac_version: str = Field(..., min_length=1, description="The stac_version cannot be empty")  # ... bedeutet, dass das Feld erforderlich ist
    stac_extensions: List[str]
    geometry: Dict[str, Any] = Field(..., description="The geometry cannot be empty")
    bbox: List[float] = Field(..., min_items=4, max_items=4, description="Bounding box must have 4 values [west, south, east, north]")
    properties: Dict[str, Any] = Field(..., description="The properties cannot be empty")
    links: List[Dict] = Field(..., description="The links cannot be empty")
    assets: Dict[str, Asset] = Field(..., description="Dictionary of asset objects that can be downloaded, each with a unique key.")
    collection_id: str
    created_at: datetime
    updated_at: datetime
    color: str = Field(..., description="The given HEX color code is invalid.")

    @validator("geometry")
    def validate_geometry(cls, value):
        # Prüfen, ob die benötigten Schlüssel vorhanden sind
        if "type" not in value or "coordinates" not in value:
            raise ValueError("The geometry must have 'type' and 'coordinates' keys.")

        # Prüfen, ob der Wert von 'type' ein gültiger GeoJSON-Typ ist
        valid_types = {"Point", "LineString", "Polygon", "MultiPoint", "MultiLineString", "MultiPolygon", "GeometryCollection"}
        if value["type"] not in valid_types:
            raise ValueError(f"{value['type']}. Type muss einer dieser Typen sein: {valid_types}.")

        # Prüfen, ob "coordinates" eine Liste ist
        if not isinstance(value["coordinates"], list):
            raise ValueError("The 'coordinates' key must contain a list.")

        return value

    @validator("properties")
    def validate_properties(cls, value):
        required_keys = ["datetime", "mlm:name", "mlm:architecture", "mlm:tasks", "mlm:input", "mlm:output"]
        missing_keys = [key for key in required_keys if key not in value]
        if missing_keys:
            raise ValueError(f"{', '.join(missing_keys)}.")

        if not isinstance(value["mlm:name"], str):
            raise ValueError(f"Invalid value for 'mlm:name'. It must be a string.")
        
        if not isinstance(value["mlm:batch_size_suggestion"], int):
            raise ValueError(f"Die Batchgröße muss ein Integer sein!")

        return value
    
    @validator("color")
    def validate_color(cls, value):
        if value is not None:
            hex_pattern = r"^#(?:[0-9a-fA-F]{3}){1,2}$"
            if not re.match(hex_pattern, value):
                raise ValueError("Invalid color format. Must be a HEX color code like #RRGGBB.")
        return value
    
    @validator("links")
    def validate_links(cls, value):
        if not isinstance(value, list):
            raise ValueError("'links' must be a list of objects.")

        for item in value:
            if not isinstance(item, dict):
                raise ValueError("Each item in 'links' must be an object (dict).")
            if 'href' not in item or 'rel' not in item:
                raise ValueError("Each object in 'links' must contain 'href' and 'rel' keys.")
            if not isinstance(item['href'], str):
                raise ValueError("The 'href' value in each object must be a string.")
            if not isinstance(item['rel'], str):
                raise ValueError("The 'rel' value in each object must be a string.")

        return value
    
    def dict(self, *args, **kwargs):
        # Überschreiben der dict-Methode, um assets zu serialisieren
        obj_dict = super().dict(*args, **kwargs)
        # Wandeln Sie alle Asset-Objekte in Dictionarys um
        obj_dict["assets"] = {key: asset.to_dict() for key, asset in self.assets.items()}
        return obj_dict
    
class CollectionCreate(BaseModel):
    id: str = Field(..., min_length=1, description="The id cannot be empty")
    type: str = Field("Collection", const=True, description="The type must always be 'Collection'")  # "type" muss immer "Feature" sein
    stac_version: str = Field(..., min_length=1, description="The stac_version cannot be empty")  # ... bedeutet, dass das Feld erforderlich ist
    stac_extensions: List[str]
    title: str
    description: str
    license: str
    extent: Dict
    links: List[Dict]
    catalog_id: str
    created_at: datetime
    updated_at: datetime

    @validator("title")
    def validate_title(cls, value):
        if not value or not value.strip():
            raise ValueError("The title must be provided and cannot be empty.")
        return value

    @validator("id")
    def validate_id(cls, value):
        if not value or not value.strip():
            raise ValueError("The id must be provided and cannot be empty.")
        # Hier könnte zusätzliche Logik hinzugefügt werden, um die Eindeutigkeit zu prüfen
        return value

    @validator("description")
    def validate_description(cls, value):
        if not value or not value.strip():
            raise ValueError("The description must be provided and cannot be empty.")
        return value

    @validator("license")
    def validate_license(cls, value):
        if not value or not value.strip():
            raise ValueError("The license must be provided and cannot be empty.")
        return value

class UserCreate(BaseModel):
    id: int = Field(...)
    username: str
    prename: str
    lastname: str
    email: str
    hashed_password: str
