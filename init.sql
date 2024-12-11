CREATE TABLE catalogs (
    id VARCHAR(50) PRIMARY KEY,                          -- Eindeutige ID des Katalogs
    type TEXT NOT NULL CHECK (type = 'Catalog'),     -- Der Typ des Katalogs, sollte immer 'Catalog' sein
    stac_version TEXT NOT NULL,                      -- Die STAC-Version, die der Katalog implementiert
    stac_extensions TEXT[],                          -- Eine Liste von Erweiterungs-IDs, die der Katalog implementiert
    title TEXT,                                     -- Ein kurzer beschreibender Titel des Katalogs
    description TEXT NOT NULL,                      -- Eine detaillierte Beschreibung des Katalogs
    links jsonb,                                    -- Eine Liste von Links (Referenzen zu anderen Dokumenten)
    created_at TIMESTAMPTZ DEFAULT NOW(),            -- Erstellungsdatum des Katalogs
    updated_at TIMESTAMPTZ DEFAULT NOW()             -- Letztes Update des Katalogs
    -- CONSTRAINT links_href_rel_check CHECK (
    --     NOT EXISTS (
    --         SELECT 1
    --         FROM jsonb_array_elements(links) AS link  -- Zerlegt das JSON-Array in einzelne Link-Objekte
    --         WHERE 
    --             link->>'href' IS NULL OR            -- Überprüft, ob 'href' null ist
    --             link->>'rel' IS NULL                -- Überprüft, ob 'rel' null ist
    --     )
    -- )
);

CREATE TABLE collections (
    id VARCHAR(50) PRIMARY KEY,                          -- Eindeutige ID für die Collection
    type TEXT NOT NULL CHECK (type = 'Collection'),  -- Der Typ der Collection, sollte immer 'Collection' sein
    stac_version TEXT NOT NULL,                      -- Die STAC-Version, die von dieser Collection implementiert wird
    stac_extensions TEXT[],                          -- Eine Liste von Erweiterungs-IDs, die von dieser Collection implementiert werden
    title TEXT,                                     -- Ein kurzer beschreibender Titel der Collection
    description TEXT NOT NULL,                      -- Eine detaillierte Beschreibung der Collection
    license TEXT NOT NULL,                          -- Lizenz der Daten-Collection als SPDX Lizenzbezeichner oder Ausdruck
    extent JSONB NOT NULL,                          -- Spatial und Temporal Extent (als JSON-Objekt)
    -- summaries JSONB,                                -- Eine Karte von Zusammenfassungen als JSON-Objekt
    links JSONB,                                    -- Eine Liste von Links im JSON-Format (required: href und rel)
    catalog_ID VARCHAR(50) REFERENCES catalogs(id),                                -- Die ID des Katalogs, zu dem diese Collection gehört
    created_at TIMESTAMPTZ DEFAULT NOW(),            -- Erstellungsdatum der Collection
    updated_at TIMESTAMPTZ DEFAULT NOW()             -- Letztes Update der Collection
    -- CONSTRAINT links_href_rel_check CHECK (
    --     NOT EXISTS (
    --         SELECT 1
    --         FROM jsonb_array_elements(links) AS link  -- Zerlegt das JSON-Array in einzelne Link-Objekte
    --         WHERE 
    --             link->>'href' IS NULL OR            -- Überprüft, ob 'href' null ist
    --             link->>'rel' IS NULL                -- Überprüft, ob 'rel' null ist
    --     )
    -- )
);

CREATE TABLE items (
    id VARCHAR(50) PRIMARY KEY,                          -- Eindeutige ID des Items
    type TEXT NOT NULL CHECK (type = 'Feature'),     -- Der GeoJSON-Typ des Items, sollte immer 'Feature' sein
    stac_version TEXT NOT NULL,                      -- Die STAC-Version, die von diesem Item implementiert wird
    stac_extensions TEXT[],                          -- Eine Liste von Erweiterungs-IDs, die von diesem Item implementiert werden
    geometry GEOMETRY,                              -- Geometrie des Items, als GeoJSON Geometry Objekt gespeichert
    bbox NUMERIC[],                                  -- Bounding Box des Items, wenn Geometrie nicht null ist
    properties JSONB NOT NULL,                       -- Ein JSONB-Objekt, das zusätzliche Metadaten enthält
    links JSONB NOT NULL,                           -- Eine Liste von Links (im JSON-Format)
    assets JSONB NOT NULL,                          -- Eine Karte von Asset-Objekten (im JSON-Format) (required: href)
    collection_ID VARCHAR(50) REFERENCES collections(id),                               -- Die ID der Collection, auf die dieses Item verweist
    created_at TIMESTAMPTZ DEFAULT NOW(),            -- Erstellungsdatum des Items
    updated_at TIMESTAMPTZ DEFAULT NOW()             -- Letztes Update des Items
    -- CONSTRAINT assets_href_check CHECK (
    --     -- Überprüfen, ob jedes Asset im 'assets'-JSON ein 'href'-Feld enthält
    --     NOT EXISTS (
    --         SELECT 1 
    --         FROM jsonb_each(assets) AS asset(key, value) 
    --         WHERE value->>'href' IS NULL
    --     )
    -- ),
    -- CONSTRAINT links_href_rel_check CHECK (
    --     NOT EXISTS (
    --         SELECT 1
    --         FROM jsonb_array_elements(links) AS link  -- Zerlegt das JSON-Array in einzelne Link-Objekte
    --         WHERE 
    --             link->>'href' IS NULL OR            -- Überprüft, ob 'href' null ist
    --             link->>'rel' IS NULL                -- Überprüft, ob 'rel' null ist
    --     )
    -- )
);

-----------------------------------------------------------------------------------------------------------------------
-- Beispiel-Daten
-----------------------------------------------------------------------------------------------------------------------
-- Insert into `catalogs` table
INSERT INTO catalogs (id, type, stac_version, stac_extensions, title, description, links, created_at, updated_at)
VALUES (
    'Catalog for MLM', 
    'Catalog', 
    '1.0.0', 
    ARRAY['stac-core', 'extended'], 
    'Example Catalog', 
    'Dies ist ein Beispielkatalog für STAC-Daten.',
    '[{"href": "http://localhost:8000/", "type": "application/json", "rel": "self"}, {"href": "http://localhost:8000/", "type":"application/json", "rel": "root"}, {"href": "http://localhost:8000/conformance", "type": "application/json", "rel": "conformance"}, {"href": "http://localhost:8000/collections", "type": "application/json", "rel": "data"}]'::jsonb, 
    NOW(), 
    NOW()
);


-- Insert into `collections` table
INSERT INTO collections (id, type, stac_version, stac_extensions, title, description, license, extent, links, catalog_ID, created_at, updated_at)
VALUES 
('Collection for MLM', 'Collection', '1.0.0', ARRAY['stac-core', 'extended'], 'Example Collection', 
 'Eine Beispiel-Collection, die innerhalb des Beispielkatalogs enthalten ist.', 'CC BY 4.0', 
 '{"spatial": {"bbox": [-180, -90, 180, 90]}, "temporal": {"interval": [["2022-01-01T00:00:00Z", "2022-12-31T23:59:59Z"]]}}', 
 '{"links": [{"href": "https://example.com/collection", "rel": "self"}, {"href": "https://example.com/next", "rel": "next"}]}', 
 (SELECT id FROM catalogs WHERE title = 'Example Catalog'), NOW(), NOW());

-- Insert into `items` table with prefixed JSON keys
INSERT INTO items (id, type, stac_version, stac_extensions, geometry, bbox, properties, links, assets, collection_ID, created_at, updated_at)
VALUES 
(
    'example_model', 
    'Feature', 
    '1.0.0', 
    ARRAY['stac-core'], 
    'SRID=4326;POINT(10 10)', 
    ARRAY[-10, -10, 10, 10], 
    '{
        "title": "Example Item",
        "description": "Dies ist ein Beispiel-Item innerhalb der Example Collection.",
        "datetime": "2024-12-04T16:20:00",
        "mlm:name": "Example Model",
        "mlm:architecture": "ResNet50",
        "mlm:tasks": ["classification", "image"],
        "mlm:framework": "TensorFlow",
        "mlm:framework_version": "2.7",
        "mlm:memory_size": 1200000000,
        "mlm:total_parameters": 25000000,
        "mlm:pretrained": true,
        "mlm:pretrained_source": "ImageNet",
        "mlm:batch_size_suggestion": 32,
        "mlm:accelerator": "GPU",
        "mlm:accelerator_constrained": false,
        "mlm:accelerator_summary": "NVIDIA Tesla V100",
        "mlm:accelerator_count": 2,
        "mlm:input": {
            "type": "image",
            "shape": [224, 224, 3]
        },
        "mlm:output": {
            "type": "class",
            "num_classes": 1000
        },
        "mlm:hyperparameters": {
            "learning_rate": 0.001,
            "dropout": 0.5
        }
    }', 
    '{
        "links": [
            {
                "href": "https://example.com/item",
                "rel": "self"
            }
        ]
    }', 
    '{
        "thumbnail": {
            "href": "https://example.com/thumbnail.png"
        },
        "data": {
            "href": "https://example.com/data"
        }
    }', 
    (SELECT id FROM collections WHERE title = 'Example Collection'), 
    NOW(), 
    NOW()
);
