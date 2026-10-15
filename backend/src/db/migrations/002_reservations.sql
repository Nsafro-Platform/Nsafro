-- 002_reservations.sql — multi-type reservation module (PERSONAL / GROUP / CUSTOM).
--
-- Kept separate from `bookings`: a reservation covers three different flows, two of
-- which are journey-based while CUSTOM is assembled from the option catalogue.
-- Money stays NUMERIC(10,2) (exact) and the whole price breakdown is snapshotted so
-- later offer/option edits never rewrite an existing reservation.

CREATE TABLE reservations (
  id               SERIAL PRIMARY KEY,
  reference        TEXT NOT NULL UNIQUE,
  user_id          INT NOT NULL REFERENCES users (id),
  reservation_type TEXT NOT NULL CHECK (reservation_type IN ('PERSONAL', 'GROUP', 'CUSTOM')),
  journey_id       INT REFERENCES journeys (id), -- PERSONAL / GROUP only
  travellers_count INT NOT NULL CHECK (travellers_count > 0),
  subtotal         NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  taxes            NUMERIC(10,2) NOT NULL CHECK (taxes >= 0),
  fees             NUMERIC(10,2) NOT NULL CHECK (fees >= 0),
  total_price      NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  selected_options JSONB NOT NULL DEFAULT '{}'::jsonb,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  payment_status   TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Journey-based flows must point at a journey; CUSTOM is built from options.
  CHECK (reservation_type = 'CUSTOM' OR journey_id IS NOT NULL)
);

CREATE INDEX reservations_user_idx ON reservations (user_id);
CREATE INDEX reservations_journey_idx ON reservations (journey_id);

CREATE TABLE reservation_participants (
  id             SERIAL PRIMARY KEY,
  reservation_id INT NOT NULL REFERENCES reservations (id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'confirmed', 'declined'))
);

CREATE INDEX reservation_participants_reservation_idx ON reservation_participants (reservation_id);

CREATE TABLE reservation_payments (
  id             SERIAL PRIMARY KEY,
  reservation_id INT NOT NULL REFERENCES reservations (id),
  outcome        TEXT NOT NULL CHECK (outcome IN ('success', 'failure')),
  amount         NUMERIC(10,2) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Duplicate-payment protection: at most one successful payment per reservation.
CREATE UNIQUE INDEX reservation_payments_one_success
  ON reservation_payments (reservation_id) WHERE outcome = 'success';
