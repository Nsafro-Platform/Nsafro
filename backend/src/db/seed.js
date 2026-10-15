import bcrypt from 'bcryptjs';
import { pool } from './pool.js';
import { migrate } from './migrate.js';

// SYNTHETIC DEMO DATA ONLY — clearly labelled seed data for the demo application.
// Admin login: admin@journey.demo / Demo1234!   User login: demo@journey.demo / Demo1234!

// Demo journey images: public Wikimedia Commons photos of the actual demo
// destinations (CC-licensed, hotlink-friendly). 960px is an allowed thumb size.
const JOURNEY_IMAGES = {
  'Atlas Mountains Trek':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Plateau_Yagour%2C_Agdal%2C_Morocco.jpg/960px-Plateau_Yagour%2C_Agdal%2C_Morocco.jpg',
  'Marrakech City Break':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Djemaa_el_Fna.jpg/960px-Djemaa_el_Fna.jpg',
  'Sahara Desert Nights':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Merzouga_Dunes_2011.jpg/960px-Merzouga_Dunes_2011.jpg',
  'Chefchaouen Blue Escape':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Chefchaouen-the-blue-city-of-morocco-with-palm-trees-and-the-mountain-view-in-the-backrgound.jpg/960px-Chefchaouen-the-blue-city-of-morocco-with-palm-trees-and-the-mountain-view-in-the-backrgound.jpg',
  'Essaouira Coast & Wind':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/%22Ein_bemerkenswertes_historisches_Denkmal%22._16.jpg/960px-%22Ein_bemerkenswertes_historisches_Denkmal%22._16.jpg',
  'Fes Heritage Weekend':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Bab_Bou_Jeloud_Frame_Minaret_Fes_Nov25_A7CR_09127-8_HDR3.jpg/960px-Bab_Bou_Jeloud_Frame_Minaret_Fes_Nov25_A7CR_09127-8_HDR3.jpg',
};

// Journey prices/capacities are synthetic demo values. startOffset/endOffset are
// days from seed time so the catalogue always shows future departures.
const JOURNEY_SEEDS = [
  {
    title: 'Atlas Mountains Trek',
    summary: 'Guided trek through the High Atlas.',
    description:
      'Five days of guided hiking between Berber villages, with mule support and mountain meals included.',
    destination: 'Imlil, Morocco',
    startOffset: 30,
    endOffset: 34,
    durationDays: 5,
    price: 890.00,
    capacity: 12,
    transport: 'Minibus from Marrakech',
    accommodation: 'Mountain gites',
    isGroup: true,
    program: 'Day 1: Imlil to Armed. Day 2: Toubkal base camp. Day 3: Summit attempt. Day 4: Descent via Azzaden valley. Day 5: Return.',
  },
  {
    title: 'Marrakech City Break',
    summary: 'A relaxed long weekend in the red city.',
    description:
      'Three nights in a riad in the medina, guided souk visit, Jemaa el-Fnaa square, and a day trip to the Majorelle Garden.',
    destination: 'Marrakech, Morocco',
    startOffset: 14,
    endOffset: 17,
    durationDays: 4,
    price: 420.00,
    capacity: 20,
    transport: 'Flight included',
    accommodation: 'Riad (B&B)',
    isGroup: true,
    program: 'Day 1: Arrival and medina walk. Day 2: Souks and palaces. Day 3: Day trip. Day 4: Departure.',
  },
  {
    title: 'Sahara Desert Nights',
    summary: 'Camel trek and camp under the dunes.',
    description:
      'Two nights in a desert camp in Merzouga with camel trekking, sandboarding, and stargazing from the Erg Chebbi dunes.',
    destination: 'Merzouga, Morocco',
    startOffset: 45,
    endOffset: 49,
    durationDays: 5,
    price: 760.00,
    capacity: 16,
    transport: '4x4 transfer',
    accommodation: 'Desert camp',
    isGroup: true,
    program: 'Day 1: Transfer via Ziz valley. Day 2: Camel trek to camp. Day 3: Dunes and sunrise. Day 4: Return drive.',
  },
  {
    title: 'Chefchaouen Blue Escape',
    summary: 'Slow travel in the blue pearl.',
    description:
      'Four days in the blue-washed streets of Chefchaouen with day hikes in the Rif mountains and local cooking workshop.',
    destination: 'Chefchaouen, Morocco',
    startOffset: 60,
    endOffset: 63,
    durationDays: 4,
    price: 530.00,
    capacity: 10,
    transport: 'Public bus',
    accommodation: 'Guesthouse',
    isGroup: false,
    program: '',
  },
  {
    title: 'Essaouira Coast & Wind',
    summary: 'Surf, seafood and old ramparts.',
    description:
      'Six days on the Atlantic coast combining beginner surf lessons, a fishing port visit, and the medina of Essaouira.',
    destination: 'Essaouira, Morocco',
    startOffset: 20,
    endOffset: 25,
    durationDays: 6,
    price: 1090.00,
    capacity: 8,
    transport: 'Private transfer',
    accommodation: 'Surf lodge',
    isGroup: false,
    program: '',
  },
  {
    title: 'Fes Heritage Weekend',
    summary: 'Artisans, tanneries and the old medina.',
    description:
      'Three days discovering the cultural capital: Al-Attarine madrasa, tanneries, artisan workshops, and a potters co-operative.',
    destination: 'Fes, Morocco',
    startOffset: 90,
    endOffset: 92,
    durationDays: 3,
    price: 340.00,
    capacity: 15,
    transport: 'Train included',
    accommodation: 'Medina hotel (B&B)',
    isGroup: true,
    program: '',
  },
];

// Extra demo rows to bulk up the catalogue for pagination testing. Metadata
// (dates, price, capacity, group flag) is generated deterministically per row —
// no real data. Titles are unique against the flagship rows above.
const EXTRA_JOURNEYS = [
  ["Agadir Beach Week", "Agadir, Morocco", "A week of wide sands and seafood.", "Seven relaxed days on Agadir's bay with beach time, a promenade stroll, and a day trip to Paradise Valley's pools."],
  ["Casablanca Modern Weekend", "Casablanca, Morocco", "Hassan II Mosque and art-deco boulevards.", "Two days mixing the iconic Hassan II Mosque, art-deco architecture, and Morocco's contemporary gallery scene."],
  ["Tangier Port Views", "Tangier, Morocco", "Where Africa meets Europe.", "Three days in the white medina of Tangier with café terraces, the Kasbah museum, and views over the Strait of Gibraltar."],
  ["Rabat Capital Discovery", "Rabat, Morocco", "Casbah ramparts and royal gardens.", "Three days through the capital: Oudayas casbah, the Hassan Tower, Chellah ruins, and modern art stops."],
  ["Meknes & Volubilis Days", "Meknes, Morocco", "Imperial gates and Roman ruins.", "Two days in Meknes with the Bab Mansour gate and a morning trip to the Roman site of Volubilis."],
  ["Ouarzazate Studio Tour", "Ouarzazate, Morocco", "Film sets and kasbahs.", "Three days exploring studio tours, the Taourirt kasbah, and the desert side of the door of the desert."],
  ["Ait Ben Haddou Trails", "Ait Ben Haddou, Morocco", "Walk an earthen ksar.", "Two days around the UNESCO-listed ksar with guided alleys, viewpoint hikes, and a tea break with locals."],
  ["Dakhla Kite Lagoon", "Dakhla, Morocco", "Turquoise water and constant wind.", "Five days of kitesurfing on the lagoon with certified instructors and a desert excursion to the white dune."],
  ["Ifrane Forest Escape", "Ifrane, Morocco", "Alpine calm in the Middle Atlas.", "Four days among cedar forests with Barbary macaque-spotting walks and stone-town strolls."],
  ["Todra Gorge Hike", "Tinerhir, Morocco", "Cliffs a hand-span apart.", "Three days walking the channel between 300-metre limestone walls plus palmery visits in Tinerhir."],
  ["Al Hoceima Coast", "Al Hoceima, Morocco", "Rif beaches without the crowds.", "Four days of coves and seafood with a boat trip across the Al Hoceima national park bays."],
  ["Tetouan White Streets", "Tetouan, Morocco", "Andalusian heritage on the Rif.", "Three days in the whitewashed medina with artisan quarters and a day on the coastal cornice."],
  ["Azrou Cedar Trails", "Azrou, Morocco", "Monkeys, cedars and cool air.", "Three days on Middle Atlas forest trails with cedar viewpoints and Berber village lunch stops."],
  ["Oualidia Lagoon Taste", "Oualidia, Morocco", "Oysters straight from the water.", "Two days of lagoon-side oyster tasting, swimming in calm waters, and a kasbah lunch."],
  ["Asilah Art Escape", "Asilah, Morocco", "Painted walls by the Atlantic.", "Two days among murals of the annual art festival and galleries inside the medina walls."],
  ["Toubkal Summit Push", "Imlil, Morocco", "North Africa's highest point.", "Three-day ascent of Mount Toubkal with an acclimatisation night in Imlil and a mountain hut stay."],
  ["Taghazout Surf Camp", "Taghazout, Morocco", "Classic waves, easy rhythm.", "Five days of surf coaching at Anchor Point with board, wetsuit and yoga mornings included."],
  ["Ouzoud Falls Days", "Ouzoud, Morocco", "Morocco's tallest waterfall.", "Two days with a boat ride under the falls, olive grove walks, and macaque viewing points."],
  ["Zagora Oasis Ride", "Zagora, Morocco", "Palm groves and desert silence.", "Three days with a camel ride into the regs around Zagora and a night in an oasis camp."],
  ["Moulay Idriss Pilgrimage Days", "Moulay Idriss, Morocco", "A holy hilltop town.", "Two days in the green-roofed town with a Volubilis panorama viewpoint and candle-lit evening walks."],
  ["Ziz Valley Road Trip", "Erfoud, Morocco", "A drive through palm canyons.", "Four days driving the Ziz gorges with palm-oasis stops and Kasbah views near Erfoud."],
  ["Safi Pottery Days", "Safi, Morocco", "Where clay becomes art.", "Two days on the Pottery Hill workshops, old medina ramparts, and a seafood dinner at the port."],
  ["Sefrou Cherry Days", "Sefrou, Morocco", "Heritage quarters and waterfalls.", "Two days through the old mellah, medina gates, and an afternoon detour to Bhalil cave houses."],
  ["Dades Valley Drive", "Dades Gorge, Morocco", "Road of a thousand kasbahs.", "Three days on the Dades valley road with hairpin viewpoint hikes and rose-water stops in Kelaa M'Gouna."],
  ["Sidi Ifni Coast Days", "Sidi Ifni, Morocco", "Colonial lines by the sea.", "Three days of cliff-top viewpoints, surf beaches, and colonial architecture in slow motion."],
];

const EXTRA_IMAGE_MAP = {
  "Agadir Beach Week": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Beach_of_Agadir_from_Kasbah_of_Agadir_Oufella.jpg/960px-Beach_of_Agadir_from_Kasbah_of_Agadir_Oufella.jpg",
  "Casablanca Modern Weekend": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Casa_finance_city_6_%28cropped%29.jpg/960px-Casa_finance_city_6_%28cropped%29.jpg",
  "Tangier Port Views": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Tanger_cor.jpg/960px-Tanger_cor.jpg",
  "Rabat Capital Discovery": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/%22Eine_beeindruckende_Festung%22._09.jpg/960px-%22Eine_beeindruckende_Festung%22._09.jpg",
  "Meknes & Volubilis Days": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Bab_Mansour_in_Meknes1732.jpg/960px-Bab_Mansour_in_Meknes1732.jpg",
  "Ouarzazate Studio Tour": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Kasbah_Taourirt_in_Ouarzazate_2011.jpg/960px-Kasbah_Taourirt_in_Ouarzazate_2011.jpg",
  "Ait Ben Haddou Trails": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Ksar_A%C3%AFt_Benhaddou%2C_Marocco_%28%D8%A3%D9%8A%D8%AA_%D8%A8%D9%86_%D8%AD%D8%AF%D9%88%D8%8C_%D8%A7%D9%84%D9%85%D8%BA%D8%B1%D8%A8%2C_%E2%B4%B0%E2%B5%A2%E2%B5%9C_%E2%B5%83%E2%B4%B0%E2%B4%B7%E2%B4%B7%E2%B5%93%29.jpg/960px-Ksar_A%C3%AFt_Benhaddou%2C_Marocco_%28%D8%A3%D9%8A%D8%AA_%D8%A8%D9%86_%D8%AD%D8%AF%D9%88%D8%8C_%D8%A7%D9%84%D9%85%D8%BA%D8%B1%D8%A8%2C_%E2%B4%B0%E2%B5%A2%E2%B5%9C_%E2%B5%83%E2%B4%B0%E2%B4%B7%E2%B4%B7%E2%B5%93%29.jpg",
  "Dakhla Kite Lagoon": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Dakhla%2C_Western_Sahara_%2811%29.jpg/960px-Dakhla%2C_Western_Sahara_%2811%29.jpg",
  "Ifrane Forest Escape": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Fes_to_Merzouga_%2855322835409%29.jpg/960px-Fes_to_Merzouga_%2855322835409%29.jpg",
  "Todra Gorge Hike": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/%22Ein_beeindruckendes_Naturwunder%22%2C_17.jpg/960px-%22Ein_beeindruckendes_Naturwunder%22%2C_17.jpg",
  "Al Hoceima Coast": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Al_Hoceima_Quemado.jpg/960px-Al_Hoceima_Quemado.jpg",
  "Tetouan White Streets": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Church_of_Our_Lady_of_Victory_of_T%C3%A9touan.jpg/960px-Church_of_Our_Lady_of_Victory_of_T%C3%A9touan.jpg",
  "Azrou Cedar Trails": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Mosqu%C3%A9e_Nour_Azrou_2.jpg/960px-Mosqu%C3%A9e_Nour_Azrou_2.jpg",
  "Oualidia Lagoon Taste": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Parkeerplaats_Oualidia_%286153240484%29.jpg/960px-Parkeerplaats_Oualidia_%286153240484%29.jpg",
  "Asilah Art Escape": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Asilah_seafront.jpg/960px-Asilah_seafront.jpg",
  "Toubkal Summit Push": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/My_Toubkal.jpg/960px-My_Toubkal.jpg",
  "Taghazout Surf Camp": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Taghazout_street_-_2026-02-02.jpg/960px-Taghazout_street_-_2026-02-02.jpg",
  "Ouzoud Falls Days": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Ouzoud_waterfalls_from_below.jpeg/960px-Ouzoud_waterfalls_from_below.jpeg",
  "Zagora Oasis Ride": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Zagora_56-2.jpg/960px-Zagora_56-2.jpg",
  "Moulay Idriss Pilgrimage Days": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Moulay_Idriss%2C_Maroc_%28318486164%29.jpg/960px-Moulay_Idriss%2C_Maroc_%28318486164%29.jpg",
  "Ziz Valley Road Trip": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Ziz_river_%28js%29.jpg/960px-Ziz_river_%28js%29.jpg",
  "Safi Pottery Days": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Safi_1.png/960px-Safi_1.png",
  "Sefrou Cherry Days": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Sefrou_commune_Headquarters.jpg/960px-Sefrou_commune_Headquarters.jpg",
  "Dades Valley Drive": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/%22Spektakul%C3%A4re_Haarnadelkurven%22._04.jpg/960px-%22Spektakul%C3%A4re_Haarnadelkurven%22._04.jpg",
  "Sidi Ifni Coast Days": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Die_wei%C3%9F-blauen_H%C3%A4user_von_Sidi_Ifni.jpg/960px-Die_wei%C3%9F-blauen_H%C3%A4user_von_Sidi_Ifni.jpg",
};

const OPTION_SEEDS = [
  ['transport', 'CTM bus pass', 'Intercity coach connections between major cities.', 35.00],
  ['transport', 'Private 4x4 transfer', 'Driver on call for the whole trip, up to 200 km/day.', 120.00],
  ['transport', 'Domestic flight add-on', 'One-way domestic flight between two cities.', 90.00],
  ['accommodation', 'Budget guesthouse', 'Simple clean double room, shared facilities.', 25.00],
  ['accommodation', 'Mid-range riad', 'Traditional riad double room with breakfast.', 65.00],
  ['accommodation', 'Desert camp night', 'Berber tent with dinner and breakfast included.', 55.00],
  ['accommodation', 'Boutique hotel upgrade', 'Design hotel room with breakfast and hammam access.', 140.00],
  ['activity', 'Guided medina tour', 'Half-day guided walk with local licensed guide.', 20.00],
  ['activity', 'Cooking workshop', 'Three-hour tagine cooking class with market visit.', 40.00],
  ['activity', 'Camel trek sunset', 'Two-hour sunset camel ride with tea break.', 30.00],
  ['activity', 'Beginner surf lesson', 'Two-hour lesson, board and wetsuit included.', 35.00],
  ['activity', 'Atlas day hike', 'Full-day guided hike with picnic lunch.', 45.00],
];

async function seed() {
  await migrate();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const hash = await bcrypt.hash('Demo1234!', 10);
    const { rows: users } = await client.query(
      `INSERT INTO users (email, password_hash, full_name, role) VALUES
         ('admin@journey.demo', $1, 'Demo Admin', 'admin'),
         ('demo@journey.demo',  $1, 'Demo Traveller', 'user')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, email, role`,
      [hash],
    );
    console.log('demo users:', users.map((u) => `${u.email} (${u.role})`).join(', '));

    // Idempotent per-row insert: journeys.title has no unique key, so a plain
    // INSERT would duplicate rows on re-run. The title guard makes re-seeding safe.
    const transports = ['Flight included', 'Private transfer', 'Public bus', 'Train included', 'Minibus shuttle'];
    const stays = ['Riad (B&B)', 'Guesthouse', 'Medina hotel (B&B)', 'Surf lodge', 'Boutique hotel'];

    const allJourneySeeds = [
      ...JOURNEY_SEEDS.map((s) => ({
        ...s,
        status: 'published',
        imageUrl: JOURNEY_IMAGES[s.title] || null,
      })),
      ...EXTRA_JOURNEYS.map(([title, destination, summary, description], index) => ({
        title,
        destination,
        summary,
        description,
        startOffset: 7 + (index * 11) % 120, // 7..126
        endOffset: 7 + (index * 11) % 120 + 2 + (index * 3) % 6,
        durationDays: 2 + (index * 3) % 6 + 1, // 3..8 (matches end-start)
        price: (Math.round((240 + (index * 173) % 1150) / 50) * 50),
        capacity: 6 + (index * 7) % 14,
        transport: transports[index % transports.length],
        accommodation: stays[(index + 2) % stays.length],
        isGroup: index % 3 !== 2,
        program: '',
        status: index === 18 ? 'draft' : 'published', // one admin-visible draft
        imageUrl: EXTRA_IMAGE_MAP[title] || null,
      })),
    ];

    for (const s of allJourneySeeds) {
      await client.query(      `INSERT INTO journeys
         (title, summary, description, destination, start_date, end_date, duration_days,
          price, capacity, transport, accommodation, is_group, program, status, image_url)
       SELECT $1, $2, $3, $4, CURRENT_DATE + $5::int, CURRENT_DATE + $6::int, $7, $8, $9, $10,
                $11, $12, $13, $14, $15
       WHERE NOT EXISTS (SELECT 1 FROM journeys WHERE title = $1)`,
        [
          s.title, s.summary, s.description, s.destination, s.startOffset, s.endOffset,
          s.durationDays, s.price, s.capacity, s.transport, s.accommodation, s.isGroup,
          s.program, s.status || 'published', s.imageUrl || null,
        ],
      );
    }

    // Keep image URLs on existing rows in sync with the demo image set.
    for (const s of allJourneySeeds) {
      if (!s.imageUrl) continue;
      await client.query(
        "UPDATE journeys SET image_url = $1 WHERE title = $2 AND COALESCE(image_url, '') <> $1",
        [s.imageUrl, s.title],
      );
    }

    const { rows: journeyTitles } = await client.query(
      'SELECT title FROM journeys ORDER BY id',
    );
    // Keep the added params in sync with the insert column list above.
    console.log('demo journeys:', journeyTitles.length, "(incl. 1 draft for the admin demo)");

    // Same idempotence guard for options (no unique key on (category, name)).
    for (const [category, name, description, price] of OPTION_SEEDS) {
      await client.query(
        `INSERT INTO journey_options (category, name, description, price)
         SELECT $1, $2, $3, $4
         WHERE NOT EXISTS (SELECT 1 FROM journey_options WHERE name = $2)`,
        [category, name, description, price],
      );
    }

    const { rows: optionRows } = await client.query('SELECT COUNT(*) AS n FROM journey_options');
    console.log('demo options:', optionRows[0].n, 'rows');

    await client.query('COMMIT');
    console.log('Seed complete (synthetic demo data only).');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
