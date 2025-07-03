CREATE TABLE IF NOT EXISTS new_gps_images (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    image_category VARCHAR(255) NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_new_gps
        FOREIGN KEY (session_id)
        REFERENCES new_gps (session_id)
        ON DELETE CASCADE
); 