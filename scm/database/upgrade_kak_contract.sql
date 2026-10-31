USE scm_v1;
CREATE TABLE IF NOT EXISTS kak_documents(
 id INT AUTO_INCREMENT PRIMARY KEY,kak_no VARCHAR(50) UNIQUE NOT NULL,title VARCHAR(255) NOT NULL,
 department VARCHAR(120) NOT NULL,requester VARCHAR(120) NOT NULL,background TEXT NOT NULL,objective TEXT NOT NULL,
 scope TEXT NOT NULL,deliverables TEXT NOT NULL,location TEXT NOT NULL,duration TEXT NOT NULL,schedule TEXT NOT NULL,
 budget DECIMAL(18,2) DEFAULT 0,payment_terms TEXT NOT NULL,requirements TEXT NOT NULL,evaluation_method TEXT NOT NULL,
 special_terms TEXT NOT NULL,status ENUM('Draft','Review','Approved','Cancelled') DEFAULT 'Draft',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS contract_drafts(
 id INT AUTO_INCREMENT PRIMARY KEY,draft_no VARCHAR(60) UNIQUE NOT NULL,kak_id INT NULL,vendor_id INT NULL,title VARCHAR(255) NOT NULL,
 contract_value DECIMAL(18,2) DEFAULT 0,start_date DATE NOT NULL,end_date DATE NOT NULL,scope TEXT NOT NULL,payment_terms TEXT NOT NULL,
 clauses TEXT NOT NULL,created_by INT NULL,status ENUM('Draft','Review','Approved','Rejected') DEFAULT 'Draft',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(kak_id) REFERENCES kak_documents(id) ON DELETE SET NULL,FOREIGN KEY(vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
 FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL);
