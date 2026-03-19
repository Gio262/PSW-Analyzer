# PSW Analyzer

PSW Analyzer is a browser-based password and passphrase inspection tool built with React, TypeScript, and Vite.

It evaluates password strength locally in the browser, compares theoretical and effective entropy, estimates cracking time across different attack scenarios, and can optionally check a password against the Have I Been Pwned (HIBP) Pwned Passwords dataset using the k-anonymity API flow.

## Features

- Local password analysis powered by `zxcvbn-ts`
- Dynamic language support for both the UI and `zxcvbn` dictionaries/translations
- Supported languages: Italian and English
- Strength score visualization with feedback and suggestions
- Theoretical entropy estimate based on detected character sets
- Effective entropy estimate derived from `zxcvbn` guesses
- Character group detection for lowercase, uppercase, digits, spaces, symbols, and non-ASCII presence
- Estimated crack times for multiple scenarios:
  - Rate-limited online attack
  - Slow offline hash
  - Fast offline hash
- Optional HIBP breach check
- No backend, no app telemetry, and no password logging

## Privacy Model

The app is designed to keep analysis local.

- All strength, entropy, charset, and guess analysis happens in the browser
- No password is sent to any project-owned server, because the project has no backend
- The only network request is the optional HIBP check, triggered explicitly by the user
- The HIBP flow uses k-anonymity and sends only the first 5 characters of the SHA-1 hash prefix
- The selected UI language is stored in `localStorage`

## How the App Works

When the user types a password, the app:

1. Runs `zxcvbn-ts` locally to estimate guesses, score, and structural weaknesses
2. Computes a simplified theoretical entropy value from detected character groups
3. Compares theoretical entropy with effective entropy derived from `log2(guesses)`
4. Displays estimated attack times for predefined cracking rates
5. Optionally checks the password against HIBP through the public range API

The app also switches the `zxcvbn` language package based on the selected site language:

- Italian UI -> `@zxcvbn-ts/language-it`
- English UI -> `@zxcvbn-ts/language-en`

## Tech Stack

- React 19
- TypeScript 5
- Vite 8
- `zxcvbn-ts`
- `i18next`
- `react-i18next`
- ESLint
- React Compiler via the Vite React plugin preset

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

## Available Scripts

- `npm run dev` starts the Vite development server
- `npm run build` runs TypeScript project builds and then creates a production bundle with Vite
- `npm run preview` serves the production build locally
- `npm run lint` runs ESLint on the project

## Project Structure

```text
.
|-- index.html
|-- src
|   |-- App.tsx
|   |-- App.css
|   |-- i18n.ts
|   |-- index.css
|   `-- main.tsx
|-- public
|   |-- favicon.svg
|   `-- icons.svg
|-- vite.config.ts
|-- eslint.config.js
|-- tsconfig.app.json
|-- tsconfig.node.json
`-- LICENSE
```

## Notes

- The app uses the Web Crypto API for SHA-1 hashing during the HIBP flow
- An internet connection is required only for the HIBP breach check
- Theoretical entropy is intentionally simplified and can overestimate human-created passwords
- `zxcvbn`-based effective entropy is generally more useful for real-world predictability
- Non-ASCII characters are detected and flagged because the simplified charset model becomes less precise
- The visual design uses Google Fonts loaded from the web

## Limitations

- This is an educational and diagnostic tool, not a formal password auditing platform
- Crack-time estimates are illustrative and depend on assumed attack rates
- Theoretical entropy is not a full statistical password model
- HIBP availability depends on the external service and network connectivity
- Only Italian and English are currently wired into the UI and `zxcvbn` language switching

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
