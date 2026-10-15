-- 003_journey_images.sql — extra gallery images for a journey.
--
-- journeys.image_url stays the principal image (catalogue cards, offer hero).
-- This table holds the additional photos shown in the gallery/lightbox, in
-- display order, so a journey can carry a full set of pictures.

CREATE TABLE journey_images (
  id         SERIAL PRIMARY KEY,
  journey_id INT NOT NULL REFERENCES journeys (id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  position   INT NOT NULL DEFAULT 0 CHECK (position >= 0),
  UNIQUE (journey_id, position)
);

CREATE INDEX journey_images_journey_idx ON journey_images (journey_id, position);
