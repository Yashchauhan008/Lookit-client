// Marketing copy + plan catalog. Plans mirror lookit-server db/migrations (seed: plans).

export const CONTACT_EMAIL = 'hello@lookit.studio'

const img = (id: string, w = 1400) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

export const IMAGES = {
  hero: img('1511285560929-80b456fea0bc', 2400),
  search: img('1519741497674-611481863552', 1600),
  about: img('1519225421980-715cb0215aed', 1600),
  findFace: img('1464366400600-7168b8af9bc3', 1600),
  upload: img('1583939003579-730e3918a45a', 1600),
  albums: img('1465495976277-4387d4b0b4c6', 1600),
}

// Event shots (decks, cards, feature art)
export const EVENT_SHOTS = [
  img('1519741497674-611481863552', 700),
  img('1465495976277-4387d4b0b4c6', 700),
  img('1583939003579-730e3918a45a', 700),
  img('1464366400600-7168b8af9bc3', 700),
  img('1511795409834-ef04bbd61622', 700),
  img('1519225421980-715cb0215aed', 700),
]

// Portrait tiles (drifting rows, selfie grid)
export const FACES = [
  '1529626455594-4ff0802cfb7e',
  '1507003211169-0a1dd7228f2d',
  '1494790108377-be9c29b29330',
  '1500648767791-00dcc994a43e',
  '1438761681033-6461ffad8d80',
  '1472099645785-5658abf4ff4e',
  '1544005313-94ddf0286df2',
  '1531746020798-e6953c6e8e04',
  '1517841905240-472988babdf9',
  '1506794778202-cad84cf45f1d',
  '1534528741775-53994a69daeb',
  '1539571696357-5a69c17a67c6',
  '1524504388940-b1c1722653e1',
  '1488426862026-3ee34a7d66df',
  '1521119989659-a83eee488004',
  '1463453091185-61582044d556',
].map((id) => img(id, 420))

export const AUDIENCES = [
  { label: 'Photographers', src: img('1519741497674-611481863552', 800) },
  { label: 'Event Organisers', src: img('1519225421980-715cb0215aed', 800) },
  { label: 'College Fests', src: img('1464366400600-7168b8af9bc3', 800) },
  { label: 'Corporate Events', src: img('1511285560929-80b456fea0bc', 800) },
  { label: 'Weddings', src: img('1465495976277-4387d4b0b4c6', 800) },
  { label: 'Garba & Celebrations', src: img('1583939003579-730e3918a45a', 800) },
]

export const MARQUEE = [
  'Weddings',
  'Garba',
  'Navratri',
  'College fests',
  'Marathons',
  'Corporate',
  'Receptions',
  'Sangeet',
]

export const EXPERIENCE = [
  { title: 'Instant Face Search', body: 'One selfie finds every photo a guest appears in.' },
  { title: 'Smart & Secure Sharing', body: 'Share one event link or printable QR code.' },
  { title: 'Get photos privately', body: 'Guests only ever see their own matches.' },
  { title: 'Easy to Use', body: 'Works in WhatsApp and Instagram in-app browsers. No app, no signup.' },
]

export const WHY = [
  { title: 'AI Face Search', body: 'Upload photos to your event, publish, and guests find themselves instantly.' },
  { title: 'Secure Sharing', body: 'Share the event album with a link or QR code. Every search stays inside one event.' },
  { title: 'Built for Indian Studios', body: 'Made for weddings, Garba nights and college fests, on shaky venue Wi‑Fi.' },
  { title: 'Bulk Upload That Survives', body: 'Direct multipart uploads to cloud storage, thousands of photos per event.' },
  { title: 'Privacy-Safe Recognition', body: 'Selfies are processed in memory and never stored. Guests can delete their data.' },
  { title: 'Powered by Advanced AI', body: 'Built on AWS Rekognition for high-accuracy face matching.' },
  { title: 'Never Cross-Event', body: 'Every search is scoped to a single event. Faces never leak between galleries.' },
  { title: 'Simple Prepaid Plans', body: 'Pay by UPI, see your photo quota live, top up any time. No surprises.' },
]

export const FEATURES = [
  {
    eyebrow: 'AI Powered Photo Sharing',
    title: 'Find Every Face in Every Frame',
    body: 'Lookit automatically detects and indexes faces across your event, even in dim reception halls and crowded dance floors. Upload once, let Lookit do the rest.',
    image: IMAGES.findFace,
    items: [
      { title: 'Accurate face detection and matching', body: 'High-accuracy AI matching with a configurable confidence threshold.' },
      { title: 'Works across thousands of photos', body: 'Large event galleries are processed and indexed in the background.' },
      { title: 'Instant search by selfie', body: 'Guests find all their photos in seconds with a single selfie.' },
    ],
  },
  {
    eyebrow: 'Advanced AI',
    title: 'Fast Uploads. Privacy-First Design.',
    body: 'Speed and safety go hand in hand. Photos go straight to cloud storage and are processed in minutes, with guest data handled as little as possible.',
    image: IMAGES.upload,
    items: [
      { title: 'Direct multipart uploads', body: 'Files go from the browser to storage, built for big batches.' },
      { title: 'Selfies never stored', body: 'Guest selfies are matched in memory and discarded.' },
      { title: 'Consent before every search', body: 'Guests see a clear consent notice before any face check.' },
      { title: 'Delete my data', body: 'Guests can remove their data from the results page at any time.' },
    ],
  },
  {
    eyebrow: 'For studios',
    title: 'Deliver Personal Galleries That Impress Clients',
    body: 'Stop sending “please share my photos” links. Every guest sees only the photos they appear in, on a page that feels like your studio.',
    image: IMAGES.albums,
    items: [
      { title: 'Guests only see photos they match' },
      { title: 'Shareable link and printable QR' },
      { title: 'Your studio name on every page' },
      { title: 'Download original photos' },
    ],
  },
]

export type Plan = {
  code: string
  name: string
  price: number
  photos: number
  featured?: boolean
  whiteLabel: boolean
  team: number
}

export const MONTHLY: Plan[] = [
  { code: 'base_monthly', name: 'Base', price: 1499, photos: 5000, whiteLabel: false, team: 0 },
  { code: 'pro_monthly', name: 'Pro', price: 2499, photos: 9000, whiteLabel: true, team: 0, featured: true },
  { code: 'studio_monthly', name: 'Studio', price: 5999, photos: 22000, whiteLabel: true, team: 3 },
]

export const SEASON: Plan[] = [
  { code: 'base_season', name: 'Base', price: 2699, photos: 10000, whiteLabel: false, team: 0 },
  { code: 'pro_season', name: 'Pro', price: 4499, photos: 18000, whiteLabel: true, team: 0, featured: true },
  { code: 'studio_season', name: 'Studio', price: 10799, photos: 44000, whiteLabel: true, team: 3 },
]

export const TRIAL = { photos: 500, days: 30 }

export const ADDONS = [
  {
    name: 'Top-up · 1,000 photos',
    price: 299,
    body: 'Running low mid-season? Add 1,000 photos to your quota for 30 days.',
  },
]

export const PRICING_FAQ = [
  {
    q: 'How do I pay?',
    a: 'Pay by UPI and submit your UTR. We verify and activate your plan, usually within hours.',
  },
  {
    q: 'What counts toward my photo quota?',
    a: 'Each photo you upload to an event. Guest searches and downloads are never counted.',
  },
  {
    q: 'How long are photos kept?',
    a: 'Every plan keeps event photos for 90 days after your plan window ends.',
  },
  {
    q: 'What is a Season Pass?',
    a: 'A 2-month prepaid bundle with roughly double the monthly quota at a lower combined price, made for wedding season.',
  },
  {
    q: 'What does white-label mean?',
    a: 'Pro and Studio remove the “Powered by Lookit” badge from your guest pages.',
  },
]

export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`
