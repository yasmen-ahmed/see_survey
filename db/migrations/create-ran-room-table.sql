-- Create ran_room table for RAN equipment information
CREATE TABLE ran_room (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL UNIQUE,
  number_of_cabinets INT DEFAULT 0,
  
  -- RAN equipment data as JSON for all frontend fields
  ran_equipment JSON NOT NULL,
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes
CREATE UNIQUE INDEX idx_ran_room_session_id ON ran_room (session_id);

-- Create ran_room_images table for image uploads
CREATE TABLE ran_room_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  image_category VARCHAR(255) NOT NULL,
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ran_room_session_id FOREIGN KEY (session_id) 
    REFERENCES ran_room(session_id) ON DELETE CASCADE
);

-- Create indexes for images
CREATE INDEX idx_ran_room_images_session ON ran_room_images(session_id);
CREATE INDEX idx_ran_room_images_category ON ran_room_images(session_id, image_category); 