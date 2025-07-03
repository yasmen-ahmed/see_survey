CREATE TABLE IF NOT EXISTS new_radio_units_images (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    radio_unit_index INTEGER NOT NULL,
    image_category VARCHAR(255) NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_new_radio_units
        FOREIGN KEY (session_id, radio_unit_index)
        REFERENCES new_radio_units (session_id, radio_unit_index)
        ON DELETE CASCADE
); 