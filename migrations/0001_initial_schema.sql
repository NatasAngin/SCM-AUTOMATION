-- SCM Automation initial D1 schema
-- Apply once to the empty scm-automation-db database.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'User',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sourcing_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_no TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  department TEXT,
  estimated_value REAL,
  status TEXT NOT NULL DEFAULT 'Draft',
  request_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS kak_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kak_no TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  requester TEXT NOT NULL,
  background TEXT,
  objective TEXT,
  scope TEXT,
  deliverables TEXT,
  location TEXT,
  duration TEXT,
  schedule TEXT,
  budget REAL,
  payment_terms TEXT,
  requirements TEXT,
  evaluation_method TEXT,
  special_terms TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_no TEXT NOT NULL UNIQUE,
  vendor_id INTEGER,
  title TEXT NOT NULL,
  contract_value REAL,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

CREATE TABLE IF NOT EXISTS contract_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  draft_no TEXT NOT NULL UNIQUE,
  kak_id INTEGER,
  vendor_id INTEGER,
  title TEXT NOT NULL,
  contract_value REAL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  scope TEXT,
  payment_terms TEXT,
  clauses TEXT,
  created_by INTEGER,
  status TEXT NOT NULL DEFAULT 'Draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (kak_id) REFERENCES kak_documents(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS obligations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id INTEGER,
  title TEXT NOT NULL,
  vendor_name TEXT,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'Open',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (contract_id) REFERENCES contracts(id)
);

CREATE TABLE IF NOT EXISTS change_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id INTEGER,
  change_no TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  reason TEXT,
  value_delta REAL,
  status TEXT NOT NULL DEFAULT 'Draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (contract_id) REFERENCES contracts(id)
);

CREATE TABLE IF NOT EXISTS approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_type TEXT NOT NULL,
  ref_id INTEGER NOT NULL,
  ref_no TEXT NOT NULL,
  title TEXT NOT NULL,
  requester TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendor_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL,
  score REAL,
  quality_score REAL,
  delivery_score REAL,
  compliance_score REAL,
  period_label TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

CREATE INDEX IF NOT EXISTS idx_sourcing_status ON sourcing_requests(status);
CREATE INDEX IF NOT EXISTS idx_kak_status ON kak_documents(status);
CREATE INDEX IF NOT EXISTS idx_contract_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contract_end_date ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_obligations_due_date ON obligations(due_date);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_vendor_performance_vendor ON vendor_performance(vendor_id);
