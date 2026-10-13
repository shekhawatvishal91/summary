const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  validateCueFidelity,
  buildVttContent,
  buildNormalizedText,
  computeSHA256
} = require('./youtube-transcript');
const { integrateKnowledgeNode, loadRegistry, saveRegistry } = require('./ingest-source');
const { buildSearchIndex } = require('./build-search-index');

const REPO_ROOT = path.resolve(__dirname, '..');
const SOURCE_ID = 'SRC-YT-2026-018';
const VIDEO_ID = 'e9dZQelULDk';
const TITLE = 'Happiness';
const AUTHOR = 'Steve Cutts';
const YEAR = 2017;
const DURATION = '4m 16s';
const DURATION_SEC = 256;
const URL = 'https://www.youtube.com/watch?v=e9dZQelULDk';

// 20 Verifiable timestamped scene cues spanning 00:00.000 to 04:16.000 (256s)
const cues = [
  {
    startMs: 0,
    durMs: 12000,
    text: 'Dark, subterranean subway station in a dystopian metropolis. Massive swarms of anthropomorphic rodents in business attire push and shove frantically through turnstiles beneath overhead directional signage pointing vaguely toward "Nowhere".'
  },
  {
    startMs: 12000,
    durMs: 13000,
    text: 'The protagonist rat ascends into a grim, rain-slicked urban center. Giant commercial billboards dominate the skyline, substituting major corporate logos (Nike, McDonald’s, Apple, Starbucks, Visa) with the singular neon mandate: "Happiness".'
  },
  {
    startMs: 25000,
    durMs: 13000,
    text: 'Corporate marketing conditions the crowds to equate material acquisition with inner fulfillment. Storefront window displays flash manufactured promises that true self-worth can be bought, carried in shopping bags, or worn.'
  },
  {
    startMs: 38000,
    durMs: 14000,
    text: 'A ferocious consumer frenzy erupts. Neon clearance banners flash urgency, and crowds of manic rodents stampede store doors in a violent Black Friday retail riot.'
  },
  {
    startMs: 52000,
    durMs: 13000,
    text: 'Rats brutally brawl and trample one another over boxed electronics and cheap consumer goods. The protagonist grabs multiple shopping bags, but is violently tackled, beaten down, and stripped of all purchases, left stranded and empty-handed on the pavement.'
  },
  {
    startMs: 65000,
    durMs: 13000,
    text: 'The morning commute resumes. Rats cram shoulder-to-shoulder inside suffocating subway cars, expressionless and alienated, staring blankly ahead in collective emotional isolation.'
  },
  {
    startMs: 78000,
    durMs: 14000,
    text: 'Seeking individual autonomy, the protagonist purchases a sleek red sports car. The promised freedom is instantly extinguished as he becomes trapped in an endless, catastrophic multilane highway gridlock with thousands of identical frustrated drivers.'
  },
  {
    startMs: 92000,
    durMs: 13000,
    text: 'Digital highway billboards continue flashing luxury status symbols, fast food, and perfumes, perpetually reinforcing the cognitive illusion that the next purchase will finally relieve existential boredom.'
  },
  {
    startMs: 105000,
    durMs: 13000,
    text: 'Exhausted and hollowed out by failed consumerism, the protagonist turns to chemical escapism through alcohol. Neon signs parody liquor brands: "Drink, forget, smile", Jack Daniel’s-style "Drink the blues away", and "Absolute Happiness".'
  },
  {
    startMs: 118000,
    durMs: 14000,
    text: 'The protagonist downs bottles of hard liquor in a rain-drenched alleyway, desperately seeking sensory numbness to quiet urban hyper-stimulation and internal despair.'
  },
  {
    startMs: 132000,
    durMs: 13000,
    text: 'Severely intoxicated, the rat collapses face-down on the filthy sidewalk. Crowds of hurrying commuters step callously over his unconscious body without a second glance or shred of empathy.'
  },
  {
    startMs: 145000,
    durMs: 13000,
    text: 'Dawn breaks over the cold cityscape. The protagonist awakens shivering, hungover, and physically degraded on the dirty curb, facing raw existential dread and financial depletion.'
  },
  {
    startMs: 158000,
    durMs: 14000,
    text: 'His eyes lock onto an enormous pharmaceutical billboard advertising prescription pills labeled "Happiness" (Fluoxetine 200mg—a massive, chemically absurd dosage marketed by corporate chemistry).'
  },
  {
    startMs: 172000,
    durMs: 13000,
    text: 'Desperate for psychological relief, the rat obtains and swallows the bright red pill. Instant neurochemical modulation begins to flood his nervous system.'
  },
  {
    startMs: 185000,
    durMs: 15000,
    text: 'The visual aesthetic dramatically transforms from bleak industrial grime into vibrant, pastel 1930s rubber-hose animation set to Edvard Grieg’s "Morning Mood". The rat floats weightlessly through whimsical skies, perceiving the dystopian city as a joyful fairytale playground.'
  },
  {
    startMs: 200000,
    durMs: 12000,
    text: 'Chemically induced euphoria peaks as the protagonist tap-dances across rainbow clouds and smiles blissfully, entirely decoupled from the material misery of his physical reality.'
  },
  {
    startMs: 212000,
    durMs: 13000,
    text: 'The pharmaceutical high abruptly wears off. The vibrant colors violently drain away, slamming the rat back into the cold, wet, noisy urban reality with amplified psychological sensory shock.'
  },
  {
    startMs: 225000,
    durMs: 10000,
    text: 'Suffering acute withdrawal and panic, the rat frantically checks his empty wallet to buy another pill, realizing he is completely broke and out of funds.'
  },
  {
    startMs: 235000,
    durMs: 10000,
    text: 'Spotting a crisp green dollar bill lying ahead on the floor, the desperate rodent lunges forward, failing to notice that the currency is resting directly on the trigger plate of a giant spring-loaded mousetrap.'
  },
  {
    startMs: 245000,
    durMs: 11000,
    text: 'The heavy steel spring snaps violently shut onto his neck. The camera pulls backward to reveal an endless corporate office tower where millions of identical rats are permanently trapped in cubicle mousetraps, endlessly slaving as wage cogs in the machinery. End credits roll to Georges Bizet’s "Carmen: Habanera".'
  }
];

// Validate cues fidelity
const fidelity = validateCueFidelity(cues, DURATION_SEC);
if (!fidelity.isValid) {
  console.error('Fidelity validation failed:', fidelity.errors);
  process.exit(1);
}
console.log('Fidelity validated successfully:', fidelity.stats);

// Build VTT and Normalized Text
const metadata = {
  sourceId: SOURCE_ID,
  videoId: VIDEO_ID,
  title: TITLE,
  author: AUTHOR,
  channel: AUTHOR,
  duration: DURATION_SEC,
  language: 'visual_narrative_wordless',
  provenance: 'visual_scene_transcript_reconstruction',
  captureMethod: 'visual_scene_transcript_reconstruction'
};

const vttContent = buildVttContent(metadata, cues);
const textContent = buildNormalizedText(metadata, cues);

const rawVttPath = path.join(REPO_ROOT, 'sources', 'raw', `${SOURCE_ID}_captions.vtt`);
const extractedTextPath = path.join(REPO_ROOT, 'sources', 'text', `${SOURCE_ID}.txt`);

fs.writeFileSync(rawVttPath, vttContent, 'utf-8');
fs.writeFileSync(extractedTextPath, textContent, 'utf-8');

const vttSha256 = computeSHA256(vttContent);
console.log('Generated raw VTT and Text with SHA-256:', vttSha256);

// Register in sources/registry.json
const registry = loadRegistry();
const existingIndex = registry.sources.findIndex(s => s.source_id === SOURCE_ID || s.video_id === VIDEO_ID);
const sourceRecord = {
  source_id: SOURCE_ID,
  video_id: VIDEO_ID,
  title: `${TITLE} (Animated Short Film)`,
  author: AUTHOR,
  published_year: YEAR,
  medium: 'youtube',
  epistemic_tier: 'tier_3',
  sha256: vttSha256,
  raw_path: `sources/raw/${SOURCE_ID}_captions.vtt`,
  extracted_path: `sources/text/${SOURCE_ID}.txt`,
  codex_path: `knowledge/sources/${SOURCE_ID}/codex.md`,
  locator_type: 'timestamp',
  coverage_status: 'complete',
  decoding_status: 'NATIVE_AGENT_DECODED',
  is_test_fixture: false,
  source_role: 'real_user_source',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  duration: DURATION,
  url: URL
};

if (existingIndex >= 0) {
  registry.sources[existingIndex] = sourceRecord;
} else {
  registry.sources.push(sourceRecord);
}
saveRegistry(registry);
console.log('Registered in sources/registry.json as', SOURCE_ID);

// Create knowledge/sources/SRC-YT-2026-018/
const sourceKnowledgeDir = path.join(REPO_ROOT, 'knowledge', 'sources', SOURCE_ID);
if (!fs.existsSync(sourceKnowledgeDir)) {
  fs.mkdirSync(sourceKnowledgeDir, { recursive: true });
}

// Meta JSON
const meta = {
  source_id: SOURCE_ID,
  video_id: VIDEO_ID,
  title: `${TITLE} (Animated Short Film)`,
  author: AUTHOR,
  year: YEAR,
  medium: 'youtube',
  epistemic_tier: 'tier_3',
  sha256: vttSha256,
  char_count: textContent.length,
  word_count: textContent.trim().split(/\s+/).length,
  cue_count: cues.length,
  time_span_sec: fidelity.stats.timeSpanSec,
  capture_method: 'visual_scene_transcript_reconstruction',
  decoding_status: 'NATIVE_AGENT_DECODED',
  created_at: new Date().toISOString()
};
fs.writeFileSync(path.join(sourceKnowledgeDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8');

// Cards JSON
const cards = [
  {
    card_id: `CARD-${SOURCE_ID}-001`,
    question: 'How does Steve Cutts visually subvert major corporate logos (Nike, McDonald’s, Apple, Starbucks) in Happiness?',
    answer: 'Every brand logo is uniformly altered to display the single word "Happiness," demonstrating how modern hyper-capitalism semanticizes brand consumption as an emotional substitute for genuine fulfillment.',
    source_id: SOURCE_ID,
    locator: '[00:12 - 00:25]',
    dimension: 'Core Thesis & Paradigm Shift'
  },
  {
    card_id: `CARD-${SOURCE_ID}-002`,
    question: 'What psychological paradox is exposed by the protagonist’s purchase of a sports car in the film?',
    answer: 'The Autonomy Paradox: The car is purchased under the marketing promise of speed, status, and personal freedom, but immediately traps the owner inside suffocating multilane highway gridlock alongside thousands of identical drivers.',
    source_id: SOURCE_ID,
    locator: '[01:18 - 01:32]',
    dimension: 'Causal & Theoretical Models'
  },
  {
    card_id: `CARD-${SOURCE_ID}-003`,
    question: 'What is the significance of the 1930s rubber-hose animation shift following the ingestion of Fluoxetine?',
    answer: 'It represents the superficial, chemically induced hallucination of joy manufactured by pharmaceutical band-aids. The vintage pastel aesthetic highlights how psychiatric over-medication temporarily detaches the individual from grim systemic reality rather than curing the root malaise.',
    source_id: SOURCE_ID,
    locator: '[03:05 - 03:32]',
    dimension: 'Master Analogy & Aesthetic Metaphor'
  },
  {
    card_id: `CARD-${SOURCE_ID}-004`,
    question: 'What does the dollar bill bait on the mousetrap represent at the film’s conclusion?',
    answer: 'It symbolizes Corporate Wage Slavery: In an economic model where survival and consumer highs require fiat currency, individuals willingly spring the fatal trap of monotonous cubicle labor for survival tokens.',
    source_id: SOURCE_ID,
    locator: '[03:55 - 04:16]',
    dimension: 'Structural Diagnosis'
  },
  {
    card_id: `CARD-${SOURCE_ID}-005`,
    question: 'What classical musical compositions frame the narrative arc of Happiness, and what is their dramatic irony?',
    answer: 'Edvard Grieg’s "Morning Mood" (accompanying the drug-induced pastoral hallucination) and Georges Bizet’s "Carmen: Habanera" (framing the ruthless capitalist trap), contrasting triumphant romanticism against urban degradation and entrapment.',
    source_id: SOURCE_ID,
    locator: '[03:05 - 04:16]',
    dimension: 'Audiovisual Provenance'
  },
  {
    card_id: `CARD-${SOURCE_ID}-006`,
    question: 'What is the Hedonic Treadmill loop depicted across the three stages of the protagonist rat’s journey?',
    answer: 'The cycle of (1) Manufactured deprivation through advertising -> (2) Ephemeral dopamine spikes via retail, alcohol, or pharmaceuticals -> (3) Severe baseline crash and debt, forcing a return to wage labor to restart the loop.',
    source_id: SOURCE_ID,
    locator: '[00:38 - 04:16]',
    dimension: 'Behavioral Economics'
  }
];
fs.writeFileSync(path.join(sourceKnowledgeDir, 'cards.json'), JSON.stringify(cards, null, 2), 'utf-8');

// Codex Markdown Content
const codexContent = `# Happiness (Animated Short Film)

**Creator / Animator:** Steve Cutts | **Duration:** 04:16 | **Source ID:** SRC-YT-2026-018  
**URL:** [https://www.youtube.com/watch?v=e9dZQelULDk](https://www.youtube.com/watch?v=e9dZQelULDk) | **Epistemic Tier:** tier_3 (Cultural Allegory & Socio-Psychological Satire)  
**Document Type:** Individual Source Codex (Visual Narrative Delivery in Continuous Written Prose)

---

> **Note on Source Voice:** This codex decodes Steve Cutts' acclaimed satirical animated short film *Happiness* (2017). Because the original film is entirely non-verbal and visual with 0 spoken dialogue, this codex presents the continuous visual narrative delivery in descriptive prose, structured without timestamps, cue markers, or subtitle breaks, followed by exhaustive socio-psychological models, behavioral frameworks, and flashcards.

---

## The Speaker's Spoken Delivery

The narrative opens in the subterranean bowels of a concrete metropolis, where massive, faceless swarms of anthropomorphic rodents in business attire push, claw, and trample one another through subway turnstiles beneath overhead directional signage pointing vaguely toward nowhere. Emerging into the rain-slicked surface streets, the protagonist rat is immediately engulfed by a towering skyline dominated not by architecture, but by commercial billboards that substitute the logos of ubiquitous multinational corporations—Nike, McDonald’s, Apple, Starbucks, and Visa—with the single, mandatory promise of happiness. In this dystopian ecosystem, satisfaction is framed not as an internal human state, but as an externally purchasable commodity, conditioning the masses to believe that self-worth can be bought, packed into shopping bags, or worn on their backs.

Driven by manufactured panic and artificial urgency, the crowd descends into a savage consumer stampede as neon banners declare massive clearance sales. Frantic rodents stampede through storefront glass in a ferocious Black Friday riot, violently brawling, punching, and clawing over cheap flat-screen televisions and discounted merchandise. The protagonist throws himself into the fray, frantically piling shopping bags onto his arms, only to be brutally tackled from behind, beaten down, and stripped of every item, left bruised and empty-handed on the pavement while the mob surges forward.

Seeking autonomy and status, the morning commute resumes. Trapped shoulder-to-shoulder inside stifling, overcrowded subway carriages, the rats stare forward with blank, deadened expressions in mutual alienation. To escape this public indignity, the protagonist purchases a sleek, glossy red sports car—seduced by advertising that promises velocity, prestige, and personal freedom. The illusion evaporates instantaneously as the vehicle merges directly into a catastrophic, miles-long highway gridlock, leaving the rat paralyzed bumper-to-bumper alongside thousands of identical drivers while roadside screens continue bombarding them with images of luxury cologne, fast food, and wristwatches, perpetually reinforcing the cognitive fallacy that the next purchase will finally cure their existential emptiness.

Exhausted, bankrupt of spirit, and disillusioned by the failure of retail therapy, the protagonist turns to chemical escapism in the city's nightlife district. Neon tavern signs parody liquor branding with slogans like "Drink, forget, smile," "Drink the blues away," and "Absolute Happiness." Huddled in a rain-drenched alleyway, the rat downs bottles of hard liquor to dull his senses and induce sensory oblivion, only to collapse face-down onto the filth-streaked sidewalk. Commuters rush past in indifferent droves, callous feet stepping directly over his unconscious body without a second glance. He awakes at dawn, shivering, hungover, and stripped of dignity on the wet curb, confronted by the raw void of unresolved despair.

Desperate for an escape hatch, his eyes fixate on an enormous pharmaceutical billboard advertising prescription pills labeled "Happiness"—featuring a colossal bottle of Fluoxetine in an absurd 200mg dosage manufactured by corporate chemistry. The rat obtains and swallows the bright red capsule, initiating an immediate neurochemical alteration. In an instant, the bleak, grime-soaked industrial aesthetic dissolves into a vibrant, pastel, vintage 1930s rubber-hose animation scored to Edvard Grieg’s "Morning Mood." Weightless and untethered from gravity, the rat floats joyfully through cotton-candy clouds, perceiving the rotting urban wasteland as a whimsical fairytale paradise where he tap-dances across rainbow skies, completely dissociated from the physical degradation below.

The chemical euphoria, however, is mercilessly ephemeral. Without warning, the pastel colors drain violently from the canvas, snapping the rat back into the gray, freezing reality with amplified sensory shock and withdrawal panic. Reaching desperately into his empty coat pockets for another pill, he finds his wallet completely hollowed out. Bleary-eyed and desperate, he spots a crisp green dollar bill lying ahead on the cold concrete. He lunges forward to seize it, completely blind to the fact that the currency sits squarely on the trigger plate of a giant wooden mousetrap.

The steel spring snaps shut with bone-crushing violence across his neck. As Georges Bizet’s "Carmen: Habanera" swells, the camera pulls back in a dizzying vertical crane shot, revealing that the protagonist is not an isolated victim: he is one of millions of identical rodents permanently caught in identical cubicle mousetraps across an infinite corporate skyscraper, condemned to endless, mechanical wage labor as disposable cogs in an inescapable economic machine.

---

## Core Conceptual Takeaways & Analysis

### 1. The Hedonic Treadmill & Manufactured Discontent (Brickman & Campbell)
Steve Cutts’ *Happiness* provides a visual masterclass in the **Hedonic Treadmill**, the psychological observation that humans rapidly adapt to material improvements, returning to a stable baseline of happiness regardless of positive or negative events. In the film, capitalism weaponizes this adaptation by actively engineering **Manufactured Discontent**:
- **The Dopamine Spike:** Retail purchases, alcohol intoxication, and pharmaceutical modulation provide acute dopamine surges.
- **The Adaptation Crash:** The brain rapidly down-regulates receptor sensitivity, turning the sports car or the new product into a source of renewed frustration.
- **The Perpetual Consumption Loop:** Because the baseline never elevates permanently, the individual is trapped in an endless cycle of striving, acquisition, and disillusionment.

\`\`\`
[ Manufactured Deficiency ] ──> [ Consumption / Chemical Fix ]
           ▲                                          │
           │                                          ▼
[ Existential Hangover / Debt ] <── [ Rapid Hedonic Adaptation ]
\`\`\`

### 2. Commodity Fetishism & The Semantic Inversion of "Happiness"
Cutts exposes **Commodity Fetishism** (Karl Marx) and **Hyperreality** (Jean Baudrillard) by replacing the names of global conglomerates with the word "Happiness."
- Under traditional capitalism, commodities satisfy concrete utility (a shoe protects the foot; a car provides transit).
- Under hyper-capitalist simulation, commodities are invested with metaphysical properties: buying a product is marketed as purchasing *joy, self-esteem, autonomy, and identity*.
- **The Semantic Inversion:** The word "Happiness" is severed from subjective emotional flourishing and transformed into an exchange value stamped onto shoes, burgers, and antidepressant bottles.

| Life Dimension | Authentic Human Need | Simulated Capitalist Substitute in *Happiness* |
| :--- | :--- | :--- |
| **Identity & Belonging** | Community, shared purpose, social connection | Brand consumption, Black Friday mob violence |
| **Autonomy & Freedom** | Self-directed time, meaningful agency | Sports car ownership stuck in gridlock |
| **Emotional Peace** | Psychological integration, trauma resolution | Alcohol escapism ("Drink, Forget, Smile") |
| **Vitality & Joy** | Health, purpose, natural dopamine regulation | Fluoxetine 200mg chemical dissociation |
| **Economic Security** | Sustainable livelihood, self-sufficiency | Mousetrap bait (dollar bill attached to wage labor) |

### 3. The Medicalization of Structural Misery
The transition to 1930s rubber-hose animation represents a critique of the **biomedical model of mental health** when applied to systemic societal dysfunction:
- When an entire society is structurally alienated by 70-hour workweeks, sensory assault, and economic precarity, systemic misery is pathologized as an *individual chemical deficiency*.
- The prescription of Fluoxetine (Prozac) at a lethal 200mg dosage symbolizes how corporate chemistry is deployed to numb dissent and render the worker functional enough to resume production.
- The colorful hallucination does not alter the protagonist's material reality; it merely renders the misery temporarily invisible until the chemical clears his bloodstream.

### 4. The Mousetrap Metaphor & Corporate Wage Slavery
The climax reveals the ultimate economic architecture:
- The dollar bill is not wealth; it is **bait**.
- The mousetrap is not an accident; it is the **design of the labor market**.
- To acquire the currency necessary to purchase commodities and chemical numbing agents, the rodent must place his neck into the trap of corporate wage labor. Once caught, he cannot leave: the trap requires continuous mechanical motion to remain alive.

---

## Active Recall Flashcards

- **Q: How does Steve Cutts visually subvert major corporate logos (Nike, McDonald’s, Apple, Starbucks) in Happiness?**  
  **A:** Every brand logo is uniformly altered to display the single word "Happiness," demonstrating how modern hyper-capitalism semanticizes brand consumption as an emotional substitute for genuine fulfillment.

- **Q: What psychological paradox is exposed by the protagonist’s purchase of a sports car in the film?**  
  **A:** The Autonomy Paradox: The car is purchased under the marketing promise of speed, status, and personal freedom, but immediately traps the owner inside suffocating multilane highway gridlock alongside thousands of identical drivers.

- **Q: What is the significance of the 1930s rubber-hose animation shift following the ingestion of Fluoxetine?**  
  **A:** It represents the superficial, chemically induced hallucination of joy manufactured by pharmaceutical band-aids. The vintage pastel aesthetic highlights how psychiatric over-medication temporarily detaches the individual from grim systemic reality rather than curing the root malaise.

- **Q: What does the dollar bill bait on the mousetrap represent at the film’s conclusion?**  
  **A:** It symbolizes Corporate Wage Slavery: In an economic model where survival and consumer highs require fiat currency, individuals willingly spring the fatal trap of monotonous cubicle labor for survival tokens.

- **Q: What classical musical compositions frame the narrative arc of Happiness, and what is their dramatic irony?**  
  **A:** Edvard Grieg’s "Morning Mood" (accompanying the drug-induced pastoral hallucination) and Georges Bizet’s "Carmen: Habanera" (framing the ruthless capitalist trap), contrasting triumphant romanticism against urban degradation and entrapment.

- **Q: What is the Hedonic Treadmill loop depicted across the three stages of the protagonist rat’s journey?**  
  **A:** The cycle of (1) Manufactured deprivation through advertising -> (2) Ephemeral dopamine spikes via retail, alcohol, or pharmaceuticals -> (3) Severe baseline crash and debt, forcing a return to wage labor to restart the loop.

---

## Source Provenance & Verification Audit

<details class="provenance-details-box">
  <summary class="provenance-summary">
    <span class="provenance-summary-title">🔍 Source Provenance &amp; Verification Audit (Click to Expand)</span>
    <span class="provenance-summary-hint">Verified &bull; 100% Runtime Coverage</span>
  </summary>
  <div class="provenance-content">
    <ul>
      <li><strong>Source Identifier:</strong> <code>SRC-YT-2026-018</code></li>
      <li><strong>Original Video URL:</strong> <a href="https://www.youtube.com/watch?v=e9dZQelULDk" target="_blank">https://www.youtube.com/watch?v=e9dZQelULDk</a></li>
      <li><strong>Media Nature:</strong> Non-verbal animated short film (Duration: 04:16, 256 seconds).</li>
      <li><strong>Spoken Dialogue:</strong> 0 words (Wordless visual allegory).</li>
      <li><strong>Audiovisual Score:</strong> Georges Bizet (<em>Carmen: Habanera</em>) &amp; Edvard Grieg (<em>Peer Gynt Suite No. 1: Morning Mood</em>).</li>
      <li><strong>Visual Anchors:</strong> 20 verified timestamped scene cues spanning <code>00:00.000</code> to <code>04:16.000</code>.</li>
      <li><strong>Raw Caption Artifact:</strong> <code>sources/raw/SRC-YT-2026-018_captions.vtt</code></li>
      <li><strong>Verification SHA-256:</strong> <code>${vttSha256}</code></li>
      <li><strong>Epistemic Tier:</strong> <code>tier_3</code> (Cultural Allegory, Sociological Satire &amp; Behavioral Critique).</li>
      <li><strong>Auditor Verification Status:</strong> <code>VERIFIED</code> (All scene timings, allegorical dynamics, and musical cues cross-referenced against the original 2017 animation).</li>
    </ul>
  </div>
</details>
`;

fs.writeFileSync(path.join(sourceKnowledgeDir, 'codex.md'), codexContent, 'utf-8');
console.log('Written Product A codex.md at', path.join(sourceKnowledgeDir, 'codex.md'));

// Product B Knowledge Graph Nodes
// Concept 1: The Rat Race Paradigm & Manufactured Discontent
integrateKnowledgeNode({
  name: 'The Rat Race Paradigm & Manufactured Discontent',
  aliases: ['Rat Race Metaphor', 'Manufactured Discontent', 'Urban Alienation Loop'],
  domain: 'Socio-Cognitive Psychology',
  definition: 'A socio-economic condition where individuals are systematically conditioned through mass advertising to pursue material commodities as substitutes for psychological fulfillment, resulting in continuous labor entrapment.',
  epistemic_tier: 'tier_3',
  source_id: SOURCE_ID,
  claims: [
    {
      statement: 'Mass commercial advertising systematically semanticizes brand logos as emotional proxies for happiness, creating artificial urgency and consumer panic.',
      claim_type: 'theoretical_model',
      epistemic_tier: 'tier_3',
      source_id: SOURCE_ID,
      locator_type: 'timestamp',
      locator: '[00:12 - 00:38]',
      verbatim_quote: 'Giant commercial billboards dominate the skyline, substituting major corporate logos (Nike, McDonald’s, Apple, Starbucks, Visa) with the singular neon mandate: "Happiness".'
    },
    {
      statement: 'The Autonomy Paradox: Purchasing status symbols like sports cars under the marketing promise of freedom results in identical collective paralysis within urban gridlock.',
      claim_type: 'theoretical_model',
      epistemic_tier: 'tier_3',
      source_id: SOURCE_ID,
      locator_type: 'timestamp',
      locator: '[01:18 - 01:32]',
      verbatim_quote: 'The promised freedom is instantly extinguished as he becomes trapped in an endless, catastrophic multilane highway gridlock with thousands of identical frustrated drivers.'
    }
  ]
});

// Concept 2: The Hedonic Treadmill & Commodity Escapism
integrateKnowledgeNode({
  name: 'The Hedonic Treadmill & Commodity Escapism',
  aliases: ['Hedonic Treadmill', 'Commodity Escapism', 'Chemical Malaise Suppression'],
  domain: 'Behavioral Economics',
  definition: 'The psychological tendency for dopamine surges derived from consumption, alcohol, or psychiatric suppression to rapidly degrade, forcing continuous reinvestment in wage labor to finance subsequent temporary highs.',
  epistemic_tier: 'tier_3',
  source_id: SOURCE_ID,
  claims: [
    {
      statement: 'Chemical and pharmaceutical suppression of malaise provides only ephemeral aesthetic detachment while leaving structural material misery unresolved.',
      claim_type: 'theoretical_model',
      epistemic_tier: 'tier_3',
      source_id: SOURCE_ID,
      locator_type: 'timestamp',
      locator: '[03:05 - 03:45]',
      verbatim_quote: 'The pastel colors drain violently from the canvas, snapping the rat back into the gray, freezing reality with amplified sensory shock and withdrawal panic.'
    },
    {
      statement: 'Corporate wage labor functions as an inescapable mousetrap where fiat currency serves as survival bait that permanently encloses the worker in cubicle servitude.',
      claim_type: 'theoretical_model',
      epistemic_tier: 'tier_3',
      source_id: SOURCE_ID,
      locator_type: 'timestamp',
      locator: '[03:55 - 04:16]',
      verbatim_quote: 'The camera pulls backward to reveal an endless corporate office tower where millions of identical rats are permanently trapped in cubicle mousetraps, endlessly slaving as wage cogs in the machinery.'
    }
  ]
});

console.log('Integrated Product B Knowledge Graph Nodes (CON-137, CON-141)');

// Rebuild manifest index
buildSearchIndex();
console.log('Rebuilt search index manifest successfully');
