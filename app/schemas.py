# Datei zur Implementierung der Eingabe und Antwort Restriktionen an die Datenbank
# SQLAlchmey macht Vorgaben für die Datenbank (Eigenschaften etc.), Pydantic prüft die Eingaben des Nutzers an FastAPI und die Rückgabe an den Nutzer

from pydantic import BaseModel
from typing import List
from datetime import datetime

class ItemCreate(BaseModel):
    id: str
    type: str
    stac_version: str
    stac_extensions: List[str]
    geometry: dict
    bbox: List[float]
    properties: dict
    links: dict
    assets: dict
    collection_id: str
    created_at: datetime
    updated_at: datetime
