# Developer README — Phase 3 (Secure User Profile Dashboard)

This README is written for developers who need to clone, run, test, and understand the security decisions made for Phase 3 of the project.

## Quick start — Clone, install, run

1. Clone the repo

```powershell
git clone <repository-url>
cd developer-portfolio
```

2. Backend setup

```powershell
cd backend
npm install
# Copy .env.example to .env and fill values (see notes below)
```

3. Frontend setup

```powershell
cd ../frontend
npm install
```

4. Start services (in separate terminals)

```powershell
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

---

## Environment variables (important)

- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` and `JWT_REFRESH_SECRET` — JWT signing secrets
- `SESSION_SECRET` — session secret used by CSRF/session code
- `ENCRYPTION_KEY` — 32-byte key (base64 or hex) used to encrypt sensitive fields (bio and public email). Generate it using a secure RNG (see below) and do not commit to git.

Example (generate a base64 key with Node):

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Then add to `backend/.env`:

```
ENCRYPTION_KEY=YOUR_BASE64_KEY_HERE
```

---

## Input validation techniques

- Libraries used: `express-validator` for declarative request validation, `validator` for string sanitization, and Mongoose schemas for type enforcement.
- Validation strategy (defense-in-depth):
  - Accept-list and type-checking: validate the presence, type and shape of every field (e.g., strings for `firstName`, `lastName`; string email for `publicEmail`; string/nullable for `bio`).
  - Length and content constraints: enforce min/max length, allowed characters, and reject fields that contain unexpected binary or control characters.
  - Deny common attack payload shapes: reject bodies containing top-level MongoDB operators (keys starting with `$`) and `__proto__` / `constructor` keys to prevent NoSQL operator injection and prototype-pollution.
  - Canonicalization and normalization: trim whitespace, normalize unicode (NFKC) where appropriate, and normalize email addresses before validation.
  - Sanitization: strip HTML tags and unsafe attributes with `validator.stripLow()`/`validator.escape()` for stored plaintext fields; when storing encrypted versions the sanitized plaintext is encrypted first.

Examples (server-side validation snippets):

```js
const { body } = require('express-validator');

app.put('/api/profile', [
  body('firstName').isString().isLength({ min: 3, max: 50 }).trim().matches(/^[\p{L} '-]+$/u),
  body('lastName').isString().isLength({ min: 3, max: 50 }).trim().matches(/^[\p{L} '-]+$/u),
  body('publicEmail').optional({ nullable: true }).isEmail().normalizeEmail(),
  body('bio').optional({ nullable: true }).isString().isLength({ max: 500 }).trim()
], validationHandler, async (req, res) => {
  // Additional deny-list checks
  for (const k of Object.keys(req.body)) {
    if (k.startsWith('$') || k === '__proto__' || k === 'constructor') return res.status(400).json({ error: 'Invalid input' });
  }
  // sanitize using validator
  const safeBio = req.body.bio ? validator.escape(validator.stripLow(req.body.bio)) : undefined;
  // ...encrypt and save
});
```

Test cases and example attack payloads (documented and asserted in tests):

- XSS attempt: `bio: "<script>alert(1)</script>"` → server strips tags or rejects, response `400` or sanitized string saved.
- NoSQL operator attempt: `{ "email": { "$gt": "" } }` → rejected by type-checking and deny-list, response `400`.
- Prototype pollution: `{ "__proto__": { "isAdmin": true } }` → rejected by key deny-list, fields not merged into user objects.

Recommended additional protections:

- Add `express-mongo-sanitize` to remove operator chars from incoming JSON automatically.
- Use strict Mongoose schemas with `strict: true` to prevent saving unexpected properties.
- Prefer explicit field mapping rather than `Object.assign(req.body)`; merge only allowed fields.


---

## Output encoding methods

- General principle: always apply context-appropriate output encoding at the last point before rendering. For HTML contexts use HTML escaping; for attribute contexts use attribute escaping; for JSON endpoints ensure you do not inject user content into HTML on the client without escaping.

- Frontend (React):
  - React escapes values rendered in JSX by default. Do not use `dangerouslySetInnerHTML` unless you intentionally allow sanitized HTML and document a clear sanitization policy.
  - If rich HTML is required, sanitize server-produced or user-provided HTML with `DOMPurify` on the client (or on the server) using a strict allow-list.

- Server-side escaping and examples:
  - Use `validator.escape()` for strings rendered into HTML templates or for admin preview pages.
  - Example: `res.render('profile', { bio: escape(user.bio) })` (if using server rendering with templates).

Example code snippets:

```js
// server-side escape example using validator
const escape = require('validator').escape;
app.get('/profile/:id', async (req, res) => {
  const profile = await User.findById(req.params.id);
  res.json({
    firstName: escape(profile.firstName),
    lastName: escape(profile.lastName),
    bio: escape(profile.bio || '')
  });
});
```

Content Security Policy & headers:

- Use `helmet()` to add security headers and set a restrictive Content-Security-Policy (CSP) to mitigate injected scripts even if something slips through.
- Example CSP: `default-src 'self'; script-src 'self'; object-src 'none';` (adjust based on app needs).

Testing and verification:

- Add end-to-end tests that render fetched data into the DOM and assert that script tags or event handlers do not execute (use headless browsers or Playwright/Puppeteer).


---

## Encryption techniques used

- At rest (field-level encryption):
  - Implementation: `backend/services/encryptionService.js` uses AES-256-GCM (authenticated encryption) to encrypt sensitive fields (`bio`, `publicEmail`) before saving them to the DB.
  - Ciphertext format: `base64(iv):base64(ciphertext):base64(authTag)` stored in `profile.bioEncrypted` and `profile.publicEmailEncrypted` while plaintext fields are cleared or omitted.
  - Key handling: the implementation reads `ENCRYPTION_KEY` from environment and performs a direct symmetric encryption. For production use, prefer envelope encryption with a KMS (AWS KMS, Azure Key Vault, GCP KMS) to store the data-encryption key (DEK) and rotate keys safely.

- In transit (TLS/HTTPS):
  - The app should be served over HTTPS in production. Local development includes `ssl/` and helper scripts (`ssl_setup.ps1`) for dev certs; production should use certificates from a trusted CA (Let's Encrypt or vendor CA) and terminate TLS at the load balancer or reverse proxy.
  - Enforce HTTPS by redirecting HTTP to HTTPS and add HSTS headers in production: `app.use(helmet.hsts({ maxAge: 31536000 }))`.

- Key management & rotation:
  - Do not hardcode keys or commit them to source control. Use environment secrets for development (e.g., `.env`), and a secrets manager or KMS for production.
  - To rotate keys: re-encrypt data with a new DEK and maintain metadata to indicate key version. Implement a background migration script (`migrate-encrypt-profiles.js`) that can re-encrypt using the new key while retaining an ability to decrypt older versions if necessary.

- Additional integrity and protections:
  - AES-GCM provides authentication (authTag). Verify the tag at decryption and handle failures gracefully (do not return decrypted data if auth fails).
  - Consider using authenticated key-wrapping or higher-level libraries if available.

Verification & testing:

- Unit test encryption/decryption round trips in `backend/services/encryptionService.test.js` to ensure correctness and tag verification.
- In staging, verify TLS configuration using `openssl s_client -connect hostname:443` and check certificate chain and protocol versions.


---

## Third-party dependency management

- Automation & tooling:
  - `Dependabot` is configured to scan both `/backend` and `/frontend` and open PRs for dependency updates on a schedule.
  - GitHub Actions workflow (`.github/workflows/security-audit.yml`) runs `npm audit --json` for each package set and uploads JSON artifacts and a human-readable summary.
  - Locally, run `npm audit` and `npm audit --json`; for CI scripts use `npm ci` followed by `npm audit --json` for reliable results.

- Triage and remediation process (recommended lifecycle):
  1. Dependabot opens a PR for a dependency bump. The CI runs tests and the security audit job.
  2. Review the PR: check the changelog, run unit/integration tests locally, and ensure no breaking changes.
  3. For direct dependencies, prefer minor/patch upgrades that pass tests and security checks. For major upgrades, create a feature branch, run full test suites, and manually test critical flows.
  4. For transitive vulnerabilities (e.g., `cookie` via `csurf`) that cannot be fixed immediately, document the risk, search upstream for fixes, and either update the parent dependency, replace the dependency, or add compensating controls (server-side sanitization, stricter input validation). Track these with an issue and Dependabot security alerts.

- Policies & best practices:
  - Pin or lock dependencies via `package-lock.json` and commit lockfiles. Use `npm ci` in CI for deterministic installs.
  - Enable Dependabot security updates and set a policy for automatic merging for low-risk patch updates (optional and only if tests pass and you have staging verification).
  - Schedule regular `npm audit` reviews and consider integrating SCA tools like Snyk for richer vulnerability context.

- Local reproduction & remediation commands:

```powershell
# Reproduce audit locally
cd backend
npm ci
npm audit --json > backend-audit.json

# Attempt automatic fix for non-breaking changes
npm audit fix

# For forced updates (use with caution)
npm audit fix --force
```

- Documenting decisions:
  - Record why a dependency was kept, updated, or replaced in `docs/DEPENDENCY_MANAGEMENT.md` or an issue tracker entry. For known unresolved transitive vulnerabilities, include a mitigation plan and expected timeline.


---

## Migration script

- Script: `backend/scripts/migrate-encrypt-profiles.js` — encrypts existing plaintext `profile.bio` and `profile.publicEmail` values and stores ciphertext in the encrypted fields.
- Usage: ensure `MONGODB_URI` and `ENCRYPTION_KEY` are set (in `.env` or environment), then run:

```powershell
cd backend
node scripts/migrate-encrypt-profiles.js
```

---

## Tests

- Unit and integration tests use Jest + Supertest. Test suites are in `backend/tests/`.
- To run tests locally:

```powershell
cd backend
npm install
npm test
```

### Test environment notes

- Tests are designed to run without a separate database or running servers:
  - Each test suite creates an isolated in-memory MongoDB using `mongodb-memory-server`.
  - `server.js` is test-friendly: it exports the Express `app` and does not start the HTTPS listener when `NODE_ENV === 'test'`.
  - Rate limiting is disabled in tests to avoid 429 responses and email sending is stubbed in test mode to avoid SMTP/TLS failures.
- When debugging tests, inspect:
  - `backend/jest.setup.js` — Jest configuration and env loading.
  - `backend/tests/*.test.js` — test suites (some create their own `mongodb-memory-server` instances).
  - `backend/server.js` — exports the app; note the test-mode guard.

### Running tests in CI

- In CI, run the backend test suite similarly with `npm ci && npm test -- --runInBand` to reduce flakiness.
- Recommended CI step (example inside the existing audit matrix job for `backend`):

```yaml
- name: Run tests
  working-directory: ./backend
  run: npm ci && npm test -- --runInBand
```

- Keep `npm test` and `npm audit` as separate steps so output and failures are easy to interpret.

---

## Testing checklist for security verification

- Submit XSS payloads in `bio` — confirm they are stripped or rejected and not executed when viewing the profile.
- Verify `profile.bioEncrypted` contains ciphertext in the DB and plaintext `profile.bio` is cleared.
- Attempt NoSQL operator injection payloads — server should validate and reject unexpected types.
- Run `npm audit` locally and review the output; address high/critical findings before production deploy.

### Additional recommended checks (developer-focused)

- Add integration tests for `POST /api/blog` and `POST /api/projects` that create content with malicious payloads and then fetch it to assert sanitization.
- Add prototype-pollution tests (attempt `__proto__` or `constructor.prototype` payloads) to ensure inputs are not merged insecurely.

---

## Lessons learned

- Input validation and output encoding are complementary: validating input reduces unsafe data, while encoding prevents execution when data is displayed.
- Encryption at rest protects sensitive fields from DB compromise, but key management is critical: use environment secrets or a KMS.
- Automation (Audit Actions) is valuable but requires human review and testing for safe upgrades.

---

## Developer notes (maintainers)

- When editing security-sensitive code paths (validation, sanitization, encryption), add a focused integration test that reproduces the attack vector and asserts the safe behavior.
- For transitive dependency vulnerabilities that cannot be fixed immediately, document the risk and add compensating controls (e.g., restrict inputs, replace package) and track with Dependabot/Snyk.
- Consider adding `express-mongo-sanitize` and `sanitize-html` for stricter server-side protections if you accept any HTML from users.
 
---

## Reflection Checkpoint

Part B — Design a Secure User Profile Update Form

- Vulnerabilities from improper input validation:
  - Cross-Site Scripting (XSS): unsanitized HTML or script content stored and later rendered leads to script execution in other users' browsers.
  - NoSQL/Injection: allowing operator-like payloads (e.g., `{ "$gt": "" }`) or unvalidated types can cause unintended queries or privilege escalation.
  - Prototype pollution: accepting `__proto__`/`constructor` keys can change object prototypes and break authorization logic.
  - Data integrity issues: malformed types (arrays/objects where strings expected) can cause app crashes or logic bypasses.

- How output encoding prevents XSS:
  - Output encoding transforms special characters into safe representations for the target context (HTML, attribute, JavaScript), preventing the browser from interpreting them as executable code.
  - In React, values rendered in JSX are escaped by default which mitigates many XSS risks. When rich HTML is required we sanitize with a vetted library such as `DOMPurify` using a strict allow-list.
  - Example: storing `&lt;script&gt;` instead of `<script>` prevents execution when displayed as HTML text.

- Encryption challenges and resolutions:
  - Key management: storing encryption keys securely and rotating them is challenging. Resolution: use environment variables for development, and recommend a KMS (AWS KMS/Azure Key Vault/GCP KMS) for production DEK storage and rotation.
  - Ciphertext format and interoperability: choosing a canonical storage format (IV:ciphertext:authTag) and testing round-trip encryption/decryption solved interoperability issues across services.
  - Tests: early test failures occurred when decrypting due to missing keys or incorrect base64 handling. Resolution: add unit tests for encryption round-trips and ensure `ENCRYPTION_KEY` is present in test envs.

Part C — Update Third-Party Software and Libraries

- Why outdated libraries are risky:
  - Known vulnerabilities (RCE, XSS, CSRF, information disclosure) are often fixed in newer releases; staying on old versions exposes the app to public exploits.
  - Outdated libs can introduce incompatibilities or prevent using improved security features (e.g., stricter cookie handling, CORS defaults).

- How automation helps with dependency management:
  - Tools like Dependabot and scheduled `npm audit` flag vulnerable packages and open PRs, reducing the window between vulnerability disclosure and remediation.
  - CI audits provide reproducible reports and artifacts that document the state of dependencies for reviewers.

- Risks of automation:
  - False positives or noisy updates: automation can create many PRs for low-impact or irrelevant updates, creating churn.
  - Breaking changes: automated major upgrades can introduce breaking API changes; always run tests and manual reviews for major bumps.
  - Over-reliance: automation is useful but does not replace human risk analysis for critical dependencies.

Part D — Test and Debug

- Most challenging vulnerabilities to address:
  - Transitive vulnerabilities in widely used transitive packages (e.g., `cookie` via `csurf`) were hard because they require upstream fixes or package replacement.
  - Test flakiness due to external services (real SMTP/TLS, rate-limiting) required stubbing and careful environment control.

- Additional testing tools and strategies:
  - Static Analysis and SCA: use Snyk or GitHub Advanced Security to augment `npm audit` with exploit details and remediation suggestions.
  - DAST: run OWASP ZAP or Burp Suite scans against a staging instance to detect runtime issues (reflected and DOM XSS, authentication flows).
  - E2E tests with Playwright or Cypress: verify rendered output in a browser context to ensure scripts do not execute and input sanitization holds at render time.
  - Fuzzing and mutation testing: generate unexpected inputs to catch parsing and validation edge-cases.


## Attributions

This project uses or references the following libraries, tools and resources. These are included for transparency and to help future maintainers trace security-related decisions and implementations.

- Server-side libraries and tools:
  - `express` — web framework for Node.js
  - `express-validator` — declarative request validation
  - `validator` — string validation and sanitization helpers
  - `helmet` — security-related HTTP headers
  - `csurf` — CSRF protection middleware
  - `express-rate-limit` — basic rate limiting middleware
  - `argon2` — password hashing
  - `mongoose` — MongoDB ODM
  - `mongodb-memory-server` — in-memory MongoDB for tests

- Client-side libraries and tools:
  - `react` — UI framework
  - `DOMPurify` (recommended) — client-side HTML sanitizer for any allowed rich text

- CI, dependency and security tooling:
  - GitHub Actions — CI workflows and `security-audit.yml` for automated `npm audit`
  - Dependabot — automated dependency update PRs
  - `npm audit` — vulnerability scanning for npm packages
  - Snyk / GitHub Advanced Security (recommended) — SCA and richer vulnerability context

- Testing and QA:
  - `jest` and `supertest` — unit and integration testing
  - Playwright / Cypress (recommended) — browser-based E2E testing and recording
  - OWASP ZAP / Burp Suite (recommended) — DAST tools for runtime vulnerability scanning

- References and guidance materials:
  - OWASP Top Ten — guidance on common web application vulnerabilities
  - Mozilla Web Security Guidelines — for CSP and TLS recommendations

If you used any other third-party tools, libraries, or resources for your demo or development that are not listed here, please add them to this section with a short note about how they were used.

## Attributions (APA 7)

The following references list the primary libraries, tools, and resources used by this project formatted according to APA 7 style. Where an individual publication date or version is not specified by the upstream project, (n.d.) is used and the URL is provided for reference.

- Express. (n.d.). Express: Fast, unopinionated, minimalist web framework for Node.js. Retrieved November 23, 2025, from https://expressjs.com/
- express-validator contributors. (n.d.). express-validator (validation middleware for Express). Retrieved November 23, 2025, from https://github.com/express-validator/express-validator
- validator.js authors. (n.d.). validator.js: String validation and sanitization. Retrieved November 23, 2025, from https://github.com/validatorjs/validator.js
- Helmet contributors. (n.d.). Helmet: Secure your Express apps by setting various HTTP headers. Retrieved November 23, 2025, from https://github.com/helmetjs/helmet
- csurf contributors. (n.d.). csurf: CSRF protection middleware for Express. Retrieved November 23, 2025, from https://github.com/expressjs/csurf
- express-rate-limit contributors. (n.d.). express-rate-limit: Basic rate-limiting middleware for Express. Retrieved November 23, 2025, from https://github.com/nfriedly/express-rate-limit
- Argon2 authors. (n.d.). argon2: Password hashing for Node.js. Retrieved November 23, 2025, from https://github.com/ranisalt/node-argon2
- Mongoose. (n.d.). Mongoose: Elegant MongoDB object modeling for Node.js. Retrieved November 23, 2025, from https://mongoosejs.com/
- mongodb-memory-server contributors. (n.d.). mongodb-memory-server: Run MongoDB for testing effciently in memory. Retrieved November 23, 2025, from https://github.com/nodkz/mongodb-memory-server
- React. (n.d.). React: A JavaScript library for building user interfaces. Retrieved November 23, 2025, from https://reactjs.org/
- GitHub, Inc. (n.d.). GitHub Actions: Automate, customize, and execute your software development workflows. Retrieved November 23, 2025, from https://docs.github.com/actions
- npm, Inc. (n.d.). npm audit: Find and fix vulnerabilities in your dependencies. Retrieved November 23, 2025, from https://docs.npmjs.com/cli/v9/commands/npm-audit
- Snyk Ltd. (n.d.). Snyk: Developer security for dependencies and containers. Retrieved November 23, 2025, from https://snyk.io/
- Jest contributors. (n.d.). Jest: Delightful JavaScript testing. Retrieved November 23, 2025, from https://jestjs.io/
- Mozilla Developer Network. (n.d.). Web security guidelines and recommendations (Content Security Policy, TLS). Retrieved November 23, 2025, from https://developer.mozilla.org/




