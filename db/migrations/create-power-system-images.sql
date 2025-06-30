-- Create AC Connection Images table
CREATE TABLE IF NOT EXISTS ac_connection_images (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR NOT NULL,
    table_id INTEGER NOT NULL,
    image_category VARCHAR NOT NULL,
    original_filename VARCHAR NOT NULL,
    stored_filename VARCHAR NOT NULL UNIQUE,
    file_path VARCHAR NOT NULL,
    file_url VARCHAR NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ac_connection
        FOREIGN KEY (session_id)
        REFERENCES ac_connection_info(session_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_ac_connection_images_session_id ON ac_connection_images(session_id);
CREATE INDEX idx_ac_connection_images_table_id ON ac_connection_images(table_id);
CREATE UNIQUE INDEX idx_ac_connection_images_stored_filename ON ac_connection_images(stored_filename);

-- Create AC Panel Images table
CREATE TABLE IF NOT EXISTS ac_panel_images (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR NOT NULL,
    table_id INTEGER NOT NULL,
    image_category VARCHAR NOT NULL,
    original_filename VARCHAR NOT NULL,
    stored_filename VARCHAR NOT NULL UNIQUE,
    file_path VARCHAR NOT NULL,
    file_url VARCHAR NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ac_panel
        FOREIGN KEY (session_id)
        REFERENCES ac_panel(session_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_ac_panel_images_session_id ON ac_panel_images(session_id);
CREATE INDEX idx_ac_panel_images_table_id ON ac_panel_images(table_id);
CREATE UNIQUE INDEX idx_ac_panel_images_stored_filename ON ac_panel_images(stored_filename);

-- Create Power Meter Images table
CREATE TABLE IF NOT EXISTS power_meter_images (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR NOT NULL,
    table_id INTEGER NOT NULL,
    image_category VARCHAR NOT NULL,
    original_filename VARCHAR NOT NULL,
    stored_filename VARCHAR NOT NULL UNIQUE,
    file_path VARCHAR NOT NULL,
    file_url VARCHAR NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_power_meter
        FOREIGN KEY (session_id)
        REFERENCES power_meter(session_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_power_meter_images_session_id ON power_meter_images(session_id);
CREATE INDEX idx_power_meter_images_table_id ON power_meter_images(table_id);
CREATE UNIQUE INDEX idx_power_meter_images_stored_filename ON power_meter_images(stored_filename); 