-- CareFlow fictional demo rooms. Each unguessable room ID is a demo capability.
-- Application server credentials stay private. Do not use real patient records.
CREATE TABLE IF NOT EXISTS careflow_demo_rooms (
 id uuid PRIMARY KEY,
 state jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
-- Mutations SELECT the room FOR UPDATE inside a transaction to avoid lost updates.
