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

# print(api.title)
# print(api.links)
# for collection in api.get_all_collections():
#     print(collection)

collection_id = "MLM_Collection"  # Replace with your collection ID
search = api.search(collections=[collection_id])

for item in search.get_items():
    print(item.to_dict())