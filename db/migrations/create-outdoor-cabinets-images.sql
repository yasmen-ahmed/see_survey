CREATE TABLE IF NOT EXISTS outdoor_cabinets_images (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  cabinet_number INTEGER NOT NULL,
  record_index INTEGER NOT NULL DEFAULT 1,
  image_category VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL UNIQUE,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS outdoor_cabinets_images_session_id_idx ON outdoor_cabinets_images(session_id);
CREATE INDEX IF NOT EXISTS outdoor_cabinets_images_cabinet_idx ON outdoor_cabinets_images(session_id, cabinet_number, image_category);
CREATE INDEX IF NOT EXISTS outdoor_cabinets_images_stored_filename_idx ON outdoor_cabinets_images(stored_filename); 