-- CareFlow fictional demo rooms. Each unguessable room ID is a demo capability.
-- Application server credentials stay private. Do not use real patient records.
CREATE TABLE IF NOT EXISTS careflow_demo_rooms (
 id uuid PRIMARY KEY,
 state jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
-- Mutations SELECT the room FOR UPDATE inside a transaction to avoid lost updates.

CREATE TABLE IF NOT EXISTS careflow_auth_attempts (key text PRIMARY KEY, failures integer NOT NULL, window_start timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS careflow_appointments (
 id uuid PRIMARY KEY, room_id uuid NOT NULL, department text NOT NULL, starts_at timestamptz NOT NULL,
 patient_name varchar(64) NOT NULL, email varchar(120), secret_hash char(64) NOT NULL,
 status text NOT NULL DEFAULT 'booked', created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(), reminded_at timestamptz,
 CONSTRAINT careflow_booking_status CHECK(status IN ('booked','cancelled','completed'))
);
CREATE INDEX IF NOT EXISTS careflow_appointments_room_slot_idx ON careflow_appointments(room_id,department,starts_at,status);
CREATE INDEX IF NOT EXISTS careflow_appointments_reminder_idx ON careflow_appointments(starts_at,status,reminded_at) WHERE email IS NOT NULL;

-- Additive appointment-to-queue check-in; original booking status constraint remains valid.
ALTER TABLE careflow_appointments ADD COLUMN IF NOT EXISTS queue_token text, ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;
