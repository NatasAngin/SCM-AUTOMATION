USE scm_v1;

CREATE TABLE IF NOT EXISTS obligations (
 id INT AUTO_INCREMENT PRIMARY KEY,
 contract_id INT NULL,
 title VARCHAR(255) NOT NULL,
 vendor_name VARCHAR(160) NULL,
 due_date DATE NULL,
 status ENUM('Open','Due Soon','Completed','Overdue') DEFAULT 'Open',
 notes TEXT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(contract_id) REFERENCES contracts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS change_orders (
 id INT AUTO_INCREMENT PRIMARY KEY,
 contract_id INT NULL,
 change_no VARCHAR(60) UNIQUE NOT NULL,
 title VARCHAR(255) NOT NULL,
 reason TEXT NULL,
 value_delta DECIMAL(18,2) DEFAULT 0,
 status ENUM('Draft','Pending Approval','Approved','Rejected') DEFAULT 'Draft',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(contract_id) REFERENCES contracts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS approvals (
 id INT AUTO_INCREMENT PRIMARY KEY,
 ref_type VARCHAR(40) NOT NULL,
 ref_id INT NOT NULL,
 ref_no VARCHAR(80) NOT NULL,
 title VARCHAR(255) NOT NULL,
 requester VARCHAR(160) NULL,
 status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_performance (
 id INT AUTO_INCREMENT PRIMARY KEY,
 vendor_id INT NOT NULL,
 score DECIMAL(4,2) DEFAULT 0,
 quality_score DECIMAL(4,2) DEFAULT 0,
 delivery_score DECIMAL(4,2) DEFAULT 0,
 compliance_score DECIMAL(4,2) DEFAULT 0,
 period_label VARCHAR(30) DEFAULT 'Current',
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_vendor_period(vendor_id, period_label),
 FOREIGN KEY(vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);
