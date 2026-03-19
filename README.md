# PSW Analyzer

PSW Analyzer is a browser-based password and passphrase inspection tool built with React, TypeScript, and Vite.

It evaluates password strength locally, compares entropy metrics, estimates crack times with configurable attack rates, and can optionally check a password against the Have I Been Pwned (HIBP) Pwned Passwords dataset using k-anonymity.

## Features

- Local password analysis powered by `zxcvbn-ts`
- UI + `zxcvbn` language switching (Italian / English)
- Strength score visualization with qualitative feedback
- Three entropy views:
  - Theoretical entropy (upper-bound estimate)
  - Effective entropy from `zxcvbn` guesses
  - Conservative entropy (`min(theoretical, effective)`)
- Character group detection including Unicode-aware handling
- User-provided context words (comma separated) passed to `zxcvbn` to reduce false confidence on personal/company/domain terms
- Crack-time simulator with **editable** guess rates per scenario
- Optional HIBP breach check with:
  - explicit user consent before network call
  - k-anonymity SHA-1 prefix flow
  - mapped, user-friendly error messages
- No backend, no app telemetry, and no password logging

## Privacy Model

The app is designed to keep analysis local.

- Strength, entropy, charset, and guess estimation happen in the browser
- No password is sent to project-owned servers (there is no backend)
- The only network request is the optional HIBP check triggered explicitly by the user
- HIBP request sends only SHA-1 prefix (`first 5 chars`) via k-anonymity
- HIBP still implies normal network metadata exposure (e.g. IP/timing)
- Selected UI language is stored in `localStorage`

## How the App Works

When the user types a password, the app:

1. Runs `zxcvbn-ts` locally to estimate guesses, score, and pattern weaknesses
2. Computes a theoretical entropy estimate from detected charset groups (Unicode-aware heuristic)
3. Computes effective entropy with `log2(guesses)` and conservative entropy as a practical lower-safe indicator
4. Displays crack-time estimates with user-adjustable rates
5. Optionally checks HIBP if explicit consent is enabled

## Tech Stack

- React 19
- TypeScript 5
- Vite 8
- `zxcvbn-ts`
- `i18next`
- `react-i18next`
- ESLint

## Getting Started

### Requirements

- Node.js
- npm

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

### Run linting

```bash
npm run lint
```

### Optional: external hardware profile API

You can load crack-rate hardware profiles from an external API by setting:

```bash
VITE_HARDWARE_PROFILES_API=https://your-api.example.com/hardware-profiles
```

Expected payload shape:

```json
[
  {
    "id": "gpu_rig_x",
    "label": "GPU rig X",
    "description": "Custom benchmark profile",
    "rates": {
      "online_throttled": 100,
      "slow_hash": 80000,
      "fast_hash": 50000000000
    }
  }
]
```

If the API is unavailable or payload is invalid, the app automatically falls back to local built-in profiles.


## Available Scripts

- `npm run dev` starts the Vite development server
- `npm run build` runs TypeScript project build + Vite production build
- `npm run preview` serves the production build locally
- `npm run lint` runs ESLint

## Project Structure

```text
.
|-- src
|   |-- App.tsx
|   |-- components/
|   |   |-- CrackTimeCard.tsx
|   |   |-- EntropyCard.tsx
|   |   |-- FeedbackCard.tsx
|   |   |-- HibpCard.tsx
|   |   |-- LanguageSwitcher.tsx
|   |   `-- PasswordInputCard.tsx
|   |-- hooks/
|   |   |-- useFeedbackItems.ts
|   |   |-- useHibpCheck.ts
|   |   |-- usePasswordAnalysis.ts
|   |   |-- useHardwareProfiles.ts
|   |   `-- useZxcvbnLanguage.ts
|   |-- services/
|   |   |-- hibp.ts
|   |   `-- hardwareProfiles.ts
|   |-- utils/
|   |   `-- passwordAnalysis.ts
|   |-- constants/
|   |   `-- security.ts
|   |-- locales/
|   |   |-- en.json
|   |   `-- it.json
|   |-- i18n.ts
|   `-- main.tsx
`-- package.json
```

## Limitations

- This is an educational/diagnostic tool, not a formal auditing platform
- Crack-time values remain scenario-driven estimates
- Theoretical entropy is still an approximation
- HIBP depends on third-party service availability
- UI and bundled dictionaries are currently optimized for Italian and English

## License

MIT. See [LICENSE](./LICENSE).
