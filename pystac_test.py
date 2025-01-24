import json
import pystac
import requests
import pystac_client
from pystac_client import Client

url1 = "http://localhost:8000"
url2 = "https://ai-extensions-stac.terradue.com/"

try:
    catalog = Client.open(url2)
    print("Verbindung zu STAC-API erfolgreich!")
except Exception as e:
    print(f"Fehler beim Verbinden mit der STAC-API: {e}")

# Alle Items abrufen, indem wir durch die Collections im Katalog iterieren
all_items = []

# Iteriere durch alle Collections im Katalog
for collection in catalog.get_children():
    print(f"Collection ID: {collection.id}")
    
    # Alle Items der Collection abrufen (nur für Collections, nicht für einzelne Items)
    for item in collection.get_all_items():
        all_items.append(item)

# Anzahl der Items ausgeben
print(f"Anzahl der Items im Katalog: {len(all_items)}")

