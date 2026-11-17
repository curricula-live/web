# API → web concept documentation: isolated end-to-end validation

The teacher concept Overview is a **read-only projection** from typed recorded relationships. Its new canonical runtime endpoint is:

```http
GET /v1/concepts/{slug}/documentation/?depth=1..5
```

The frontend feature lives at `/concepts/{slug}`, and the index is at `/concepts`.

## What was verified

In an isolated local integration test, the API's feature branch and the web's feature branch consumed the **actual 554 concepts, 19 predicate types and 663 directed statements** from the checked-out `curricula-live/data` repository.

For Array, the API returned the following bounded results:

| Requested depth | Nodes | Recorded edges | Conditional subtype consequences | Truncated |
| ---: | ---: | ---: | ---: | :--- |
| 1 | 4 | 4 | 0 | No |
| 2 | 17 | 18 | 2 | No |
| 3 | 59 | 67 | 2 | No |
| 4 | 120 | 148 | 2 | Yes |
| 5 | 120 | 151 | 2 | Yes |

The two consequences are conditional `Array ⊆ Data` and `Array ⊆ Structure`. Their premise UUIDs are preserved. **Neither conclusion nor any underlying source premise is certified by this test.**

The paired test completed with a 200 response from both the actual documentation API and the rendered Next.js page. These are development-loop results, not production benchmarks.

## Reproduce locally without credentials

Check out matching feature branches in `api` and `web`, plus a checkout of `data`; all commands below assume sibling directories.

### Terminal A — create a disposable SQLite copy and start the API

```bash
cd api
python -m venv .venv
.venv/bin/pip install "django>=5.2,<5.3" "django-environ>=0.14" "psycopg[binary]>=3.1.8,<4" \
  "pytest>=9.1.1" "pytest-django>=4.12.0"

.venv/bin/python tests/tools/bootstrap_data_sqlite.py \
  --data-root ../data \
  --output /tmp/curricula-concept-preview.sqlite3

DJANGO_SETTINGS_MODULE=config.settings \
APP_ENV=development \
DJANGO_DEBUG=0 \
DJANGO_SECRET_KEY=LOCAL-DISPOSABLE-TEST-ONLY \
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1 \
DATABASE_URL=sqlite:////tmp/curricula-concept-preview.sqlite3 \
.venv/bin/python manage.py runserver 127.0.0.1:8094 --noreload
```

The bootstrap refuses to overwrite an existing file unless `--replace` is given and refuses output outside the OS temporary directory. It creates only a *disposable SQLite test database*; the production database and canonical JSONL are never modified.

### Terminal B — point the web frontend at the API feature branch

```bash
cd web
npm install
API_BASE_URL=http://127.0.0.1:8094 npm run build

API_BASE_URL=http://127.0.0.1:8094 \
CONCEPT_DOCUMENTATION_REQUIRE_API=1 \
npm run start -- -p 3040
```

The `CONCEPT_DOCUMENTATION_REQUIRE_API=1` setting is important: it makes the frontend **fail closed** if the new API route is not available instead of silently falling back to the slow multi-request neighborhood compatibility projection. Do not enable this setting on the existing Vercel web preview until the API route is actually reachable there.

### Terminal C — verify proofs and rendered pages

```bash
cd web
node scripts/verify-concept-integration.mjs
# Optional: verify a different existing concept
CONCEPT_VERIFY_SLUG=integer node scripts/verify-concept-integration.mjs
CONCEPT_VERIFY_DEPTH=5 node scripts/verify-concept-integration.mjs
```

This script verifies original assertion UUIDs, every premise chain's direction and predicate, the target of derived conclusions, provisional evidence status, symbolic notation, and the rendered teacher concept page.

Visit `http://127.0.0.1:3040/concepts/array?depth=3`.

## Deployment boundaries and follow-up

- Current production `api.curricula.live` does **not** expose the new documentation endpoint. The paired feature API Vercel preview is protected by Vercel login. Do not weaken its deployment protection to work around that.
- The web preview temporarily uses bounded public `/neighborhood/` requests on a documented **404 fallback**. Its multi-request latency is not representative of the actual API implementation.
- A coordinated development API deployment must make the new endpoint reachable to the Next.js server. Then set `CONCEPT_DOCUMENTATION_REQUIRE_API=1` for the dev web deployment, run the paired smoke tests, and remove the compatibility fallback after parity is established.
- No merge to production or automatic source import is authorized by these tests.
- Future graph representation compression, pagination or proof-aware streaming should be evaluated using real response-size and traversal benchmarks after the paired endpoint is deployed; avoid premature encodings that obscure original UUID evidence.

## Academic proof traces on the teacher Overview

The documentation endpoint returns a **checked, provisional rule trace** for
each derived subtype relation. A response includes:

- `premise_ids`: UUIDs of the actual ordered recorded relations;
- `proof.steps`: numbered `h1`, `h2`, etc. hypotheses and compositional
  `s1`, `s2`, etc. transitive deductions;
- `depends_on`: the exact proof-step IDs used at each intermediate step;
- `scope_origin: assumed_not_in_source`: scientific subtype meaning has
  **not** been verified for the archived legacy graph;
- `is_formal_proof_certificate: false`, `may_publish: false`: the teacher
  display is a verified graph-path witness, **not** the separate
  formal-model research certificate or an accepted canonical assertion.

The proof path is validated in the API against its original directed
`subtype_of` edges. The temporary web-only preview compatibility fallback
produces the same trace shape when the new API endpoint is 404. The frontend
renders it in academic order, with each hypothesis linking to the original
Observation (and its source UUID), rather than repeating a large set of
unstructured premise paragraphs. The conclusion is separated by an inference
rule divider; multi-hop proofs expose intermediate derivation steps.

**Screenshots from a real headless Chromium run against an isolated local
API/web pairing (not screenshots of the deployed preview or production):**

- [Complete Array page at three hops](previews/array-three-hop-page.png)
- [Definitions, observations and derivations](previews/array-proof-detail.png)

Only the existing API and web feature branches are altered here; the
experimental certificate checker remains isolated in the separately
reviewed [API formal PR #65](https://github.com/curricula-live/api/pull/65).
No ontology source import, canonical data mutation, migration, scientific
certification or release is implied.

## Class expressions and conditional logic on concept pages

The teacher Overview now includes **typed, source-linked formal expressions**
without equating any unreviewed scientific claims to established truth:

- Two or more *direct* recorded superclasses can yield a **necessary**
  class condition of the form `Array ⊑ (Collection ⊓ Data Structure)`.
  This is an intersection of necessary conditions, **not** an equivalence
  or a full definition. Its source assertion UUIDs are exposed and linked to
  the original observations.
- Each conditional, checked subtype-transitivity witness additionally
  displays a propositional rule formula:
  `(Array ⊑ Collection ∧ Collection ⊑ Data) ⇒ (Array ⊑ Data)`.
  The underlying typed AST includes all original UUIDs and flags its source
  scope as `assumed_not_in_source`; it is not a new recorded graph relation.
- The generic client renderer distinguishes **class** operators
  `⊑, ≡, ⊓, ⊔, ¬, ∃, ∀` from **propositional** operators
  `∧, ∨, ¬, ⇒, ⇔`. Their syntax is tested in
  `scripts/verify-formal-notation.mjs`, including unsupported-premise
  rejection. Only the **supported subset** is generated from current data.
  In particular, `⇔` or class equivalence `≡` are never inferred
  from a one-directional subtype assertion; the current corpus lacks the
  structured evidence and bidirectional proof basis for automatic admission.
- Expressions are horizontally scrollable for longer proofs so their
  operators and concept names are never cut off by page layout.

Headless Chromium visual review:
- [Array with class and propositional formulas](previews/array-formal-operators.png)
- [Formal expression detail](previews/array-formal-detail.png)

Neither the experimental formal-language PR, source admission status nor
canonical data snapshot is automatically changed by this read-only projection.


## Live benchmark comparison: Algorithm and Computer Network

The read-only teacher documentation API and the Next.js concept page were
checked together using a **disposable SQLite mirror** of canonical Git
`data` (554 concepts, 19 predicates, 663 recorded relationships). This is
**not production**, and the historical native ontology was *not* imported.

The new generic `relation_profile` response counts the subject's direct
incoming/outgoing recorded edges by predicate, and the conditional subtype
conclusions produced by the existing rule. Its scope is always
`retrieved_neighborhood_only`; it reports truncation explicitly and **does
not** claim scientific or full-ontology completeness. For examples with no
recorded direct `subtype_of`, the page explains why no class characterization
can be assembled rather than fabricating a definition.

**Benchmarks from the current canonical snapshot:**

| Concept | Depth | Retrieved nodes | Retrieved edges | Direct incidence | Conditional subtype derivations | Truncated? |
|---|---:|---:|---:|---:|---:|---|
| Algorithm | 2 | 53 | 55 | 18 (1 outgoing, 17 incoming) | 0 | No |
| Computer Network | 3 | 46 | 47 | 4 (1 outgoing, 3 incoming) | 1 | No |
| Function | 3 | 55 | 58 | 12 | 0 | No |
| Operating System | 3 | 59 | 63 | 4 | 0 | No |

Algorithm at 3 hops reaches the 120-node cap; it is an intentionally useful
stress test for graph density and sparse classificatory evidence. The viewport
now opens on the selected concept at readable zoom when a whole-graph fit
would be too small (<58%), retaining **Focus**, pan/zoom and **Fit** controls.
The graph does not suppress or silently alter the underlying assertion IDs.

Visual screenshots from headless Chromium after API/React integration:

- [Algorithm at two hops with focused zoom and relation profile](previews/algorithm-benchmark-2h.png)
- [Computer Network at three hops with a conditional proof](previews/computer-network-benchmark-3h.png)

You can inspect these same provisional previews at
`/concepts/algorithm?depth=2` and
`/concepts/computer-network?depth=3` on the paired development deployment.
The screenshots were generated locally, not on production. No claim is made
that the historical native structures are scientifically accepted or that
`broader_topic` can be treated as `subtype_of`.
