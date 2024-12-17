import json
import pystac
import requests

from pystac_client import Client

try:
    api = Client.open("http://localhost:8000")
    print("Verbindung zu STAC-API erfolgreich!")
except Exception as e:
    print(f"Fehler beim Verbinden mit der STAC-API: {e}")

# search = api.search(collections=["Collection for MLM"])




