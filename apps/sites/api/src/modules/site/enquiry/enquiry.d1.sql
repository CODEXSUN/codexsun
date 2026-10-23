CREATE TABLE IF NOT EXISTS sites_delivery_identity (id INTEGER PRIMARY KEY CHECK(id=1), site_uuid TEXT NOT NULL, site_key TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sites_enquiry_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sites_enquiry_limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sites_enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  request_key TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  rate_key TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  consented_at TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS sites_enquiry_activity (id INTEGER PRIMARY KEY AUTOINCREMENT, reference TEXT NOT NULL, action TEXT NOT NULL, actor TEXT NOT NULL, at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS sites_enquiries_inbox ON sites_enquiries(deleted_at,status,created_at);
CREATE INDEX IF NOT EXISTS sites_enquiry_activity_reference ON sites_enquiry_activity(reference,id);
CREATE TRIGGER IF NOT EXISTS sites_enquiry_rate_check BEFORE INSERT ON sites_enquiries
WHEN NOT EXISTS(SELECT 1 FROM sites_enquiries WHERE request_key=NEW.request_key)
BEGIN
  SELECT CASE WHEN COALESCE((SELECT hits FROM sites_enquiry_limits WHERE key=NEW.rate_key),0)>=10
    THEN RAISE(ABORT,'sites_enquiry_rate_limit') END;
END;
CREATE TRIGGER IF NOT EXISTS sites_enquiry_received AFTER INSERT ON sites_enquiries
BEGIN
  INSERT INTO sites_enquiry_limits(key,hits,expires_at) VALUES(NEW.rate_key,1,NEW.created_at+3600000)
    ON CONFLICT(key) DO UPDATE SET hits=hits+1;
  INSERT INTO sites_enquiry_activity(reference,action,actor,at) VALUES(NEW.reference,'received','website',NEW.consented_at);
END;

CREATE TABLE IF NOT EXISTS sites_marketing_outbox(reference TEXT PRIMARY KEY REFERENCES sites_enquiries(reference) ON DELETE CASCADE,status TEXT NOT NULL DEFAULT 'pending',receipt TEXT,attempts INTEGER NOT NULL DEFAULT 0,available_at INTEGER NOT NULL DEFAULT 0);
CREATE TRIGGER IF NOT EXISTS sites_marketing_capture AFTER INSERT ON sites_enquiries BEGIN INSERT OR IGNORE INTO sites_marketing_outbox(reference) VALUES(NEW.reference); END;
