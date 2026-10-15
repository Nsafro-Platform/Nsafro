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

// Extra gallery photos per journey (principal image stays in JOURNEY_IMAGES /
// EXTRA_IMAGE_MAP above). Real, CC-licensed Wikimedia Commons photos of each
// demo destination; every URL was verified to return HTTP 200. Demo data only.
const JOURNEY_GALLERY = {
  "Atlas Mountains Trek": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/A_view_on_the_Atlas_Mountains_from_Imlil%2C_Morocco.jpg/960px-A_view_on_the_Atlas_Mountains_from_Imlil%2C_Morocco.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/Atlas_mountains%2C_Imlil%2C_2022_10_30.jpg/960px-Atlas_mountains%2C_Imlil%2C_2022_10_30.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e8/Commune_Imlil_center.jpg/960px-Commune_Imlil_center.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Marrakech City Break": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/be/Babuchas_02_--_2014_--_Marrakech%2C_Marruecos.jpg/960px-Babuchas_02_--_2014_--_Marrakech%2C_Marruecos.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/16/Jewish_cemetery_Marrakech_03042022_026.jpg/960px-Jewish_cemetery_Marrakech_03042022_026.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f7/Lamp_maker%2C_Medina_of_Marrakech.jpg/960px-Lamp_maker%2C_Medina_of_Marrakech.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Sahara Desert Nights": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/Brahim_FARAJI_-_SAHARA_is_coming-_Merzouga_-_Morocco_-_%D8%A7%D9%84%D8%B5%D8%AD%D8%B1%D8%A7%D8%A1_%D9%82%D8%A7%D8%AF%D9%85%D8%A9_-_%D9%85%D8%B1%D8%B2%D9%88%D9%83%D8%A9_-_%D8%A7%D9%84%D9%85%D8%BA%D8%B1%D8%A8.jpg/960px-Brahim_FARAJI_-_SAHARA_is_coming-_Merzouga_-_Morocco_-_%D8%A7%D9%84%D8%B5%D8%AD%D8%B1%D8%A7%D8%A1_%D9%82%D8%A7%D8%AF%D9%85%D8%A9_-_%D9%85%D8%B1%D8%B2%D9%88%D9%83%D8%A9_-_%D8%A7%D9%84%D9%85%D8%BA%D8%B1%D8%A8.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/28/Cavalier_de_chameaux_au_passage_dans_une_dune_de_sable_au_Maroc.jpg/960px-Cavalier_de_chameaux_au_passage_dans_une_dune_de_sable_au_Maroc.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/83/Merzouga.20200114.1.jpg/960px-Merzouga.20200114.1.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Chefchaouen Blue Escape": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c7/2018_01_%28Blue%29_-_Chaouen.jpg/960px-2018_01_%28Blue%29_-_Chaouen.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/Akchour%2C_Chefchaouen.jpg/960px-Akchour%2C_Chefchaouen.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3b/Akchour%2C_Chefchaouen_2.jpg/960px-Akchour%2C_Chefchaouen_2.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Essaouira Coast & Wind": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/65/Bab_El_Marsa%2C_Essaouira%2C_Morocco.jpg/960px-Bab_El_Marsa%2C_Essaouira%2C_Morocco.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Bab_el-Menzeh_in_Essaouira%2C_Morocco.jpg/960px-Bab_el-Menzeh_in_Essaouira%2C_Morocco.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Birds_flying_in_Essaouira_beach.jpg/960px-Birds_flying_in_Essaouira_beach.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Fes Heritage Weekend": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2a/Amazigh_Cultural_Postcards_in_Fes_Medina.jpg/960px-Amazigh_Cultural_Postcards_in_Fes_Medina.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0d/Bab_Bou_Jeloud_Frame_Minaret_Fes_Nov25_A7CR_09127-8_HDR3.jpg/960px-Bab_Bou_Jeloud_Frame_Minaret_Fes_Nov25_A7CR_09127-8_HDR3.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ed/COLOURED_GLASS_WINDOW%2C_FEZ%2C_MOROCCO.jpg/960px-COLOURED_GLASS_WINDOW%2C_FEZ%2C_MOROCCO.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Agadir Beach Week": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/AGADIR_MOROCCO.jpg/960px-AGADIR_MOROCCO.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Agadir_Airport_2020.jpg/960px-Agadir_Airport_2020.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/Agadir_Areal_view_cropped.jpg/960px-Agadir_Areal_view_cropped.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Casablanca Modern Weekend": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/75_Casablanca_%28Taradell%29.jpg/960px-75_Casablanca_%28Taradell%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/97/Ad-Dar_Al_Bayda%27%2C_salfit_01.jpg/960px-Ad-Dar_Al_Bayda%27%2C_salfit_01.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a7/Ad-Dar_Al_Bayda%27%2C_salfit_02.jpg/960px-Ad-Dar_Al_Bayda%27%2C_salfit_02.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Tangier Port Views": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/69/2000-06-10_01_Watermen_returning_from_lobster_fishing_to_Tangier_Island%2C_Virginia_USA.jpg/960px-2000-06-10_01_Watermen_returning_from_lobster_fishing_to_Tangier_Island%2C_Virginia_USA.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/2000-06-10_02_Watermen_unloading_lobsters_on_Tangier_Island%2C_Virginia_USA.jpg/960px-2000-06-10_02_Watermen_unloading_lobsters_on_Tangier_Island%2C_Virginia_USA.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Comercio_en_la_plaza_del_9_de_abril_de_1947%2C_T%C3%A1nger%2C_Marruecos%2C_2015-12-11%2C_DD_78.JPG/960px-Comercio_en_la_plaza_del_9_de_abril_de_1947%2C_T%C3%A1nger%2C_Marruecos%2C_2015-12-11%2C_DD_78.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Rabat Capital Discovery": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/ff/Ahl_Fas_Mosque_-_rabat.jpg/960px-Ahl_Fas_Mosque_-_rabat.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d9/Hassan_Tower%2C_Rabat%2C_Marocco_%28%D8%B5%D9%88%D9%85%D8%B9%D8%A9_%D8%AD%D8%B3%D8%A7%D9%86_%29.jpg/960px-Hassan_Tower%2C_Rabat%2C_Marocco_%28%D8%B5%D9%88%D9%85%D8%B9%D8%A9_%D8%AD%D8%B3%D8%A7%D9%86_%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/Hassan_Tower%2C_Rabat_%28%D8%B5%D9%88%D9%85%D8%B9%D8%A9_%D8%AD%D8%B3%D8%A7%D9%86%29.jpg/960px-Hassan_Tower%2C_Rabat_%28%D8%B5%D9%88%D9%85%D8%B9%D8%A9_%D8%AD%D8%B3%D8%A7%D9%86%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Meknes & Volubilis Days": [
    'https://upload.wikimedia.org/wikipedia/commons/2/26/Cave_coop%C3%A9rative_de_Mekn%C3%A8s.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2c/Ceramics_in_Meknes.jpg/960px-Ceramics_in_Meknes.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c2/Compagnie_Generale_Transatlantique_-_Le_%22Puerto-Rico%22.jpg/960px-Compagnie_Generale_Transatlantique_-_Le_%22Puerto-Rico%22.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Ouarzazate Studio Tour": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e6/Berberic_painter%2C_Ouarzazate%2C_Morocco.jpg/960px-Berberic_painter%2C_Ouarzazate%2C_Morocco.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/Berberic_painter_drawing_a_bookmark%2C_Ouarzazate%2C_Morocco_v2.jpg/960px-Berberic_painter_drawing_a_bookmark%2C_Ouarzazate%2C_Morocco_v2.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Carte_de_OUARZAZATE.jpg/960px-Carte_de_OUARZAZATE.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Ait Ben Haddou Trails": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8c/31616-Ait_Ben_Haddou_%2812291651433%29.jpg/960px-31616-Ait_Ben_Haddou_%2812291651433%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Ait_Ben_Haddou%2C_poblado_nuevo_08.JPG/960px-Ait_Ben_Haddou%2C_poblado_nuevo_08.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Ait_Ben_Haddou%2C_turistas_01.JPG/960px-Ait_Ben_Haddou%2C_turistas_01.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Dakhla Kite Lagoon": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/78/Dajla-ad-Dajla-Villa_Cisneros.png/960px-Dajla-ad-Dajla-Villa_Cisneros.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Dakhla%2C_Western_Sahara.jpg/960px-Dakhla%2C_Western_Sahara.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Dakhla%2C_Western_Sahara_%2810%29.jpg/960px-Dakhla%2C_Western_Sahara_%2810%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Ifrane Forest Escape": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Ain_Vittel_Parc_Ifrane_1.jpg/960px-Ain_Vittel_Parc_Ifrane_1.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d6/Euro_Camping_Emirates_Tourist_Center_Azrou_Ifrane_3.jpg/960px-Euro_Camping_Emirates_Tourist_Center_Azrou_Ifrane_3.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cd/Ifrane%2Cphoto_d%E2%80%99une_petite_partie_de_nos_traditions.jpg/960px-Ifrane%2Cphoto_d%E2%80%99une_petite_partie_de_nos_traditions.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Todra Gorge Hike": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0f/Assole_in_Tinghir.jpg/960px-Assole_in_Tinghir.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/Le_quartier_juif_de_Tinghir.jpg/960px-Le_quartier_juif_de_Tinghir.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1d/Morocco_Africa_Flickr_Rosino_December_2005_83957092.jpg/960px-Morocco_Africa_Flickr_Rosino_December_2005_83957092.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Al Hoceima Coast": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Al_Hoceima_Morocco.jpg/960px-Al_Hoceima_Morocco.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ee/Al_Hoceima_Province_711.jpg/960px-Al_Hoceima_Province_711.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/Al_Hoceima_Quemado_-_Banner.jpg/960px-Al_Hoceima_Quemado_-_Banner.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Tetouan White Streets": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Kasbah_of_Tetouan_3.jpg/960px-Kasbah_of_Tetouan_3.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6a/Kasbah_of_Tetouan_4.jpg/960px-Kasbah_of_Tetouan_4.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d6/Mellah_de_Tetouan_10112020_001.jpg/960px-Mellah_de_Tetouan_10112020_001.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Azrou Cedar Trails": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/%28MHNT%29_Anthocaris_belia_androgyne_-_Azrou_-_Maroc_-_Male_dorsal.jpg/960px-%28MHNT%29_Anthocaris_belia_androgyne_-_Azrou_-_Maroc_-_Male_dorsal.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/%28MHNT%29_Anthocaris_belia_androgyne_-_Azrou_-_Maroc_-_Male_ventral.jpg/960px-%28MHNT%29_Anthocaris_belia_androgyne_-_Azrou_-_Maroc_-_Male_ventral.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/Ahadaf_neighborhood_in_Azrou_in_black_and_white.jpg/960px-Ahadaf_neighborhood_in_Azrou_in_black_and_white.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Oualidia Lagoon Taste": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5f/Artemisia_absinthium%2C_Oualidia%2C_Casablanca-Settat_region%2C_Morocco_2023.jpg/960px-Artemisia_absinthium%2C_Oualidia%2C_Casablanca-Settat_region%2C_Morocco_2023.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/Mirabilis_jalapa%2C_Oualidia%2C_Casablanca-Settat_region%2C_Morocco.jpg/960px-Mirabilis_jalapa%2C_Oualidia%2C_Casablanca-Settat_region%2C_Morocco.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3b/Oualidia%2C_Casablanca-Settat_region%2C_Morocco_-_Renault_4.jpg/960px-Oualidia%2C_Casablanca-Settat_region%2C_Morocco_-_Renault_4.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Asilah Art Escape": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dc/Alley_of_the_city_of_Asilah_43434.jpg/960px-Alley_of_the_city_of_Asilah_43434.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b1/Alleys_of_the_city_of_Asilah_700.jpg/960px-Alleys_of_the_city_of_Asilah_700.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ad/Asilah_%2836750513531%29.jpg/960px-Asilah_%2836750513531%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Toubkal Summit Push": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/At_the_peak_of_Toubkal_4%2C167_m_%282%29.jpg/960px-At_the_peak_of_Toubkal_4%2C167_m_%282%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Jebel_Toubkal_and_a_group_of_hikers.jpg/960px-Jebel_Toubkal_and_a_group_of_hikers.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/Randonneurs_pr%C3%A8s_du_Toubkal_%28Maroc%29.jpg/960px-Randonneurs_pr%C3%A8s_du_Toubkal_%28Maroc%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Taghazout Surf Camp": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c4/A_neighborhood_in_Taghazout.jpg/960px-A_neighborhood_in_Taghazout.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/42/Camel_on_the_beach_at_Taghazout_%288591453987%29.jpg/960px-Camel_on_the_beach_at_Taghazout_%288591453987%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/Commune_rurale_de_Taghazout.jpg/960px-Commune_rurale_de_Taghazout.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Ouzoud Falls Days": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/Cat_at_Ouzoud_Falls%2C_Morocco%2C_20250126_1244_7446.jpg/960px-Cat_at_Ouzoud_Falls%2C_Morocco%2C_20250126_1244_7446.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Lake_below_Ouzoud_Falls%2C_Morocco%2C_20250126_1402_7475.jpg/960px-Lake_below_Ouzoud_Falls%2C_Morocco%2C_20250126_1402_7475.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2d/Macaca_sylvanus%2C_Ouzoud_Falls%2C_Morocco%2C_20250126_1128_7323.jpg/960px-Macaca_sylvanus%2C_Ouzoud_Falls%2C_Morocco%2C_20250126_1128_7323.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Zagora Oasis Ride": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Stara_Zagora%2C_Bulgaria_-_Stream.jpg/960px-Stara_Zagora%2C_Bulgaria_-_Stream.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/Stefanos_Stournaras_Zagora_No132_c1910.jpg/960px-Stefanos_Stournaras_Zagora_No132_c1910.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/The_defenders_of_Stara_Zagora_Memorial_Complex_-_Defenders_02.jpg/960px-The_defenders_of_Stara_Zagora_Memorial_Complex_-_Defenders_02.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Moulay Idriss Pilgrimage Days": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fd/Alley_stairs_Moulay_Idriss%2CMorocco.jpg/960px-Alley_stairs_Moulay_Idriss%2CMorocco.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/Mausoleo_Moulay_Idriss.jpg/960px-Mausoleo_Moulay_Idriss.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/Mausol%C3%A9e_Moulay_Idriss_II_F%C3%A8s.jpg/960px-Mausol%C3%A9e_Moulay_Idriss_II_F%C3%A8s.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Ziz Valley Road Trip": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2e/Erfoud-Market-Morocco.jpg/960px-Erfoud-Market-Morocco.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Erfoud-Morocco.jpg/960px-Erfoud-Morocco.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/85/Erfoud-Sahara-Morocco.jpg/960px-Erfoud-Sahara-Morocco.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Safi Pottery Days": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/Asfi_by_night.png/960px-Asfi_by_night.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Asfi_masjid.jpg/960px-Asfi_masjid.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/Historical_cannon_in_the_National_Museum_of_Ceramics_in_Safi%2C_Morocco.jpg/960px-Historical_cannon_in_the_National_Museum_of_Ceramics_in_Safi%2C_Morocco.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Sefrou Cherry Days": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/25/Kunsthandwerker_in_Sefrou.jpg/960px-Kunsthandwerker_in_Sefrou.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/Lovely_sefrou_city.jpg/960px-Lovely_sefrou_city.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/Medina_gate_in_sefrou-alex.lines.jpg/960px-Medina_gate_in_sefrou-alex.lines.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Dades Valley Drive": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/Cloud_formations_over_Dades_Gorge_-_Flickr_-_gailhampshire.jpg/960px-Cloud_formations_over_Dades_Gorge_-_Flickr_-_gailhampshire.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/37/Dades_Gorge_%284989115091%29.jpg/960px-Dades_Gorge_%284989115091%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/Dades_Gorge_%284989115699%29.jpg/960px-Dades_Gorge_%284989115699%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
  "Sidi Ifni Coast Days": [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/98/Cinema_Avenida_-_Sidi_Ifni.jpg/960px-Cinema_Avenida_-_Sidi_Ifni.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/98/Ciudad_de_Sidi_Ifni.jpg/960px-Ciudad_de_Sidi_Ifni.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1d/Empty_Field_-_Sidi_Ifni.jpg/960px-Empty_Field_-_Sidi_Ifni.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  ],
};

const OPTION_SEEDS = [
  ['transport', 'CTM bus pass', 'Intercity coach connections between major cities.', 35.00],
  ['transport', 'Private 4x4 transfer', 'Driver on call for the whole trip, up to 200 km/day.', 120.00],
  ['transport', 'Domestic flight add-on', 'One-way domestic flight between two cities.', 90.00],
  ['transport', 'Train ticket (2nd class)', 'Second-class rail ticket between two cities, per traveller.', 45.00],
  ['transport', 'Private van seat', 'Shared van with driver-guide for the whole custom itinerary, per member.', 95.00],
  ['transport', 'Luxury coach seat', 'Air-conditioned coach with reclining seats, per member.', 65.00],
  ['transport', 'SUV with driver', 'Private SUV with driver for the whole custom itinerary, per member.', 140.00],
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

    // Gallery images: the principal photo stays on journeys.image_url and the
    // extra photos live in journey_images. Re-seeding rewrites the rows so the
    // gallery always matches this list.
    const { rows: journeyIdRows } = await client.query('SELECT id, title FROM journeys');
    const journeyIdsByTitle = new Map(journeyIdRows.map((row) => [row.title, row.id]));
    let galleryCount = 0;
    for (const [title, urls] of Object.entries(JOURNEY_GALLERY)) {
      const journeyId = journeyIdsByTitle.get(title);
      if (!journeyId) continue;
      await client.query('DELETE FROM journey_images WHERE journey_id = $1', [journeyId]);
      for (const [position, url] of urls.entries()) {
        await client.query(
          'INSERT INTO journey_images (journey_id, url, position) VALUES ($1, $2, $3)',
          [journeyId, url, position],
        );
        galleryCount += 1;
      }
    }
    console.log('demo gallery images:', galleryCount, 'rows');

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
