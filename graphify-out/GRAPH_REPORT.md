# Graph Report - .  (2026-05-03)

## Corpus Check
- 60 files · ~29,309 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 207 nodes · 242 edges · 15 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 28 edges
2. `Base` - 8 edges
3. `get_application()` - 7 edges
4. `get_user_by_id()` - 6 edges
5. `getValidToken()` - 5 edges
6. `score_resume()` - 4 edges
7. `User` - 4 edges
8. `ProcessedPayment` - 4 edges
9. `Application` - 4 edges
10. `ApplicationEvent` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Dashboard()` --calls--> `useAuth()`  [INFERRED]
  src\pages\Dashboard.jsx → src\contexts\AuthContext.jsx
- `get_current_user()` --calls--> `User`  [INFERRED]
  backend\app\core\deps.py → backend\app\models\models.py
- `add_credits()` --calls--> `ProcessedPayment`  [INFERRED]
  backend\app\services\user_service.py → backend\app\models\models.py
- `create_application()` --calls--> `Application`  [INFERRED]
  backend\app\services\application_service.py → backend\app\models\models.py
- `create_application_event()` --calls--> `ApplicationEvent`  [INFERRED]
  backend\app\services\application_service.py → backend\app\models\models.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.1
Nodes (14): TopNav(), AuthProvider(), useAuth(), AddEdit(), Analytics(), Applications(), Login(), Profile() (+6 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (20): BaseModel, AIAnalyzeResponse, AnalyticsMonthCount, AnalyticsResponse, ApplicationCreate, ApplicationDetailResponse, ApplicationDocumentResponse, ApplicationEventCreate (+12 more)

### Community 2 - "Community 2"
Cohesion: 0.23
Nodes (12): Base, Base, DeclarativeBase, Enum, Application, ApplicationDocument, ApplicationEvent, ApplicationStatus (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.21
Nodes (8): create_application(), create_application_document(), create_application_event(), delete_application(), get_application(), get_application_detail(), list_application_events(), update_application()

### Community 4 - "Community 4"
Cohesion: 0.26
Nodes (8): analyze_resume(), analyze_resume_with_gemini(), cosine_sim(), normalize_and_tokenize(), parse_jd(), score_resume(), tailor_resume(), tailor_resume_with_gemini()

### Community 6 - "Community 6"
Cohesion: 0.44
Nodes (8): buildHeaders(), decodeJwt(), doRefresh(), getSafeSession(), getValidToken(), isExpired(), rawFetch(), request()

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (3): BaseSettings, Config, Settings

### Community 8 - "Community 8"
Cohesion: 0.52
Nodes (6): add_credits(), check_credits(), deduct_credit(), delete_user(), get_user_by_id(), update_user()

### Community 9 - "Community 9"
Cohesion: 0.4
Nodes (2): Details(), formatSalary()

### Community 10 - "Community 10"
Cohesion: 0.5
Nodes (3): decode_claims(), get_jwks_client(), get_current_user()

### Community 11 - "Community 11"
Cohesion: 0.5
Nodes (3): Dashboard(), formatDate(), relativeTime()

### Community 12 - "Community 12"
Cohesion: 0.67
Nodes (2): do_run_migrations(), run_migrations_online()

### Community 14 - "Community 14"
Cohesion: 0.5
Nodes (2): Webhook endpoint for Stripe events.     Does NOT require authentication (validat, stripe_webhook()

### Community 16 - "Community 16"
Cohesion: 0.67
Nodes (1): Remove legacy demo records.

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (2): getSkills(), parseFrontmatter()

## Knowledge Gaps
- **4 isolated node(s):** `Remove legacy demo records.`, `Webhook endpoint for Stripe events.     Does NOT require authentication (validat`, `Config`, `Config`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 9`** (6 nodes): `Details()`, `fileUrl()`, `formatEventDate()`, `formatEventType()`, `formatSalary()`, `Details.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (4 nodes): `do_run_migrations()`, `run_migrations_offline()`, `run_migrations_online()`, `env.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (4 nodes): `payments.py`, `create_checkout_session()`, `Webhook endpoint for Stripe events.     Does NOT require authentication (validat`, `stripe_webhook()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (3 nodes): `cleanup()`, `cleanup.py`, `Remove legacy demo records.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (3 nodes): `getSkills()`, `parseFrontmatter()`, `skills.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Community 0` to `Community 9`, `Community 11`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `ProcessedPayment` connect `Community 2` to `Community 8`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `getSafeSession()` connect `Community 6` to `Community 0`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `useAuth()` (e.g. with `ProtectedRoute()` and `PublicRoute()`) actually correct?**
  _`useAuth()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `Base` (e.g. with `ApplicationStatus` and `User`) actually correct?**
  _`Base` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Remove legacy demo records.`, `Webhook endpoint for Stripe events.     Does NOT require authentication (validat`, `Config` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._