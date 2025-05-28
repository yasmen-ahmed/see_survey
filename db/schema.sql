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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  country VARCHAR(255),
  ct VARCHAR(255),
  project VARCHAR(255),
  company VARCHAR(255),
  PRIMARY KEY (site_id, created_at),
  UNIQUE KEY (site_id, created_at),
  FOREIGN KEY (site_id) REFERENCES site_location(site_id)
); 