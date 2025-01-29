# Description: Python-Beispielcode für die Nutzung des STAC für Machine Learning Modells (MLM)

import json
import requests
from pystac import Catalog

####################################################################################################
# STAC-Server-URL definieren
####################################################################################################
url = "http://localhost:8000"

####################################################################################################
# Katalog laden
####################################################################################################

try:
    catalog = Catalog.from_file(url)
    print("Katalog erfolgreich geladen")
except Exception as e:
    print(f"Fehler beim Laden des Katalogs: {e}")

####################################################################################################
# STAC-API-Features: `conformance` überprüfen
####################################################################################################

# try:
#     response = requests.get(f"{url}/conformance")
#     if response.status_code == 200:
#         conformance_info = response.json()
#         print("API Conformance Informationen:")
#         print(json.dumps(conformance_info, indent=4))
#     else:
#         print(f"Fehler beim Abrufen der Conformance-Daten: {response.status_code}")
# except Exception as e:
#     print(f"Fehler beim Abrufen der Conformance-Informationen: {e}")

####################################################################################################
# Collections abrufen und Informationen extrahieren
####################################################################################################

# try:
#     collections = catalog.get_collections()
#     print("Sammlungen im Katalog:")
#     for collection in collections:
#         collection.describe()
# except Exception as e:
#     print(f"Fehler beim Abrufen der Collections: {e}")

####################################################################################################
# Ein bestimmtes Collection-Element abrufen
####################################################################################################

# collection_id = "MLM_Collection" # Beispiel für eine Collection-ID
# try:
#     collection = catalog.get_child(collection_id)
#     print(f"Collection mit ID {collection_id} gefunden.")
#     collection.describe()
# except Exception as e:
#     print(f"Fehler beim Abrufen der Collection {collection_id}: {e}")

####################################################################################################
# Items aus einer Collection abrufen und Informationen extrahieren
####################################################################################################

# collection_id = "MLM_Collection"  # Beispiel für eine Collection-ID
# try:
#     collection = catalog.get_child(collection_id)
#     items = collection.get_all_items()
#     for item in items:
#         assets = {key: asset.to_dict() for key, asset in item.assets.items()}
#         item_summary = {
#             "ID": item.id,
#             "Bounding Box": item.bbox,
#             "Datetime": item.datetime.isoformat() if item.datetime else None,
#             "Properties": item.properties,
#             "Assets": assets,
#         }
#         print(json.dumps(item_summary, indent=4) )
# except Exception as e:
#     print(f"Fehler beim Abrufen der Items: {e}")

####################################################################################################
# Suche nach Items basierend auf unterschiedlichen Parametern
####################################################################################################

# bbox = [-180, -90, 180, 90]  # Beispiel einer Bounding Box
# datetime = "2020-01-01T00:00:00/2025-01-15T23:59:59" # Beispiel für einen Zeitbereich
# collections = ["MLM_Collection"]  # Beispiel für eine Collection-ID
# ids = ["solar_satlas_sentinel2"]  # Beispiel für eine Item-ID
# limit = 10  # Anzahl der zurückgegebenen Items

# search_query = {
#     "bbox": bbox,
#     "collections": collections,
#     "datetime": datetime,
#     "ids": ids,
#     "limit": limit
# }
# try:
#     response = requests.post(f"{url}/search", json=search_query)
#     if response.status_code == 200:
#         items = response.json().get('features', [])
#         print(json.dumps(items, indent=4))
#         print(f"Gefundene Items: {len(items)}")
#     else:
#         print(f"Fehler bei der Suche: {response.status_code} - {response.text}")
# except Exception as e:
#     print(f"Fehler bei der Suche nach Items: {e}")

####################################################################################################
# Assets eines Items abrufen
####################################################################################################

# item_id = "solar_satlas_sentinel2"  # Beispiel für eine Item-ID
# items = catalog.get_all_items()
# for item in items:
#     if item.id == item_id:
#         print(f"Assets für Item {item_id}:")
#         for key, asset in item.assets.items():
#             print(f"Asset: {key}")
#             print(json.dumps(asset.to_dict(), indent=4))