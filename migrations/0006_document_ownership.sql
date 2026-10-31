-- Add document ownership for private user workspaces.
-- Existing records remain unassigned (NULL) and are visible only to privileged roles.
ALTER TABLE sourcing_requests ADD COLUMN created_by INTEGER REFERENCES users(id);
ALTER TABLE contracts ADD COLUMN created_by INTEGER REFERENCES users(id);
ALTER TABLE obligations ADD COLUMN created_by INTEGER REFERENCES users(id);
ALTER TABLE change_orders ADD COLUMN created_by INTEGER REFERENCES users(id);
ALTER TABLE approvals ADD COLUMN created_by INTEGER REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_sourcing_created_by ON sourcing_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_kak_created_by ON kak_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_contract_drafts_created_by ON contract_drafts(created_by);
CREATE INDEX IF NOT EXISTS idx_obligations_created_by ON obligations(created_by);
CREATE INDEX IF NOT EXISTS idx_change_orders_created_by ON change_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_approvals_created_by ON approvals(created_by);
