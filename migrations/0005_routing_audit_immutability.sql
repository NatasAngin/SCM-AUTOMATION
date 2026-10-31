-- Enforce append-only audit history for document routing.
-- Apply only to the Preview D1 database.
CREATE TRIGGER IF NOT EXISTS trg_document_route_events_no_update
BEFORE UPDATE ON document_route_events
BEGIN
  SELECT RAISE(ABORT, 'document_route_events is append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_document_route_events_no_delete
BEFORE DELETE ON document_route_events
BEGIN
  SELECT RAISE(ABORT, 'document_route_events is append-only');
END;
