// Gallery images live in their own table while journeys.image_url stays the
// principal image. Keeping the aggregate SQL and the shaping in one module means
// the catalogue, the journey detail and the reservation wizard always agree.

export const JOURNEY_IMAGES_SQL = `COALESCE((
  SELECT json_agg(ji.url ORDER BY ji.position, ji.id)
  FROM journey_images ji WHERE ji.journey_id = j.id
), '[]'::json) AS extra_images`;

// Principal image first, then the gallery photos.
export function journeyImages(row) {
  const extra = Array.isArray(row.extra_images) ? row.extra_images : [];
  return [row.image_url, ...extra].filter(Boolean);
}
