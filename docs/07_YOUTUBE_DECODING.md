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

The generated codex in `knowledge/sources/{source-id}/codex.md` must follow this structure:

```markdown
# [LECTURE_TITLE]: Video Lecture Codex
**Speaker(s):** [Name(s)] | **Channel / Institution:** [Name]
**Duration:** [HH:MM:SS] | **URL:** [YouTube Link] | **Source ID:** [SRC-YT-YYYY-NNN]

---

## Executive Summary & Core Contribution
* (High-density summary of the lecture's core intellectual contribution).

---

## Speaker Perspective & Epistemic Stance
* (Speaker's clinical, industry, or academic background and potential biases).

---

## Chronological Analytical Reconstruction

### Section 1: [Topic Title] `[00:00 - 14:32]`
* **Core Argument:** ...
* **Key Evidence / Demonstration:** ...
* **Verbatim Statement:** > "Exact quote of critical definition." `[08:14]`
* **Slide / Code / Diagram Recreation:**
  (Mermaid diagram, table, or code block representing visual assets).

### Section 2: [Topic Title] `[14:33 - 32:10]`
...

---

## Audience Q&A & Edge Cases `[32:11 - End]`
* **Question 1:** [Audience question asked at 34:12]
  * **Answer & Nuance:** [Speaker's response, edge cases acknowledged].

---

## Key Takeaways & Applied Protocols
* (Actionable methodologies or mental models extracted from the lecture).
```

---

## 4. YouTube Timestamp Link Specification

All timestamp references in the web interface and markdown files must generate working query parameters linking directly into the video:

- Format: `[HH:MM:SS](https://www.youtube.com/watch?v={VIDEO_ID}&t={TOTAL_SECONDS}s)`
- Example: `[14:25](https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=865s)`
