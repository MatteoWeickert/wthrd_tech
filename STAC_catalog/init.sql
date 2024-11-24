-- Create the `items` table
CREATE TABLE items (
    id SERIAL PRIMARY KEY,                             -- Unique identifier for the record
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
    created_at TIMESTAMP DEFAULT NOW(),                -- Timestamp for when the record was created
    updated_at TIMESTAMP DEFAULT NOW()                 -- Timestamp for when the record was last updated
);

-- Insert sample data into the `items` table
INSERT INTO items (
    name, architecture, tasks, framework, framework_version, 
    memory_size, total_parameters, pretrained, pretrained_source, 
    batch_size_suggestion, accelerator, accelerator_constrained, 
    accelerator_summary, accelerator_count, input, output, 
    hyperparameters
)
VALUES
(
    'ImageNetClassifier', 
    'ResNet-50', 
    ARRAY['ImageClassification'], 
    'PyTorch', 
    '1.10.0', 
    1024000000,                -- 1GB memory size
    23500000,                 -- 23.5M parameters
    TRUE, 
    'ImageNet', 
    32, 
    'NVIDIA A100', 
    FALSE, 
    'NVIDIA A100, Ampere Generation', 
    1, 
    '{"type": "image", "format": "JPEG", "shape": [224, 224, 3]}', 
    '{"type": "classification", "labels": ["cat", "dog", "bird"]}', 
    '{"learning_rate": 0.001, "batch_size": 32, "epochs": 50}'
),
(
    'TextSummarizer', 
    'Transformer', 
    ARRAY['TextSummarization', 'Translation'], 
    'TensorFlow', 
    '2.9.1', 
    512000000,                 -- 512MB memory size
    110000000,                -- 110M parameters
    TRUE, 
    'CommonCrawl', 
    16, 
    NULL,                     -- No specific accelerator required
    FALSE, 
    NULL, 
    NULL, 
    '{"type": "text", "format": "string", "max_length": 1024}', 
    '{"type": "text", "format": "string", "max_length": 256}', 
    '{"optimizer": "adam", "dropout_rate": 0.1}'
),
(
    'TimeSeriesForecaster', 
    'LSTM', 
    ARRAY['TimeSeriesForecasting'], 
    'Keras', 
    '2.8.0', 
    256000000,                 -- 256MB memory size
    5000000,                  -- 5M parameters
    FALSE, 
    NULL, 
    64, 
    'TPU', 
    TRUE, 
    'TPU v3, optimized for time-series forecasting', 
    2, 
    '{"type": "sequence", "format": "array", "length": 50}', 
    '{"type": "sequence", "format": "array", "length": 10}', 
    '{"hidden_units": 128, "num_layers": 3, "activation": "tanh"}'
);
