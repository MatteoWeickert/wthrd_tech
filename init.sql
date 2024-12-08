CREATE TABLE catalogs (
    id VARCHAR(50) PRIMARY KEY,                          -- Eindeutige ID des Katalogs
    type TEXT NOT NULL CHECK (type = 'Catalog'),     -- Der Typ des Katalogs, sollte immer 'Catalog' sein
    stac_version TEXT NOT NULL,                      -- Die STAC-Version, die der Katalog implementiert
    stac_extensions TEXT[],                          -- Eine Liste von Erweiterungs-IDs, die der Katalog implementiert
    title TEXT,                                     -- Ein kurzer beschreibender Titel des Katalogs
    description TEXT NOT NULL,                      -- Eine detaillierte Beschreibung des Katalogs
    links JSONB,                                    -- Eine Liste von Links (Referenzen zu anderen Dokumenten)
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

-- Create the `items` table
CREATE TABLE properties (
    id VARCHAR(50) PRIMARY KEY,                             -- Unique identifier for the record
    name VARCHAR(255) NOT NULL,                       -- REQUIRED: Name for the model
    architecture VARCHAR(255) NOT NULL,               -- REQUIRED: Generic architecture name of the model
    tasks TEXT[] NOT NULL,                            -- REQUIRED: List of machine learning tasks (array of enums)
    framework VARCHAR(100) NOT NULL,                  -- Framework used to train the model
    framework_version VARCHAR(50),                    -- Framework library version
    memory_size BIGINT,                                -- In-memory size of the model during inference (bytes)
    total_parameters BIGINT,                           -- Total number of model parameters
    pretrained BOOLEAN NOT NULL DEFAULT FALSE,        -- Indicates if the model was pretrained
    pretrained_source TEXT,                            -- Source of the pretraining, or NULL if not pretrained
    batch_size_suggestion INT,                         -- Suggested batch size for hardware
    accelerator VARCHAR(100),                          -- Intended computational hardware for inference
    accelerator_constrained BOOLEAN DEFAULT FALSE,     -- Whether only the intended accelerator can run inference
    accelerator_summary TEXT,                          -- High-level description of the accelerator
    accelerator_count INT,                             -- Minimum number of accelerator instances required
    input JSONB NOT NULL,                              -- REQUIRED: JSON object describing model input
    output JSONB NOT NULL,                             -- REQUIRED: JSON object describing model output
    hyperparameters JSONB,                             -- Additional hyperparameters relevant for the model
    item_id VARCHAR(50) REFERENCES items(id),  -- Reference to the item that this record is associated with
    created_at TIMESTAMP DEFAULT NOW(),                -- Timestamp for when the record was created
    updated_at TIMESTAMP DEFAULT NOW()                 -- Timestamp for when the record was last updated
);


-----------------------------------------------------------------------------------------------------------------------
-- Beispiel-Daten
-----------------------------------------------------------------------------------------------------------------------
-- Insert into `catalogs` table
INSERT INTO catalogs (id, type, stac_version, stac_extensions, title, description, links, created_at, updated_at)
VALUES 
('Catalog for MLM', 'Catalog', '1.0.0', ARRAY['stac-core', 'extended'], 'Example Catalog', 'Dies ist ein Beispielkatalog für STAC-Daten.', 
 '{"links": [{"href": "https://example.com/catalog", "rel": "self"}, {"href": "https://example.com/other", "rel": "next"}]}', 
 NOW(), NOW());

-- Insert into `collections` table
INSERT INTO collections (id, type, stac_version, stac_extensions, title, description, license, extent, links, catalog_ID, created_at, updated_at)
VALUES 
('Collection for MLM', 'Collection', '1.0.0', ARRAY['stac-core', 'extended'], 'Example Collection', 
 'Eine Beispiel-Collection, die innerhalb des Beispielkatalogs enthalten ist.', 'CC BY 4.0', 
 '{"spatial": {"bbox": [-180, -90, 180, 90]}, "temporal": {"interval": [["2022-01-01T00:00:00Z", "2022-12-31T23:59:59Z"]]}}', 
 '{"links": [{"href": "https://example.com/collection", "rel": "self"}, {"href": "https://example.com/next", "rel": "next"}]}', 
 (SELECT id FROM catalogs WHERE title = 'Example Catalog'), NOW(), NOW());

-- Insert into `items` table
INSERT INTO items (id, type, stac_version, stac_extensions, geometry, bbox, properties, links, assets, collection_ID, created_at, updated_at)
VALUES 
('example_model', 'Feature', '1.0.0', ARRAY['stac-core'], 'SRID=4326;POINT(10 10)', ARRAY[-10, -10, 10, 10], 
 '{"title": "Example Item", "description": "Dies ist ein Beispiel-Item innerhalb der Example Collection.", "datetime": "2024-12-04T16:20:00"}', 
 '{"links": [{"href": "https://example.com/item", "rel": "self"}]}', 
 '{"thumbnail": {"href": "https://example.com/thumbnail.png"}, "data": {"href": "https://example.com/data"}}', 
 (SELECT id FROM collections WHERE title = 'Example Collection'), NOW(), NOW());

-- Insert into `properties` table
INSERT INTO properties (id, name, architecture, tasks, framework, framework_version, memory_size, total_parameters, pretrained, pretrained_source, batch_size_suggestion, accelerator, accelerator_constrained, accelerator_summary, accelerator_count, input, output, hyperparameters, item_id, created_at, updated_at)
VALUES 
('example', 'Example Model', 'ResNet50', ARRAY['classification', 'image'], 'TensorFlow', '2.7', 1200000000, 25000000, TRUE, 'ImageNet', 32, 'GPU', FALSE, 'NVIDIA Tesla V100', 2, 
 '{"type": "image", "shape": [224, 224, 3]}', 
 '{"type": "class", "num_classes": 1000}', 
 '{"learning_rate": 0.001, "dropout": 0.5}', 
 (SELECT id FROM items WHERE properties->>'title' = 'Example Item'), NOW(), NOW());
