// Static demo catalogue for the GitHub Pages build.
//
// The real application reads these rows from PostgreSQL through the Express API
// (backend/src/db/seed.js). This module mirrors that seed so the published site
// can run entirely in the browser — see src/demo/api.js.

export const DEMO_PASSWORD = 'Demo1234!'

// Offsets are days from the day the demo data is first created, so the
// catalogue always shows upcoming departures.
export const FLAGSHIP_JOURNEYS = [
  {
    title: 'Atlas Mountains Trek',
    summary: 'Guided trek through the High Atlas.',
    description:
      'Five days of guided hiking between Berber villages, with mule support and mountain meals included.',
    destination: 'Imlil, Morocco',
    startOffset: 30,
    endOffset: 34,
    price: '890.00',
    capacity: 12,
    transport: 'Minibus from Marrakech',
    accommodation: 'Mountain gites',
    isGroup: true,
    program:
      'Day 1: Imlil to Armed. Day 2: Toubkal base camp. Day 3: Summit attempt. Day 4: Descent via Azzadene valley. Day 5: Return.',
  },
  {
    title: 'Marrakech City Break',
    summary: 'A relaxed long weekend in the red city.',
    description:
      'Three nights in a riad in the medina, guided souk visit, Jemaa el-Fnaa square, and a day trip to the Majorelle Garden.',
    destination: 'Marrakech, Morocco',
    startOffset: 14,
    endOffset: 17,
    price: '420.00',
    capacity: 20,
    transport: 'Flight included',
    accommodation: 'Riad (B&B)',
    isGroup: true,
    program:
      'Day 1: Arrival and medina walk. Day 2: Souks and palaces. Day 3: Day trip. Day 4: Departure.',
  },
  {
    title: 'Sahara Desert Nights',
    summary: 'Camel trek and camp under the dunes.',
    description:
      'Two nights in a desert camp in Merzouga with camel trekking, sandboarding, and stargazing from the Erg Chebbi dunes.',
    destination: 'Merzouga, Morocco',
    startOffset: 45,
    endOffset: 49,
    price: '760.00',
    capacity: 16,
    transport: '4x4 transfer',
    accommodation: 'Desert camp',
    isGroup: true,
    program:
      'Day 1: Transfer via Ziz valley. Day 2: Camel trek to camp. Day 3: Dunes and sunrise. Day 4: Return drive.',
  },
  {
    title: 'Chefchaouen Blue Escape',
    summary: 'Slow travel in the blue pearl.',
    description:
      'Four days in the blue-washed streets of Chefchaouen with day hikes in the Rif mountains and local cooking workshop.',
    destination: 'Chefchaouen, Morocco',
    startOffset: 60,
    endOffset: 63,
    price: '530.00',
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
    price: '1090.00',
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
    price: '340.00',
    capacity: 15,
    transport: 'Train included',
    accommodation: 'Medina hotel (B&B)',
    isGroup: true,
    program: '',
  },
]

// Extra offers that bulk up the catalogue for search and pagination, exactly as
// the backend seed generates them deterministically from the index.
export const EXTRA_JOURNEYS = [
  ['Agadir Beach Week', 'Agadir, Morocco', 'A week of wide sands and seafood.', "Seven relaxed days on Agadir's bay with beach time, a promenade stroll, and a day trip to Paradise Valley's pools."],
  ['Casablanca Modern Weekend', 'Casablanca, Morocco', 'Hassan II Mosque and art-deco boulevards.', "Two days mixing the iconic Hassan II Mosque, art-deco architecture, and Morocco's contemporary gallery scene."],
  ['Tangier Port Views', 'Tangier, Morocco', 'Where Africa meets Europe.', 'Three days in the white medina of Tangier with café terraces, the Kasbah museum, and views over the Strait of Gibraltar.'],
  ['Rabat Capital Discovery', 'Rabat, Morocco', 'Casbah ramparts and royal gardens.', 'Three days through the capital: Oudayas casbah, the Hassan Tower, Chellah ruins, and modern art stops.'],
  ['Meknes & Volubilis Days', 'Meknes, Morocco', 'Imperial gates and Roman ruins.', 'Two days in Meknes with the Bab Mansour gate and a morning trip to the Roman site of Volubilis.'],
  ['Ouarzazate Studio Tour', 'Ouarzazate, Morocco', 'Film sets and kasbahs.', 'Three days exploring studio tours, the Taourirt kasbah, and the desert side of the door of the desert.'],
  ['Ait Ben Haddou Trails', 'Ait Ben Haddou, Morocco', 'Walk an earthen ksar.', 'Two days around the UNESCO-listed ksar with guided alleys, viewpoint hikes, and a tea break with locals.'],
  ['Dakhla Kite Lagoon', 'Dakhla, Morocco', 'Turquoise water and constant wind.', 'Five days of kitesurfing on the lagoon with certified instructors and a desert excursion to the white dune.'],
  ['Ifrane Forest Escape', 'Ifrane, Morocco', 'Alpine calm in the Middle Atlas.', 'Four days among cedar forests with Barbary macaque-spotting walks and stone-town strolls.'],
  ['Todra Gorge Hike', 'Tinerhir, Morocco', 'Cliffs a hand-span apart.', 'Three days walking the channel between 300-metre limestone walls plus palmery visits in Tinerhir.'],
  ['Al Hoceima Coast', 'Al Hoceima, Morocco', 'Rif beaches without the crowds.', 'Four days of coves and seafood with a boat trip across the Al Hoceima national park bays.'],
  ['Tetouan White Streets', 'Tetouan, Morocco', 'Andalusian heritage on the Rif.', 'Three days in the whitewashed medina with artisan quarters and a day on the coastal cornice.'],
  ['Azrou Cedar Trails', 'Azrou, Morocco', 'Monkeys, cedars and cool air.', 'Three days on Middle Atlas forest trails with cedar viewpoints and Berber village lunch stops.'],
  ['Oualidia Lagoon Taste', 'Oualidia, Morocco', 'Oysters straight from the water.', 'Two days of lagoon-side oyster tasting, swimming in calm waters, and a kasbah lunch.'],
  ['Asilah Art Escape', 'Asilah, Morocco', 'Painted walls by the Atlantic.', 'Two days among murals of the annual art festival and galleries inside the medina walls.'],
  ['Toubkal Summit Push', 'Imlil, Morocco', "North Africa's highest point.", 'Three-day ascent of Mount Toubkal with an acclimatisation night in Imlil and a mountain hut stay.'],
  ['Taghazout Surf Camp', 'Taghazout, Morocco', 'Classic waves, easy rhythm.', 'Five days of surf coaching at Anchor Point with board, wetsuit and yoga mornings included.'],
  ['Ouzoud Falls Days', 'Ouzoud, Morocco', "Morocco's tallest waterfall.", 'Two days with a boat ride under the falls, olive grove walks, and macaque viewing points.'],
  ['Zagora Oasis Ride', 'Zagora, Morocco', 'Palm groves and desert silence.', 'Three days with a camel ride into the regs around Zagora and a night in an oasis camp.'],
  ['Moulay Idriss Pilgrimage Days', 'Moulay Idriss, Morocco', 'A holy hilltop town.', 'Two days in the green-roofed town with a Volubilis panorama viewpoint and candle-lit evening walks.'],
  ['Ziz Valley Road Trip', 'Erfoud, Morocco', 'A drive through palm canyons.', 'Four days driving the Ziz gorges with palm-oasis stops and Kasbah views near Erfoud.'],
  ['Safi Pottery Days', 'Safi, Morocco', 'Where clay becomes art.', 'Two days on the Pottery Hill workshops, old medina ramparts, and a seafood dinner at the port.'],
  ['Sefrou Cherry Days', 'Sefrou, Morocco', 'Heritage quarters and waterfalls.', 'Two days through the old mellah, medina gates, and an afternoon detour to Bhalil cave houses.'],
  ['Dades Valley Drive', 'Dades Gorge, Morocco', 'Road of a thousand kasbahs.', "Three days on the Dades valley road with hairpin viewpoint hikes and rose-water stops in Kelaa M'Gouna."],
  ['Sidi Ifni Coast Days', 'Sidi Ifni, Morocco', 'Colonial lines by the sea.', 'Three days of cliff-top viewpoints, surf beaches, and colonial architecture in slow motion.'],
]

export const OPTION_SEEDS = [
  ['transport', 'CTM bus pass', 'Intercity coach connections between major cities.', '35.00'],
  ['transport', 'Private 4x4 transfer', 'Driver on call for the whole trip, up to 200 km/day.', '120.00'],
  ['transport', 'Domestic flight add-on', 'One-way domestic flight between two cities.', '90.00'],
  ['transport', 'Train ticket (2nd class)', 'Second-class rail ticket between two cities, per traveller.', '45.00'],
  ['transport', 'Private van seat', 'Shared van with driver-guide for the whole custom itinerary, per member.', '95.00'],
  ['transport', 'Luxury coach seat', 'Air-conditioned coach with reclining seats, per member.', '65.00'],
  ['transport', 'SUV with driver', 'Private SUV with driver for the whole custom itinerary, per member.', '140.00'],
  ['accommodation', 'Budget guesthouse', 'Simple clean double room, shared facilities.', '25.00'],
  ['accommodation', 'Mid-range riad', 'Traditional riad double room with breakfast.', '65.00'],
  ['accommodation', 'Desert camp night', 'Berber tent with dinner and breakfast included.', '55.00'],
  ['accommodation', 'Boutique hotel upgrade', 'Design hotel room with breakfast and hammam access.', '140.00'],
  ['activity', 'Guided medina tour', 'Half-day guided walk with local licensed guide.', '20.00'],
  ['activity', 'Cooking workshop', 'Three-hour tagine cooking class with market visit.', '40.00'],
  ['activity', 'Camel trek sunset', 'Two-hour sunset camel ride with tea break.', '30.00'],
  ['activity', 'Beginner surf lesson', 'Two-hour lesson, board and wetsuit included.', '35.00'],
  ['activity', 'Atlas day hike', 'Full-day guided hike with picnic lunch.', '45.00'],
]
