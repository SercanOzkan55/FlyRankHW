# Week 10 Deliverable — Keep Building: The Plan

**Submission by:** Sercan Özkan
**Reference:** https://aifluency.flyrank.ai/week-09.html#the-plan-to-keep-building

---

## 1. How to Add the Next Case Study (Concrete Steps)

The portfolio is a single Node script — `build-site.mjs` in `c:\Users\ASUS\Desktop\Deneme\Portfolio\`. Adding a new case study is exactly five steps:

### Step-by-step:
1. **Open `build-site.mjs`** and locate the `cases` array (near the top of the data section).
2. **Add a new entry** to `cases` following the three-beat structure (Week 2 shape):

```js
{
  slug: "my-new-project",        // becomes /work/my-new-project/
  title: "Project Title",
  tag:   "Backend · Python",
  year:  "2025",
  // --- Beat 1: The Problem ---
  problem: "One sentence on what was broken or missing.",
  // --- Beat 2: What I Did ---
  contribution: "What I specifically built or changed.",
  // --- Beat 3: What Came Of It ---
  outcome: "The measurable result or real impact.",
  // Supporting media & links
  img:     "my-project.webp",    // put the image in assets/images/
  demo:    "https://...",        // live demo or ""
  repo:    "https://github.com/...",
  tech:    ["Python", "FastAPI"],
  metrics: [
    { n: "42",      label: "endpoints built" },
    { n: "< 200ms", label: "p95 latency"     },
  ],
},
```

3. **Drop the cover image** into `Portfolio/assets/images/` as a `.webp` (ideally 1600 × 900 px).
4. **Run `node build-site.mjs`** — generates the new case-study page at `/work/my-new-project/` and links it into the Work index automatically.
5. **Commit and push:**

```
git add . ; git commit -m "feat: add [Project Name] case study" ; git push origin main
```

GitHub Pages deploys in ~60 seconds.

### Where the pages live after build:

| Route                     | File generated                                  |
|---------------------------|-------------------------------------------------|
| `/work/`                  | `Portfolio/work/index.html`                     |
| `/work/my-new-project/`   | `Portfolio/work/my-new-project/index.html`      |

That is the whole loop. No framework, no CMS, no new dependency.

---

## 2. Next Piece of Work I Will Add

**Project: Dasal Havacılık — Aerospace Video Streaming System**

> **Beat 1 — Problem:** Live UAV camera feeds were being dropped and delayed during long-range streaming sessions due to no adaptive buffering strategy.
>
> **Beat 2 — What I Did:** Built a real-time RTSP/RTP ingestion pipeline using FFmpeg and GStreamer; implemented adaptive bitrate selection based on network jitter metrics; containerised the stack with Docker for field deployment.
>
> **Beat 3 — What Came Of It:** Achieved stable 720p streaming at ranges up to 2 km with < 400ms glass-to-glass latency and zero frame-loss events during final integration tests.

This is real internship work. It is concrete, measurable, and shows a domain (aerospace + real-time systems) that none of the current six projects cover.

---

## 3. Reminder — Evidence

A recurring calendar reminder set for the **first Monday of every month at 10:00 Istanbul time (UTC+3)** with the note:

> "Add/update a case study in Portfolio. Open build-site.mjs. Three beats: Problem → Did → Came of it. Push."

**Specific next due date: Monday, 1 September 2026 at 10:00 Istanbul**

---

## 4. Claude Project Context Is Preserved

This conversation already holds:
- Sercan's full tech stack (Python, FastAPI, PostgreSQL, Redis, Celery, FFmpeg, GStreamer, Unity XR, RTSP/RTP).
- Tone and voice from all previous case study drafts.
- Portfolio architecture (one Node script, static pages, Cloudflare Worker for contact).
- FlyRank identity kit and Week 2 three-beat shape.

To add the next case, open a new message in this same project and say:
> "Write the Dasal Havacılık case study card and detail page content — three-beat format."

That is a 5-minute conversation, not a rebuild.

---

## Checklist

| Criterion                                        | Status                                       |
|--------------------------------------------------|----------------------------------------------|
| Concrete "how to add" note (not vague)           | Five numbered steps above                    |
| Specific next piece of work named                | Dasal Havacılık Streaming System             |
| Real reminder set with a date                    | Monthly Monday 10:00 — next: 1 Sep 2026     |
| Build context (Claude Project) preserved         | This conversation, full stack + voice saved  |
