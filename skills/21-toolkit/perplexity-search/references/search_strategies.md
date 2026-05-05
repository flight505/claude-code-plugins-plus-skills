# Search Strategies for Perplexity MCP Tools

Query design patterns and domain-specific templates for effective Perplexity searches.

## Query Design Principles

### Be Specific and Detailed

**Good examples:**

- "What are the latest clinical trial results for CAR-T cell therapy in treating B-cell lymphoma published in 2024?"
- "Compare the efficacy and safety profiles of mRNA vaccines versus viral vector vaccines for COVID-19"
- "Explain the mechanism of CRISPR-Cas9 off-target effects and current mitigation strategies"

**Bad examples:**

- "Tell me about cancer treatment" (too broad)
- "CRISPR" (too vague)
- "vaccines" (lacks specificity)

### Structure Complex Queries

Break complex questions into clear components:

1. **Topic**: What is the main subject?
2. **Scope**: What specific aspect are you interested in?
3. **Context**: What time frame, domain, or constraints apply?
4. **Output**: What format or type of answer do you need?

**Example:**

```
Topic: Protein folding prediction
Scope: AlphaFold3 improvements over AlphaFold2
Context: Published research from 2023-2024
Output: Technical comparison with specific accuracy metrics
```

**Query:**
"What improvements does AlphaFold3 offer over AlphaFold2 for protein structure prediction, according to research published between 2023 and 2024? Include specific accuracy metrics and benchmarks."

## Domain-Specific Templates

### Scientific Literature

**Template:**
"What does recent research (2023-2024) say about [specific scientific concept] in [domain]? Focus on [peer-reviewed/preprint] studies and include [specific metrics/findings]."

**Example:**
"What does recent research (2023-2024) say about the role of gut microbiome in Parkinson's disease? Focus on peer-reviewed studies and include specific bacterial species identified."

**Recommended tool:** `perplexity_ask` with `search_domain_filter: ["pubmed.ncbi.nlm.nih.gov", "nature.com"]` and `search_recency_filter: "year"`

### Technical / Engineering

**Template:**
"How to [specific technical task] using [technology/framework] for [use case]? Include [implementation details/performance considerations]."

**Example:**
"How to implement real-time data streaming from Kafka to PostgreSQL using Python? Include considerations for handling backpressure and ensuring exactly-once semantics."

**Recommended tool:** `perplexity_ask` with `search_domain_filter: ["github.com", "stackoverflow.com"]`

### Medical / Clinical

**Template:**
"What is the evidence for [intervention] in treating [condition] in [population]? Focus on [study types] and report [specific outcomes]."

**Example:**
"What is the evidence for intermittent fasting in managing type 2 diabetes in adults? Focus on randomized controlled trials and report HbA1c changes and weight loss outcomes."

**Recommended tool:** `perplexity_reason` (benefits from step-by-step evidence evaluation)

### Comparative Analysis

**Template:**
"Compare [option A] versus [option B] for [use case] in terms of [criteria 1], [criteria 2], and [criteria 3]. Include [specific evidence or metrics]."

**Example:**
"Compare PyTorch versus TensorFlow for implementing transformer models in terms of ease of use, performance, and ecosystem support. Include benchmarks from recent studies."

**Recommended tool:** `perplexity_reason` with `search_context_size: "high"`

### Trend Analysis

**Template:**
"What are the key trends in [domain/topic] over the past [time period]? Highlight [specific aspects] and include [data or examples]."

**Example:**
"What are the key trends in single-cell RNA sequencing technology over the past 5 years? Highlight improvements in throughput, cost, and resolution, with specific examples."

**Recommended tool:** `perplexity_ask` with `search_recency_filter: "year"` and `search_context_size: "high"`

### Gap Identification

**Template:**
"What are the current limitations and open questions in [field/topic]? Focus on [specific aspects] and identify areas needing further research."

**Example:**
"What are the current limitations and open questions in quantum error correction? Focus on practical implementations and identify scalability challenges."

**Recommended tool:** `perplexity_research` with `reasoning_effort: "medium"`

### Mechanism Explanation

**Template:**
"Explain the mechanism by which [process/phenomenon] occurs in [context]. Include [level of detail] and discuss [specific aspects]."

**Example:**
"Explain the mechanism by which mRNA vaccines induce immune responses. Include molecular details of translation, antigen presentation, and memory cell formation."

**Recommended tool:** `perplexity_reason` (shows reasoning steps through complex mechanisms)

## Advanced Techniques

### Query Refinement

Start broad, then narrow:

1. "Recent developments in cancer immunotherapy"
2. "Recent developments in checkpoint inhibitor combination therapies for melanoma"
3. "What are the clinical trial results for combining anti-PD-1 and anti-CTLA-4 checkpoint inhibitors in metastatic melanoma patients, published 2023-2024?"

### Specify Desired Output Format

- "Provide a step-by-step explanation..."
- "Summarize in bullet points..."
- "Create a comparison table of..."
- "List the top 5 approaches with pros and cons..."
- "Include specific numerical benchmarks and metrics..."

### Domain-Specific Keywords

**Biomedical:** "randomized controlled trial", "meta-analysis", "in vitro" vs "in vivo" vs "clinical", specific gene/protein names (e.g., "BRCA1" not "breast cancer gene")

**Computational/AI:** "transformer architecture" not "AI model", "few-shot learning" not "learning from limited data", specific model names

**Chemistry/Drug Discovery:** IUPAC names, "pharmacokinetics" (ADME) vs "pharmacodynamics", specific assay types (IC50, EC50)

### Source Quality Hints

Include source preferences in the query text:

- "According to peer-reviewed publications..."
- "Based on clinical trial registries like clinicaltrials.gov..."
- "From authoritative sources such as Nature, Science, Cell..."

## Common Pitfalls

| Pitfall                                          | Fix                                                             |
| ------------------------------------------------ | --------------------------------------------------------------- |
| Too vague ("Tell me about AI")                   | Specify: topic + scope + context + output format                |
| Loaded questions ("Why is X better?")            | Neutral framing: "Compare X vs Y based on evidence"             |
| Multiple unrelated questions                     | One focused question per tool call                              |
| Assumed context ("What are the latest results?") | Explicit: "Latest results for [specific topic]"                 |
| Missing time constraints                         | Add dates: "published 2024-2025" or use `search_recency_filter` |
