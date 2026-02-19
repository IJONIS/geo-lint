# GEO Rules -- Optimize Content for AI Search

When someone asks ChatGPT, Perplexity, or Google AI Overviews a question, the model pulls from web content to build its answer. **Which content gets cited is not random** -- it follows predictable structural patterns that can be checked mechanically.

**GEO (Generative Engine Optimization)** is the practice of structuring content to match these patterns. Traditional SEO gets you into search result lists. GEO gets your content **cited in AI-generated answers**. Both matter -- but no existing open-source tool checks for GEO. That's why these rules exist.

We researched the current state of GEO and AEO (Answer Engine Optimization) to identify what actually drives AI citation. These 7 core rules target the highest-impact patterns: how LLMs select headings to match queries, how they extract lead paragraphs as citation snippets, why data-backed claims get cited over vague statements, and why structured formats like tables and FAQs are extracted verbatim.

Each rule includes a before/after example showing the exact change. When you run geo-lint with an AI agent, the agent applies these fixes automatically and re-lints until every violation is resolved.

---

## 1. `geo-no-question-headings`

**At least 20% of H2/H3 headings should be phrased as questions.**

LLMs match user queries against headings to find relevant sections. Question-formatted headings create a direct mapping between what users ask and what your content answers.

**Before:**
```markdown
## Benefits of Remote Work
```

**After:**
```markdown
## What are the benefits of remote work?
```

---

## 2. `geo-weak-lead-sentences`

**At least 50% of sections should start with a direct answer, not filler.**

AI systems use the first sentence after a heading as the citation snippet. Filler openings like "In this section, we will explore..." get skipped in favor of content that leads with the answer.

**Before:**
```markdown
## What is serverless computing?

In this section, we will take a closer look at serverless computing and
what it means for modern development teams.
```

**After:**
```markdown
## What is serverless computing?

Serverless computing is a cloud execution model where the provider
dynamically allocates compute resources per request, eliminating the
need to provision or manage servers.
```

---

## 3. `geo-low-citation-density`

**Content needs at least 1 statistical data point per 500 words.**

AI answers prefer citable claims backed by numbers. A post that says "performance improved significantly" is less likely to be cited than one that says "performance improved by 47% in load testing."

**Before:**
```markdown
Adopting TypeScript significantly reduces bugs in large codebases.
```

**After:**
```markdown
Adopting TypeScript reduces production bugs by 38% in codebases
exceeding 50,000 lines of code, according to a 2023 study by
Microsoft Research.
```

---

## 4. `geo-missing-faq-section`

**Long posts (800+ words) should include an FAQ section.**

FAQ sections are extracted verbatim by AI systems more than any other content structure. A well-written FAQ at the bottom of a post can generate more AI citations than the rest of the article combined.

**Before:**
```markdown
## Conclusion

TypeScript is a valuable tool for large teams.
```

**After:**
```markdown
## FAQ

### Is TypeScript worth learning in 2026?

Yes. TypeScript is used by 78% of professional JavaScript developers
and is required in most enterprise job listings.

### Does TypeScript slow down development?

Initial setup adds overhead, but teams report 15-25% faster
iteration after the first month due to fewer runtime errors.
```

---

## 5. `geo-missing-table`

**Long posts (1000+ words) should include at least one data table.**

Tables are highly structured and unambiguous, which makes them ideal for AI extraction. Research shows that content with comparison tables is cited 2.5x more frequently in AI-generated answers than equivalent content without tables.

**Before:**
```markdown
React is component-based and uses a virtual DOM. Vue is also
component-based but uses a reactivity system. Svelte compiles
components at build time.
```

**After:**
```markdown
| Framework | Architecture     | Bundle Size | Learning Curve |
|-----------|------------------|-------------|----------------|
| React     | Virtual DOM      | 42 KB       | Moderate       |
| Vue       | Reactivity proxy | 33 KB       | Low            |
| Svelte    | Compile-time     | 1.6 KB      | Low            |
```

---

## 6. `geo-short-citation-blocks`

**At least 50% of sections should start with a paragraph of 40+ words.**

The first paragraph after a heading is the "citation block" -- the unit of text that AI systems extract and present to users. If your opening paragraph is too short (a single sentence fragment), the AI may skip it or pull from a competitor's more complete answer.

**Before:**
```markdown
## How does DNS work?

It translates domain names.

DNS uses a hierarchical system of nameservers...
```

**After:**
```markdown
## How does DNS work?

DNS (Domain Name System) translates human-readable domain names like
example.com into IP addresses that computers use to route traffic.
The resolution process queries a hierarchy of nameservers, starting
from root servers and drilling down through TLD and authoritative
nameservers to find the correct IP address.
```

---

## 7. `geo-low-entity-density`

**Brand name and location should appear in the content body.**

AI systems build entity graphs that connect brands, locations, products, and topics. If your content never mentions your brand name or geographic context, the AI cannot associate the content with your entity -- even if the domain is correct.

This rule checks for the presence of the `brandName` and `brandCity` values from your config. When either value is empty, that check is skipped.

**Before:**
```markdown
Our team builds high-performance web applications using modern
frameworks and cloud infrastructure.
```

**After:**
```markdown
ACME builds high-performance web applications from our Berlin
headquarters, using modern frameworks and cloud infrastructure.
```

---

These are the 7 core GEO rules. For the complete list of 35 GEO rules across E-E-A-T, Structure, Freshness, and RAG categories, see [rules.md](rules.md).

[Back to main README](../README.md)
