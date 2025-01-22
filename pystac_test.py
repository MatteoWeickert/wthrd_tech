import json
import pystac
import requests
import pystac_client
from pystac_client import Client

try:
    api = Client.open("http://localhost:8000")
    print("Verbindung zu STAC-API erfolgreich!")
except Exception as e:
    print(f"Fehler beim Verbinden mit der STAC-API: {e}")

print(api.title)
print(api.links)
for collection in api.get_all_collections():
    print(collection)

for item in api.get_all_items():
    print(item)