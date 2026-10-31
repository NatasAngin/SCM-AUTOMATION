PRAGMA foreign_keys = ON;

-- Central approval and document-routing engine.
-- Existing module records remain the source of truth; these tables provide
-- a unified routing register, tasks, configurable templates, and audit trail.

CREATE TABLE IF NOT EXISTS routing_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_type TEXT NOT NULL UNIQUE,
  resource TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routing_template_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL REFERENCES routing_templates(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_key TEXT NOT NULL,
  step_name TEXT NOT NULL,
  assignee_role TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'Review'
    CHECK(action_type IN ('Review','Process','Approval','Record')),
  is_required INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(template_id, step_order),
  UNIQUE(template_id, step_key)
);

CREATE TABLE IF NOT EXISTS document_routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_type TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id INTEGER NOT NULL,
  document_no TEXT,
  title TEXT NOT NULL,
  requester_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  requester_name TEXT,
  department TEXT,
  route_status TEXT NOT NULL DEFAULT 'Draft'
    CHECK(route_status IN ('Draft','In Review','Revision','In Process','Approved','Rejected','Completed','Cancelled')),
  current_step_order INTEGER NOT NULL DEFAULT 0,
  current_step_name TEXT NOT NULL DEFAULT 'Draft',
  submitted_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(resource, resource_id)
);

CREATE TABLE IF NOT EXISTS document_route_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_id INTEGER NOT NULL REFERENCES document_routes(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_key TEXT NOT NULL,
  step_name TEXT NOT NULL,
  assignee_role TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'Review' CHECK(action_type IN ('Review','Process','Approval','Record')),
  assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  task_status TEXT NOT NULL DEFAULT 'Pending'
    CHECK(task_status IN ('Pending','In Progress','Approved','Revision','Rejected','Completed','Skipped')),
  note TEXT,
  acted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  acted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(route_id, step_order)
);

CREATE TABLE IF NOT EXISTS document_route_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_id INTEGER NOT NULL REFERENCES document_routes(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES document_route_tasks(id) ON DELETE SET NULL,
  actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  from_step TEXT,
  to_step TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_document_routes_status ON document_routes(route_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_document_routes_type ON document_routes(document_type, updated_at);
CREATE INDEX IF NOT EXISTS idx_document_routes_resource ON document_routes(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_route_tasks_assignee ON document_route_tasks(assignee_id, task_status);
CREATE INDEX IF NOT EXISTS idx_route_tasks_role ON document_route_tasks(assignee_role, task_status);
CREATE INDEX IF NOT EXISTS idx_route_events_route ON document_route_events(route_id, created_at);

-- Default routes are intentionally distinct by document type. Administrators
-- can later maintain these templates from the application.
INSERT OR IGNORE INTO routing_templates(document_type,resource,display_name,description) VALUES
 ('Sourcing Request','sourcing','Sourcing Request','Permintaan pengadaan dari unit kerja hingga proses sourcing SCM.'),
 ('KAK / TOR','kak','KAK / TOR','Penyusunan, pemeriksaan Section Head SCM, dan persetujuan KAK.'),
 ('Vendor Qualification','vendors','Vendor Qualification','Pemeriksaan administrasi, teknis, dan kelayakan vendor.'),
 ('Draft Contract','contract_drafts','Draft Contract','Pemeriksaan draft kontrak sebelum ditetapkan menjadi kontrak.'),
 ('Contract','contracts','Contract','Pemeriksaan dan persetujuan kontrak.'),
 ('Change Order','change_orders','Change Order','Pemeriksaan perubahan ruang lingkup atau nilai kontrak.');

-- Sourcing: requester -> SCM Section Head -> sourcing execution.
INSERT OR IGNORE INTO routing_template_steps(template_id,step_order,step_key,step_name,assignee_role,action_type)
SELECT id,1,'scm_review','Review Section Head SCM','Section Head','Approval' FROM routing_templates WHERE document_type='Sourcing Request';
INSERT OR IGNORE INTO routing_template_steps(template_id,step_order,step_key,step_name,assignee_role,action_type)
SELECT id,2,'sourcing_process','Proses Sourcing SCM','Admin','Process' FROM routing_templates WHERE document_type='Sourcing Request';

-- KAK: requester -> SCM Section Head (no separate Procurement reviewer).
INSERT OR IGNORE INTO routing_template_steps(template_id,step_order,step_key,step_name,assignee_role,action_type)
SELECT id,1,'scm_review','Review Section Head SCM','Section Head','Approval' FROM routing_templates WHERE document_type='KAK / TOR';

-- Vendor qualification: SCM admin check -> Section Head decision.
INSERT OR IGNORE INTO routing_template_steps(template_id,step_order,step_key,step_name,assignee_role,action_type)
SELECT id,1,'admin_check','Pemeriksaan Administrasi SCM','Admin','Review' FROM routing_templates WHERE document_type='Vendor Qualification';
INSERT OR IGNORE INTO routing_template_steps(template_id,step_order,step_key,step_name,assignee_role,action_type)
SELECT id,2,'scm_approval','Persetujuan Section Head SCM','Section Head','Approval' FROM routing_templates WHERE document_type='Vendor Qualification';

-- Contract draft: SCM admin review -> Section Head approval.
INSERT OR IGNORE INTO routing_template_steps(template_id,step_order,step_key,step_name,assignee_role,action_type)
SELECT id,1,'contract_review','Review Draft Kontrak','Admin','Review' FROM routing_templates WHERE document_type='Draft Contract';
INSERT OR IGNORE INTO routing_template_steps(template_id,step_order,step_key,step_name,assignee_role,action_type)
SELECT id,2,'contract_approval','Persetujuan Section Head SCM','Section Head','Approval' FROM routing_templates WHERE document_type='Draft Contract';

-- Contract: SCM administration -> Section Head approval -> contract activation.
INSERT OR IGNORE INTO routing_template_steps(template_id,step_order,step_key,step_name,assignee_role,action_type)
SELECT id,1,'contract_check','Pemeriksaan Dokumen Kontrak','Admin','Review' FROM routing_templates WHERE document_type='Contract';
INSERT OR IGNORE INTO routing_template_steps(template_id,step_order,step_key,step_name,assignee_role,action_type)
SELECT id,2,'contract_approval','Persetujuan Section Head SCM','Section Head','Approval' FROM routing_templates WHERE document_type='Contract';

-- Change order: contract owner/SCM check -> Section Head approval.
INSERT OR IGNORE INTO routing_template_steps(template_id,step_order,step_key,step_name,assignee_role,action_type)
SELECT id,1,'change_review','Review Change Order','Admin','Review' FROM routing_templates WHERE document_type='Change Order';
INSERT OR IGNORE INTO routing_template_steps(template_id,step_order,step_key,step_name,assignee_role,action_type)
SELECT id,2,'change_approval','Persetujuan Section Head SCM','Section Head','Approval' FROM routing_templates WHERE document_type='Change Order';
