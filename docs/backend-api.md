# CV Adapter API

Serves the job listings the spiders collect, and turns a CV into one aimed at a
specific advert. Interactive docs at `/docs`; this file is the overview.

Running it, the database, and deployment are covered in the [stack README](../README.md).

## Endpoints at a glance

Three tiers, and the tier is what a client needs to know before calling:

| tier | cost | endpoints |
|---|---|---|
| **open** | free, milliseconds | browsing and rendering |
| **signed in** | free | reading your own account |
| **signed in + credits** | a model call, 10–50s | everything that reads or writes with AI |

```
POST /auth/register      GET  /jobs                 POST /cv/render
POST /auth/login         GET  /jobs/{job_id}        POST /cv/pdf
GET  /auth/me      🔒    GET  /jobs/index
GET  /auth/usage   🔒    POST /jobs/match/all  🔒    POST /cv/parse    🔒💳
                         POST /jobs/search  🔒💳     POST /cv/tailor   🔒💳
🔒 needs a token         POST /jobs/match   🔒💳     POST /cv/adapt    🔒💳
💳 spends credits
```

`/jobs/search` and `/jobs/match` only spend a credit when `explain` asks the model to
rank and justify the shortlist; without it the reservation is refunded. `/jobs/match/all`
never spends one — it is vector retrieval with no model — but still needs an account,
because the request body is somebody's CV.

---

## Accounts

### `POST /auth/register`

Open an account and sign in, in one call.

**Receives** `{ email, password, full_name? }` — password at least 8 characters.
**Returns** `201`.

```jsonc
// request
{ "email": "demo@example.com", "password": "correct horse battery", "full_name": "Ana Popescu" }

// 201
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YWJhOGZlMzMz...",
  "token_type": "bearer",
  "expires_in": 604800,
  "user": {
    "id": "6aba8fe3336288a4039d6c68",
    "email": "demo@example.com",
    "full_name": "Ana Popescu",
    "plan": "free",
    "created_at": "2026-09-28T16:03:47.092168Z"
  }
}
```

Returning a token here saves the client an immediate second call to `/auth/login`.
`409` if the email already has an account.

### `POST /auth/login`

**Receives** `{ email, password }`. Email matching is case-insensitive.
**Returns** `200` with the same shape as register.

```jsonc
// request
{ "email": "demo@example.com", "password": "correct horse battery" }

// 401 — identical for a wrong password and an unknown address
{ "detail": "That email and password do not match an account." }
```

`401` for both a wrong password and an unknown address, with an identical message —
telling them apart would let someone discover which emails are registered.

Send the token on every protected call:

```
Authorization: Bearer <access_token>
```

### `GET /auth/me` 🔒

**Receives** nothing.

```jsonc
// 200
{
  "id": "6aba8fe3336288a4039d6c68",
  "email": "demo@example.com",
  "full_name": "Ana Popescu",
  "plan": "free",
  "created_at": "2026-09-28T16:03:47.092168Z"
}
```

### `GET /auth/usage` 🔒

**Receives** nothing.

```jsonc
// 200
{
  "plan": "paid",
  "description": "20 AI credits a month.",
  "credits": 20,          // 0 on the free plan; null if a plan is ever made unlimited
  "used": 3,
  "remaining": 17,
  "resets": "month",      // day | month | total
  "costs": { "/cv/parse": 1, "/cv/tailor": 1, "/cv/adapt": 2,
             "/jobs/search": 2, "/jobs/match": 2 }
}
```

On the free plan `credits` and `remaining` are `0`, which is what a client should
check before offering an AI action. `costs` is the live per-endpoint price table —
read it rather than hardcoding, since the allowances are configurable. An endpoint
absent from `costs` is free.

---

## Jobs

The catalogue is US listings only, collected from eight job boards. It currently holds
about 222,000 live postings; a listing leaves when it leaves the board it came from, not
when it reaches an age.

### `GET /jobs`

Every listing, newest first. Free, no model, no credits.

**Receives** `page`, `page_size` (max 100), and any of the filters below. Omitted
filters match everything.

| filter | means |
|---|---|
| `skills` | repeatable; **all** must be present. Stored lower-case |
| `seniority` | `intern` \| `junior` \| `mid` \| `senior` \| `staff` \| `principal` \| `lead` |
| `remote` | `true` or `false` |
| `max_years` | hides jobs asking for more experience than this. Jobs naming no figure are kept |
| `source` | `greenhouse` \| `ashby` \| `lever` \| `breezy` \| `workable` \| `remoteok` \| `himalayas` \| `usajobs` |

```jsonc
// GET /jobs?source=usajobs&page_size=1  -> 200
{
  "page": 1,
  "page_size": 1,
  "total": 9079,
  "items": [
    {
      "_id": "6ac41486522f6891c9be3fd0",
      "source": "usajobs",
      "external_id": "887664700",
      "url": "https://www.usajobs.gov:443/job/887664700",
      "title": "Librarian",
      "company_name": "Legislative Branch / Library of Congress",
      "department": "Librarian",
      "summary": "",                  // distilled by the spider, not the advert's own blurb
      "skills": [],                   // extracted by dictionary match; often empty
      "seniority": null,
      "years_min": null,
      "employment_type": "Flexitime",
      "salary_raw": "70,623–91,815 USD Per Year",   // as printed; not parsed into numbers
      "location": "Washington, District of Columbia",
      "remote": false,
      "country": "US",
      "posted_at": "2026-10-05T17:17:14.097000",
      "scraped_at": "2026-10-05T21:19:57.910000",
      "description_text": "The Library of Congress shares its vast collections..."
    }
  ]
}
```

`total` is exact when a filter is applied and an estimate when none is — the unfiltered
count is read from collection metadata, because counting 222,000 documents took 2.2s of
a 3.6s page load to produce a number that changes on the next crawl anyway.

### `GET /jobs/{job_id}`

**Receives** a listing id. **Returns** one listing — the same object as an `items[]`
entry — or `404`:

```jsonc
{ "detail": "No listing with id 6aa9876ff95559303b2be000." }
```

### `GET /jobs/index`

What the similarity index holds. Free, open, and the thing to check first when matching
returns less than expected.

```jsonc
// 200
{
  "vectors": 221971,
  "dimensions": 256,
  "megabytes": 227.3,
  "age_seconds": 730,
  "model": "potion-base-8M",
  "jobs": 221971
}
```

`vectors` well below `jobs` means either a stale index or listings that failed to embed.
The index is a snapshot held in memory; it polls every 30 seconds and reloads when the
collection has moved, so a crawl's jobs become searchable within about half a minute
rather than at the next scheduled rebuild.

### `POST /jobs/search` 🔒💳 — 2 credits, refunded without `explain`

Search with a sentence instead of filters, in any language.

**Receives** `{ prompt, page_size?, explain?, skills?, seniority?, remote?, max_years?, source? }`.

```jsonc
// request
{
  "prompt": "senior backend engineer working with Go and Kubernetes, remote",
  "page_size": 2,
  "explain": false
}

// 200
{
  "total_candidates": 221971,
  "results": [
    {
      "job": { /* a full listing, as above */ },
      "similarity": 0.6991,
      "score": 0,        // 0 unless the model ranked it
      "reason": ""       // empty unless the model ranked it
    }
  ],
  "note": "",
  "used_model": false
}
```

No model interprets the sentence. It is embedded and compared against the listings
directly, which is both free and better at the thing an interpretation step used to
approximate. A model runs only to rank and explain the shortlist, and only when
`explain` is set — which is why the credit is reserved up front and refunded when it
is not.

With `explain: true` each result gains a real `score` (0–100) and a `reason`, and
`used_model` comes back `true`. Budget 25–50s for that; without it the call is ~2s.

### `POST /jobs/match` 🔒💳 — 2 credits, refunded without `explain`

The same ranking, but driven by a parsed CV rather than a sentence.

**Receives** `{ profile, page_size?, explain?, skills?, seniority?, remote?, max_years?, source? }`
— `profile` is the object `/cv/parse` returns. **Returns** the same shape as
`/jobs/search`.

`explain` defaults to **true** here, unlike `/jobs/search`. Set it to `false` for a
free, ~1.5s vector-only ranking.

What of the CV gets embedded is deliberately not the whole document: the three most
recent job titles, the skills, and the distilled summary. Matching prose against prose
is what a static embedding is worst at; matching titles-and-skills against
titles-and-skills is what it is best at.

### `POST /jobs/match/all` 🔒 — free

The best listings for a CV, best first — up to 500 of them. No model, no credits — but it needs an
account, because the request body is somebody's CV.

**Receives** `{ profile, limit?, min_similarity?, skills?, seniority?, remote?, max_years?, source? }`.
`limit` defaults to 200 and is at most **500**; asking for more is a `422` rather than a
silently shorter list. `min_similarity` defaults to 0.25.

```jsonc
// request
{ "profile": { /* from /cv/parse */ }, "limit": 2, "min_similarity": 0.3 }

// 200
{
  "total_candidates": 221971,   // how many were considered
  "matched": 19036,             // of those, how many cleared min_similarity
  "returned": 2,                // how many are in this response, after limit
  "cached": false,
  "data_version": "crawl:2026-10-05T21:20:22.552000",
  "results": [
    {
      "job": {
        "_id": "6abf9524522f6891c9a552a3",
        "source": "greenhouse",
        "external_id": "7816737003",
        "url": "https://www.zipline.com/open-roles/7816737003?gh_jid=7816737003",
        "title": "Senior Software Engineer - Maps Platform",
        "company_name": "Zipline",
        "summary": "Experience building and operating large-scale data pipelines...",
        "skills": ["python", "go", "postgresql", "kafka", "aws", "distributed systems"],
        "seniority": "senior",
        "years_min": null,
        "salary_raw": null,
        "location": "Ann Arbor, Michigan USA; South San Francisco, California, USA",
        "remote": false,
        "posted_at": "2026-09-30T00:00:00"
      },
      "similarity": 0.7788
    }
  ]
}
```

The listing here is a **brief** — no `description_text`, `department`, `country` or
`scraped_at`. A response of hundreds of matches would otherwise be mostly advert text
nobody asked for; fetch the full listing with `GET /jobs/{job_id}`.

**Every listing is ranked, but only the top 500 are kept.** `matched` is still the real
total — 19,036 in the example — so a UI can say "19,036 jobs match, showing the best
500". An unfiltered CV routinely clears the floor for 80,000 listings, and holding all
of them per cached CV cost about 7 MiB each; nobody pages that far.

**Results are cached until the next crawl.** `data_version` is the other half of the
cache key, so a repeat request is served in milliseconds and invalidates itself the
moment new listings land. First call ~1.5s, cached ~0.3s.

The cache is keyed on the CV's content and the filters, not on the user — two people
with the same CV share an entry, and editing a CV produces a new one. It lives in the
backend's memory, capped at 64 MB (about 5,000 CVs at ~13 KB each), least recently used
first out, and every entry is dropped when a crawl lands. A restart empties it, which
costs nothing but one recomputation per CV.

A client can cache too, and should: keep each response keyed on the CV plus
`data_version`, and refetch only when `data_version` changes.

### How filters and similarity divide the work

Filters are *requirements* and run in MongoDB first. Similarity has no notion of one — a
CV mentioning Kubernetes will cheerfully rank an intern role on another continent highly
because it is talking about the same subject. So what qualifies is decided by the query,
and the vector only orders what survived it.

An unfiltered request ranks the entire index without reading the database at all, since
the index already holds every vector in memory. A filtered one reads the matching ids
and ranks just those.

---

## CV

### `POST /cv/parse` 🔒💳 — 1 credit

Read an uploaded CV into structured, editable data.

**Receives** multipart: `file` (PDF or DOCX) and `language`.

```bash
curl -X POST http://127.0.0.1:8000/cv/parse \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@cv.pdf" -F "language=en"
```

```jsonc
// 200 — a CvResult. `changes` and `rationale` stay empty: no tailoring ran.
{
  "profile": {
    "contact": {
      "full_name": "Maxim Voloșenco",
      "headline": "Software Engineer",
      "email": "maximvolosenco@gmail.com",
      "phone": "+373 79 864 352",
      "location": "Chișinău, Moldova",
      "links": [ { "label": "LinkedIn", "url": "https://linkedin.com/in/..." } ]
    },
    "summary": "",
    "experience": [
      {
        "company": "Stefanini, Chișinău, Moldova",
        "title": "Software Engineer",
        "location": "Chișinău, Moldova",
        "start_date": "December 2020",
        "end_date": "",                       // empty because is_current
        "is_current": true,
        "bullets": [
          "Led web scraping projects utilizing the Scrapy library in Python.",
          "Deployed and managed web scraping solutions on Zyte Cloud."
        ]
      }
    ],
    "volunteering": [ { "organization": "Coder Dojo, Chișinău", "role": "Mentor",
                        "start_date": "", "end_date": "", "is_current": false, "bullets": [] } ],
    "education":   [ { "institution": "Tehnical University of Moldova", "degree": "Bachelor's Degree",
                       "field_of_study": "", "location": "", "start_date": "September 2018",
                       "end_date": "June 2022", "details": "" } ],
    "skill_groups": [ { "category": "Programming Languages", "skills": ["Python", "C#", "TypeScript"] } ],
    "other_sections": []
  },
  "template_data": { /* the same CV in the shape /cv/pdf wants — post it straight back */ },
  "blocked": null,
  "dropped": [],
  "warnings": [],
  "changes": [],
  "rationale": ""
}
```

Absent values are `""` and `[]`, never `null` — a field the CV did not mention comes
back empty rather than invented.

A DOCX is converted to structured HTML rather than rendered to a page — it keeps tables
and headings, and costs about a tenth as many tokens as processing a rendered page
visually. `415` for anything that is not a PDF or DOCX, including `.doc`, which asks the
user to re-save. `413` over 24MB, `422` for an encrypted or unreadable file.

### `POST /cv/tailor` 🔒💳 — 1 credit

Aim an already-parsed CV at one advert.

**Receives** `{ profile, language?, and either job_id or job }` — a listing id from
`/jobs`, or a pasted advert. Exactly one; both or neither is a `422`.

```jsonc
// request — against a catalogue listing
{
  "profile": { /* the CvProfile from /cv/parse, with any edits */ },
  "job_id": "6aaa6a503235de5ca0573674",
  "language": "en"
}

// request — against a pasted advert instead
{
  "profile": { /* ... */ },
  "job": { "title": "Senior Python Engineer", "company": "Northwind", "description": "We run..." }
}
```

```jsonc
// 200 — same CvResult shape, now with changes and a rationale
{
  "profile": { /* the tailored CV */ },
  "template_data": { /* ready for /cv/pdf */ },
  "blocked": null,
  "dropped": [],
  "warnings": [],
  "changes": [
    {
      "path": "experience[0].bullets",
      "before": "Led web scraping projects utilizing the Scrapy library in Python.\nDeployed...",
      "after":  "Developed and maintained API endpoints using Flask, working with RESTful..."
    },
    { "path": "skill_groups order", "before": "[0, 1, 2, 3, 4, 5]", "after": "[0, 2, 4, 3, 5, 1]" }
  ],
  "rationale": "The advert asks for C#/.NET, ASP.NET MVC and Entity Framework..."
}
```

**An empty `changes` is a valid, honest answer.** When the CV does not fit the advert,
it changes nothing and says why:

```jsonc
{
  "changes": [],
  "rationale": "Anunțul este pentru un post de Bucătar, complet diferit de profilul acestei persoane (Software Engineer). CV-ul nu conține nicio experiență relevantă pentru gătit, iar regulile nu permit inventarea unor competențe care nu apar în CV."
}
```

This call never sees the uploaded document, only the parsed profile, so it cannot
surface anything the user was not already shown. **It also cannot alter employers, job
titles, dates, institutions or qualifications** — there is no field in its response to
put them in, so this is a property of the schema rather than an instruction the model
might ignore.

If the CV genuinely does not fit the advert, the honest answer is no changes at all and
a `rationale` saying why. That is a correct outcome, not a failure.

### `POST /cv/adapt` 🔒💳 — 2 credits

`/cv/parse` and `/cv/tailor` in one request.

**Receives** multipart: `file`, `language`, and either `job_id` or
`job_title` + `job_description` (+ optional `job_company`).
**Returns** the same `CvResult` as `/cv/tailor`.

```bash
curl -X POST http://127.0.0.1:8000/cv/adapt \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@cv.pdf" -F "job_id=6aaa6a503235de5ca0573674" -F "language=en"

# or with a pasted advert
curl -X POST http://127.0.0.1:8000/cv/adapt \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@cv.pdf" -F "job_title=Senior Python Engineer" \
  -F "job_description=We run large-scale web data collection..." -F "language=en"
```

Two sequential model calls — budget 20–60s. It returns JSON, not a finished PDF, on
purpose: the `changes` diff is the only thing standing between a tailored CV and an
employer, and streaming back a PDF would throw it away.

### `POST /cv/render`

**Receives** either a `CvTemplateData` — post back the `template_data` from any CV
endpoint, unchanged — or a bare `profile`. **Returns** `text/html` (~13 KB).

Both are accepted because the two are not interchangeable by hand: a parsed CV carries
an empty `headline`, and its links have no `text`, both of which the render contract
requires. Posting a `profile` runs the same conversion `/cv/adapt` uses, filling those
in; posting `template_data` is used exactly as given and nothing is inferred.

Free and deterministic, ~2ms. Useful as a live preview while someone edits — its fonts
are served from `/cv/fonts`, so the response renders correctly in a browser or an
iframe.

### `POST /cv/pdf`

**Receives** either shape, exactly as `/cv/render` does. **Returns**
`application/pdf` (~45 KB) as an attachment:

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Maxim_Volosenco_CV.pdf";
                     filename*=UTF-8''Maxim%20Volo%C8%99enco%20CV.pdf
```

Free, ~450ms, real A4 with fonts embedded. Because it is a POST, a browser cannot
download it by navigation — fetch it, take the blob, and trigger the download from the
`Content-Disposition` header.

---

## What `CvResult` carries

Every CV endpoint returns the same shape, and four of its fields are easy to overlook:

| field | why it matters |
|---|---|
| `profile` | the editable CV — send it back to `/cv/tailor` |
| `template_data` | the same CV in the shape `/cv/pdf` wants, ready to post straight back. `null` when it cannot be rendered at all, with the reason in `blocked` |
| `dropped` | entries the design cannot print, with a reason each. Show these — otherwise the user finds out from the finished PDF |
| `warnings` | problems with the upload itself: a scanned PDF, a DOCX that converted thinly |
| `changes` | every edit tailoring made, `before` and `after`. Empty when no tailoring ran |
| `rationale` | why tailoring emphasised what it did, in the CV's language |

`template_data` means a client never has to convert between the parse model and the
render model — that translation has already happened server-side.

---

## Errors

| code | means |
|---|---|
| `401` | no token, or it expired |
| `402` | the plan's credits are used up — the fix is a different plan, not waiting |
| `404` | no listing with that `job_id` |
| `413` | upload over 24MB |
| `415` | not a PDF or DOCX |
| `422` | the request or the document could not be read |
| `502` | the model could not be reached |
| `503` | the PDF renderer is not installed |

Every error is the same shape — a single `detail` string, except `422` from request
validation, which is FastAPI's field-level list:

```jsonc
{ "detail": "Sign in to use this endpoint." }                                        // 401
{ "detail": "This request needs 2 credit(s); the free plan allows 0 per month and 0 have been used." }   // 402
{ "detail": "No listing with id 6aa9876ff95559303b2be000." }                         // 404
{ "detail": "Only PDF and DOCX are supported. Note that renaming a file does not change its format." }  // 415

// 422 from body validation — a list, not a string
{ "detail": [ { "type": "string_too_short", "loc": ["body", "password"],
                "msg": "String should have at least 8 characters" } ] }
```

**A failed request costs nothing.** Credits are reserved before the work runs and
refunded on any failure, so a 415, a 422 or a 502 leaves the allowance untouched.

## Plans

| plan | AI credits | resets | what it allows |
|---|---|---|---|
| `free` | **0** | — | browse, filter, render and download, all unlimited |
| `paid` | **20** | monthly | everything above, plus the AI endpoints |

Registering gives `free`. It is a usable product on its own — searching the
catalogue by filter, opening a listing, rendering and downloading a CV all run
without a model and cost nothing — but every AI endpoint answers `402` until the
account is upgraded.

**The allowances live in MongoDB, not in the code**, so changing 20 is a document
update rather than a deploy:

```bash
python scripts/set_plan.py                              # show current plans
python scripts/set_plan.py --plan paid --credits 50     # change the allowance
python scripts/set_plan.py --user someone@example.com --assign paid
```

A change takes effect within 30 seconds without a restart. The values in
`auth/plans.py` are only the seed used when the collection is empty, and the
fallback if Mongo is unreachable — a database outage degrades to the documented
defaults rather than handing out unlimited access.

Credits are weighted by what an endpoint really spends: `/cv/adapt` is 2 because it
makes two model calls, `/cv/parse` and `/cv/tailor` are 1, and `/jobs/search` is 2
unless the fast path answers it without a model, in which case it is refunded to 0.
`/jobs/match/all` charges nothing at all — it is vector retrieval, no model — though
it still needs an account, because the request body is somebody's CV.

`scripts/create_user.py <email> <password> --plan paid` makes an account from the
command line.

---

## Workflow

The whole product is four calls, in this order:

```
   1. POST /cv/parse        upload  ─────────────►  CvResult
      (or start from an already-parsed profile)
                                   │
   2.    user edits the profile    │
                                   ▼
   3. POST /cv/tailor    profile + job_id  ─────►  CvResult
                                   │                + changes
                                   │                + rationale
   4.    user reviews the diff     │
                                   ▼
   5. POST /cv/pdf       template_data  ─────────►  the PDF
```

Finding the job comes first: `GET /jobs` with filters for a plain search,
`POST /jobs/search` for a sentence, or `POST /jobs/match/all` to let a CV find its own
matches for free. Either way you end up with a `job_id`, and steps 3 onward take it
directly — nothing needs to fetch and forward the advert text.

`POST /cv/adapt` collapses steps 1 and 3 into one request. Convenient, and the right
choice when there is nothing to edit between them.

**Three things are worth building the UI around.**

Parsing and tailoring are deliberately separate calls. One upload can be aimed at many
adverts without re-reading the document, and the parsed profile is what the user edits
and keeps.

Step 4 is not optional in spirit. `changes` exists because a tailored CV that nobody
reviewed is the one failure mode this design is arranged to prevent — the model cannot
change facts, but it can still reword a bullet more warmly than the person would.
Showing the diff is what makes that safe.

Steps 1 and 3 take tens of seconds and cost money; step 5 takes half a second and costs
nothing. Put the spinner on the first two.
