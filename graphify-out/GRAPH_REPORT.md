# Graph Report - Applyd  (2026-05-04)

## Corpus Check
- 70 files · ~34,666 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 259 nodes · 310 edges · 17 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 32 edges
2. `call_gemini_unified()` - 11 edges
3. `Base` - 9 edges
4. `get_application()` - 7 edges
5. `get_user_by_id()` - 6 edges
6. `AILimiter` - 5 edges
7. `getValidToken()` - 5 edges
8. `extract_resume_summary()` - 4 edges
9. `extract_top_keywords_for_prompt()` - 4 edges
10. `calculate_local_score()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `add_credits()` --calls--> `ProcessedPayment`  [INFERRED]
  backend\app\services\user_service.py → backend\app\models\models.py
- `ProtectedRoute()` --calls--> `useAuth()`  [INFERRED]
  src\App.jsx → src\contexts\AuthContext.jsx
- `PublicRoute()` --calls--> `useAuth()`  [INFERRED]
  src\App.jsx → src\contexts\AuthContext.jsx
- `Sidebar()` --calls--> `useAuth()`  [INFERRED]
  src\components\Sidebar.jsx → src\contexts\AuthContext.jsx
- `TopNav()` --calls--> `useAuth()`  [INFERRED]
  src\components\TopNav.jsx → src\contexts\AuthContext.jsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (18): Sidebar(), TopNav(), AuthProvider(), useAuth(), AddEdit(), Analytics(), Applications(), Dashboard() (+10 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (25): Base, decode_claims(), get_jwks_client(), get_current_user(), Base, DeclarativeBase, Enum, Application (+17 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (23): analyze_resume(), analyze_resume_with_gemini(), calculate_local_score(), call_gemini_unified(), cosine_sim(), extract_resume_summary(), extract_top_keywords_for_prompt(), normalize_and_tokenize() (+15 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (24): BaseModel, AIAnalyzeResponse, AnalyticsMonthCount, AnalyticsResponse, ApplicationCreate, ApplicationDetailResponse, ApplicationDocumentResponse, ApplicationEventCreate (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (3): update(), mark_all_as_read(), mark_as_read()

### Community 5 - "Community 5"
Cohesion: 0.44
Nodes (8): buildHeaders(), decodeJwt(), doRefresh(), getSafeSession(), getValidToken(), isExpired(), rawFetch(), request()

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (3): BaseSettings, Config, Settings

### Community 7 - "Community 7"
Cohesion: 0.52
Nodes (6): add_credits(), check_credits(), deduct_credit(), delete_user(), get_user_by_id(), update_user()

### Community 8 - "Community 8"
Cohesion: 0.29
Nodes (3): AILimiter, Acquires the lock and waits for the cooldown if necessary., Singleton to manage AI request concurrency and cooldowns.     Ensures only one r

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (2): Details(), formatSalary()

### Community 10 - "Community 10"
Cohesion: 0.4
Nodes (3): lifespan(), Run ad-hoc migrations. Failure here should not crash the app., run_migrations()

### Community 11 - "Community 11"
Cohesion: 0.6
Nodes (4): Settings(), getTheme(), initializeTheme(), setTheme()

### Community 12 - "Community 12"
Cohesion: 0.67
Nodes (2): do_run_migrations(), run_migrations_online()

### Community 13 - "Community 13"
Cohesion: 0.5
Nodes (1): add avatar_url to users  Revision ID: bd18a523ba16 Revises:  Create Date: 20

### Community 15 - "Community 15"
Cohesion: 0.5
Nodes (2): Webhook endpoint for Stripe events.     Does NOT require authentication (validat, stripe_webhook()

### Community 17 - "Community 17"
Cohesion: 0.67
Nodes (1): Remove legacy demo records.

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (2): getSkills(), parseFrontmatter()

## Knowledge Gaps
- **18 isolated node(s):** `Remove legacy demo records.`, `add avatar_url to users  Revision ID: bd18a523ba16 Revises:  Create Date: 20`, `Run ad-hoc migrations. Failure here should not crash the app.`, `Extracts key experience points and skills to reduce token noise.`, `Extracts top 10-12 keywords for the prompt.` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 9`** (7 nodes): `Details()`, `fileUrl()`, `formatEventDate()`, `formatEventType()`, `formatSalary()`, `getEventStyle()`, `Details.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (4 nodes): `do_run_migrations()`, `run_migrations_offline()`, `run_migrations_online()`, `env.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (4 nodes): `bd18a523ba16_add_avatar_url_to_users.py`, `downgrade()`, `add avatar_url to users  Revision ID: bd18a523ba16 Revises:  Create Date: 20`, `upgrade()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (4 nodes): `payments.py`, `create_checkout_session()`, `Webhook endpoint for Stripe events.     Does NOT require authentication (validat`, `stripe_webhook()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (3 nodes): `cleanup()`, `cleanup.py`, `Remove legacy demo records.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (3 nodes): `getSkills()`, `parseFrontmatter()`, `skills.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Community 0` to `Community 9`, `Community 11`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `create_notification()` connect `Community 1` to `Community 4`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `useAuth()` (e.g. with `ProtectedRoute()` and `PublicRoute()`) actually correct?**
  _`useAuth()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `Base` (e.g. with `ApplicationStatus` and `User`) actually correct?**
  _`Base` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Remove legacy demo records.`, `add avatar_url to users  Revision ID: bd18a523ba16 Revises:  Create Date: 20`, `Run ad-hoc migrations. Failure here should not crash the app.` to the rest of the system?**
  _18 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._