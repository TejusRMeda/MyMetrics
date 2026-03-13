-- ============================================
-- SUPPORT INSIGHTS TOOL — DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. WEEKLY SUMMARY
CREATE TABLE weekly_summary (
  id SERIAL PRIMARY KEY,
  week_start DATE NOT NULL UNIQUE,
  week_end DATE NOT NULL,
  tickets_total INT NOT NULL,
  calls INT NOT NULL,
  patient_support_tickets INT NOT NULL,
  total_submissions INT NOT NULL,
  ticket_pct DECIMAL(5,2),
  patient_pct DECIMAL(5,2),
  satisfaction_rating DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weekly_summary_week_start ON weekly_summary(week_start DESC);

-- 2. TRUSTS
CREATE TABLE trusts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO trusts (name) VALUES
  ('NCA'),
  ('Dumfries and Galloway'),
  ('RUH'),
  ('UHL'),
  ('Chesterfield'),
  ('LNW'),
  ('Grampian'),
  ('Modality'),
  ('QEHKL'),
  ('No Trust');

-- 3. TRUST TICKETS
CREATE TABLE trust_tickets (
  id SERIAL PRIMARY KEY,
  week_id INT NOT NULL REFERENCES weekly_summary(id) ON DELETE CASCADE,
  trust_id INT NOT NULL REFERENCES trusts(id),
  ticket_count INT NOT NULL DEFAULT 0,
  UNIQUE(week_id, trust_id)
);

CREATE INDEX idx_trust_tickets_week ON trust_tickets(week_id);

-- 4. ISSUE CATEGORIES
CREATE TABLE issue_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  parent_id INT REFERENCES issue_categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Top-level issues
INSERT INTO issue_categories (name, parent_id) VALUES
  ('Patient Help', NULL),
  ('Check-in Assessment Question', NULL),
  ('Screener Question', NULL),
  ('Post-op Assessment Question', NULL),
  ('Appointment Question', NULL),
  ('Procedure Question', NULL),
  ('Why Invite', NULL),
  ('Check Report Sent', NULL),
  ('Locate Code', NULL),
  ('Resend Code', NULL),
  ('Can''t Fill Out', NULL),
  ('Mass Issue', NULL),
  ('Connector Issue', NULL),
  ('Clinician Help', NULL),
  ('Binned Assessment', NULL),
  ('Already Had Procedure', NULL),
  ('Multiple Assessments', NULL),
  ('Amend Questionnaire', NULL),
  ('DOB Error', NULL);

-- Sub-categories
INSERT INTO issue_categories (name, parent_id) VALUES
  ('Questions Help', (SELECT id FROM issue_categories WHERE name = 'Patient Help')),
  ('Open Message', (SELECT id FROM issue_categories WHERE name = 'Patient Help')),
  ('Logging Back In', (SELECT id FROM issue_categories WHERE name = 'Patient Help')),
  ('Confirm Report Sent', (SELECT id FROM issue_categories WHERE name = 'Check Report Sent')),
  ('Uncomfortable With Technology', (SELECT id FROM issue_categories WHERE name = 'Can''t Fill Out')),
  ('No Internet Access', (SELECT id FROM issue_categories WHERE name = 'Can''t Fill Out')),
  ('Clinician Account Request', (SELECT id FROM issue_categories WHERE name = 'Clinician Help')),
  ('Clinician Permissions Change', (SELECT id FROM issue_categories WHERE name = 'Clinician Help')),
  ('Clinician Login Issue', (SELECT id FROM issue_categories WHERE name = 'Clinician Help')),
  ('Clinician Tech Help', (SELECT id FROM issue_categories WHERE name = 'Clinician Help')),
  ('Clinician Invite Expired', (SELECT id FROM issue_categories WHERE name = 'Clinician Help')),
  ('Clinician Invite Valid', (SELECT id FROM issue_categories WHERE name = 'Clinician Help')),
  ('Clinician Password Reset', (SELECT id FROM issue_categories WHERE name = 'Clinician Help')),
  ('Deactivate Account Request', (SELECT id FROM issue_categories WHERE name = 'Clinician Help')),
  ('Single Consultant Added', (SELECT id FROM issue_categories WHERE name = 'Clinician Help')),
  ('Clinical Notes', (SELECT id FROM issue_categories WHERE name = 'Clinician Help'));

CREATE INDEX idx_issue_categories_parent ON issue_categories(parent_id);

-- 5. WEEKLY ISSUES (Global top issues per week)
CREATE TABLE weekly_issues (
  id SERIAL PRIMARY KEY,
  week_id INT NOT NULL REFERENCES weekly_summary(id) ON DELETE CASCADE,
  issue_id INT NOT NULL REFERENCES issue_categories(id),
  count INT NOT NULL DEFAULT 0,
  UNIQUE(week_id, issue_id)
);

CREATE INDEX idx_weekly_issues_week ON weekly_issues(week_id);

-- 6. TRUST ISSUES (Per-trust issue breakdown)
CREATE TABLE trust_issues (
  id SERIAL PRIMARY KEY,
  week_id INT NOT NULL REFERENCES weekly_summary(id) ON DELETE CASCADE,
  trust_id INT NOT NULL REFERENCES trusts(id),
  issue_id INT NOT NULL REFERENCES issue_categories(id),
  count INT NOT NULL DEFAULT 0,
  UNIQUE(week_id, trust_id, issue_id)
);

CREATE INDEX idx_trust_issues_week_trust ON trust_issues(week_id, trust_id);

-- 7. PRODUCTS
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO products (name) VALUES
  ('MyPreOp+'),
  ('MyPreOp'),
  ('MyEndo'),
  ('MyPreOp Kids'),
  ('MyLA'),
  ('Not Known Product');

-- 8. PRODUCT TICKETS
CREATE TABLE product_tickets (
  id SERIAL PRIMARY KEY,
  week_id INT NOT NULL REFERENCES weekly_summary(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  ticket_count INT NOT NULL DEFAULT 0,
  UNIQUE(week_id, product_id)
);

CREATE INDEX idx_product_tickets_week ON product_tickets(week_id);

-- 9. CHANNELS
CREATE TABLE channels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO channels (name) VALUES
  ('Voice'),
  ('Email'),
  ('Messaging'),
  ('Web'),
  ('SMS');

-- 10. CHANNEL BREAKDOWN
CREATE TABLE channel_breakdown (
  id SERIAL PRIMARY KEY,
  week_id INT NOT NULL REFERENCES weekly_summary(id) ON DELETE CASCADE,
  channel_id INT NOT NULL REFERENCES channels(id),
  percentage DECIMAL(5,2) NOT NULL,
  UNIQUE(week_id, channel_id)
);

-- 11. AGENTS & FEEDBACK
CREATE TABLE agents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO agents (name) VALUES
  ('Lizzy'),
  ('Jordan'),
  ('Ben');

CREATE TABLE agent_feedback (
  id SERIAL PRIMARY KEY,
  week_id INT NOT NULL REFERENCES weekly_summary(id) ON DELETE CASCADE,
  agent_id INT NOT NULL REFERENCES agents(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_feedback_week ON agent_feedback(week_id);

-- 12. VERSION TRACKING
CREATE TABLE version_tickets (
  id SERIAL PRIMARY KEY,
  week_id INT NOT NULL REFERENCES weekly_summary(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  ticket_count INT NOT NULL DEFAULT 0,
  UNIQUE(week_id, version)
);

-- 13. WEEKLY IMAGES (Zendesk screenshot uploads)
CREATE TABLE weekly_images (
  id SERIAL PRIMARY KEY,
  week_id INT NOT NULL REFERENCES weekly_summary(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type VARCHAR(30) NOT NULL CHECK (image_type IN ('tickets_by_hour', 'tickets_by_day')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_id, image_type)
);

-- ============================================
-- VIEWS FOR DASHBOARDS
-- ============================================

-- Weekly overview with RAG status
CREATE VIEW vw_weekly_overview AS
SELECT
  ws.*,
  CASE
    WHEN ws.ticket_pct > 10 THEN 'RED'
    WHEN ws.ticket_pct >= 5 THEN 'AMBER'
    ELSE 'GREEN'
  END AS ticket_rag,
  CASE
    WHEN ws.satisfaction_rating < 85 THEN 'RED'
    WHEN ws.satisfaction_rating <= 95 THEN 'AMBER'
    ELSE 'GREEN'
  END AS satisfaction_rag
FROM weekly_summary ws
ORDER BY ws.week_start DESC;

-- Trust summary per week
CREATE VIEW vw_trust_weekly AS
SELECT
  ws.week_start,
  ws.week_end,
  t.name AS trust_name,
  tt.ticket_count
FROM trust_tickets tt
JOIN weekly_summary ws ON ws.id = tt.week_id
JOIN trusts t ON t.id = tt.trust_id
ORDER BY ws.week_start DESC, tt.ticket_count DESC;

-- Top issues ranked per week
CREATE VIEW vw_top_issues_weekly AS
SELECT
  ws.week_start,
  ic.name AS issue_name,
  pic.name AS parent_issue,
  wi.count
FROM weekly_issues wi
JOIN weekly_summary ws ON ws.id = wi.week_id
JOIN issue_categories ic ON ic.id = wi.issue_id
LEFT JOIN issue_categories pic ON pic.id = ic.parent_id
ORDER BY ws.week_start DESC, wi.count DESC;

-- Product breakdown per week
CREATE VIEW vw_product_weekly AS
SELECT
  ws.week_start,
  p.name AS product_name,
  pt.ticket_count
FROM product_tickets pt
JOIN weekly_summary ws ON ws.id = pt.week_id
JOIN products p ON p.id = pt.product_id
ORDER BY ws.week_start DESC, pt.ticket_count DESC;

-- ============================================
-- STORAGE: Create a bucket for image uploads
-- Run this via Supabase dashboard or API:
-- Storage > New Bucket > "weekly-images" (public: false)
-- ============================================
