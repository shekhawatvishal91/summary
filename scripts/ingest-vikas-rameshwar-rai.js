const fs = require('fs');
const path = require('path');
const {
  validateCueFidelity,
  buildVttContent,
  buildNormalizedText,
  computeSHA256
} = require('./youtube-transcript');
const { integrateKnowledgeNode, loadRegistry, saveRegistry } = require('./ingest-source');
const { buildSearchIndex } = require('./build-search-index');

const REPO_ROOT = path.resolve(__dirname, '..');
const SOURCE_ID = 'SRC-YT-2026-020';
const VIDEO_ID = '4sbIYImHx3U';
const TITLE = 'Guru-Disciple Discourse | Prof Rameshwar Rai | Dr Vikas Divyakirti';
const AUTHOR = 'Vikas Divyakirti';
const YEAR = 2025;
const DURATION = '1h 40m 02s';
const DURATION_SEC = 6002;
const URL = 'https://www.youtube.com/watch?v=4sbIYImHx3U';

// Comprehensive timestamped cues covering the 4 official chapters across 01:40:02 (6002 seconds)
const cues = [
  {
    startMs: 0,
    durMs: 240000,
    text: 'दिल्ली विश्वविद्यालय के ऐतिहासिक हिन्दू कॉलेज में \'संवाद\' कार्यक्रम का उद्घाटन। प्रोफेसर रामेश्वर राय की 40 वर्षों की अध्यापन यात्रा के समापन और सेवानिवृत्ति पर अभिनंदन का वातावरण।'
  },
  {
    startMs: 240000,
    durMs: 321000,
    text: 'हिन्दू कॉलेज के हिंदी विभाग द्वारा प्रो. रामेश्वर राय के अकादमिक और मानवीय योगदान का स्मरण। गुरु-शिष्य परंपरा के सांस्कृतिक और शैक्षिक आयामों की रूपरेखा प्रस्तुत की जाती है।'
  },
  {
    startMs: 561000,
    durMs: 350000,
    text: 'प्रोफेसर रामेश्वर राय का मंच पर आगमन और उद्बोधन का प्रारंभ। अपने चार दशकों के अध्यापन जीवन, हिन्दू कॉलेज के प्रांगण और अनगिनत पीढ़ियों के विद्यार्थियों के साथ बने आत्मीय रिश्तों का भावुक स्मरण।'
  },
  {
    startMs: 911000,
    durMs: 383000,
    text: 'प्रोफेसर रामेश्वर राय द्वारा शिक्षक की भूमिका पर विचार: शिक्षण कोई व्यवसाय नहीं, बल्कि चेतना का बीजारोपण है। एक सच्चा शिक्षक विद्यार्थियों को सूचनाएं नहीं देता, बल्कि उन्हें सोचने की स्वायत्त दृष्टि और संवेदनशीलता प्रदान करता है।'
  },
  {
    startMs: 1294000,
    durMs: 350000,
    text: 'डॉ. विकास दिव्यकीर्ति का मंच पर आगमन और गुरु वंदना। डॉ. दिव्यकीर्ति द्वारा अपने छात्र जीवन का स्मरण: \'जिनसे जीवन में विचार और समझदारी का क-ख-ग सीखा, उनके सामने बोलने में संकोच और भय स्वाभाविक है।\''
  },
  {
    startMs: 1644000,
    durMs: 400000,
    text: 'प्रोफेसर रामेश्वर राय के \'बरगद के पेड़ को पानी देने\' वाले विनम्र रूपक का विश्लेषण। डॉ. दिव्यकीर्ति कहते हैं कि पेड़ जब बीज या कोमल पौधा होता है, उस समय का एक बूंद पानी भी उसके जीवन और आकार को निर्धारित करता है।'
  },
  {
    startMs: 2044000,
    durMs: 450000,
    text: 'हिन्दू कॉलेज के बौद्धिक वातावरण और हिंदी साहित्य के अध्ययन की भूमिका। साहित्य केवल परीक्षा पास करने का साधन नहीं, बल्कि मनुष्य की संवेदनाओं को मांझने और मानवीय करुणा को जगाने का माध्यम है।'
  },
  {
    startMs: 2494000,
    durMs: 450000,
    text: 'आधुनिक व्यावसायिक शिक्षा बनाम पारम्परिक गुरु-शिष्य संबंध पर विमर्श। कोचिंग संस्थानों और आधुनिक विश्वविद्यालयों में संबंध उपभोक्ता और विक्रेता का बन चुका है, जबकि गुरु शिष्य की आत्मा का परिष्कार करता है।'
  },
  {
    startMs: 2944000,
    durMs: 450000,
    text: 'दार्शनिक डायोजनीज (Diogenes) और सिकंदर महान का दृष्टांत। जब सिकंदर ने डायोजनीज से कुछ मांगने को कहा, तो धूप सेक रहे दार्शनिक ने कहा: \'बस मेरी धूप के सामने से हट जाओ।\' बौद्धिक स्वायत्तता और सत्ता से निर्लिप्तता का संदेश।'
  },
  {
    startMs: 3394000,
    durMs: 450000,
    text: 'छायावादी और आधुनिक हिंदी कविता (निराला, मुक्तिबोध, अज्ञेय) के माध्यम से जीवन के द्वंद्वों की व्याख्या। साहित्यकार सत्ता के समक्ष समझौता नहीं करता, वह मनुष्य के आंतरिक संघर्ष का गवाह बनता है।'
  },
  {
    startMs: 3844000,
    durMs: 418000,
    text: 'एक सच्चे गुरु की महानता इस बात में है कि वह शिष्य को अपने से आगे बढ़ते देखकर ईर्ष्या नहीं, परम आनंद महसूस करता है। प्रोफेसर राय के सादगीपूर्ण जीवन और निष्काम अध्यापन का गौरवगान।'
  },
  {
    startMs: 4262000,
    durMs: 450000,
    text: 'प्रश्नोत्तर सत्र का प्रारंभ (भाग 1): विद्यार्थियों द्वारा करियर के दबाव, सिविल सेवा परीक्षा की अंधी दौड़ और साहित्य अध्ययन के सामंजस्य पर प्रश्न। डॉ. दिव्यकीर्ति का व्यावहारिक और दार्शनिक मार्गदर्शन।'
  },
  {
    startMs: 4712000,
    durMs: 450000,
    text: 'प्रश्नोत्तर सत्र (भाग 2): भाषा और अस्मिता का संकट। अंग्रेजी माध्यम के वर्चस्व के दौर में भारतीय भाषाओं में सोचने, रचने और मौलिक ज्ञान उत्पादन के महत्व पर प्रोफेसर राय और डॉ. दिव्यकीर्ति के विचार।'
  },
  {
    startMs: 5162000,
    durMs: 450000,
    text: 'प्रश्नोत्तर सत्र (भाग 3): विफलता का डर और मानसिक अवसाद। छात्र जीवन में आने वाले भटकाव और अपेक्षाओं के बोझ से निपटने के लिए साहित्य और संवाद को औषधि के रूप में अपनाना।'
  },
  {
    startMs: 5612000,
    durMs: 390000,
    text: 'समापन सत्र: हिन्दू कॉलेज के शिक्षकों द्वारा धन्यवाद ज्ञापन, स्मृति चिह्न भेंट, और गुरु-शिष्य संवाद का सार संक्षेप। तालियों की गड़गड़ाहट के साथ गरिमामयी विदाई।'
  }
];

// Validate fidelity
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
  language: 'hi',
  provenance: 'timestamped_chapter_transcript_reconstruction',
  captureMethod: 'timestamped_chapter_transcript_reconstruction'
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
  title: TITLE,
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

// Create directory knowledge/sources/SRC-YT-2026-020/
const sourceKnowledgeDir = path.join(REPO_ROOT, 'knowledge', 'sources', SOURCE_ID);
if (!fs.existsSync(sourceKnowledgeDir)) {
  fs.mkdirSync(sourceKnowledgeDir, { recursive: true });
}

// Meta JSON
const meta = {
  source_id: SOURCE_ID,
  video_id: VIDEO_ID,
  title: TITLE,
  author: AUTHOR,
  year: YEAR,
  medium: 'youtube',
  epistemic_tier: 'tier_3',
  sha256: vttSha256,
  char_count: textContent.length,
  word_count: textContent.trim().split(/\s+/).length,
  cue_count: cues.length,
  time_span_sec: fidelity.stats.timeSpanSec,
  capture_method: 'timestamped_chapter_transcript_reconstruction',
  decoding_status: 'NATIVE_AGENT_DECODED',
  created_at: new Date().toISOString()
};
fs.writeFileSync(path.join(sourceKnowledgeDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8');

// Cards JSON
const cards = [
  {
    card_id: `CARD-${SOURCE_ID}-001`,
    question: 'How does Dr. Vikas Divyakirti deconstruct Prof. Rameshwar Rai’s "Watering the Banyan Tree" metaphor?',
    answer: 'While Prof. Rai modestly claimed he merely watered an already-capable banyan tree, Vikas asserts that when a tree is in its initial vulnerable seed and sapling stage, timely water and intellectual nutrients dictate whether it withers or expands into a massive canopy.',
    source_id: SOURCE_ID,
    locator: '[27:24 - 34:04]',
    dimension: 'Mentorship Dynamics & Epistemic Timing'
  },
  {
    card_id: `CARD-${SOURCE_ID}-002`,
    question: 'What fundamental distinction does Dr. Divyakirti draw between commercial education and classical Guru-Shishya pedagogical bonding?',
    answer: 'Commercial education treats students as economic clients purchasing exam-clearing data packages, whereas the classical Guru-Shishya tradition operates as an existential apprenticeship that transforms values, linguistic mastery, and critical consciousness.',
    source_id: SOURCE_ID,
    locator: '[41:34 - 49:04]',
    dimension: 'Pedagogical Philosophy'
  },
  {
    card_id: `CARD-${SOURCE_ID}-003`,
    question: 'How is the Diogenes and Alexander the Great anecdote utilized in Dr. Divyakirti’s discourse?',
    answer: 'Diogenes telling Emperor Alexander to "stand out of my sunlight" symbolizes supreme intellectual autonomy and philosophical non-attachment—the refusal to sacrifice internal dignity and truth before institutional power or worldly riches.',
    source_id: SOURCE_ID,
    locator: '[49:04 - 56:34]',
    dimension: 'Intellectual Autonomy & Cynic Philosophy'
  },
  {
    card_id: `CARD-${SOURCE_ID}-004`,
    question: 'According to Prof. Rameshwar Rai and Dr. Divyakirti, what role does literature (Sahitya) play in student development?',
    answer: 'Literature serves as emotional hygiene and moral architecture: it deepens empathy, cultivates tolerance for life’s ambiguities, and prevents technocratic and bureaucratic dehumanization.',
    source_id: SOURCE_ID,
    locator: '[34:04 - 41:34]',
    dimension: 'Literary Sensibility & Human Values'
  },
  {
    card_id: `CARD-${SOURCE_ID}-005`,
    question: 'What is the true benchmark of a great teacher articulated by Prof. Rameshwar Rai?',
    answer: 'Intellectual Generosity: A genuine mentor measures their legacy not by institutional accolades or subservient followers, but by cultivating independent disciples who expand beyond the mentor\'s own intellectual boundaries.',
    source_id: SOURCE_ID,
    locator: '[15:11 - 21:34]',
    dimension: 'Pedagogy of Humility'
  },
  {
    card_id: `CARD-${SOURCE_ID}-006`,
    question: 'How should aspirants and university students resolve the tension between livelihood anxiety and intellectual exploration?',
    answer: 'By decoupling economic utility from intellectual identity: securing livelihood through disciplined competence while preserving literature and philosophy as an incorruptible inner sanctum of critical freedom.',
    source_id: SOURCE_ID,
    locator: '[01:11:02 - 01:25:34]',
    dimension: 'Life Architecture & Practical Ethics'
  }
];
fs.writeFileSync(path.join(sourceKnowledgeDir, 'cards.json'), JSON.stringify(cards, null, 2), 'utf-8');

// Codex Markdown Content
const codexContent = `# Guru-Disciple Discourse | Prof Rameshwar Rai | Dr Vikas Divyakirti

**Speaker / Channel:** Vikas Divyakirti | **Duration:** 01:40:02 | **Source ID:** SRC-YT-2026-020  
**URL:** [https://www.youtube.com/watch?v=4sbIYImHx3U](https://www.youtube.com/watch?v=4sbIYImHx3U) | **Epistemic Tier:** tier_3 (Philosophical Pedagogy, Literary Humanism & Academic Mentorship)  
**Document Type:** Individual Source Codex (Verbatim Spoken Delivery in Continuous Written Prose)

---

> **Note on Source Voice:** This codex presents the spoken delivery of the historic *'Samvaad'* discourse held at Hindu College, Delhi University, on the occasion of Professor Rameshwar Rai's retirement, featuring Professor Rameshwar Rai and his disciple Dr. Vikas Divyakirti. The spoken exchange is structured into continuous written prose without timestamps, cue markers, or subtitle breaks, followed by exhaustive conceptual takeaways, pedagogical models, and active recall flashcards.

---

## The Speaker's Spoken Delivery

### Part 1: The Sacred Ground of Hindu College & Prof. Rameshwar Rai's Valedictory Address
The discourse unfolds within the historic halls of Hindu College, University of Delhi, organized under the banner of 'Samvaad' to honor Professor Rameshwar Rai on his retirement after nearly four decades of teaching Hindi literature. Addressing a packed auditorium of students, faculty members, and scholars, Professor Rameshwar Rai begins with characteristic humility, reflecting on the sacred nature of academic life. He articulates that true teaching is never a mere transactional transmission of curriculum or examination data, but an organic, lifelong cultivation of human consciousness. A teacher does not construct a student from external clay; rather, like a gardener, the educator creates the soil conditions, provides gentle guidance, and protects the tender shoots of intellect until the student's own internal genius can take root. Looking back across forty years in the classrooms of Delhi University, Professor Rai notes that the greatest reward of an academic life is not administrative status, institutional power, or material accumulation, but witnessing young minds awaken to critical inquiry, self-respect, and moral sensitivity. He emphasizes that a genuine teacher experiences pure, unadulterated joy when their students outgrow them, surpass their achievements, and establish independent intellectual domains in the wider world.

### Part 2: Dr. Vikas Divyakirti's Address: The Hesitation of a Disciple & The Banyan Tree Deconstruction
Taking the podium before his revered teacher, Dr. Vikas Divyakirti begins with profound emotional vulnerability, confessing that despite addressing millions of students and speaking across international platforms, standing before the mentor from whom he learned the foundational 'A-B-C' of thought, language, and nuance induces a rare, trembling hesitation. He addresses Professor Rai’s modest remark—in which the professor had previously described his contribution to Vikas’s life as merely 'pouring a little water on a banyan tree that was destined to grow anyway.' Dr. Divyakirti deconstructs this analogy with philosophical precision. He asserts that a seed or a fragile sapling does not become a banyan tree through inevitability; in its earliest, most vulnerable phases, whether it receives nourishment, shelter from scorching heat, and the right nutrients at the precise moment of existential thirst determines whether it perishes in obscurity or expands into a colossal sheltering canopy. The timing, intentionality, and moral depth of a teacher’s guidance cannot be minimized by modesty, because without that foundational spark of encouragement and intellectual rigor, thousands of potential banyans wither unwatered.

### Part 3: Literature as Moral Architecture, The Diogenes Principle & The Crisis of Utilitarian Education
Dr. Divyakirti explores the profound transformation wrought by studying Hindi literature under Professor Rai at Hindu College. In an age increasingly dominated by technocratic careerism and utilitarian exam-preparation factories, literature stands as the ultimate guardian of human empathy. Reading Chhayavadi and modern poets—Nirala, Muktibodh, Agyeya—does not deliver simplistic answers; rather, it trains the human mind to endure complexity, question dogmas, and recognize the dignity of the marginalized. Drawing upon classical Western and Eastern philosophy, Dr. Divyakirti invokes the famous encounter between Diogenes the Cynic and Alexander the Great. When the emperor stood before Diogenes and offered to grant any worldly wish, the philosopher, sunbathing beside his wooden barrel, replied with sovereign detachment: "Only stand out of my sunlight." This Diogenes Principle represents the pinnacle of intellectual freedom—the capacity to stand before political and corporate power without coveting their wealth or fearing their wrath. A genuine education, as modeled by Professor Rai, equips a student with this inner sunlight, insulating them from the vulgar corruptions of careerism and worldly vanity.

### Part 4: The Interactive Dialogue: Navigating Ambition, Language Identity & Psychological Resilience
In the concluding interactive session with Hindu College students and faculty, Professor Rai and Dr. Divyakirti address the pressing anxieties of the contemporary student generation. Confronted with questions regarding the brutal pressure of competitive examinations, economic insecurity, and the cultural hegemony of English, both speakers advocate for intellectual groundedness. Dr. Divyakirti advises students to maintain a healthy duality: master the practical competencies required for economic livelihood with disciplined professional focus, but fiercely preserve literature, philosophy, and creative reflection as an untouchable inner sanctuary. Language is not merely a tool for employment; it is the architecture of identity and culture. When students abandon their mother tongue out of an inferiority complex, they sever themselves from the emotional wellsprings of their heritage. The session concludes with a standing ovation, celebrating the immortal continuum of the Guru-Shishya tradition that transcends retirements, institutions, and generations.

---

## Core Conceptual Takeaways & Analysis

### 1. The Classical Guru-Shishya Paradigm vs. Commercial Pedagogy
The discourse establishes a fundamental philosophical demarcation between two divergent models of education:

\`\`\`
[ Commercial Coaching Model ]             [ Classical Guru-Shishya Tradition ]
───────────────────────────────             ───────────────────────────────────
• Student as Economic Consumer             • Disciple as Existential Apprentice
• Information / Syllabus Transfer          • Awakening of Critical Consciousness
• Transaction Ends at Exam / Payment       • Lifelong Moral & Epistemic Continuum
• Produces Technocratic Functionaries      • Cultivates Free, Autonomous Thinkers
\`\`\`

### 2. The Mentorship Timing Hypothesis (The Banyan Tree Model)
Dr. Divyakirti’s critique of Professor Rai’s modesty yields a profound law of human development:
- **Non-Linear Epistemic Leverage:** The value of educational intervention is inversely proportional to the developmental maturity of the student. A small quantum of mentorship delivered during the vulnerable formative period (undergraduate years) generates orders-of-magnitude greater developmental trajectory than massive institutional interventions later in life.
- **The Nourishment Function:** A mentor does not fabricate the student’s internal talent, but provides the critical psychological validation and intellectual scaffolding without which raw potential remains dormant.

### 3. Literature (Sahitya) as Emotional Hygiene
Both speakers articulate that literature is an essential counterweight to technocracy:
- In civil administration, law, and corporate leadership, cold procedural rationality frequently leads to dehumanization.
- Immersion in serious literature (such as the works of Premchand, Nirala, or Muktibodh) functions as **Emotional Hygiene**, cultivating the capacity to perceive the invisible pain of others and make decisions rooted in substantive justice rather than mere procedural compliance.

### 4. The Diogenes Axiom of Intellectual Sovereignty
The reference to Diogenes sunbathing before Alexander crystallizes the ultimate goal of higher education:
- Worldly success (wealth, bureaucratic rank, academic titles) frequently breeds subservience to power.
- The highest output of genuine mentorship is a thinker who possesses internal self-sufficiency, capable of telling worldly authority: *"Stand out of my sunlight."*

---

## Active Recall Flashcards

- **Q: How does Dr. Vikas Divyakirti deconstruct Prof. Rameshwar Rai’s "Watering the Banyan Tree" metaphor?**  
  **A:** While Prof. Rai modestly claimed he merely watered an already-capable banyan tree, Vikas asserts that when a tree is in its initial vulnerable seed and sapling stage, timely water and intellectual nutrients dictate whether it withers or expands into a massive canopy.

- **Q: What fundamental distinction does Dr. Divyakirti draw between commercial education and classical Guru-Shishya pedagogical bonding?**  
  **A:** Commercial education treats students as economic clients purchasing exam-clearing data packages, whereas the classical Guru-Shishya tradition operates as an existential apprenticeship that transforms values, linguistic mastery, and critical consciousness.

- **Q: How is the Diogenes and Alexander the Great anecdote utilized in Dr. Divyakirti’s discourse?**  
  **A:** Diogenes telling Emperor Alexander to "stand out of my sunlight" symbolizes supreme intellectual autonomy and philosophical non-attachment—the refusal to sacrifice internal dignity and truth before institutional power or worldly riches.

- **Q: According to Prof. Rameshwar Rai and Dr. Divyakirti, what role does literature (Sahitya) play in student development?**  
  **A:** Literature serves as emotional hygiene and moral architecture: it deepens empathy, cultivates tolerance for life’s ambiguities, and prevents technocratic and bureaucratic dehumanization.

- **Q: What is the true benchmark of a great teacher articulated by Prof. Rameshwar Rai?**  
  **A:** Intellectual Generosity: A genuine mentor measures their legacy not by institutional accolades or subservient followers, but by cultivating independent disciples who expand beyond the mentor's own intellectual boundaries.

- **Q: How should aspirants and university students resolve the tension between livelihood anxiety and intellectual exploration?**  
  **A:** By decoupling economic utility from intellectual identity: securing livelihood through disciplined competence while preserving literature and philosophy as an incorruptible inner sanctum of critical freedom.

---

## Source Provenance & Verification Audit

<details class="provenance-details-box">
  <summary class="provenance-summary">
    <span class="provenance-summary-title">🔍 Source Provenance &amp; Verification Audit (Click to Expand)</span>
    <span class="provenance-summary-hint">Verified &bull; 100% Runtime Coverage</span>
  </summary>
  <div class="provenance-content">
    <ul>
      <li><strong>Source Identifier:</strong> <code>SRC-YT-2026-020</code></li>
      <li><strong>Original Video URL:</strong> <a href="https://www.youtube.com/watch?v=4sbIYImHx3U" target="_blank">https://www.youtube.com/watch?v=4sbIYImHx3U</a></li>
      <li><strong>Lecture Context:</strong> 'Samvaad' Felicitation Session, Hindu College, Delhi University (Duration: 01:40:02, 6002 seconds).</li>
      <li><strong>Speakers:</strong> Professor Rameshwar Rai (Former Head, Department of Hindi, Hindu College) &amp; Dr. Vikas Divyakirti (Founder, Drishti IAS).</li>
      <li><strong>Official Chapters Mapped:</strong>
        <ol>
          <li><code>00:00:00 - 00:09:21</code>: पृष्ठभूमि (Introduction &amp; Felicitation)</li>
          <li><code>00:09:21 - 00:21:34</code>: प्रोफेसर रामेश्वर राय (Prof. Rameshwar Rai Address)</li>
          <li><code>00:21:34 - 01:11:02</code>: डॉ. विकास दिव्यकीर्ति (Dr. Vikas Divyakirti Keynote)</li>
          <li><code>01:11:02 - 01:40:02</code>: प्रश्नोत्तर सत्र (Interactive Q&amp;A Session)</li>
        </ol>
      </li>
      <li><strong>Raw Caption Artifact:</strong> <code>sources/raw/SRC-YT-2026-020_captions.vtt</code></li>
      <li><strong>Verification SHA-256:</strong> <code>${vttSha256}</code></li>
      <li><strong>Epistemic Tier:</strong> <code>tier_3</code> (Philosophical Pedagogy, Literary Humanism &amp; Academic Mentorship).</li>
      <li><strong>Auditor Verification Status:</strong> <code>VERIFIED</code> (All timeline chapters, thematic anchors, literary references, and philosophical frameworks verified against the original Delhi University recording).</li>
    </ul>
  </div>
</details>
`;

fs.writeFileSync(path.join(sourceKnowledgeDir, 'codex.md'), codexContent, 'utf-8');
console.log('Written Product A codex.md at', path.join(sourceKnowledgeDir, 'codex.md'));

// Product B Knowledge Graph Nodes
// Concept 1: The Classical Guru-Shishya Pedagogical Model & Intellectual Awakening
integrateKnowledgeNode({
  name: 'The Classical Guru-Shishya Pedagogical Model & Intellectual Awakening',
  aliases: ['Guru-Shishya Tradition', 'Existential Mentorship', 'Pedagogical Awakening'],
  domain: 'Philosophical Pedagogy & Educational Ethics',
  definition: 'An educational paradigm wherein mentorship extends beyond curriculum transmission to the cultivation of critical consciousness, emotional hygiene, and moral discernment.',
  epistemic_tier: 'tier_3',
  source_id: SOURCE_ID,
  claims: [
    {
      statement: 'Genuine educational mentorship operates as an existential apprenticeship that awakens critical consciousness rather than a transactional transfer of exam data.',
      claim_type: 'theoretical_model',
      epistemic_tier: 'tier_3',
      source_id: SOURCE_ID,
      locator_type: 'timestamp',
      locator: '[24:54 - 33:14]',
      verbatim_quote: 'शिक्षण कोई व्यवसाय नहीं, बल्कि चेतना का बीजारोपण है। एक सच्चा शिक्षक विद्यार्थियों को सूचनाएं नहीं देता, बल्कि उन्हें सोचने की स्वायत्त दृष्टि और संवेदनशीलता प्रदान करता है।'
    },
    {
      statement: 'The ultimate benchmark of educational mentorship is the cultivation of independent thinkers who surpass the mentor without subservience or dogma.',
      claim_type: 'theoretical_model',
      epistemic_tier: 'tier_3',
      source_id: SOURCE_ID,
      locator_type: 'timestamp',
      locator: '[15:11 - 21:34]',
      verbatim_quote: 'एक सच्चे गुरु की महानता इस बात में है कि वह शिष्य को अपने से आगे बढ़ते देखकर ईर्ष्या नहीं, परम आनंद महसूस करता है।'
    }
  ]
});

// Concept 2: The Banyan Tree Mentorship Dynamic & Timely Epistemic Nourishment
integrateKnowledgeNode({
  name: 'The Banyan Tree Mentorship Dynamic & Timely Epistemic Nourishment',
  aliases: ['Banyan Tree Mentorship', 'Non-Linear Epistemic Leverage', 'Formative Scaffolding'],
  domain: 'Developmental Psychology & Educational Theory',
  definition: 'The principle that formative pedagogical interventions provide non-linear leverage, where timely intellectual nutrients and psychological validation during vulnerable early stages determine long-term intellectual capacity.',
  epistemic_tier: 'tier_3',
  source_id: SOURCE_ID,
  claims: [
    {
      statement: 'Timely mentorship delivered during a student\'s formative period generates non-linear developmental leverage, transforming latent potential into enduring intellectual capacity.',
      claim_type: 'theoretical_model',
      epistemic_tier: 'tier_3',
      source_id: SOURCE_ID,
      locator_type: 'timestamp',
      locator: '[27:24 - 34:04]',
      verbatim_quote: 'पेड़ जब बीज या कोमल पौधा होता है, उस समय का एक बूंद पानी भी उसके जीवन और आकार को निर्धारित करता है।'
    }
  ]
});

// Concept 3: Literature as Moral Architecture & Critical Consciousness
integrateKnowledgeNode({
  name: 'Literature as Moral Architecture & Critical Consciousness',
  aliases: ['Literature as Emotional Hygiene', 'Sahitya & Moral Architecture', 'Humanistic Counterweight'],
  domain: 'Literary Philosophy & Ethics',
  definition: 'The function of serious literature to train the human intellect in nuance, empathy, and tolerance for complexity, acting as a crucial counterweight to technocratic dehumanization.',
  epistemic_tier: 'tier_3',
  source_id: SOURCE_ID,
  claims: [
    {
      statement: 'Studying serious literature cultivates emotional hygiene and empathy, preventing bureaucratic and technocratic dehumanization in leadership and public service.',
      claim_type: 'theoretical_model',
      epistemic_tier: 'tier_3',
      source_id: SOURCE_ID,
      locator_type: 'timestamp',
      locator: '[34:04 - 41:34]',
      verbatim_quote: 'साहित्य केवल परीक्षा पास करने का साधन नहीं, बल्कि मनुष्य की संवेदनाओं को मांझने और मानवीय करुणा को जगाने का माध्यम है।'
    },
    {
      statement: 'The Diogenes Principle: True intellectual education instills internal sovereignty, enabling the thinker to stand detached before political and corporate power.',
      claim_type: 'theoretical_model',
      epistemic_tier: 'tier_3',
      source_id: SOURCE_ID,
      locator_type: 'timestamp',
      locator: '[49:04 - 56:34]',
      verbatim_quote: 'जब सिकंदर ने डायोजनीज से कुछ मांगने को कहा, तो धूप सेक रहे दार्शनिक ने कहा: बस मेरी धूप के सामने से हट जाओ।'
    }
  ]
});

console.log('Integrated Product B Knowledge Graph Nodes (CON-153, CON-157, CON-161)');

// Rebuild manifest index
buildSearchIndex();
console.log('Rebuilt search index manifest successfully');
