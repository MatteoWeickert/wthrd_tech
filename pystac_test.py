import json
import pystac
import requests

from pystac_client import Client

try:
    api = Client.open("http://localhost:8000")
    print("Verbindung zu STAC-API erfolgreich!")
except Exception as e:
    print(f"Fehler beim Verbinden mit der STAC-API: {e}")

# Suchparameter definieren
search_params = {
    "collections": ["MLM_Collection"]
    # "bbox": [10.0, 50.0, 12.0, 52.0],  # Beispiel-Bounding Box
    # "datetime": "2023-01-01T00:00:00Z/2023-12-31T23:59:59Z",  # Beispielzeitraum
    # "limit": 5
}

# Suche durchführen
search = api.search(**search_params)

# Ergebnisse ausgeben
print("Suchergebnisse:")
for item in search.get_all_items():
    print(json.dumps(item.to_dict(), indent=2))