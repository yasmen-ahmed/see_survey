DROP TABLE IF EXISTS antenna_images;

CREATE TABLE antenna_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  antenna_number INT NOT NULL,
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
  CONSTRAINT fk_antenna_img_session FOREIGN KEY (session_id) 
    REFERENCES antenna_configuration(session_id) ON DELETE CASCADE
);

CREATE INDEX idx_antenna_img_session ON antenna_images(session_id);
CREATE INDEX idx_antenna_img_composite ON antenna_images(session_id, antenna_number, image_category);
CREATE UNIQUE INDEX idx_antenna_img_stored ON antenna_images(stored_filename); 