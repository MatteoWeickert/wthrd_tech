# Datei zur Implementierung der Eingabe und Antwort Restriktionen an die Datenbank
# SQLAlchmey macht Vorgaben für die Datenbank (Eigenschaften etc.), Pydantic prüft die Eingaben des Nutzers an FastAPI und die Rückgabe an den Nutzer

from pydantic import BaseModel
from typing import List, Optional

class ItemBase(BaseModel):
    name: str
    architecture: str
    tasks: List[str]
    framework: str
    input: dict
    output: dict

class ItemCreate(ItemBase):
    pretrained: bool
    accelerator: Optional[str] = None  # Optionales Feld

class ItemResponse(ItemBase):
    id: int
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True  # Ermöglicht die Konvertierung von SQLAlchemy-Objekten in Pydantic-Modelle
