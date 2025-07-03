CREATE TABLE IF NOT EXISTS new_antennas_images (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    antenna_index INTEGER NOT NULL,
    image_category VARCHAR(255) NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_new_antennas
        FOREIGN KEY (session_id, antenna_index)
        REFERENCES new_antennas (session_id, antenna_index)
        ON DELETE CASCADE
); 