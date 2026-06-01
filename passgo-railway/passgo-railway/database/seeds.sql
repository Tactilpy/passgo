-- PASSGO - Seeds v2.0
-- Run after schema.sql

-- Admin organization
INSERT INTO organizations (name, razon_social, ruc, email, phone, contact_name, contact_role, plan, active)
VALUES ('Passgo Demo', 'Passgo Demo S.A.', '30-99999999-9', 'admin@passgo.app', '+54 11 0000-0000', 'Administrador', 'Super Admin', 'enterprise', true);

-- Super admin user (password: Admin1234!)
INSERT INTO users (org_id, nombre, apellido, email, password_hash, role, plan, permissions, active, temp_password)
VALUES (
  1, 'Admin', 'General', 'admin@passgo.app',
  crypt('Admin1234!', gen_salt('bf', 12)),
  'SuperAdmin', 'enterprise',
  '["create_events","edit_events","delete_events","create_participants","emit_certs","use_qr","use_facial","use_rfid","use_huella","use_kiosks","view_reports"]',
  true, false
);

-- Demo org
INSERT INTO organizations (name, razon_social, email, phone, contact_name, plan, active)
VALUES ('Hospital Demo', 'Hospital Demo S.A.', 'demo@hospital.com', '+54 11 1111-1111', 'Dr. Demo', 'pro', true);

-- Demo speaker
INSERT INTO users (org_id, nombre, apellido, email, password_hash, role, plan, active, temp_password)
VALUES (
  2, 'Martín', 'Rodríguez', 'm.rodriguez@hospital.com',
  crypt('Speaker123!', gen_salt('bf', 12)),
  'Disertante', 'pro', true, false
);

-- Demo event
INSERT INTO events (org_id, title, slug, type, date, time_start, time_end, location, capacity, status, methods, payment_type, created_by)
VALUES (
  2, 'Congreso Demo 2026', 'congreso-demo-2026', 'Congreso Médico',
  CURRENT_DATE + 7, '09:00', '17:00', 'Auditorio Central, Buenos Aires',
  60, 'upcoming', '["facial","qr"]', 'free', 1
);

-- Comm settings template
INSERT INTO comm_settings (org_id, type, config, active)
VALUES (1, 'smtp', '{"host":"smtp.gmail.com","port":587,"user":"","pass":"","from":"noreply@passgo.app"}', false);

INSERT INTO comm_settings (org_id, type, config, active)
VALUES (1, 'whatsapp', '{"provider":"evolution","url":"","apiKey":"","phoneFrom":""}', false);
