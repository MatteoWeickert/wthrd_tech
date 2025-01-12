# Datei zur Implementierung der Eingabe und Antwort Restriktionen an die Datenbank
# SQLAlchmey macht Vorgaben für die Datenbank (Eigenschaften etc.), Pydantic prüft die Eingaben des Nutzers an FastAPI und die Rückgabe an den Nutzer

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
from datetime import datetime

class ItemCreate(BaseModel):
    id: str = Field(..., min_length=1, description="The id cannot be empty")
    type: str = Field("Feature", const=True, description="The type must always be 'Feature'")  # "type" muss immer "Feature" sein
    stac_version: str = Field(..., min_length=1, description="The stac_version cannot be empty")  # ... bedeutet, dass das Feld erforderlich ist
    stac_extensions: List[str]
    geometry: Dict[str, Any] = Field(..., description="The geometry cannot be empty")
    bbox: List[float] = Field(..., min_items=4, max_items=4, description="Bounding box must have 4 values [west, south, east, north]")
    properties: Dict[str, Any] = Field(..., description="The properties cannot be empty")
    links: Dict[str, Any] = Field(..., description="The links cannot be empty")
    assets: Dict  # TODO
    collection_id: str
    created_at: datetime
    updated_at: datetime
    color: Optional[str] = Field(None, description="The given HEX color code is invalid.")

    @validator("geometry")
    def validate_geometry(cls, value):
        # Prüfen, ob die benötigten Schlüssel vorhanden sind
        if "type" not in value or "coordinates" not in value:
            raise ValueError("The geometry must have 'type' and 'coordinates' keys.")

        # Prüfen, ob der Wert von 'type' ein gültiger GeoJSON-Typ ist
        valid_types = {"Point", "LineString", "Polygon", "MultiPoint", "MultiLineString", "MultiPolygon", "GeometryCollection"}
        if value["type"] not in valid_types:
            raise ValueError(f"Invalid geometry type: {value['type']}. Must be one of {valid_types}.")

        # Prüfen, ob "coordinates" eine Liste ist
        if not isinstance(value["coordinates"], list):
            raise ValueError("The 'coordinates' key must contain a list.")

        return value

    @validator("properties")
    def validate_properties(cls, value):
        required_keys = ["datetime", "mlm:name", "mlm:architecture", "mlm:tasks", "mlm:input", "mlm:output"]
        missing_keys = [key for key in required_keys if key not in value]
        if missing_keys:
            raise ValueError(f"Properties must contain the following keys: {', '.join(missing_keys)}.")

        if not isinstance(value["mlm:name"], str):
            raise ValueError(f"Invalid value for 'mlm:name'. It must be a string.")

        return value
    
    @validator("color")
    def validate_color(cls, value):
        if value is not None:
            hex_pattern = r"^#(?:[0-9a-fA-F]{3}){1,2}$"
            if not re.match(hex_pattern, value):
                raise ValueError("Invalid color format. Must be a HEX color code like #RRGGBB.")
        return value
    
    # "links"-validation: falsch, weil links kein dict sein dürfen, sondern ein array sein müssen. !!!ÄNDERN!!!

    # @validator("links")
    # def validate_links(cls, value):
    #     if "href" not in value or "rel" not in value:
    #         raise ValueError("The links must have 'href' and 'rel' keys.")

    #     # Prüfen, ob beide Werte Strings sind
    #     if not isinstance(value["href"], str):
    #         raise ValueError(f"Invalid value for 'href'. It must be a string.")
    #     if not isinstance(value["rel"], str):
    #         raise ValueError(f"Invalid value for 'rel'. It must be a string.")

    #     return value
