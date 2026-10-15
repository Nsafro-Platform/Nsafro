-- 001_init.sql — initial schema for the Journey Platform.
-- Money is NUMERIC(10,2) (exact); snapshots are stored on bookings.

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE journeys (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  summary       TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  destination   TEXT NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  duration_days INT  NOT NULL CHECK (duration_days > 0),
  price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  capacity      INT  NOT NULL CHECK (capacity > 0),
  transport     TEXT NOT NULL DEFAULT '',
  accommodation TEXT NOT NULL DEFAULT '',
  image_url     TEXT,
  is_group      BOOLEAN NOT NULL DEFAULT FALSE,
  program       TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

CREATE INDEX journeys_status_idx ON journeys (status);
CREATE INDEX journeys_destination_idx ON journeys (destination);

CREATE TABLE bookings (
  id               SERIAL PRIMARY KEY,
  reference        TEXT NOT NULL UNIQUE,
  user_id          INT NOT NULL REFERENCES users (id),
  journey_id       INT NOT NULL REFERENCES journeys (id),
  travellers_count INT NOT NULL CHECK (travellers_count > 0),
  unit_price       NUMERIC(10,2) NOT NULL, -- snapshot of journey.price at booking time
  total_price      NUMERIC(10,2) NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  payment_status   TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX bookings_user_idx ON bookings (user_id);

CREATE TABLE payments (
  id         SERIAL PRIMARY KEY,
  booking_id INT NOT NULL REFERENCES bookings (id),
  outcome    TEXT NOT NULL CHECK (outcome IN ('success', 'failure')),
  amount     NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Duplicate-payment protection: at most one successful payment per booking.
CREATE UNIQUE INDEX payments_one_success_per_booking
  ON payments (booking_id) WHERE outcome = 'success';

CREATE TABLE participants (
  id         SERIAL PRIMARY KEY,
  booking_id INT NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'confirmed', 'declined'))
);

CREATE INDEX participants_booking_idx ON participants (booking_id);

CREATE TABLE journey_options (
  id          SERIAL PRIMARY KEY,
  category    TEXT NOT NULL CHECK (category IN ('transport', 'accommodation', 'activity')),
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0)
);

CREATE TABLE itineraries (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users (id),
  title      TEXT NOT NULL DEFAULT 'My journey',
  status     TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE itinerary_items (
  id           SERIAL PRIMARY KEY,
  itinerary_id INT NOT NULL REFERENCES itineraries (id) ON DELETE CASCADE,
  option_id    INT NOT NULL REFERENCES journey_options (id),
  quantity     INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  UNIQUE (itinerary_id, option_id)
);

CREATE TABLE quote_requests (
  id            SERIAL PRIMARY KEY,
  itinerary_id  INT NOT NULL UNIQUE REFERENCES itineraries (id),
  user_id       INT NOT NULL REFERENCES users (id),
  status        TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_review', 'quoted', 'rejected')),
  agent_note    TEXT NOT NULL DEFAULT '',
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
