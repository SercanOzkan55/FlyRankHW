# FlyRank Backend Internship — Final Track Package & Master Index (FL-10)

**Candidate**: Sercan Özkan  
**Portfolio**: [https://sercanozkan55.github.io/Portfolio/](https://sercanozkan55.github.io/Portfolio/)  
**GitHub Profile**: [https://github.com/SercanOzkan55](https://github.com/SercanOzkan55)  
**Verification / Badge**: [https://internship.flyrank.ai](https://internship.flyrank.ai)  

---

## 📑 1. Master Deliverables Index (Week 1 to Week 10)

Every assignment, homework, and capstone from the entire FlyRank Backend Track is indexed and directly accessible below:

| Week / Module | Deliverable Description | Repository / Link | Key Technologies |
|---|---|---|---|
| **Week 1 (W1)** | Smallest Possible Backend (JSON APIs & routing) | [`w1/`](./w1/) | Node.js, HTTP, REST |
| **Week 2 (A2)** | Task Service with Swappable In-Memory / Postgres Repo | [`a2/`](./a2/) & [`a2-database/`](../a2-database/) | Express, TypeScript, Postgres, Docker Compose |
| **Week 3 (W3)** | Identity Kit, Style System & Visual Identity | [`WEEK-03-DELIVERABLE.md`](./WEEK-03-DELIVERABLE.md) & [`identity-kit/`](./identity-kit/) | CSS Design System, Typography, SVG Branding |
| **Week 3 (W3)** | Curated Image Assets & Rejection Rationale | [`curated-images/`](./curated-images/) | Image Specs, Aspect Ratios, Visual Hierarchy |
| **Week 4 (A3)** | Rate-Limited & Robots.txt-Aware Web Scraper | [`a3/`](./a3/) & [`a3/NOTES.md`](./a3/NOTES.md) | Cheerio, Rate-Limiting, Data Pipelines |
| **Week 5 (A4)** | Supabase Auth, Protected Routes & Bearer Middleware | [`a4-auth/`](./a4-auth/) | Supabase Auth, JWT, OpenAPI / Swagger |
| **Week 9 (W9)** | Portfolio Hardening, Stress Tests & Security Audit | [`WEEK-09-DELIVERABLE.md`](../Portfolio/WEEK-09-DELIVERABLE.md) | XSS / Honeypot Defense, SEO Metadata |
| **Week 10 (W10)** | The Plan to Keep Building (Future Case Studies) | [`WEEK-10-DELIVERABLE.md`](./WEEK-10-DELIVERABLE.md) | Continuous Portfolio Workflow, Reminder Proof |
| **Capstone 1** | AI Image Understanding & Content Matching Engine | [GitHub Repo](https://github.com/SercanOzkan55/flyrank-capstone-image-relevance) | TypeScript, Vision Embeddings, Mismatch Guard, Vitest |
| **Capstone 2** | Multi-Platform Social Campaign Publisher (Social Studio) | [GitHub Repo](https://github.com/SercanOzkan55/flyrank-capstone-social-studio) | Idempotent Adapters, 429 Backoff, HMAC Webhooks, Durable Queue |
| **10x Capstone** | CV Analyzer Enterprise SaaS & Local Worker | [GitHub Repo](https://github.com/SercanOzkan55/CV-Analyzer) & [10x Doc](https://github.com/SercanOzkan55/CV-Analyzer/blob/main/My%2010x%20Solution%20-%20Sercan%20Ozkan.md) | Python, FastAPI, PostgreSQL, Redis, Celery, PySide6 |

---

## 🎓 2. Retrospective (Written for Week 1 Sercan)

*Word count: ~680 words*

### To the Sercan who opened Week 1:

When you sat down on Day 1 to write that tiny two-endpoint Node.js server in `w1/`, you thought backend engineering was mostly about stringing together endpoints, returning JSON objects, and calling third-party APIs. You assumed that if an API call returned a `200 OK`, your job was done.

Ten weeks, three full-scale capstones, and hundreds of test suites later, your entire mental model of software engineering has shifted. 

You learned that anyone can build for the "happy path." A junior engineer writes code that works when the network is flawless, the input is clean, and the server never restarts. A professional engineer designs for what happens when everything breaks: when duplicate network packets arrive, when third-party platforms throw `429 Too Many Requests`, when an unexpected crash happens right in the middle of a batch job, or when an AI model confidently hallucinates a wrong answer.

### What Changed in How I Work

1. **Defensive Boundary Architecture**: In Week 1, inputs flowed directly into functions. Today, nothing crosses an architectural boundary without schema validation (Zod / Pydantic), cryptographic verification (HMAC-SHA256 with `timingSafeEqual`), and token encryption at rest using AES-256-GCM with random IVs.
2. **Deterministic Guards Over Blind AI Faith**: When building the Capstone Image Relevance Engine, the biggest revelation was that AI embeddings alone are not enough for high-stakes decisions. Giving a system a strict **Mismatch Guard** (a hard boundary where taxonomy checks override raw vector similarity) is the difference between a toy demo and production software.
3. **Idempotency as a Non-Negotiable Core**: Learning to treat retries not as accidents, but as inevitable events. By attaching deterministic `Idempotency-Key` headers and database state locks (`draft → queued → publishing → published`), we proved that hammering an endpoint five times creates exactly one record, with zero duplicated side-effects.

### The 3 Most Transferable Lessons

1. **State Resilience Beats Code Cleverness**: Durable queues that record their state to disk before executing network calls will always beat complicated in-memory retry loops. If a worker dies, it should be able to wake up, look at the database, and continue seamlessly without double-posting or corrupting records.
2. **Honest Limitations Build Genuine Trust**: In the past, you might have tried to hide edge cases or pretend a system could handle infinite scale. Today, being upfront—documenting that an in-process cosine loop is optimal for 50 items but requires pgvector at 100k items—is what senior engineers and technical reviewers actually respect.
3. **AI as an Accelerator, Not a Substitute**: Using AI to scaffold boilerplate, explore design trade-offs, and draft test cases is 10x leverage; but taking full ownership, verifying every cryptographic primitive, and hardening the logic yourself is what makes you an engineer.

### What I Am Building Next

Building upon the real-time aerospace video streaming work from my Daşal Havacılık internship, my next major project is a distributed real-time telemetry and video pipeline (RTSP/RTP ingestion, WebRTC relay, and adaptive bitrate transcoding). The reliability, idempotency, and durable queuing principles mastered during this FlyRank track will form the foundation of that distributed architecture.

---

## 📢 3. Build-in-Public Post (LinkedIn / X Story)

```text
🚀 Milestone reached: Completed the FlyRank Backend Engineering Track & shipped my Capstones!

Over the past 10 weeks, I moved beyond standard CRUD apps to focus on what happens when production systems fail under real-world pressure:

💡 1 Key Design Decision:
In my Social Media Publisher Capstone, we implemented deterministic idempotency keys and state locking before touching any third-party network adapter. When network timeouts happen, retrying never creates duplicate posts or double-charges—the system returns the cached result with zero side effects.

⚠️ 1 Honest Limitation:
Our Capstone AI Mismatch Guard uses an in-process cosine similarity engine that executes in < 1ms across 50 corpus images. While 100% precise offline, scaling this to 500,000 images requires migrating the vector lookup to pgvector or Milvus. Acknowledging scale boundaries upfront is what engineering is all about.

🔗 Portfolio & Live Demos: https://sercanozkan55.github.io/Portfolio/
📦 GitHub Track Package: https://github.com/SercanOzkan55/FlyRankHW

Huge thanks to the FlyRank team and mentors for a challenging, production-focused curriculum! #SoftwareEngineering #Backend #SystemDesign #TypeScript #Python #FlyRank
```

---

## ✅ 4. Track Checklist & Verification Status

- [x] **Master Deliverables Index**: All assignments linked and organized above.
- [x] **500–800 Word Retrospective**: Written with specific, non-generic architectural reflections.
- [x] **Live Portfolio**: Live on GitHub Pages with dark mode, live telemetry HUD, interactive playground, and FlyRank badge.
- [x] **Transparency & AI Ownership**: Documented across all repositories with honest build logs.
- [x] **Build-in-Public Post**: Story drafted with 1 decision and 1 limitation ready to share.
