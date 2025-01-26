import json
import pystac
import requests
import pystac_client
from pystac_client import Client

url1 = "http://localhost:8000"
url2 = "https://ai-extensions-stac.terradue.com/"

try:
    catalog = Client.open(url1)
    print("Verbindung zu STAC-API erfolgreich!")
except Exception as e:
    print(f"Fehler beim Verbinden mit der STAC-API: {e}")

# Hole die Collection mit der ID "MLM_Collection"
col1 = catalog.get_child("MLM_Collection")

# Hole alle Items in der Collection
# items = col1.get_all_items()

# for item in items:
#   print(f"Item ID: {item.id}")

# Collection abrufen
collection = catalog.get_child("MLM_Collection", "MLM_Collection_2")

items = []
# Durch alle Items in allen Collections iterieren
for collection in catalog.get_children():
    print(f"Collection ID: {collection.id}")
    for item in collection.get_all_items():
        print(item.id)
        if item.id == "solar_satlas_sentinel2":
            items.append(item)

# Ausgabe der Items
# for item in items:
#     print(json.dumps(item.to_dict(), indent=4))


