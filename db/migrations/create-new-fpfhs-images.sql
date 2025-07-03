CREATE TABLE IF NOT EXISTS new_fpfhs_images (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    fpfh_index INTEGER NOT NULL,
    image_category VARCHAR(255) NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_new_fpfhs
        FOREIGN KEY (session_id, fpfh_index)
        REFERENCES new_fpfhs (session_id, fpfh_index)
        ON DELETE CASCADE
); 