CREATE TABLE site_location (
  site_id VARCHAR(50) NOT NULL,
  sitename VARCHAR(255) NOT NULL,
  region VARCHAR(255),
  city VARCHAR(255),
  longitude DECIMAL(10, 6),
  latitude DECIMAL(10, 6),
  site_elevation FLOAT,
  address VARCHAR(255),
  PRIMARY KEY (site_id),
  UNIQUE KEY (site_id)
);

CREATE TABLE survey (
  site_id VARCHAR(50) NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  creator_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  country VARCHAR(255),
  ct VARCHAR(255),
  project VARCHAR(255),
  company VARCHAR(255),
  PRIMARY KEY (site_id, created_at),
  UNIQUE KEY (site_id, created_at),
  FOREIGN KEY (site_id) REFERENCES site_location(site_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

CREATE TABLE users (
  id INT AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'engineer') DEFAULT 'engineer' NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  NID VARCHAR(20) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  title VARCHAR(100),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_username (username),
  UNIQUE KEY unique_email (email),
  UNIQUE KEY unique_nid (NID)
);

CREATE TABLE outdoor_cabinets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id VARCHAR(255) NOT NULL UNIQUE,
  number_of_cabinets INTEGER CHECK (number_of_cabinets >= 1 AND number_of_cabinets <= 10),
  cabinets JSON NOT NULL DEFAULT '[]',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_outdoor_cabinets_session_id ON outdoor_cabinets (session_id);