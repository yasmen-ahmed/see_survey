-- Create BTS images table for dynamic BTS-related image uploads
CREATE TABLE bts_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  bts_index INT NOT NULL, -- Which BTS this image belongs to (1, 2, 3, etc.)
  image_category VARCHAR(255) NOT NULL, -- e.g., 'rack_photo_1', 'rack_photo_1_closed', etc.
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL UNIQUE,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSON,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes for BTS images
CREATE INDEX idx_bts_images_session ON bts_images(session_id);
CREATE INDEX idx_bts_images_bts_index ON bts_images(session_id, bts_index);
CREATE INDEX idx_bts_images_category ON bts_images(session_id, bts_index, image_category);
CREATE INDEX idx_bts_images_active ON bts_images(session_id, is_active); 