from pystac_client import Client
import pystac

# Deine STAC API URL
stac_api_url = "http://localhost:8000"

# Erstellen eines Clients
client = Client.open(stac_api_url)

# Die Parameter für die Anfrage
collections = ["MLM_Collection"]  # Beispiel-Collections
bbox = [-180, -90, 180, 90]  # Beispiel-Bounding Box
limit = 10  # Anzahl der Ergebnisse
offset = 0  # Offset für Pagination

# Suche nach Items mit den angegebenen Parametern
search = client.search(
    collections=collections,
    bbox=bbox,
    limit=limit
)

# Durch die Ergebnisse iterieren
for item in search.items():
    print(f"Item ID: {item.id}")
    print(f"Item Collection: {item.collection_id}")
    print(f"Item BBox: {item.bbox}")
    print(f"Item Properties: {item.properties}")

# Optional: Wenn du alle Seiten (Paginationslinks) durchsuchen möchtest:
# Hier wird das Resultat durch alle Seiten iteriert, falls mehr als `limit` Ergebnisse vorhanden sind
search_results = list(search.items())

# Alle Items durchgehen und ausgeben
for item in search_results:
    print(f"Item ID: {item.id}")
