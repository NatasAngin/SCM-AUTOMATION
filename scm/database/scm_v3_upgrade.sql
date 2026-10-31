USE scm_v1;
SOURCE upgrade_kak_contract.sql;
CREATE TABLE IF NOT EXISTS scm_contract_obligations(
 id INT AUTO_INCREMENT PRIMARY KEY,
 contract_id INT NOT NULL,
 obligation_title VARCHAR(255) NOT NULL,
 description TEXT,
 due_date DATE,
 status ENUM('OPEN','COMPLETED','OVERDUE','CANCELLED') DEFAULT 'OPEN',
 owner VARCHAR(150), completed_at DATETIME,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX(contract_id),INDEX(due_date),INDEX(status)
);
CREATE TABLE IF NOT EXISTS scm_notifications(
 id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NULL,notification_type VARCHAR(50) NOT NULL,
 title VARCHAR(255) NOT NULL,message TEXT NOT NULL,entity_type VARCHAR(50),entity_id INT,
 is_read TINYINT(1) DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX(user_id),INDEX(is_read),INDEX(created_at)
);
CREATE TABLE IF NOT EXISTS scm_audit_logs(
 id BIGINT AUTO_INCREMENT PRIMARY KEY,user_id INT NULL,action VARCHAR(100) NOT NULL,
 entity_type VARCHAR(50) NOT NULL,entity_id INT,old_value LONGTEXT,new_value LONGTEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,INDEX(entity_type),INDEX(entity_id),INDEX(created_at)
);
