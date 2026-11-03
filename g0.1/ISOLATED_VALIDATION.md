# GásFácil — G0.1 isolated validation review

**Result: conditional local validation, not production-ready approval.**

Completed 2026-11-03, approximately 15:51 UTC. Draft: **G0.1 validação isolada**, `drft_01m6h1bx35et8rrhja02vxf5tw`; thread `thr_k31cpql5wa2z`.

## 1. Isolation verified before mutations

- Platform identifies this draft as having its own dedicated local database. Environment draft ID matched the requested ID.
- Database connection independently reported `postgres`, role `sandbox_exec`, server `127.0.0.1:8004`.
- `SUPABASE_URL` was independently verified as local; service credential presence was checked without printing it. No `.env` credentials were used.
- PostgreSQL version: **17.11**, compiled with GCC 15.2.0, 64-bit. Deno **2.8.3**, TypeScript **6.0.3**. Auth health reports GoTrue **v2.197.0**.
- Initially **zero Auth users**. All accounts created during this review were new fictional `example.invalid` accounts, created through the local Auth admin API, never copied from production. Random temporary passwords/tokens stayed in restricted temporary files, not source or this report.
- No production query, mutation, deployment, publishing, accepting, backup restore, email delivery, real orders, stock or financial fixtures were used.
- No second PostgreSQL server was started. Tests used the draft's existing complete database.

### Important acceptance warning

The migration is recorded in this draft. **Accepting this draft would apply its recorded migration to the app.** This review did not accept it. The draft's fictional rows do not transfer to the app. Do not accept this draft merely to collect the review; coordinate acceptance/migration integration with the main thread first.

## 2. Candidate SQL applied byte-for-byte to complete isolated schema

Source: `g0.1/sql/001_profile_verification.sql`.

Tool result explicitly confirmed isolated application at:

`drizzle/migrations/0000_g01_isolated_profile_verification.sql`

Journal: `drizzle/migrations/meta/_journal.json`, index 0, tag `0000_g01_isolated_profile_verification`, timestamp `1793720799198`.

Source and recorded migration have identical SHA-256:

`acc2d28ff0e131c463c0535fb4fad45b26c161490e5972717db433e51ae243a8`

SQL compiled/applied successfully against the complete draft app schema, not the previous minimal test bootstrap. No SQL candidate changes were necessary. No additional recovery table or roles were added.

### Before/after complete public-schema evidence

| Inventory | Before | After | Comparison |
|---|---:|---:|---|
| Public tables | 43 | 43 | Exact table list unchanged |
| Public columns | 492 | 492 | Exact type/default/nullability inventory unchanged |
| Public RLS policies | 52 | 52 | Exact definitions unchanged |
| Public constraints | 63 | 63 | Exact definitions unchanged |

Changed/added function definitions were exactly:

- `g0_recover_own_profile`
- `g01_guard_organization_owner`
- `profiles_guard_privileged_fields`
- `set_user_role`

Added trigger: `g01_organization_owner_guard`. Existing profile guard and updated-at trigger remained attached.

Verified grants after application: authenticated `INSERT` on profiles = false; authenticated `INSERT` on user_roles = false. Authenticated direct RPC and read access remained usable in actual tests.

### Schema comparison limitations

This is a before/after comparison of this draft's complete public schema snapshot. It is **not** an independent comparison with current production, and does not prove production has not changed since draft creation. No production schema/data was fetched. Reserved-schema completeness, all extension objects, indexes, grants across every table, configuration/secrets equivalence, storage, scheduler and all application modules were not exhaustively compared. The test did not validate inventory or finance.

`profiles.ativo` is **NOT NULL DEFAULT true** on the complete schema. Attempting to store NULL was rejected (HTTP 400). Null safety in the SQL remains explicit (`ativo IS NOT TRUE`); we did not loosen NOT NULL to manufacture a NULL row. Previous mock/minimal-schema NULL tests are not relabeled as full-schema execution here.

## 3. Real runtime and gateway limitation

The standard local gateway at `127.0.0.1:8001` returned 503 for `/auth/v1/health`, `/auth/v1/settings`, `/rest/v1/`, and `/functions/v1/get_user_profile`. Its root returned 200. The upstream services were healthy:

- Auth `127.0.0.1:8002`: health/settings 200, real account creation and password login worked.
- PostgREST `127.0.0.1:8003`: root and authorized requests 200.
- Service credential access to PostgREST succeeded.

Therefore endpoint tests used **real Auth + real PostgREST + real database**, with a temporary loopback-only prefix proxy on port 18100. Endpoint code ran in local Deno processes on 18101–18106. Network permissions allowed only those loopback ports. No endpoint was uploaded to a managed function deployment destination; active `supabase/functions` paths were not edited.

Only the Deno listener port/hostname was adapted in temporary runtime copies. Baseline copies additionally changed the original esm.sh SDK import to the same npm SDK version 2.49.4. Candidate administrative endpoints used pinned SDK **2.118.0**, including SDK CORS, after detecting that 2.49.4 does not expose `/cors`. Candidate business logic was not mocked.

**Not executed:** functioning standard gateway deployment/invocation, browser/cellular end-to-end, genuine email-confirmation delivery, JWT expiry timing, hosted provider compatibility, failure-injection/transaction rollback under service outage. No simulated result is presented as success for these.

Auth settings actually read: email signup enabled, `mailer_autoconfirm=false`. Administrative collaborator creation deliberately preserves existing `email_confirm:true` without sending an email. This is not equivalent to testing public signup email confirmation.

## 4. Endpoint inspection and reproduced defects

Baseline source inspected:

- `supabase/functions/create-user/index.ts`
- `supabase/functions/manage-user/index.ts`
- settings `dialogs/useUserCreation.ts`, `UserList.tsx`, `RoleAssignmentPanel.tsx`, `hooks/useUserManagement.ts`.

### Baseline real executions

- Administrator created a fictional collaborator: 200. Profile canonical role `user`, real login 200.
- Deactivation: 200, profile false, password login 400 (banned).
- Authorized reactivation: 200, profile true, login 200.
- **Security defect reproduced:** an administrator whose profile had been set inactive could still deactivate another account with its already-issued token. Baseline endpoint returned 200 and the target became inactive. `has_role` alone did not check active status.

### Inspection findings

1. `create-user` accepts any truthy role and ignores profile/role mutation errors. It may report a successful user object after partial configuration.
2. `manage-user` ignores both profile mutation and Auth ban/unban errors; `!!active` accepts coerced non-booleans.
3. Both administrative endpoints require active canonical admin + valid company checks, not merely `has_role`.
4. The existing trigger creates an initial owner company/admin for every new Auth user. Creation then moves only the profile and role to the caller's company, leaving the initial company behind. This baseline behavior remains a limitation below.
5. No ordinary-edit action existed in `manage-user`. Ordinary profile edits can already use authenticated direct profile updates.
6. RoleAssignmentPanel uses **direct `set_user_role` RPC**, not manage-user. This exact real RPC contract was tested.
7. Frontend role choices include values absent from the enum; `ativo ?? true` display logic still treats NULL as active. Those frontend/session candidates belong to the main thread and were not modified.

## 5. Final candidate-only compatibility fixes

Added/staged only:

- `g0.1/candidate/supabase/functions/_shared/g01-admin.ts`
- `g0.1/candidate/supabase/functions/create-user/index.ts`
- `g0.1/candidate/supabase/functions/manage-user/index.ts`

No main-thread session/frontend candidates were modified.

### Administrative authorization

Validate caller JWT with Auth; require existing profile, `ativo === true`, valid existing organization, exactly one canonical `admin` role, and matching profile mirror. Use service credentials only after verifying the caller. Failures return controlled 401/403/400/409/503 with CORS/no-store, never credentials/internal query messages.

### create-user

Preserves `{email,password,name,role}` → `{user:{id,name,role}}` contract. Validates only existing roles `admin`, `user`, `entregador`; no new roles. Existing admin ability to grant admin to a third party is preserved rather than silently redesigning administrative policy.

New account starts banned until all profile and canonical-role writes/readbacks succeed. Requires initial profile from the existing new-user trigger; **never reconstructs a missing profile**. Checks errors/readbacks and only then unbans. On partial failure, attempts to leave profile inactive and Auth banned and returns failure, not false success.

### manage-user

Preserves toggle/reset/delete payloads; adds scoped `edit` (name only) and `set_role` action. Self-management and cross-company targets denied. Rejects extraneous/smuggled fields, strict boolean active, supported role only.

- `toggle_active`: checks profile and Auth operations. Reactivation requires consistent existing canonical role/mirror; unban while inactive, then activation, with reban if activation fails. Deactivation writes inactive first, then ban.
- `set_role`: invokes the candidate atomic role RPC with the caller's JWT, not direct independent service-role role writes.
- `edit`: name only, never company/role/activation modification.
- `reset_password`/`delete`: preserved and error-checked, but destructive/reset flows were not part of executed tests.

### Remaining candidate limitations / release blockers

- Creation profile/role assignment is still multiple service calls, not a transaction. Temporary ban/readbacks reduce exposure but do not make it atomic.
- Initial trigger-created company remains after moving the collaborator to the caller's company; fictional accounts demonstrated extra company rows. No cleanup or trigger rewrite was added in this scope. Administrative creation needs an independently reviewed transactional provisioning design before production approval.
- Compensating ban/deactivation writes are best-effort; injected double failures were not tested. Do not claim guaranteed containment if both service operations fail.
- Reactivation target authorization and caller status can race with concurrent changes after the authorization read; concurrent admin operations were not fault/race tested.
- Backend-wide active-account enforcement for every unrelated table/policy is outside scope; profile endpoint checks do not prove every other query rejects an already-issued inactive token.
- Added edit/set_role actions have no new UI caller here. Existing ordinary name self-edit and direct role RPC are compatible and actually tested.

## 6. Real executed candidate results — 44 passing assertions

These are real HTTP/status/readback checks against local Auth/PostgREST/complete draft schema, not mocks.

| Flow / assertion group | Observed |
|---|---|
| Anonymous management | 401 |
| Ordinary collaborator management | 403 |
| Other-company admin management | 403 |
| Administrator self-management | 403 |
| String active instead of boolean | 400 |
| Inactive admin, existing token | 403 (baseline incorrectly returned 200) |
| Ordinary administrator name edit + readback | 200; requested fictional name saved |
| Smuggled role in edit | 400 |
| Role endpoint change | 200; canonical and mirror both entregador |
| Existing direct role RPC | 204; mirror changed back to user |
| Deactivate + persisted flag | 200; ativo false |
| Banned real password login | 400 |
| Banned token profile recovery | 401 from real Auth validation (not misreported as SQL 403) |
| Authorized reactivate + flag + login | 200; ativo true; password login 200 |
| Existing verified profile read | 200 |
| Existing profile recovery/verification | 200, no recreation |
| Direct RPC with profile false but no Auth ban | 403 |
| Unsupported gerente before Auth creation | 400 |
| Candidate collaborator creation | 200; correct caller company; canonical entregador |
| Candidate collaborator password login/read | 200 / 200 |
| Complete schema NULL ativo insert/update | 400 (NOT NULL protection) |
| Missing profile read/recovery | 404 / 409; zero profile recreated |
| Self ativo/role/company forgery | 403 each |
| Organization owner transfer forgery | 403 |
| Direct canonical role insert forgery | 403 |
| Admin self-role RPC | 403 |
| Missing profile self-insert | 403 |
| Authorized reactivate with divergent role | 409 |
| Authorized reactivate after explicit fictional admin evidence repair | 200 |
| Ordinary authenticated self name edit/readback | 204; role user and active true preserved |

Baseline executions are separate from the 44 candidate assertions. An initial candidate test expectation incorrectly expected 403 for an Auth-banned token; the actual 401 was observed, explained, corrected, and rerun. Dependency `/cors` mismatch and nullable data type-check were also fixed before the final runs.

Both new candidate administrative entrypoints passed **Deno check**, using temporary no-config runtime copies. No frontend app build/typecheck was manually run; preview build log latest entries report build OK.

Temporary scripts/results/schema inventories reside under `/tmp/g01-validation`; contain no operational fixtures but the accounts file holds secrets and is **not** a deliverable. Accounts were one-off Auth API test accounts, not committed replay seeds.

## 7. Exact candidate versions

SHA-256:

| File | SHA-256 |
|---|---|
| create-user/index.ts | `fa33c3b10a761bcda5b41f8932b8cd1c1838eb5080b4e6aef0f69250e4e9a681` |
| manage-user/index.ts | `6af8e5f193b215afa5c68e81a4bae411124089ea603cefce449e23b1cf549e97` |
| _shared/g01-admin.ts | `dc1bf27106438aa8599ed8a48c1c0a011dbd0fc899a67a0679b83ffa601b8c5a` |

All preexisting `g0.1/candidate/src` files were hash-compared and untouched. Active source/functions remained untouched **except** automatic regeneration of `src/integrations/supabase/types.ts` by the isolated migration tool. This generated change is disclosed rather than claiming every source byte stayed identical.

## 8. Handoff to the main thread

1. Incorporate this report and the three endpoint candidates; do not overwrite shared auth-generation/frontend revisions.
2. Treat the SQL as validated on the complete draft snapshot, with explicit production-drift comparison limitations.
3. Review provisioning atomicity, leftover initial company and compensation guarantees before production approval.
4. Complete standard gateway/managed edge and browser/cellular tests once the gateway route issue is resolved. This review used direct real services and does not substitute for that layer.
5. Reconcile enum/UI role choices and active NULL presentation in the main thread without introducing new roles.
6. Keep recovery fail-closed: existing profile true only; absent profile remains blocked without independent activation evidence.
7. Do **not** accept or publish this draft now. Recorded migration acceptance must be coordinated to avoid duplicate migration application in the main thread.

**Production was not changed, no backup was restored, and this draft was neither accepted nor published.**