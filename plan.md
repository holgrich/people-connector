# Connect App — Implementation Plan

> **Status legend:** `[ ]` not started · `[~]` in progress · `[x]` done · `[-]` deferred/skipped

---

## Vision

An AI-powered social app that learns who you are through conversation, then connects you with people nearby who are genuinely compatible — and helps you actually talk to them once you meet.

---

## App Name

> TBD — placeholder: **"Connect"**

---

## Three Products (in implementation order)

### Product 1 · AI Conversation & Profile Building ← *current focus*

The app asks users AI-generated questions. Users answer by voice or text. The app responds with something fun (a quip, a follow-up, a reflection). Behind the scenes, answers build a lightweight character profile of the user.

**Profile dimensions (non-exhaustive, refined later):**
- Introvert / extrovert tendency
- Occupation / field
- Hobbies & interests
- Communication style
- Values

**Key UX rule:** The primary experience is entertainment / curiosity. Profile-building is a side effect, not the framing.

---

### Product 2 · Nearby People Discovery & Matching

Users can browse a pool of nearby people (target: within walking/cycling distance, not 45-min-by-transit). Matching is based on the profiles generated in Product 1.

**Key differentiator:** Hyper-local. Small pool (~10 people), high compatibility signal.

---

### Product 3 · Facilitated Meeting (Future / Far Scope)

**No in-app chat.** The philosophy: push people toward a real-world meeting, not keep them typing at each other forever. Once matched, the app acts as a coordinator:

- Shares basic contact details with both parties (name, maybe phone/email — exact scope TBD)
- OR (preferred): app proactively suggests a specific plan — *"You both like nature walks, you're both free tomorrow at 5pm, weather looks good — meet at [park] at 5?"*
- Calendar integration to find shared free slots
- Weather API to filter outdoor suggestions
- Google Maps for location suggestions
- Possible: in-app assistant for last-minute coordination (e.g. one person gets cold feet)

> Explicitly deferred. Not in scope for the first version. Vision is clear, implementation order TBD.

---

## Technical Stack

> **Decision criteria:** cross-platform (one codebase for iOS + Android), easy to implement, easy for AI to write real code for, cheap, microphone must work.

| Layer | Choice | Notes |
|---|---|---|
| App framework | **Expo (React Native)** | JavaScript/TypeScript; one codebase for iOS + Android; microphone works natively; huge ecosystem; no Xcode/Android Studio needed to start |
| AI | **Mistral API** | Question generation, response logic, profile extraction. `mistral-small` is cheapest; upgrade to `mistral-large` if quality needs it |
| Voice input | **Expo AV + Whisper API** | Record audio with Expo's built-in audio library, send to OpenAI Whisper for transcription |
| Auth | **Supabase Auth** — email + password to start | Social login (Google, Apple) can come later |
| Backend | **Supabase** | PostgreSQL; great CLI; free tier; open source; SQL is better than NoSQL for matching/querying profiles |
| Location | Device GPS via **Expo Location** | Only used for proximity matching in Product 2 |

### Previously explored (not chosen)
- **FlutterFlow** — tried previously; microphone access was a blocker; visual builder limits what code can be written directly
- **Firebase** — tried previously; functional but web-console-only management is inconvenient; NoSQL is less suitable for profile matching queries

---

## Implementation Phases

### Phase 0 · Foundation `[ ]`

- `[x]` Set up project repository (this repo)
- `[x]` Choose and confirm tech stack: Expo + Supabase + Mistral + Whisper
- `[x]` Initialize Expo project (`app/` subdirectory, SDK 56, TypeScript)
- `[x]` Set up Supabase project + connect to app (verified in browser)
- `[ ]` Get Mistral API key
- `[ ]` Get OpenAI API key (for Whisper)
- `[ ]` Email auth: sign up, log in, log out (via Supabase Auth) ← *current*
- `[ ]` Basic app shell: tab/screen navigation skeleton

> **Note on device testing:** Expo Go on App Store doesn't support SDK 56 yet. Using browser (`npx expo start --web`) for now. A development build (requires Xcode) will be needed before testing native features like microphone.

---

### Phase 1 · AI Q&A Screen (Product 1, no profile yet)

- `[ ]` Screen: question display + text input + submit
- `[ ]` Voice input → device STT → text field
- `[ ]` Send user answer to Mistral, receive response
- `[ ]` Display AI response (text)
- `[ ]` Basic conversation flow (question → answer → response → next question)
- `[ ]` Define initial prompt/logic for Mistral (question generation style, response style)

---

### Phase 2 · Profile Building (Product 1, full)

- `[ ]` Define profile schema (fields, data types)
- `[ ]` Mistral extracts profile signals from user answers (background call)
- `[ ]` Store profile in backend (per user)
- `[ ]` Profile screen: user can view their own profile
- `[ ]` Profile editing / correction by user

---

### Phase 3 · Nearby Discovery (Product 2)

- `[ ]` Location permission + GPS capture
- `[ ]` Store anonymized location in backend (privacy: coarse location only)
- `[ ]` Query: find users within X km
- `[ ]` Compatibility scoring logic (profile similarity)
- `[ ]` Discovery screen: show ~10 nearby compatible people (name, profile summary)
- `[ ]` "Connect" / express interest action
- `[ ]` Match notification when both sides express interest

---

### Phase 4 · Facilitated Meeting (Product 3) `[-]` *(deferred)*

- `[ ]` Shared profile view for a matched pair
- `[ ]` Mistral generates conversation starters based on both profiles
- `[ ]` Activity suggestions
- `[ ]` Google Maps integration
- `[ ]` Calendar integration
- `[ ]` Auto-booking

---

## Open Questions

- [x] After a match: no in-app chat — app suggests specific real-world meetup
- [ ] **Confirm tech stack:** Expo + Supabase as recommended, or different preference?
- [ ] Mistral model: `mistral-small` (cheap, fast) vs `mistral-large` (smarter, pricier) — start small, upgrade if needed
- [ ] Privacy model for location: how coarse? Neighborhood? City district?
- [ ] App name
- [ ] After a match: share contact details directly, or only via app-suggested plan?

---

## Costs (rough hobby-scale estimate)

| Service | Free tier | Notes |
|---|---|---|
| Mistral API | Pay-per-token, no free tier | `mistral-small` is very cheap (~$0.10–0.30/1M tokens) |
| Firebase / Supabase | Generous free tier | Should cover hobby scale |
| Apple App Store | $99/year | Required to distribute on iOS |
| Google Play Store | $25 one-time | Required to distribute on Android |
| FlutterFlow | Free tier available | Paid plan needed for some export/deploy features |

---

*Last updated: 2026-06-30 (session 2 — stack reconsidered; recommended Expo + Supabase; no-chat philosophy set)*
