-- Import this in phpMyAdmin (or just open api/install.php once). One table holds all website content as JSON blocks.
CREATE TABLE IF NOT EXISTS site_content (
  k VARCHAR(40) NOT NULL PRIMARY KEY,
  v LONGTEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
