const { matchedData } = require('express-validator');
const Product = require('../models/Product');

/*
  Windshield care assistant.
  - With ANTHROPIC_API_KEY set, answers come from Claude, grounded in the live catalogue.
  - Without it (or if the API call fails), a built-in care guide answers common questions.
  Either way, product suggestions only ever come from real catalogue items.
*/

const MODEL = process.env.ASSISTANT_MODEL || 'claude-haiku-5-5';
const API_URL = 'https://api.anthropic.com/v1/messages';

const SAFETY =
  'If your wipers stop working or you cannot see clearly while driving, slow down and pull over somewhere safe before doing anything else.';

// ── Built-in care guide ─────────────────────────────────────────────
const GUIDE = [
  {
    id: 'streak',
    keys: ['streak', 'lines', 'smear', 'smudge', 'haze', 'glare', 'film', 'oily'],
    reply:
      'Streaks and smears usually come from one of three things:\n\n1. **Grit on the blade edge.** Wipe the rubber gently with a damp cloth.\n2. **A film on the glass** (wax, road oil, exhaust). Clean the windshield thoroughly with washer fluid and dry it with a lint-free microfiber towel.\n3. **Worn rubber.** If the edge is cracked, rounded or hardened, the blade can no longer wipe cleanly and should be replaced.\n\nIf streaks remain on clean glass with a clean blade, it is time for new blades.',
    types: ['Wiper Blades', 'Washer Fluid', 'Microfiber Towel'],
  },
  {
    id: 'chatter',
    keys: ['chatter', 'judder', 'skip', 'skipping', 'jump', 'bounce', 'stutter'],
    reply:
      'Chattering or skipping blades are usually caused by:\n\n1. **Contaminated glass:** wax or oil makes the rubber grip and release. Clean the glass with washer fluid.\n2. **Dry glass:** never run wipers on a dry windshield. Spray washer fluid first.\n3. **Hardened rubber:** older blades lose flexibility, and replacing them fixes it.\n4. **A bent wiper arm** that holds the blade at the wrong angle. A workshop can check and adjust the arm.',
    types: ['Washer Fluid', 'Wiper Blades'],
  },
  {
    id: 'noise',
    keys: ['squeak', 'noise', 'squeal', 'screech', 'loud'],
    reply:
      'Squeaking usually means the blade is dragging on glass that is too dry or not quite clean. Use washer fluid rather than running the wipers dry, clean the glass and the blade edge, and replace the blades if the rubber has hardened or cracked.',
    types: ['Washer Fluid', 'Wiper Blades'],
  },
  {
    id: 'replace',
    keys: ['replace', 'change', 'how often', 'when should', 'lifespan', 'last', 'old', 'worn', 'crack'],
    reply:
      'Replace your wiper blades when you notice any of these signs:\n\n- streaks or patches the blade misses\n- chattering or skipping\n- cracked, split or hardened rubber\n- a blade frame that no longer sits flat on the glass\n\nSun, heat and dust age rubber quickly, so inspect blades every few months and before the monsoon. Many drivers replace them roughly once a year.',
    types: ['Wiper Blades'],
  },
  {
    id: 'washer',
    keys: ['washer', 'spray', 'nozzle', 'jet', 'fluid not', 'not spraying', 'reservoir'],
    reply:
      'If the washer is not spraying:\n\n1. **Check the reservoir** and top it up with washer fluid.\n2. **Clear a blocked nozzle** carefully with a fine pin, without enlarging the hole.\n3. If you hear the pump but nothing comes out, a hose may be loose or kinked. If you hear nothing at all, the pump or its fuse may need a workshop check.',
    types: ['Washer Fluid'],
  },
  {
    id: 'fog',
    keys: ['fog', 'mist', 'condensation', 'steam', 'inside', 'defog', 'demist'],
    reply:
      'Mist on the inside of the glass is moisture from the cabin. Use the windshield defogger with the AC on, switch air recirculation off so fresh air comes in, and keep the inside of the glass clean, since a dirty surface fogs faster. Wipe it with a dry microfiber towel when parked.',
    types: ['Microfiber Towel'],
  },
  {
    id: 'repellent',
    keys: ['repellent', 'hydrophobic', 'bead', 'coating', 'rain-x', 'rain x', 'apply'],
    reply:
      'A rain repellent makes water bead up and roll off the glass at speed. For the best result, clean and fully dry the windshield first, then apply it exactly as the instructions on the pack describe. Our rain-repellent spray lists protection of up to 3 months per application.',
    types: ['Rain Repellent', 'Microfiber Towel'],
  },
  {
    id: 'fit',
    keys: ['size', 'fit', 'compatible', 'which blade', 'my car', 'length', 'inch', 'model', 'vehicle'],
    reply:
      'To find blades that fit, use the **Compatibility finder**. Choose your vehicle if we have verified fitment data for it, or measure your current blades:\n\n1. Measure each rubber blade from end to end, in inches.\n2. Note the connector where the blade meets the arm (most cars use a J-hook).\n3. Enter both lengths and the finder shows which of our blade pairs match.',
    types: ['Wiper Blades'],
    link: { href: '/fit', label: 'Open the compatibility finder' },
  },
  {
    id: 'monsoon',
    keys: ['monsoon', 'rain season', 'heavy rain', 'prepare', 'prep', 'storm'],
    reply:
      'A quick pre-monsoon routine:\n\n1. **Inspect the blades** and replace them if they streak or the rubber is cracked.\n2. **Top up the washer fluid.**\n3. **Deep-clean the glass**, then apply a rain repellent so rain beads off at speed.\n4. **Keep a microfiber towel** in the car for mist and spots.',
    types: ['Wiper Blades', 'Washer Fluid', 'Rain Repellent', 'Microfiber Towel'],
  },
];

const FALLBACK = {
  id: 'help',
  reply:
    'I can help with windshield and wiper care. For example:\n\n- why the wipers streak, chatter or squeak\n- when to replace blades\n- clearing fog or a blocked washer\n- preparing for the monsoon\n- finding blades that fit your vehicle\n\nWhat would you like to know?',
  types: [],
};

const SUGGESTIONS = ['My wipers leave streaks', 'Wipers chatter on the glass', 'When should I replace blades?', 'Which blades fit my car?', 'Prepare for the monsoon'];

function guideAnswer(text, products) {
  const t = text.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const g of GUIDE) {
    const score = g.keys.reduce((n, k) => n + (t.includes(k) ? k.length : 0), 0);
    if (score > bestScore) {
      best = g;
      bestScore = score;
    }
  }
  const topic = best || FALLBACK;
  const urgent = /(stopp?ed|not working|broke|can'?t see|cannot see|while driving)/.test(t);
  const picks = topic.types.flatMap((type) => products.filter((p) => p.type === type).slice(0, 1));
  return {
    reply: (urgent ? `${SAFETY}\n\n` : '') + topic.reply,
    products: picks.slice(0, 3),
    link: topic.link || null,
    topic: topic.id,
  };
}

// ── Claude ─────────────────────────────────────────────────────────
function systemPrompt(products) {
  const catalogue = products
    .map((p) => {
      const sizes = p.bladeLengthsIn?.length ? ` | blade lengths (in): ${p.bladeLengthsIn.join(' + ')}` : '';
      const conn = p.connectors?.length ? ` | connectors: ${p.connectors.join(', ')}` : '';
      return `- slug: ${p.slug} | ${p.name} | ${p.type} | ₹${p.price} | ${p.stock > 0 ? 'in stock' : 'out of stock'}${sizes}${conn} | features: ${(p.features || []).join('; ')}`;
    })
    .join('\n');
  return `You are the AutoCare windshield care assistant on an Indian online store for windshield care and wiper blades.

Help with troubleshooting (streaks, chatter, noise, fogging, washer problems), maintenance advice, and finding products in the catalogue below.

Rules:
- Recommend only products from the catalogue below, and describe them only with the details listed there. Never invent specifications, sizes, prices, materials, durations or claims.
- Never state which blades fit a specific vehicle. For fit questions, tell the user to use the Compatibility finder at /fit (by verified vehicle data, or by measuring their current blades in inches and noting the connector).
- Put safety first. If someone cannot see or the wipers fail while driving, tell them to pull over safely first. Suggest a workshop for mechanical faults (motor, linkage, pump, bent arms).
- Be concise and warm: at most about 130 words, with short numbered steps where helpful. Use **bold** sparingly. Prices are in rupees (₹).
- Stay on topic. Politely decline unrelated requests.
- On the very last line, write "PRODUCTS:" followed by up to 3 catalogue slugs you recommend, comma-separated, or "PRODUCTS: none".

Catalogue:
${catalogue}`;
}

async function askClaude(messages, products) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 600, system: systemPrompt(products), messages }),
    });
    if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    const m = text.match(/\n?PRODUCTS:\s*(.*)\s*$/i);
    const slugs = m ? m[1].split(',').map((s) => s.trim()).filter((s) => s && s.toLowerCase() !== 'none') : [];
    const reply = m ? text.slice(0, m.index).trim() : text;
    const picks = slugs.map((s) => products.find((p) => p.slug === s)).filter(Boolean).slice(0, 3);
    return { reply, products: picks };
  } finally {
    clearTimeout(timer);
  }
}

const publicProduct = (p) => ({ slug: p.slug, name: p.name, price: p.price, type: p.type, stock: p.stock, image: p.image || null });

// POST /api/assistant  { messages: [{ role, content }] }
exports.chat = async (req, res) => {
  const { messages } = matchedData(req, { locations: ['body'] });
  // The conversation must start with the user and end with the user
  while (messages.length && messages[0].role !== 'user') messages.shift();
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'user') return res.status(400).json({ success: false, message: 'The last message must be from the user' });

  const products = await Product.find({ isActive: true })
    .select('name slug price stock type features bladeLengthsIn connectors image')
    .sort({ type: 1, price: 1 })
    .lean();

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const out = await askClaude(messages, products);
      return res.json({ success: true, mode: 'ai', reply: out.reply, products: out.products.map(publicProduct), suggestions: [] });
    } catch (err) {
      console.error('Assistant AI error, falling back to guide:', err.message);
    }
  }
  const g = guideAnswer(last.content, products);
  res.json({
    success: true,
    mode: 'guide',
    reply: g.reply,
    products: g.products.map(publicProduct),
    link: g.link,
    suggestions: g.topic === 'help' ? SUGGESTIONS : SUGGESTIONS.filter((s) => !s.toLowerCase().includes(g.topic)).slice(0, 3),
  });
};

exports.SUGGESTIONS = SUGGESTIONS;
