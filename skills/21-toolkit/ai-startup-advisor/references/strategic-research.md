# Strategic Research Reference: AI Startup Landscape 2025–2026

This document provides detailed evidence, case studies, academic frameworks, and market data
supporting the evaluation frameworks in the main SKILL.md. Load this when deeper context is needed.

## Table of Contents

1. [The Foundation Model Squeeze — Evidence](#1-the-foundation-model-squeeze)
2. [Five Moat Types — Detailed Case Studies](#2-five-moat-types)
3. [Vertical AI Opportunities by Sector](#3-vertical-ai-by-sector)
4. [Infrastructure Plays — What Works and What Doesn't](#4-infrastructure-plays)
5. [Business Model Innovation](#5-business-model-innovation)
6. [Academic Frameworks](#6-academic-frameworks)
7. [Market Data and Funding Trends](#7-market-data)
8. [Anti-Patterns and Cautionary Tales](#8-anti-patterns)

---

## 1. The Foundation Model Squeeze

### The absorption dynamic

Foundation model companies are systematically expanding upward into the application layer:

- **OpenAI DevDay 2025**: Launched a full Apps SDK turning ChatGPT into an OS where Canva, Zillow,
  Spotify, and Figma run as native apps. Directly competes with middleware and wrapper startups.
- **Anthropic MCP**: Model Context Protocol standardizes AI-tool connectivity, reducing the need
  for integration middleware startups.
- **Google NotebookLM**: Reached 8M monthly active users on mobile, competing with document
  analysis startups.

Foundation Capital identifies the key asymmetry: model providers have a "panoramic view" of what
works across the ecosystem — they see which domains drive heavy API usage, which features deliver
results, and can rapidly absorb promising use cases.

### The wrapper epidemic

- Google/Accel India AI accelerator rejected 70% of 4,000+ applicants as wrappers; only 5 made the cut
- Chat-with-PDF tools died when OpenAI added built-in PDF parsing
- AI résumé builders evaporated when LinkedIn and Canva added the feature natively
- Jasper AI: raised $100M+, reached ~$90M ARR, then revised forecasts down 30%+ after ChatGPT
  launched a free competitor

### The counter-narrative: value IS moving to applications

- Enterprise AI spending hit $37B in 2025 (3.2x YoY)
- Startups earn roughly $2 for every $1 incumbents earn in AI applications
- Anthropic commands 40% of enterprise LLM spend (up from 12% in 2023); OpenAI fell to 27%
- As models commoditize, value shifts to applications with genuine domain depth

Foundation Capital's three waves:

- Wave 1 (2022): Wrappers — thin API integrations
- Wave 2 (2023–2024): AI-native products with custom data pipelines
- Wave 3 (2025+): Agentic learning systems with continuous adaptation via RL

---

## 2. Five Moat Types — Detailed Case Studies

### Moat 1: Proprietary Data Flywheel

**Tempus AI** — Clinical-molecular database

- 50x larger than the Cancer Genome Atlas
- Data from 7,000+ physicians, 65% of U.S. academic medical centers
- Every genomic test enriches the dataset (compounding advantage)
- Revenue: $1.59B in 2025 with 85% YoY growth
- Valuation: $8–10B

**CrowdStrike** — Security telemetry

- CEO describes Falcon as "a vertically integrated net data creator"
- Customer environments generate real-time security data that improves the platform
- The data flywheel gives structural advantage vs. AI agents entering security

**Principle**: The data doesn't need to be massive initially — it needs to be unique,
high-quality, and compounding. Every customer interaction should make the product better.

### Moat 2: Deep Workflow Integration

**Abridge** — Clinical documentation

- Valued at $5B+
- Integrates natively into Epic and major EHR systems
- Clinical notes generated directly in physician's existing workflow
- EHR integration costs: $120K–$800K+ for custom implementations
- Migrating away means retraining staff, rebuilding integrations, risking data loss

**Key metric**: Bessemer reports vertical AI companies with strong workflow integration
achieve customer retention rates 30–50% higher than horizontal counterparts.

### Moat 3: Regulatory / Compliance Barriers

**Harvey AI** — Legal AI

- Valued at $8B, 235+ enterprise customers
- Lawyers comprise 20% of workforce to validate outputs
- Legal tech funding hit all-time high of $2.4B in 2025

**FDA-cleared medical devices**: 950+ AI/ML-enabled devices authorized, each requiring
years of rigorous clinical validation.

**Healthcare AI funding**: In H1 2025, AI-enabled healthcare startups captured 62% of all
digital health VC funding at 83% average deal premium over non-AI startups.

### Moat 4: Counter-Positioning via Pricing

**Sierra AI** — Customer service agents

- Valued at $4.5B
- Charges only for successful outcomes: resolved conversations, saved cancellations, upsells
- Legacy SaaS companies charging per seat cannot copy this without cannibalization

**Intercom Fin** — $0.99 per successful resolution, quadrupled revenue YoY

**Klarna AI assistant** — 2.3M conversations in first month, equivalent to 700 FTE agents,
cut resolution time from 11 min to ~2 min, projected $40M profit improvement.

### Moat 5: Production Complexity

**Greenlite AI** — KYC/AML compliance

- Years building production-grade system
- Final 10% of performance required 10–100x work of a hackathon prototype

**Scale AI** — $100M Department of Defense agreement

- Requires security clearances, SCIF infrastructure
- Revenue: $760M, valuation: $29B

---

## 3. Vertical AI Opportunities by Sector

### Healthcare (strongest vertical thesis)

The $6T+ opportunity: traditional SaaS captures 1–5% of employee value via per-seat pricing.
Vertical AI captures 25–50% by automating high-value cognitive work, expanding from $450B
software industry to $11T labor market.

**Sub-verticals**:

- Ambient clinical documentation: $1B+ investment in 2025 (Abridge, Suki, Augmedix)
- Medical imaging/diagnostics: billion-dollar companies (Viz.ai, PathAI, Cleerly)
- Precision medicine: Tempus at $8–10B valuation
- Prior authorization automation
- Pathology quality assurance
- Clinical trial matching
- Revenue cycle management

**Key stat**: 6 of 11 AI unicorns born in Q1 2025 were healthcare companies.

### Biotech / Drug Discovery

- AI-native biotechs show 80–90% Phase 1 success rates vs. 40–65% industry average (BCG)
- Recursion Pharmaceuticals: 65 petabytes proprietary biological data, 2.2M samples/week
- Insilico Medicine: first end-to-end AI-designed drug in Phase 2, target-to-trials in 18 months
  at $150K vs. typical 4–6 years and millions

### Legal Tech

- Harvey AI: $100M+ ARR, 7,000+ lawyers, 53 countries
- EvenUp: proprietary settlement data with human-in-the-loop review
- Legal tech funding: all-time high $2.4B in 2025

### Financial Services / Insurance

- KYC/AML compliance (Greenlite AI)
- Insurance underwriting (Sixfold, Corgi Insurance)
- Fraud detection with proprietary transaction data

### Defense / Government

- $49B raised by defense tech startups in 2025
- FedRAMP, security clearances, SCIF create massive barriers
- Scale AI's $100M DoD contract as exemplar

### Construction / Industrial

- OSHA compliance automation
- Project management with domain-specific cost estimation
- Building permit and inspection workflows

---

## 4. Infrastructure Plays — What Works and What Doesn't

### High-conviction infrastructure (software layer)

These share a key trait: they require **vendor neutrality** that model providers cannot offer.

**AI Evaluation and Testing**

- Braintrust: $800M valuation (Feb 2026), serves Notion, Stripe, Vercel, Cloudflare
- No model provider can build this neutrally when they're the subject being evaluated
- Arize AI: $131M total raised
- Langfuse: acquired by ClickHouse (part of $15B valuation round)

**AI Security and Guardrails**

- California SB 243 and AB 489 took effect Jan 2026
- Only 4% of enterprises rate GenAI security confidence at highest level
- 15% have experienced security incidents
- Lakera acquired by Check Point (Q4 2025)
- Model providers incentivized NOT to build security that limits adoption

**Observability ("Datadog for AI")**

- Bessemer explicitly endorses this thesis
- 79% of OpenAI paying customers also pay for Anthropic → multi-model monitoring needed
- Category approaching $800M+

### a16z "Theory of Well" thesis

- $1.7B dedicated to AI infrastructure from $15B 2025 fundraise
- Argument: infrastructure chokepoints capture the most durable value

### What to AVOID in infrastructure

**Physical infrastructure (GPU clouds, data centers)**: The "picks-and-shovels trap"

- $202B invested in AI infrastructure in 2025
- Hyperscalers pursue "capex externalization" — let startups take debt, acquire at distress
- CoreWeave: IPO'd March 2025, revenue ~$5B, but debt-to-equity 4.85, stock fell ~50% from peak

**Commoditizing categories**:

- Vector databases: pgvector and major DBs adding vector capabilities; Pinecone reportedly considering sale
- Simple prompt engineering tools: absorbed into model providers and IDEs
- Basic agent orchestration: direct competition from MCP (Anthropic) and Agent Kit (OpenAI)

---

## 5. Business Model Innovation

### Service-as-Software (SaS)

The inversion of SaaS: using AI to deliver services traditionally performed by humans.

- Traditional SaaS targets IT budgets ($450B)
- Service-as-software targets labor budgets ($11T)
- Atomic unit shifts from "user" to "resolved ticket" / "completed analysis" / "processed claim"

**Margin trajectory**:

- Early-stage SaS: ~25% gross margins
- Mature operators: ~60% (Bessemer's "Shooting Stars")
- Traditional SaaS: 80–90% gross margins

**Salient** (a16z-backed): AI debt collector, clients recover 50% more debt, knows legal
provisions across all 50 states, speaks 21 languages.

### AI-Native Agency Model

Y Combinator 2025–2026 RFS explicitly identifies this: "Agencies of the future will look more
like software companies, with software margins."

- Revenue tied to output/outcomes (targeting 50–70%+ gross margins)
- vs. traditional agencies: revenue tied to headcount (30% gross margins)
- Small AI-powered agencies in marketing, design, legal, accounting

### The One-Person Billion-Dollar Company

- Sam Altman and Dario Amodei (70–80% confidence by 2026) both predicted this
- Historical precedents: Instagram (13 employees, $1B), WhatsApp (55 employees, $19B)
- METR research: leading AI models complete 2h17m of continuous autonomous work at 50% confidence
- Task length doubling ~every 7 months

### Data-Centric Business

- Global data collection/labeling market: $4–5B in 2025, projected $13.8B by 2030
- Mercor: $450M annual revenue run rate by mid-2025
- Scale AI: $760M revenue, $29B valuation
- Opportunity for small teams: domain-specific data assets in underserved verticals

---

## 6. Academic Frameworks

### Teece's Profiting from Innovation (PFI)

**Source**: Teece (1986), updated 2006 and 2018
**Core prediction**: When appropriability is weak (the innovation is easily accessible) and
complementary assets matter, profits flow to asset owners, not innovators.

**Application to AI**: Foundation models = innovation (weak appropriability via API access).
Domain data, regulatory expertise, workflow integration, customer relationships = complementary assets.

**Extension**: Gambardella et al. (2021) in Strategy Science — "Profiting from Enabling Technologies?"
Because complementary assets are sector-specific, the enabling technology firm cannot own all
necessary assets across all target markets → structural space for vertical specialists.

### Eisenmann, Parker, Van Alstyne — Platform Envelopment

**Source**: Strategic Management Journal, 2011
**Mechanism**: When platforms are complements/weak substitutes, the enveloper captures share by
bundling functionality and leveraging shared user relationships.

**Extension**: Chu and Wu (2024) — "Algorithm Envelopment" incorporating data-driven learning dynamics.

### Zhu & Liu — Competing with Complementors

**Source**: Strategic Management Journal, 2018 (empirical study of Amazon)
**Finding**: Platforms are more likely to enter successful, well-reviewed product spaces.
**Implication**: Success on a platform paints a target. OpenAI launched coding agents after Cursor's
success; attempted to acquire Windsurf.

**Extension**: Wen & Zhu (2019, SMJ) — Even the _threat_ of platform-owner entry shifts
complementor behavior: startups redirect innovation to unaffected segments and increase prices.

### Xu, Wang, Chen, Xie — Foundation Model Economics

**Source**: SSRN/arXiv, 2024–2025
**Key concept**: "Openness trap" — transparency mandates can backfire because they enable
incumbents to strengthen data flywheel effects.
**Finding**: Vertical integration by FM companies benefits ecosystem only when data flywheel
is strong enough; government subsidies can be captured by incumbents.

### Agrawal, Gans, Goldfarb — Cheap Prediction Framework

**Source**: Prediction Machines (2018), Power and Prediction (2022)
**Key distinction**: "Point solutions" (AI improving existing processes — wrappers) vs.
"system-level solutions" (AI redesigning entire decision architectures — defensible products).
**Implication**: Startups that merely add AI prediction to existing workflows are vulnerable;
those that redesign entire systems create genuine competitive advantages.

### Iansiti & Lakhani — The AI Factory

**Source**: Competing in the Age of AI (HBS, 2020)
**Framework**: AI-driven firms operate under fundamentally different economics — unlimited returns
to scale, scope, and learning. "Collisions" occur when AI-native firms compete across previously
separate industries.

### Bommasani et al. — Foundation Models Report

**Source**: Stanford, 2021 (100+ authors)
**Concepts**: "Emergence" and "homogenization" — foundation models create both concentration risk
and innovation opportunity simultaneously.

---

## 7. Market Data and Funding Trends

- AI venture funding 2025: $212B (up 85% YoY)
- Enterprise AI spending 2025: $37B (3.2x YoY)
- 82% of recently funded YC startups are AI-focused
- Median AI seed pre-money valuation: $17.9M (42% higher than non-AI)
- Healthcare AI: ~$4B in VC funding in H1 2025, 62% of all digital health funding
- Defense tech: $49B raised in 2025
- Legal tech: $2.4B all-time high in 2025
- AI infrastructure investment: $202B in 2025

**Enterprise LLM market share (2025)**:

- Anthropic: 40% (up from 12% in 2023)
- OpenAI: 27% (declining)
- Google: growing but trailing

---

## 8. Anti-Patterns and Cautionary Tales

### Jasper AI — The canonical wrapper story

- Raised $100M+, valued at $1.5B, reached ~$90M ARR
- Revenue forecasts revised down 30%+ after ChatGPT launched
- Cut internal valuation, appointed new CEO
- Lesson: marketing copy generation has zero moat when the model provider ships the same feature

### Chat-with-X tools

- Chat-with-PDF: dead when OpenAI added PDF parsing
- Chat-with-codebase: dead when Cursor, then Claude Code and GitHub Copilot dominated
- Pattern: any "chat with [data source]" is a feature, not a product

### The vector database squeeze

- Pinecone reportedly considering a sale
- pgvector and major database providers adding native vector capabilities
- Lesson: infrastructure that gets commoditized into existing tools is not defensible

### CoreWeave — Physical infrastructure risk

- IPO'd March 2025, revenue near $5B
- Debt-to-equity ratio 4.85
- Stock fell ~50% from peak
- Lesson: physical AI infrastructure carries massive balance sheet risk
  and is vulnerable to hyperscaler price competition
