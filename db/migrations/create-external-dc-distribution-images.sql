DROP TABLE IF EXISTS external_dc_distribution_images;

CREATE TABLE external_dc_distribution_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  record_id INT NOT NULL,
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
  CONSTRAINT fk_ext_dc_dist_img_session FOREIGN KEY (session_id) 
    REFERENCES external_dc_distribution(session_id) ON DELETE CASCADE
);

CREATE INDEX idx_ext_dc_dist_img_session ON external_dc_distribution_images(session_id);
CREATE INDEX idx_ext_dc_dist_img_composite ON external_dc_distribution_images(session_id, record_id, image_category);
CREATE UNIQUE INDEX idx_ext_dc_dist_img_stored ON external_dc_distribution_images(stored_filename); 