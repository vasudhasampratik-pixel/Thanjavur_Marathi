import { useState, useCallback, useRef } from 'react';

// ─── Web Audio Sound Engine ───────────────────────────────────────────────────
function getAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

function playTempleBell() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 2);
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 2.5);
}

function playManjira() {
  const ctx = getAudioContext();
  if (!ctx) return;
  [1320, 2640, 3960].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12 / (i + 1), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  });
}

function playUnlock() {
  const ctx = getAudioContext();
  if (!ctx) return;
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.08;
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

// ─── Data ─────────────────────────────────────────────────────────────────────
interface RitualStep {
  text: string;
  dialogue?: string;
  items?: string[];
  highlight?: 'bride' | 'groom' | 'priest' | 'mother-bride' | 'mother-groom' | 'father' | 'brother' | 'savashnis' | 'uncle' | 'couple';
  special?: string;
  sound?: 'bell' | 'manjira' | 'unlock';
}

interface Ritual {
  id: string;
  name: string;
  nameMarathi?: string;
  emoji: string;
  timing: string;
  participants: string[];
  stageBg: string;
  stageAccent: string;
  summary: string;
  steps: RitualStep[];
}

const RITUALS: Ritual[] = [
  {
    id: 'halkund',
    name: 'Halkund Thenchna',
    nameMarathi: 'हळकुंड ठेंचना',
    emoji: '🌿',
    timing: 'Before the wedding - at both homes',
    participants: ['Bride/Groom', 'Mother', 'Five Savashnis'],
    stageBg: 'from-yellow-50 via-amber-50 to-orange-50',
    stageAccent: 'amber',
    summary: 'The first step to a wedding. Turmeric sticks are pounded by the Savashnis (married women), awakening auspicious energy. No bridal purchases may begin until this is done.',
    steps: [
      { text: 'A Ganesh is formed from turmeric powder mixed with water, a cone anointed with kunku, placed on a betel leaf with its stem removed.', items: ['🙏', '🌿', '🍃'], sound: 'bell', highlight: 'mother-bride' },
      { text: 'The Bride or Groom, dressed in silk and flowers, sits before the Haldi Ganesh. Puja is performed with Haldi Kunku, Geja Vastra and flowers. Bananas and jaggery are offered.', items: ['🕯️', '🌸', '🍌'], highlight: 'bride', sound: 'bell' },
      { text: 'The Mother and all five Savashnis take their turn to perform puja to the Ganesh.', items: ['🙏'], highlight: 'savashnis' },
      { text: 'One by one, each Savashni takes a turmeric stick and pounds it on the Vatach Dhonda (grinding stone), breaking it into pieces — a rhythmic, joyful act.', items: ['🗿', '🌿'], highlight: 'savashnis', special: '🥁 Pound! Pound! Pound!', sound: 'manjira' },
      { text: 'The powdered turmeric is mixed with rice for later use. The Haldi Ganesh is placed in the prayer room and worshipped every day until the wedding is over.', items: ['✨'], sound: 'unlock' },
      { text: 'Each Savashni receives: haldi-kunku, flowers, betel leaf and supari, a banana, a coconut, and a choli piece. Kheer is served. The wedding may now begin.', items: ['🥥', '🌸', '🍮'], highlight: 'savashnis', sound: 'manjira' },
    ],
  },
  {
    id: 'devach',
    name: 'Devach Samardhana',
    nameMarathi: 'देवाच समर्धना',
    emoji: '🕯️',
    timing: 'Day 1 — Morning',
    participants: ['Bride/Groom', 'Mother', 'Savashnis', 'Priest', 'All family'],
    stageBg: 'from-orange-50 via-amber-50 to-yellow-50',
    stageAccent: 'orange',
    summary: 'The commencement of wedding ceremonies. The family deity is propitiated with Pancha Amrutha Abhisheka. A charming ritual where the bride or groom searches for gold hidden in wheat.',
    steps: [
      { text: 'The Zantha (grinding stone) is adorned with chuna, geru, haldi and kunku, then a flower is placed. It is set in its auspicious place.', items: ['🗿', '🌸'], highlight: 'priest', sound: 'bell' },
      { text: 'The Bride/Groom, mother, and Savashnis seat themselves on a mat. Puja to the Zantha commences with the officiating priest.', items: ['🕯️', '🌼'], highlight: 'mother-bride' },
      { text: 'The mother folds wheat into the front padhar of her saree. Hidden within is a ring or gold item — can you find it?', items: ['🌾', '💍'], highlight: 'mother-bride' },
      { text: 'The Savashnis call out: "Thula Kai Milla?" or What did you find?', dialogue: '"Mala Sona Sarka Navra Milli!" or I found a groom/bride like GOLD! 🥇', highlight: 'bride', sound: 'manjira', special: 'First Search' },
      { text: '"Thula Kai Milla?" they ask again…', dialogue: '"Mala Vajra Sarka Navra Milli!" or I found a groom/bride like DIAMOND! 💎', highlight: 'bride', sound: 'manjira', special: 'Second Search' },
      { text: '"Thula Kai Milla?" one last time…', dialogue: '"Mala Vaiduria Sarka Navri Milla!" or like LAPIZ LAZULI! 💙', highlight: 'bride', sound: 'unlock', special: 'Third Search' },
      { text: 'The wheat is placed in the Zantha and ground by the Navra/Navri, mother, and Savashnis into Rava. This Rava is given to the cook to make the ceremonial Kheer for the feast.', items: ['🗿', '🍮'], sound: 'bell' },
    ],
  },
  {
    id: 'nandhi',
    name: 'Nandhi',
    nameMarathi: 'नंदी',
    emoji: '🙏',
    timing: 'Day 1 — Morning (with Devach Samardhana)',
    participants: ['Priests', 'All Family'],
    stageBg: 'from-slate-50 via-blue-50 to-indigo-50',
    stageAccent: 'indigo',
    summary: 'The ancestors are solemnly invited to witness and bless the wedding. Through mantras recited by the purohiths, the departed forebears are called to be present in spirit.',
    steps: [
      { text: 'The Purohiths prepare the Nandhi setup. God and Ancestors must be treated separately — both are present today.', items: ['📿'], highlight: 'priest', sound: 'bell' },
      { text: 'Through ancient mantras, the ancestors are called by name 3 generations, both sides of the family.', items: ['✨', '🌿'], highlight: 'priest', special: '🕯️ Ancestors are present…' },
      { text: 'Coconut and fruits are offered to the ancestors. In elder times, a full meal was prepared; today offerings are made with deep respect.', items: ['🥥', '🍌'], sound: 'manjira' },
      { text: 'The family bows in namaskar. The ancestors bless the couple and the wedding may proceed under their watchful grace.', items: ['🙏'], sound: 'unlock', special: '🌟 Blessings flow from above' },
    ],
  },
  {
    id: 'moolphana',
    name: 'Mool Phana',
    nameMarathi: 'मूळ फणा',
    emoji: '👧',
    timing: 'Day 1 — Evening',
    participants: ['Bride', 'Groom\'s Mother', 'All Ladies', 'Groom\'s Party'],
    stageBg: 'from-rose-50 via-pink-50 to-orange-50',
    stageAccent: 'rose',
    summary: '"Seeing the Bride" — a grand colorful function where the groom\'s mother formally presents the bride with sarees and gifts, and all the groom\'s family arrives with decorated trays.',
    steps: [
      { text: 'The Bride is dressed in her finest.. hair plaited with flowers, jewels gleaming, green glass bangles on her wrists, a zari saree. She is seated on the mane (a covered plank).', items: ['💐', '💍', '✨'], highlight: 'bride', sound: 'bell' },
      { text: 'The Groom\'s Mother arrives and takes her seat on the Bride\'s right side, facing her. The hall is full of ladies in colorful finery.', items: ['🌸'], highlight: 'mother-groom' },
      { text: 'The Bride performs Ganesh puja on the Groom\'s Mother\'s instruction.', items: ['🙏', '🕯️'], highlight: 'bride' },
      { text: 'The Groom\'s Mother applies haldi kunku and gives the Bride 2 sarees — one to wear now, one to keep.', items: ['🧣', '🌿'], highlight: 'mother-groom', sound: 'manjira' },
      { text: 'The Bride goes inside to change into the gifted saree. She returns to the mane, glowing.', items: ['✨'], highlight: 'bride' },
      { text: 'All the ladies of the groom\'s party arrive in procession! Each carries a tray of fruits, dry fruits, sugar moulds, decorated dolls, and carved dry coconuts.', items: ['🥥', '🍇', '🎎', '🍮'], highlight: 'mother-groom', special: '🎶 Procession enters…', sound: 'manjira' },
      { text: 'The Groom\'s Mother places milk and banana in the Bride\'s palm 3 times. She drinks. The ceremony is complete.', items: ['🍌', '🥛'], highlight: 'couple', sound: 'unlock' },
    ],
  },
  {
    id: 'jhanvasa',
    name: 'Jhanvasa',
    nameMarathi: 'झनवासा',
    emoji: '🤵',
    timing: 'Day 1 — Evening',
    participants: ['Groom', 'Bride\'s Parents', 'All Guests'],
    stageBg: 'from-amber-50 via-yellow-50 to-lime-50',
    stageAccent: 'amber',
    summary: 'A colorful grand function: the mirror of Mool Phana for the Groom. He is honored by the bride\'s family with gifts, new clothes, garlands, and a ceremonial feast on silver plates.',
    steps: [
      { text: 'The Groom is seated on a beautifully decorated Jamkhana (mat). He is dressed in his finest.', items: ['✨'], highlight: 'groom', sound: 'bell' },
      { text: 'The Bride\'s parents sit beside the Groom. Ganesh Puja is performed.', items: ['🙏', '🕯️'], highlight: 'priest' },
      { text: 'The Bride\'s Mother applies kunku on the Groom\'s forehead with care.', items: ['🌿'], highlight: 'mother-bride', sound: 'manjira' },
      { text: 'The Bride\'s Father applies sandal paste (gandh) on the Groom\'s forehead and presents him with new clothes, a wristwatch, and gifts.', items: ['⌚', '🧣', '🌿'], highlight: 'father', sound: 'manjira' },
      { text: 'The Groom changes into his new clothes and returns. He is garlanded with flowers.', items: ['💐', '✨'], highlight: 'groom' },
      { text: 'Sugar moulds, decorated coconuts, fruits, and more are placed before him.', items: ['🥥', '🍬', '🍇'], sound: 'manjira' },
      { text: 'The Bride\'s Mother places milk and banana in the Groom\'s palm 3 times. He drinks. The banquet on silver plates and plantain leaves follows.', items: ['🍌', '🥛', '🍽️'], highlight: 'couple', sound: 'unlock' },
    ],
  },
  {
    id: 'kashi',
    name: 'Kashi Yathra',
    nameMarathi: 'काशी यात्रा',
    emoji: '☂️',
    timing: 'Day 2 — Morning',
    participants: ['Groom', 'Bride\'s Father', 'Bride\'s Brother', 'Priest'],
    stageBg: 'from-yellow-100 via-amber-50 to-orange-50',
    stageAccent: 'yellow',
    summary: 'The most theatrical ritual. The Groom, dressed in yellow robes, pretends to renounce worldly life and journey to Kashi. The Bride\'s father dramatically intercepts him with an offer he cannot refuse.',
    steps: [
      { text: 'The Groom is dressed in a yellow-dyed dhoti. He is the image of a wandering scholar-monk.', items: ['🟡', '📚'], highlight: 'groom', sound: 'bell', special: 'The Groom transforms…' },
      { text: 'The ☂️ umbrella appears held over the Groom\'s head by the Bride\'s Brother. A fan (vijna) in the Groom\'s left hand.', items: ['☂️', '🌬️'], highlight: 'brother', sound: 'bell' },
      { text: 'The Groom receives his 🦯 walking stick. Flour earrings are placed on his ears. He is ready for the road.', items: ['🦯', '👂'], highlight: 'groom' },
      { text: 'The Priest makes the Groom declare in Sanskrit, that he is renouncing household life and departing for Kashi to pursue learning!', items: ['📿'], highlight: 'priest', special: '"I go to Kashi! I seek knowledge!" 🗣️', sound: 'manjira' },
      { text: '🛑 The Bride\'s Father steps forward and STOPS him!', highlight: 'father', special: '🛑 STOP! — The Father intercepts!', items: ['🚧'], sound: 'bell' },
      { text: 'The Father pleads: "Do not go to Kashi. Accept my daughter as your companion to face all of life\'s challenges together."', dialogue: '"Take my daughter — she will be your wisdom, your companion, your home."', highlight: 'father', sound: 'manjira' },
      { text: 'The Groom relents. He is led back. The Bride\'s Mother pours water; the Father washes the Groom\'s feet in a plate at the threshold.', items: ['💧', '💦'], highlight: 'couple', sound: 'unlock' },
      { text: 'A Homa is performed. The sacred thread changes from 3 threads (Brahmacharya) to 6 threads (Samsara). The scholar becomes a householder.', items: ['🔥', '📿'], highlight: 'priest', special: '🔥 He is reborn as a family man', sound: 'bell' },
    ],
  },
  {
    id: 'gowri',
    name: 'Gowri Puja',
    nameMarathi: 'गौरी पूजा',
    emoji: '🌸',
    timing: 'Day 2 — Morning (before Muhurtha)',
    participants: ['Bride', 'Bride\'s Mother', 'Groom\'s Mother', 'Maternal Uncle', 'Priest'],
    stageBg: 'from-pink-50 via-rose-50 to-red-50',
    stageAccent: 'pink',
    summary: 'The Bride prays to Goddess Gowri (Parvathi) in complete silence. This is her private, sacred conversation with the goddess, seeking blessings for her married life.',
    steps: [
      { text: 'A Haldi Gowri cone is made large, majestic and placed on a folded choli piece. Decorated pots tower in each corner. Lamps are lit on either side.', items: ['🕯️', '🟡', '🏺'], highlight: 'mother-bride', sound: 'bell' },
      { text: 'Two Peetach Divas (flour lamps) are shaped. Their wicks as long as the Bride\'s height. An Akhand diya burns steadily.', items: ['🕯️', '🕯️'], sound: 'bell' },
      { text: 'The Bride\'s Mother adorns her with haldi kunku and flowers. She is brought to Gowri\'s place and shown how to perform the puja.', items: ['💐', '🌺'], highlight: 'bride' },
      { text: 'The Bride begins puja in complete, unbroken SILENCE (Mouna). No words. Only flowers and prayers offered to Gowri.', items: ['🙏', '🌸', '🤫'], highlight: 'bride', special: '🤫 Total Silence…', sound: 'bell' },
      { text: 'Just before Muhurtha, the Groom\'s Mother arrives carrying the Wedding Sari and a garland. She performs puja to Gowri and applies haldi kunku to the Bride.', items: ['🧣', '💐'], highlight: 'mother-groom', sound: 'manjira' },
      { text: 'The Maternal Uncle (Mama) takes the Bride\'s hand and leads her toward the wedding pandal. The Antharpat curtain awaits.', items: ['🚶'], highlight: 'uncle', sound: 'bell' },
      { text: 'The curtain (Antharpat) is held by the priests. Bride and Groom stand on either side, they cannot see each other. Jaggery and jeera are placed in their palms.', items: ['🧿', '🌿'], highlight: 'couple' },
      { text: 'The Mangalashtaka is sung. Ladies invite the gods, river goddesses, and Saptharishis to bless the couple and priests chant "Saava Dhaan" as blessings rain down.', items: ['✨', '🎶', '⭐'], highlight: 'couple', special: '🎶 Mangalashtaka resonates…', sound: 'unlock' },
    ],
  },
  {
    id: 'kankana',
    name: 'Kankana',
    nameMarathi: 'कंकण',
    emoji: '💛',
    timing: 'Day 2 — Muhurtha',
    participants: ['Bride', 'Groom', 'Five Couples (each side)', 'Both Mothers', 'Priest'],
    stageBg: 'from-yellow-50 via-amber-50 to-rose-50',
    stageAccent: 'yellow',
    summary: 'The sacred thread ritual binding bride and groom. A circle of five couples surrounds them as milk-soaked threads are wound around all — then tied to their wrists with a turmeric stick.',
    steps: [
      { text: 'The Antharpat is removed! The couple sprinkle jaggery-jeera on each other — the Groom on the Bride\'s head, the Bride on the Groom\'s feet.', items: ['✨', '🌿'], highlight: 'couple', sound: 'bell', special: '✨ The curtain falls!' },
      { text: 'Five couples from each side stand in a circle around the Bride and Groom seated in the center.', items: ['👫', '👫', '👫'], highlight: 'couple' },
      { text: 'Two balls of thread soaked in milk are wound around all the couples and the central pair, round after round, binding everyone in sacred unity.', items: ['🧵', '🥛'], sound: 'manjira' },
      { text: 'The priest separates the thread into two strands. A turmeric stick (haldi) is tied to each. This is the KANKAN: the sacred wrist-band.', items: ['🌿', '🟡'], highlight: 'priest', sound: 'manjira' },
      { text: 'The Groom ties the Kankan to the Bride\'s RIGHT wrist. 💛', items: ['💛'], highlight: 'groom', sound: 'manjira', special: 'Groom → Bride\'s wrist' },
      { text: 'The Bride ties the Kankan to the Groom\'s RIGHT wrist. 💛', items: ['💛'], highlight: 'bride', sound: 'manjira', special: 'Bride → Groom\'s wrist' },
      { text: 'The two Mangalyas on a coconut in a plate are carried around for everyone to bless.', items: ['🥥', '📿', '🙏'], sound: 'bell' },
      { text: 'Kanyadana: the most sacred moment. The Bride\'s palms are placed in the Groom\'s palms. A coconut, Saligrama, Krishna idol, Tulasi leaf, and a coin rest between them. Parents pour Ganga water.', items: ['🌿', '💧', '🙏'], highlight: 'couple', special: '💧 Ganga water flows…', sound: 'bell' },
      { text: 'The Groom ties BOTH Mangalyas into 3 sacred knots. Then both mothers and elderly Savashnis each tie one additional knot.', items: ['📿', '💍'], highlight: 'couple', sound: 'unlock', special: '💍 The Mangalya is tied!' },
    ],
  },
  {
    id: 'saptapadi',
    name: 'Saptapadi',
    nameMarathi: 'सप्तपदी',
    emoji: '🔥',
    timing: 'Day 2 — Agni Ceremony',
    participants: ['Bride', 'Groom', 'Bride\'s Brother', 'Priest', 'All Witnesses'],
    stageBg: 'from-orange-100 via-red-50 to-amber-50',
    stageAccent: 'red',
    summary: 'The 7 Steps around the sacred fire - the heart of the wedding. Each step carries a vow from groom to bride. Agni (fire) is the eternal witness.',
    steps: [
      { text: '🔥 The sacred fire (Agni) is lit. The Laja Homa begins. A Homa to invite Agni as the eternal witness to this marriage.', items: ['🔥'], highlight: 'priest', sound: 'bell', special: '🔥 Agni arrives!' },
      { text: 'The Bride\'s Brother offers laahe (puffed rice) into the fire as prayer for his sister\'s happiness. Women cannot perform the Homa directly — the Groom holds the Bride\'s hands and offers together.', items: ['🌾', '🔥', '🙏'], highlight: 'brother', sound: 'bell' },
      { text: 'The Vatach Dhonda is placed. The Bride\'s right foot, big toe, is set upon it. The Groom holds her toe and moves it gently, 7 times, as mantras are chanted for a steadfast, giving, adjusting life together.', items: ['🦶', '🗿'], highlight: 'couple', sound: 'manjira' },
      { text: 'Step 1 — 🚶 "Bear with me and walk with Samarthya (strength)."', items: ['👣'], highlight: 'couple', special: 'Step 1 of 7', sound: 'manjira' },
      { text: 'Step 2 — 🌾 "Let there be food in plenty for our home."', items: ['👣', '👣'], highlight: 'couple', special: 'Step 2 of 7', sound: 'manjira' },
      { text: 'Step 3 — 💰 "Let there be prosperity in all we do."', items: ['👣', '👣', '👣'], highlight: 'couple', special: 'Step 3 of 7', sound: 'manjira' },
      { text: 'Step 4 — 🌟 "Let us achieve all that we want and be happy."', items: ['👣', '👣', '👣', '👣'], highlight: 'couple', special: 'Step 4 of 7', sound: 'manjira' },
      { text: 'Step 5 — 👶 "Let there be children to carry our love forward."', items: ['👣', '👣', '👣', '👣', '👣'], highlight: 'couple', special: 'Step 5 of 7', sound: 'manjira' },
      { text: 'Step 6 — 🌺 "In all seasons, let there be Bhoga and Bhagya (joy and fortune)."', items: ['👣', '👣', '👣', '👣', '👣', '👣'], highlight: 'couple', special: 'Step 6 of 7', sound: 'manjira' },
      { text: 'Step 7 — ❤️ "Let there be love, trust, and affection between us — always."', items: ['👣', '👣', '👣', '👣', '👣', '👣', '👣'], highlight: 'couple', special: 'Step 7 of 7 ✨', sound: 'unlock' },
      { text: 'Sindupu: The Bride\'s Mother, with a lamp on her head, leads the newly-weds and family in three circles around the Homa kund. Raksha is applied to their foreheads.', items: ['🔥', '🕯️', '💧'], sound: 'bell' },
      { text: 'The couple is led outside and shown the star Arundhathi (wife of Sage Vashishta, an eternal Pathivratha). "Be steadfast in your devotion to each other like Vashishta and Arundhathi."', items: ['⭐', '🌌'], highlight: 'couple', special: '⭐ Find Arundhathi in the sky…', sound: 'bell' },
    ],
  },
  {
    id: 'grahapravesh',
    name: 'Grahapravesh',
    nameMarathi: 'गृहप्रवेश',
    emoji: '🏠',
    timing: 'Day 2 — Evening',
    participants: ['Bride', 'Groom', 'Mother-in-law', 'All Family'],
    stageBg: 'from-emerald-50 via-teal-50 to-cyan-50',
    stageAccent: 'emerald',
    summary: 'The Bride\'s formal entry into her new home. The mother-in-law gifts the 9-yard sari, the Bride is handed over with love, and Lakshmi Puja consecrates the new beginning.',
    steps: [
      { text: 'The Mother-in-law (Groom\'s Mother) presents the Bride with a 9-yard sari, the full traditional form, and lovingly helps her wear it.', items: ['🧣', '💐'], highlight: 'mother-groom', sound: 'bell' },
      { text: 'In a moving ritual, the Bride is formally handed over, first to the Groom\'s Parents, with mantras and blessings.', items: ['🙏'], highlight: 'couple', sound: 'bell' },
      { text: 'Then to an elderly relative (a paternal uncle or elder brother) of the Groom. Each accepting her into the family.', items: ['🙏'], highlight: 'couple' },
      { text: 'Finally, she is handed to the Groom. His to love and cherish.', items: ['💍', '❤️'], highlight: 'couple', special: '❤️ Now and always.', sound: 'unlock' },
      { text: 'The Bride, accompanied by her parents and siblings, journeys to the Groom\'s home for the last time as a guest.', items: ['🚶', '🏠'], sound: 'bell' },
      { text: 'The Bride arrives at the threshold of her new home. She steps over with her right foot first.', items: ['🏠', '👣'], highlight: 'bride', special: '🏠 She arrives home.' },
      { text: 'The Mother-in-law helps the Bride perform Lakshmi Puja, consecrating the new home with the goddess\'s grace and welcoming prosperity.', items: ['🕯️', '🌸', '🙏'], highlight: 'couple', sound: 'bell' },
      { text: 'Refreshments and coffee are shared with guests. Gifts are exchanged. The Bride is now home. A new family is born.', items: ['☕', '🌸', '✨'], sound: 'unlock', special: '🌟 A new family begins.' },
    ],
  },
];

// ─── Character component ──────────────────────────────────────────────────────
const CHAR_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  bride: { emoji: '👧', label: 'Navri', color: 'bg-rose-100 border-rose-300 text-rose-700' },
  groom: { emoji: '👦', label: 'Navra', color: 'bg-amber-100 border-amber-300 text-amber-700' },
  priest: { emoji: '🧘', label: 'Purohith', color: 'bg-orange-100 border-orange-300 text-orange-700' },
  'mother-bride': { emoji: '👩', label: "Bride's Mother", color: 'bg-pink-100 border-pink-300 text-pink-700' },
  'mother-groom': { emoji: '👩‍👦', label: "Groom's Mother", color: 'bg-purple-100 border-purple-300 text-purple-700' },
  father: { emoji: '👨', label: "Bride's Father", color: 'bg-blue-100 border-blue-300 text-blue-700' },
  brother: { emoji: '🧑', label: "Bride's Brother", color: 'bg-cyan-100 border-cyan-300 text-cyan-700' },
  savashnis: { emoji: '👩‍👩‍👧', label: 'Savashnis', color: 'bg-violet-100 border-violet-300 text-violet-700' },
  uncle: { emoji: '🧔', label: 'Maternal Uncle', color: 'bg-teal-100 border-teal-300 text-teal-700' },
  couple: { emoji: '💑', label: 'Bride & Groom', color: 'bg-gradient-to-r from-rose-100 to-amber-100 border-rose-300 text-rose-700' },
};

function CharacterBubble({ charKey, isHighlighted }: { charKey: string; isHighlighted: boolean }) {
  const cfg = CHAR_CONFIG[charKey];
  if (!cfg) return null;
  return (
    <div
      className={`flex flex-col items-center gap-1 transition-all duration-500 ${isHighlighted ? 'scale-125' : 'scale-100 opacity-60'}`}
    >
      <div
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center text-xl sm:text-2xl shadow-sm ${cfg.color} ${isHighlighted ? 'shadow-md ring-2 ring-offset-1 ring-amber-400' : ''} transition-all duration-300`}
      >
        {cfg.emoji}
      </div>
      <span className={`text-[10px] font-medium text-center leading-tight max-w-[56px] ${isHighlighted ? 'text-gray-900' : 'text-gray-900'}`}>
        {cfg.label}
      </span>
    </div>
  );
}

// ─── Stage ────────────────────────────────────────────────────────────────────
function Stage({ ritual, stepIndex }: { ritual: Ritual; stepIndex: number }) {
  const step = ritual.steps[stepIndex];
  const participants = ritual.participants;

  // Which character keys to show based on participants list
  const charMap: Record<string, string> = {
    'Bride': 'bride',
    'Bride/Groom': 'bride',
    'Groom': 'groom',
    'Priest': 'priest',
    "Bride's Mother": 'mother-bride',
    "Groom's Mother": 'mother-groom',
    'Mother': 'mother-bride',
    "Bride's Father": 'father',
    "Bride's Brother": 'brother',
    'Savashnis': 'savashnis',
    'Five Savashnis': 'savashnis',
    'Maternal Uncle': 'uncle',
    'Couple': 'couple',
  };

  const charKeys = Array.from(new Set(
    participants
      .map(p => {
        const found = Object.entries(charMap).find(([k]) => p.includes(k));
        return found ? found[1] : null;
      })
      .filter(Boolean) as string[]
  ));

  // Always ensure both bride and groom are shown for Saptapadi/Kankana
  if (['saptapadi', 'kankana'].includes(ritual.id) && !charKeys.includes('couple')) {
    if (!charKeys.includes('bride')) charKeys.unshift('bride');
    if (!charKeys.includes('groom')) charKeys.push('groom');
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${ritual.stageBg} border border-orange-100 shadow-inner`}>
      {/* Stage curtain top deco */}
      <div className="flex justify-between px-4 pt-2">
        <div className="w-8 h-6 bg-rose-200/50 rounded-b-full" />
        <div className="w-6 h-4 bg-rose-200/50 rounded-b-full" />
        <div className="w-8 h-6 bg-rose-200/50 rounded-b-full" />
      </div>

      {/* Characters row */}
      <div className="flex justify-center gap-3 sm:gap-5 px-4 pt-4 pb-2 flex-wrap">
        {charKeys.map(key => (
          <CharacterBubble
            key={key}
            charKey={key}
            isHighlighted={step.highlight === key || (step.highlight === 'couple' && (key === 'bride' || key === 'groom' || key === 'couple'))}
          />
        ))}
      </div>

      {/* Items row */}
      {step.items && step.items.length > 0 && (
        <div className="flex justify-center gap-2 px-6 py-2 flex-wrap">
          {step.items.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="text-2xl animate-bounce"
              style={{ animationDelay: `${i * 0.1}s`, animationDuration: '1.5s' }}
            >
              {item}
            </span>
          ))}
        </div>
      )}

      {/* Special event banner */}
      {step.special && (
        <div className="mx-4 mb-2 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
          <p className="text-sm font-bold text-gray-900">{step.special}</p>
        </div>
      )}

      {/* Dialogue */}
      {step.dialogue && (
        <div className="mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
          <p className="text-sm italic text-amber-800 font-medium">"{step.dialogue}"</p>
        </div>
      )}

      {/* Stage floor */}
      <div className="h-2 bg-gradient-to-r from-amber-200/40 via-orange-100/60 to-amber-200/40 mx-4 rounded-full mb-3" />
    </div>
  );
}

// ─── Ritual Map Stop ──────────────────────────────────────────────────────────
function MapStop({
  ritual,
  index,
  isActive,
  isCompleted,
  onClick,
}: {
  ritual: Ritual;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 flex-shrink-0 group transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 rounded-xl p-2 ${isActive ? 'scale-105' : 'hover:scale-102'}`}
      aria-label={ritual.name}
      aria-pressed={isActive}
    >
      <div
        className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl shadow-md border-2 transition-all duration-300 ${
          isActive
            ? 'border-amber-500 bg-amber-50 shadow-amber-200 shadow-lg ring-2 ring-amber-400'
            : isCompleted
            ? 'border-emerald-400 bg-emerald-50'
            : 'border-orange-200 bg-white hover:border-amber-300 hover:bg-amber-50'
        }`}
      >
        <span>{ritual.emoji}</span>
        {isCompleted && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
        )}
        <span className="absolute -bottom-1 -left-1 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {index + 1}
        </span>
      </div>
      <span
        className={`text-[10px] sm:text-xs font-semibold text-center leading-tight max-w-[64px] sm:max-w-[72px] transition-colors ${
          isActive ? 'text-amber-700' : isCompleted ? 'text-emerald-700' : 'text-gray-900 group-hover:text-amber-600'
        }`}
      >
        {ritual.name}
      </span>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function VaraadPage() {
  const [activeRitualId, setActiveRitualId] = useState<string>(RITUALS[0].id);
  const [stepIndex, setStepIndex] = useState(0);
  const [completedRituals, setCompletedRituals] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);

  const activeRitual = RITUALS.find(r => r.id === activeRitualId)!;
  const currentStep = activeRitual.steps[stepIndex];
  const isLastStep = stepIndex === activeRitual.steps.length - 1;
  const isLastRitual = activeRitual.id === RITUALS[RITUALS.length - 1].id;

  const triggerSound = useCallback((sound?: string) => {
    if (!soundEnabled) return;
    if (sound === 'bell') playTempleBell();
    else if (sound === 'manjira') playManjira();
    else if (sound === 'unlock') playUnlock();
  }, [soundEnabled]);

  const selectRitual = useCallback((id: string) => {
    setActiveRitualId(id);
    setStepIndex(0);
    triggerSound('bell');
    // Scroll map stop into view
    setTimeout(() => {
      const el = mapRef.current?.querySelector(`[data-ritual="${id}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, 50);
  }, [triggerSound]);

  const handleNext = useCallback(() => {
    if (!isLastStep) {
      const nextIdx = stepIndex + 1;
      setStepIndex(nextIdx);
      triggerSound(activeRitual.steps[nextIdx].sound);
    } else {
      // Complete this ritual
      setCompletedRituals(prev => new Set(prev).add(activeRitualId));
      triggerSound('unlock');
      // Auto-advance to next ritual
      const currentIdx = RITUALS.findIndex(r => r.id === activeRitualId);
      if (currentIdx < RITUALS.length - 1) {
        const next = RITUALS[currentIdx + 1];
        setActiveRitualId(next.id);
        setStepIndex(0);
        setTimeout(() => {
          const el = mapRef.current?.querySelector(`[data-ritual="${next.id}"]`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }, 100);
      }
    }
  }, [isLastStep, stepIndex, activeRitual.steps, triggerSound, activeRitualId]);

  const handlePrev = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex(s => s - 1);
    }
  }, [stepIndex]);

  const totalCompleted = completedRituals.size;
  const progressPct = Math.round((totalCompleted / RITUALS.length) * 100);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* Page heading */}
      <div className="text-center py-1 sm:py-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Varaad — Wedding Ceremonies and Tradition
        </h2>
        <p className="devanagari text-3xl text-saffron-500 mt-1 leading-snug">वराड</p>
      </div>


      {/* ── Sound toggle + Progress ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="h-2 flex-1 sm:w-56 bg-orange-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="shrink-0 text-xs text-gray-900">{totalCompleted}/{RITUALS.length} complete</span>
        </div>
        <button
          onClick={() => setSoundEnabled(s => !s)}
          className={`w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${soundEnabled ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-gray-200 bg-gray-50 text-gray-900'}`}
          aria-pressed={soundEnabled}
        >
          <span>{soundEnabled ? '🔔' : '🔕'}</span>
          {soundEnabled ? 'Sound On' : 'Sound Off'}
        </button>
      </div>

      {/* ── Ritual Quest Map ── */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-cream to-transparent z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #fdf6ee, transparent)' }} />
        <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-cream to-transparent z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #fdf6ee, transparent)' }} />
        <div
          ref={mapRef}
          className="flex gap-1 overflow-x-auto pb-2 px-3 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {RITUALS.map((ritual, i) => (
            <div key={ritual.id} className="flex items-center" data-ritual={ritual.id}>
              <MapStop
                ritual={ritual}
                index={i}
                isActive={ritual.id === activeRitualId}
                isCompleted={completedRituals.has(ritual.id)}
                onClick={() => selectRitual(ritual.id)}
              />
              {i < RITUALS.length - 1 && (
                <div className={`w-4 h-0.5 flex-shrink-0 transition-colors duration-300 ${completedRituals.has(ritual.id) ? 'bg-emerald-400' : 'bg-orange-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Active Ritual Card ── */}
      <div className="rounded-3xl border border-orange-100 bg-white shadow-sm overflow-hidden">
        {/* Ritual header */}
        <div className={`bg-gradient-to-br ${activeRitual.stageBg} px-5 pt-5 pb-4`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{activeRitual.emoji}</span>
                <h2 className="text-xl font-bold text-gray-900">{activeRitual.name}</h2>
              </div>
              {activeRitual.nameMarathi && (
                <p className="devanagari text-base text-gray-900 mb-1">{activeRitual.nameMarathi}</p>
              )}
              <p className="text-xs text-gray-900 flex items-center gap-1">
                <span>⏰</span> {activeRitual.timing}
              </p>
            </div>
            <span className="text-3xl flex-shrink-0">{activeRitual.emoji}</span>
          </div>
          <p className="text-sm text-gray-900 mt-3 leading-relaxed">{activeRitual.summary}</p>

          {/* Participants */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {activeRitual.participants.map(p => (
              <span key={p} className="text-[10px] bg-white/60 border border-white/80 text-gray-900 px-2 py-0.5 rounded-full">
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Stage */}
        <div className="px-4 pt-4">
          <Stage ritual={activeRitual} stepIndex={stepIndex} />
        </div>

        {/* Step text */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
              Step {stepIndex + 1} of {activeRitual.steps.length}
            </span>
            <div className="flex gap-0.5">
              {activeRitual.steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${i <= stepIndex ? 'bg-amber-500' : 'bg-orange-100'} ${i === stepIndex ? 'w-4' : 'w-1.5'}`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-900 leading-relaxed">
            {currentStep.text}
          </p>
        </div>

        {/* Navigation */}
        <div className="px-4 pb-5 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handlePrev}
            disabled={stepIndex === 0}
            className="w-full sm:flex-1 py-3 rounded-2xl border border-orange-200 text-gray-900 text-sm font-medium hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            className={`w-full sm:flex-[2] py-3 rounded-2xl text-sm font-bold shadow-sm transition-all duration-200 active:scale-95 ${
              isLastStep && isLastRitual
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-emerald-200 hover:shadow-md'
                : isLastStep
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-amber-200 hover:shadow-md'
                : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white hover:shadow-amber-200 hover:shadow-md'
            }`}
          >
            {isLastStep && isLastRitual
              ? '✨ Wedding Complete!'
              : isLastStep
              ? `Next Ritual: ${RITUALS[RITUALS.findIndex(r => r.id === activeRitualId) + 1]?.name} →`
              : 'Next →'}
          </button>
        </div>
      </div>

      {/* ── Completion banner ── */}
      {completedRituals.size === RITUALS.length && (
        <div className="rounded-3xl bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50 border border-amber-200 p-6 text-center space-y-2">
          <p className="text-3xl">🎊</p>
          <h3 className="text-lg font-bold text-gray-900">Subhamangala!</h3>
          <p className="text-sm text-gray-900 leading-relaxed">
            You've journeyed through all ten rituals of a Tanjore Marathi Desastha wedding. May every ceremony be filled with joy, meaning, and the blessings of all who have come before.
          </p>
          <p className="devanagari text-lg text-amber-600">शुभमंगल सावधान! 🌸</p>
        </div>
      )}
    </div>
  );
}
