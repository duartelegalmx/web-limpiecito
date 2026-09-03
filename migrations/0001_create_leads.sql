CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  user_type TEXT NOT NULL,
  original_case TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  priority TEXT,
  origin TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at
ON leads(created_at);
