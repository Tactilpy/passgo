-- ============================================================
-- PASSGO - Schema SQL v2.0
-- PostgreSQL 15+
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- ORGANIZATIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE organizations (
  id            SERIAL PRIMARY KEY,
  uuid          UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  name          VARCHAR(200) NOT NULL,
  razon_social  VARCHAR(200),
  ruc           VARCHAR(30),
  address       VARCHAR(300),
  city          VARCHAR(100),
  country       VARCHAR(100) DEFAULT 'Argentina',
  lat           DECIMAL(10,7),
  lng           DECIMAL(10,7),
  email         VARCHAR(150) NOT NULL,
  email2        VARCHAR(150),
  phone         VARCHAR(30),
  phone2        VARCHAR(30),
  contact_name  VARCHAR(150),
  contact_role  VARCHAR(100),
  plan          VARCHAR(20) DEFAULT 'pro' CHECK (plan IN ('basico','pro','enterprise')),
  logo_url      TEXT,
  active        BOOLEAN DEFAULT true,
  permissions   JSONB DEFAULT '[]',
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orgs_plan   ON organizations(plan);
CREATE INDEX idx_orgs_active ON organizations(active);

-- ────────────────────────────────────────────────────────────
-- USERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  uuid          UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  org_id        INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  nombre        VARCHAR(100) NOT NULL,
  apellido      VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  phone         VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(30) DEFAULT 'Disertante'
                CHECK (role IN ('SuperAdmin','Admin','Organizador','Disertante','Operador')),
  plan          VARCHAR(20) DEFAULT 'pro',
  permissions   JSONB DEFAULT '[]',
  active        BOOLEAN DEFAULT true,
  temp_password BOOLEAN DEFAULT true,
  last_login    TIMESTAMP,
  refresh_token TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email  ON users(email);
CREATE INDEX idx_users_org    ON users(org_id);
CREATE INDEX idx_users_role   ON users(role);

-- ────────────────────────────────────────────────────────────
-- SPEAKERS (Disertantes)
-- ────────────────────────────────────────────────────────────
CREATE TABLE speakers (
  id         SERIAL PRIMARY KEY,
  uuid       UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  org_id     INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  nombre     VARCHAR(100) NOT NULL,
  apellido   VARCHAR(100) NOT NULL,
  dni        VARCHAR(20),
  email      VARCHAR(150) NOT NULL,
  tel        VARCHAR(30),
  address    VARCHAR(300),
  cargo      VARCHAR(100),
  empresa    VARCHAR(200),
  foto_url   TEXT,
  firma_url  TEXT,
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_speakers_org   ON speakers(org_id);
CREATE INDEX idx_speakers_email ON speakers(email);

-- Speaker ↔ Event relation
CREATE TABLE speaker_events (
  speaker_id INTEGER REFERENCES speakers(id) ON DELETE CASCADE,
  event_id   INTEGER, -- FK added after events table
  PRIMARY KEY (speaker_id, event_id)
);

-- ────────────────────────────────────────────────────────────
-- EVENTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE events (
  id             SERIAL PRIMARY KEY,
  uuid           UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  org_id         INTEGER REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  title          VARCHAR(300) NOT NULL,
  slug           VARCHAR(150) UNIQUE NOT NULL,
  type           VARCHAR(100),
  date           DATE NOT NULL,
  time_start     TIME,
  time_end       TIME,
  location       VARCHAR(300),
  capacity       INTEGER DEFAULT 50,
  attendees      INTEGER DEFAULT 0,
  status         VARCHAR(20) DEFAULT 'upcoming'
                 CHECK (status IN ('upcoming','active','finished','cancelled')),
  methods        JSONB DEFAULT '["facial","qr"]',
  survey_timing  VARCHAR(20) DEFAULT 'checkout'
                 CHECK (survey_timing IN ('checkin','checkout','email')),
  confirm_mode   VARCHAR(20) DEFAULT 'auto'
                 CHECK (confirm_mode IN ('auto','confirm')),
  payment_type   VARCHAR(10) DEFAULT 'free' CHECK (payment_type IN ('free','paid')),
  price          DECIMAL(10,2) DEFAULT 0,
  cert_type      VARCHAR(50) DEFAULT 'standard',
  has_survey     BOOLEAN DEFAULT true,
  color          VARCHAR(20),
  created_by     INTEGER REFERENCES users(id),
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_org    ON events(org_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date   ON events(date);
CREATE INDEX idx_events_slug   ON events(slug);

-- Add FK now that events exists
ALTER TABLE speaker_events ADD CONSTRAINT fk_se_event
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- ────────────────────────────────────────────────────────────
-- PARTICIPANTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE participants (
  id            SERIAL PRIMARY KEY,
  uuid          UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  nombre        VARCHAR(100) NOT NULL,
  apellido      VARCHAR(100) NOT NULL,
  dni           VARCHAR(20),
  nacimiento    DATE,
  email         VARCHAR(150),
  tel           VARCHAR(30),
  org           VARCHAR(200),
  role          VARCHAR(100),
  facial_data   TEXT,        -- base64 facial descriptor
  qr_code       TEXT,        -- QR value
  rfid_uid      VARCHAR(50),
  huella_data   TEXT,        -- fingerprint hash
  foto_url      TEXT,
  pay_status    VARCHAR(20) DEFAULT 'free'
                CHECK (pay_status IN ('free','pending','paid','partial')),
  pay_amount    DECIMAL(10,2) DEFAULT 0,
  pay_date      DATE,
  pay_method    VARCHAR(50),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_parts_email ON participants(email);
CREATE INDEX idx_parts_dni   ON participants(dni);

-- Participant ↔ Event enrollment
CREATE TABLE participant_events (
  id             SERIAL PRIMARY KEY,
  participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
  event_id       INTEGER REFERENCES events(id) ON DELETE CASCADE,
  registered_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(participant_id, event_id)
);

-- ────────────────────────────────────────────────────────────
-- CHECK-INS
-- ────────────────────────────────────────────────────────────
CREATE TABLE checkins (
  id             SERIAL PRIMARY KEY,
  participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
  event_id       INTEGER REFERENCES events(id) ON DELETE CASCADE,
  check_in       TIMESTAMP,
  check_out      TIMESTAMP,
  method         VARCHAR(20) CHECK (method IN ('facial','qr','rfid','huella','manual')),
  status         VARCHAR(10) DEFAULT 'in' CHECK (status IN ('in','out')),
  survey_done    BOOLEAN DEFAULT false,
  operator_id    INTEGER REFERENCES users(id),
  created_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(participant_id, event_id)  -- anti-duplicate
);

CREATE INDEX idx_checkins_event ON checkins(event_id);
CREATE INDEX idx_checkins_part  ON checkins(participant_id);
CREATE INDEX idx_checkins_status ON checkins(status);

-- ────────────────────────────────────────────────────────────
-- CERTIFICATES
-- ────────────────────────────────────────────────────────────
CREATE TABLE cert_templates (
  id         SERIAL PRIMARY KEY,
  org_id     INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  name       VARCHAR(150) NOT NULL,
  theme      VARCHAR(50) DEFAULT 'clasico',
  data       JSONB NOT NULL,  -- all template config
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE certificates (
  id             SERIAL PRIMARY KEY,
  uuid           UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  cert_id        VARCHAR(50) UNIQUE NOT NULL,
  template_id    INTEGER REFERENCES cert_templates(id),
  event_id       INTEGER REFERENCES events(id) ON DELETE CASCADE,
  participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
  issued_by      INTEGER REFERENCES users(id),
  issued_at      TIMESTAMP DEFAULT NOW(),
  approved       BOOLEAN DEFAULT false,
  approved_by    INTEGER REFERENCES users(id),
  approved_at    TIMESTAMP,
  sent           BOOLEAN DEFAULT false,
  sent_at        TIMESTAMP,
  channel        VARCHAR(20) DEFAULT 'email',
  pdf_url        TEXT,
  revoked        BOOLEAN DEFAULT false,
  UNIQUE(event_id, participant_id)
);

CREATE INDEX idx_certs_event ON certificates(event_id);
CREATE INDEX idx_certs_part  ON certificates(participant_id);
CREATE INDEX idx_certs_approved ON certificates(approved);

-- ────────────────────────────────────────────────────────────
-- SURVEYS
-- ────────────────────────────────────────────────────────────
CREATE TABLE surveys (
  id         SERIAL PRIMARY KEY,
  event_id   INTEGER REFERENCES events(id) ON DELETE CASCADE,
  title      VARCHAR(200),
  timing     VARCHAR(20) DEFAULT 'checkout',
  questions  JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE survey_responses (
  id             SERIAL PRIMARY KEY,
  survey_id      INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
  participant_id INTEGER REFERENCES participants(id),
  answers        JSONB NOT NULL,
  submitted_at   TIMESTAMP DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- COMMUNICATIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE comm_settings (
  id       SERIAL PRIMARY KEY,
  org_id   INTEGER REFERENCES organizations(id),
  type     VARCHAR(20) NOT NULL CHECK (type IN ('smtp','whatsapp')),
  config   JSONB NOT NULL DEFAULT '{}',
  active   BOOLEAN DEFAULT false,
  UNIQUE(org_id, type)
);

CREATE TABLE send_log (
  id             SERIAL PRIMARY KEY,
  event_id       INTEGER REFERENCES events(id),
  participant_id INTEGER REFERENCES participants(id),
  channel        VARCHAR(20),
  type           VARCHAR(50),
  status         VARCHAR(20) DEFAULT 'sent',
  sent_at        TIMESTAMP DEFAULT NOW(),
  error_msg      TEXT
);

-- ────────────────────────────────────────────────────────────
-- AUDIT LOG
-- ────────────────────────────────────────────────────────────
CREATE TABLE audit_log (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id),
  action     VARCHAR(100) NOT NULL,
  entity     VARCHAR(50),
  entity_id  INTEGER,
  details    JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user   ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity, entity_id);
CREATE INDEX idx_audit_date   ON audit_log(created_at);

-- ────────────────────────────────────────────────────────────
-- UPDATED_AT triggers
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['organizations','users','events','participants'] LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t, t);
  END LOOP;
END; $$;
