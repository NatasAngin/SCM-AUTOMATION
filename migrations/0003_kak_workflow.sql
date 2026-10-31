PRAGMA foreign_keys = ON;

-- Workflow state is stored separately to preserve the existing KAK table and records.
CREATE TABLE IF NOT EXISTS kak_workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kak_id INTEGER NOT NULL UNIQUE REFERENCES kak_documents(id) ON DELETE CASCADE,
  workflow_status TEXT NOT NULL DEFAULT 'Draft'
    CHECK(workflow_status IN ('Draft','Review','Revision','Final Approval','Final')),
  current_step TEXT NOT NULL DEFAULT 'Draft',
  submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  revision_note TEXT,
  final_approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  final_approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kak_workflow_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kak_id INTEGER NOT NULL REFERENCES kak_documents(id) ON DELETE CASCADE,
  reviewer_role TEXT NOT NULL CHECK(reviewer_role IN ('Section Head','Procurement')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Approved','Revision')),
  note TEXT,
  reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  decided_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(kak_id, reviewer_role)
);

CREATE TABLE IF NOT EXISTS kak_workflow_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kak_id INTEGER NOT NULL REFERENCES kak_documents(id) ON DELETE CASCADE,
  actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kak_workflow_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kak_id INTEGER NOT NULL REFERENCES kak_documents(id) ON DELETE CASCADE,
  revision_no INTEGER NOT NULL,
  edited_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  change_summary TEXT,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(kak_id, revision_no)
);

CREATE INDEX IF NOT EXISTS idx_kak_workflow_status ON kak_workflows(workflow_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_kak_review_role_status ON kak_workflow_reviews(reviewer_role, status);
CREATE INDEX IF NOT EXISTS idx_kak_workflow_events_kak ON kak_workflow_events(kak_id, created_at);
