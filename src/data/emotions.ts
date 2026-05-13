export interface EmotionEntry {
  roman: string;
  devanagari: string;
  english: string;
  note?: string;
}

export interface EmotionGroup {
  id: string;
  /** filename inside /expressions/ (without leading slash), e.g. "angry.png" */
  image: string | null;
  primaryEnglish: string;
  entries: EmotionEntry[];
}

export const EMOTION_GROUPS: EmotionGroup[] = [
  {
    id: 'anger',
    image: 'angry.png',
    primaryEnglish: 'Anger',
    entries: [
      { roman: 'Raag', devanagari: 'राग', english: 'Anger' },
      { roman: 'Aavesh', devanagari: 'आवेश', english: 'Angry Passion', note: 'An intense, impassioned state — more than just anger, a fervent emotional charge.' },
    ],
  },
  {
    id: 'happy',
    image: 'happy.png',
    primaryEnglish: 'Happiness',
    entries: [
      { roman: 'Santosh', devanagari: 'संतोष', english: 'Happy / Happiness' },
    ],
  },
  {
    id: 'sad',
    image: 'sad.png',
    primaryEnglish: 'Sadness',
    entries: [
      { roman: 'Vessan', devanagari: 'वेसन', english: 'Sad' },
    ],
  },
  {
    id: 'love',
    image: 'love.png',
    primaryEnglish: 'Love',
    entries: [
      { roman: 'Laad', devanagari: 'लाड', english: 'Love / Affection' },
    ],
  },
  {
    id: 'suspicion',
    image: 'suspicious.png',
    primaryEnglish: 'Suspicion',
    entries: [
      { roman: 'Sandegh', devanagari: 'संदेघ', english: 'Suspicion' },
      { roman: 'Anumaan', devanagari: 'अनुमान', english: 'Suspicion / Inference' },
      {
        roman: 'Sandegh Praani',
        devanagari: 'संदेघ प्राणी',
        english: 'Suspicious creature',
        note: 'Literally "suspicious creature" — the TMD use of "Praani" (creature/being) to describe a suspicious person carries a colourful, somewhat scornful judgement.',
      },
    ],
  },
  {
    id: 'fear',
    image: 'fear-afraid.png',
    primaryEnglish: 'Fear',
    entries: [
      { roman: 'Behe', devanagari: 'बेहे', english: 'Fear / Afraid' },
    ],
  },
  {
    id: 'timid',
    image: 'timid-scared.png',
    primaryEnglish: 'Timid',
    entries: [
      { roman: 'Bhikondi', devanagari: 'भिकोंडी', english: 'Timid / Scared person' },
    ],
  },
  {
    id: 'pride',
    image: 'pride.png',
    primaryEnglish: 'Pride',
    entries: [
      { roman: 'Garv', devanagari: 'गर्व', english: 'Pride' },
      { roman: 'Garvisht', devanagari: 'गर्विष्ट', english: 'Proud person' },
    ],
  },
  {
    id: 'jealousy',
    image: 'jealous.png',
    primaryEnglish: 'Jealousy',
    entries: [
      { roman: 'Jhalkapan', devanagari: 'झ्ल्कापण', english: 'Jealousy' },
    ],
  },
  {
    id: 'show-off',
    image: 'show-off.png',
    primaryEnglish: 'Show-off',
    entries: [
      { roman: 'Jhamb', devanagari: 'झंब', english: 'Show off / Boastfulness' },
      { roman: 'Jhambishta', devanagari: 'झम्बिष्ट', english: 'Show-off person' },
    ],
  },
  {
    id: 'gentle',
    image: 'soft-gentle.png',
    primaryEnglish: 'Soft / Gentle',
    entries: [
      { roman: 'Sowmya', devanagari: 'सौम्या', english: 'Soft / Gentle' },
    ],
  },
  {
    id: 'rough',
    image: 'rough-unpolished.png',
    primaryEnglish: 'Rough',
    entries: [
      { roman: 'Moratt', devanagari: 'मोरट्', english: 'Rough / Unpolished' },
    ],
  },
  {
    id: 'wicked',
    image: 'wicked-micheivous.png',
    primaryEnglish: 'Wicked',
    entries: [
      { roman: 'Dushtapan', devanagari: 'दुष्टपण', english: 'Wickedness / Mischievousness' },
    ],
  },
  {
    id: 'dignified',
    image: 'dignified.png',
    primaryEnglish: 'Dignified',
    entries: [
      { roman: 'Gambhir', devanagari: 'गंभीर', english: 'Dignified / Composed' },
      { roman: 'Gambhirtha', devanagari: 'गंभीरता', english: 'Dignity / Composure' },
    ],
  },
];
