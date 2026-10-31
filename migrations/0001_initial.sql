PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Admin',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Active','Inactive','Pending')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sourcing_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_no TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  department TEXT,
  estimated_value REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Review','RFQ','Evaluation','Awarded','Cancelled')),
  request_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_no TEXT NOT NULL UNIQUE,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  contract_value REAL NOT NULL DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Pending Approval','Active','Expired','Closed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kak_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kak_no TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  requester TEXT NOT NULL,
  background TEXT NOT NULL DEFAULT '',
  objective TEXT NOT NULL DEFAULT '',
  scope TEXT NOT NULL DEFAULT '',
  deliverables TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  schedule TEXT NOT NULL DEFAULT '',
  budget REAL NOT NULL DEFAULT 0,
  payment_terms TEXT NOT NULL DEFAULT '',
  requirements TEXT NOT NULL DEFAULT '',
  evaluation_method TEXT NOT NULL DEFAULT '',
  special_terms TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Review','Approved','Cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contract_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  draft_no TEXT NOT NULL UNIQUE,
  kak_id INTEGER REFERENCES kak_documents(id) ON DELETE SET NULL,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  contract_value REAL NOT NULL DEFAULT 0,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT '',
  payment_terms TEXT NOT NULL DEFAULT '',
  clauses TEXT NOT NULL DEFAULT '',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Review','Approved','Rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS obligations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  vendor_name TEXT,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Due Soon','Completed','Overdue')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS change_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
  change_no TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  reason TEXT,
  value_delta REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Pending Approval','Approved','Rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_type TEXT NOT NULL,
  ref_id INTEGER NOT NULL,
  ref_no TEXT NOT NULL,
  title TEXT NOT NULL,
  requester TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Approved','Rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  score REAL NOT NULL DEFAULT 0,
  quality_score REAL NOT NULL DEFAULT 0,
  delivery_score REAL NOT NULL DEFAULT 0,
  compliance_score REAL NOT NULL DEFAULT 0,
  period_label TEXT NOT NULL DEFAULT 'Current',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendor_id, period_label)
);

CREATE INDEX IF NOT EXISTS idx_kak_created ON kak_documents(created_at);
CREATE INDEX IF NOT EXISTS idx_contract_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_sourcing_status ON sourcing_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_status ON approvals(status);
