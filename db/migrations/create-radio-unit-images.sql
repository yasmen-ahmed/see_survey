DROP TABLE IF EXISTS radio_unit_images;

CREATE TABLE radio_unit_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  radio_unit_number INT NOT NULL,
  record_index INT NOT NULL DEFAULT 1,
  image_category VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSON,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_radio_unit_img_session FOREIGN KEY (session_id) 
    REFERENCES new_radio_units(session_id) ON DELETE CASCADE
);

CREATE INDEX idx_radio_unit_img_session ON radio_unit_images(session_id);
CREATE INDEX idx_radio_unit_img_composite ON radio_unit_images(session_id, radio_unit_number, image_category);
CREATE UNIQUE INDEX idx_radio_unit_img_stored ON radio_unit_images(stored_filename); 