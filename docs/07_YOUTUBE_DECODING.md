# 07 YOUTUBE DECODING PROTOCOL: TRANSCRIPT, TIMESTAMPS & VISUAL CONTENT

> **Document Type:** Media Decoding Specification  
> **Status:** RATIFIED & MANDATORY  
> **Target Scope:** Video Lectures, Technical Keynotes, Podcasts, Tutorials  

---

## 1. Prime Directives for Video Decoding

Video lectures present distinct challenges: conversational rambling, lack of formal page numbers, reliance on visual slides/whiteboards, and spontaneous audience Q&A.

The YouTube Decoding Engine guarantees:
1. **Millisecond-Accurate Timestamps:** Every claim is linked to a clickable video timestamp (`[MM:SS]` or `[HH:MM:SS]`).
2. **Slide & Diagram Reconstruction:** Information presented on slides, code editors, or whiteboards is transcribed into markdown tables, ascii/mermaid diagrams, or structured code blocks.
3. **Conversational De-Noising:** Filler words, conversational tangents, host banter, and commercial sponsorships are filtered out, while intellectual nuance and debate are preserved.
4. **Speaker Attribution:** In panel discussions or interviews, propositions are assigned to specific speakers.

---

## 2. Ingestion Pipeline for YouTube Sources

```
[ YouTube Video / URL ]
          │
          ▼
1. Fetch Metadata (Title, Channel, Upload Date, Duration, Description)
          │
          ▼
2. Fetch Transcript (Auto-generated or Human-verified subtitles)
          │
          ▼
3. Semantic Segmenting (Chunk transcript into coherent 2-5 min blocks)
          │
          ▼
4. Visual / Slide Extraction (Analyze key visual frames or speaker notes)
          │
          ▼
5. Product A Codex Generation (knowledge/sources/SRC-YT-XXXX/codex.md)
```

---

## 3. Product A Codex Structure for Video Materials

The generated codex in `knowledge/sources/{source-id}/codex.md` must follow this ratified unified structure:

```markdown
# [Video / Lecture Title]

**Speaker / Channel:** [Name] | **Duration:** [HH:MM:SS] | **Source ID:** [SRC-YT-YYYY-NNN]  
**URL:** [YouTube Link] | **Epistemic Tier:** [tier_X]  
**Document Type:** Individual Source Codex (Verbatim Spoken Delivery in Continuous Written Prose)

---

> **Note on Source Voice:** This codex presents the speaker's spoken delivery as delivered in the video audio, structured into continuous written prose without timestamps, cue markers, or subtitle breaks.

---

## The Speaker's Spoken Delivery

[Continuous, natural, high-fidelity prose capturing the complete spoken delivery of the speaker.
CRITICAL DEPTH INVARIANT: The length and depth of this section MUST be proportional to the source duration:
- Short videos (under 2 minutes): 150–400 words capturing every sentence and reverse-psychology premise.
- Medium videos (5–10 minutes): 1,000–2,000 words broken into logical thematic paragraphs capturing all examples, stories, and mechanisms.
- Long-form lectures (20–60+ minutes): 3,000–6,000+ words divided into structured Parts (e.g., Part 1: Phase Breakdown, Part 2: Cognitive Engines, Part 3: Protocols), thoroughly detailing every single mental model, script, field exercise, and physiological coping strategy. Superficial summaries that flatten a 50-minute lecture to look like a 1-minute video are strictly prohibited.]

---

## Core Conceptual Takeaways & Analysis

### 1. [Framework / Mechanism Name]
[Deep analytical deconstruction, psychological models, causal diagrams, mathematical equations, or comparative tables].

### 2. [Operational Protocols]
[Specific field rules, diagnostic taxonomies, or behavioral algorithms extracted from the lecture].

---

## Active Recall Flashcards

- **Q: [Targeted question testing core insight]?**  
  **A:** [Direct, rigorous answer].

---

## Source Provenance & Verification

- **Transcription Fidelity:** [Verbatim cue count and speech duration].
- **Verification Hash:** Verified against raw artifact in `sources/raw/{source-id}_captions.vtt`.
- **Epistemic Classification:** [Tier and rationale].
```

---

## 4. YouTube Timestamp Link Specification

All timestamp references in the web interface and markdown files must generate working query parameters linking directly into the video:

- Format: `[HH:MM:SS](https://www.youtube.com/watch?v={VIDEO_ID}&t={TOTAL_SECONDS}s)`
- Example: `[14:25](https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=865s)`
