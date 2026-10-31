CREATE DATABASE IF NOT EXISTS scm_v1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE scm_v1;
CREATE TABLE users(id INT AUTO_INCREMENT PRIMARY KEY,username VARCHAR(50) UNIQUE NOT NULL,password_hash VARCHAR(255) NOT NULL,full_name VARCHAR(120) NOT NULL,role VARCHAR(50) NOT NULL DEFAULT 'Admin',is_active TINYINT(1) DEFAULT 1,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE vendors(id INT AUTO_INCREMENT PRIMARY KEY,code VARCHAR(30) UNIQUE NOT NULL,name VARCHAR(160) NOT NULL,category VARCHAR(100),email VARCHAR(120),phone VARCHAR(50),status ENUM('Active','Inactive','Pending') DEFAULT 'Pending',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE sourcing_requests(id INT AUTO_INCREMENT PRIMARY KEY,request_no VARCHAR(40) UNIQUE NOT NULL,title VARCHAR(200) NOT NULL,department VARCHAR(120),estimated_value DECIMAL(18,2) DEFAULT 0,status ENUM('Draft','Review','RFQ','Evaluation','Awarded','Cancelled') DEFAULT 'Draft',request_date DATE,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE contracts(id INT AUTO_INCREMENT PRIMARY KEY,contract_no VARCHAR(50) UNIQUE NOT NULL,vendor_id INT,title VARCHAR(200) NOT NULL,contract_value DECIMAL(18,2) DEFAULT 0,start_date DATE,end_date DATE,status ENUM('Draft','Pending Approval','Active','Expired','Closed') DEFAULT 'Draft',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(vendor_id) REFERENCES vendors(id) ON DELETE SET NULL);
INSERT INTO users(username,password_hash,full_name,role) VALUES('admin','$2y$12$5P84jpfjyS9gWBHSnyNQUuHcmJYbB1qQJZGylTEzqcr87T83G/VrS','SCM Administrator','Admin');
INSERT INTO vendors(code,name,category,email,phone,status) VALUES('VND-001','PT Vendor Nusantara','IT Services','vendor@example.com','08123456789','Active'),('VND-002','PT Mitra Procurement','General Supply','procurement@example.com','08129876543','Active');
INSERT INTO sourcing_requests(request_no,title,department,estimated_value,status,request_date) VALUES('SR-2026-0001','Pengadaan Network Equipment','IT',250000000,'RFQ','2026-08-01'),('SR-2026-0002','Jasa Maintenance Gedung','GA',500000000,'Evaluation','2026-08-05');
INSERT INTO contracts(contract_no,vendor_id,title,contract_value,start_date,end_date,status) VALUES('CTR-2026-0001',1,'Managed IT Services',1200000000,'2026-01-01','2026-12-31','Active'),('CTR-2026-0002',2,'General Supply Agreement',750000000,'2026-03-01','2026-09-15','Active');
CREATE TABLE IF NOT EXISTS kak_documents(
 id INT AUTO_INCREMENT PRIMARY KEY,
 kak_no VARCHAR(50) UNIQUE NOT NULL,
 title VARCHAR(255) NOT NULL,
 department VARCHAR(120) NOT NULL,
 requester VARCHAR(120) NOT NULL,
 background TEXT NOT NULL,
 objective TEXT NOT NULL,
 scope TEXT NOT NULL,
 deliverables TEXT NOT NULL,
 location TEXT NOT NULL,
 duration TEXT NOT NULL,
 schedule TEXT NOT NULL,
 budget DECIMAL(18,2) DEFAULT 0,
 payment_terms TEXT NOT NULL,
 requirements TEXT NOT NULL,
 evaluation_method TEXT NOT NULL,
 special_terms TEXT NOT NULL,
 status ENUM('Draft','Review','Approved','Cancelled') DEFAULT 'Draft',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contract_drafts(
 id INT AUTO_INCREMENT PRIMARY KEY,
 draft_no VARCHAR(60) UNIQUE NOT NULL,
 kak_id INT NULL,
 vendor_id INT NULL,
 title VARCHAR(255) NOT NULL,
 contract_value DECIMAL(18,2) DEFAULT 0,
 start_date DATE NOT NULL,
 end_date DATE NOT NULL,
 scope TEXT NOT NULL,
 payment_terms TEXT NOT NULL,
 clauses TEXT NOT NULL,
 created_by INT NULL,
 status ENUM('Draft','Review','Approved','Rejected') DEFAULT 'Draft',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(kak_id) REFERENCES kak_documents(id) ON DELETE SET NULL,
 FOREIGN KEY(vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
 FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
);
