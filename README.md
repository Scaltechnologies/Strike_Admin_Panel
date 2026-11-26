# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## Deployment (CI/CD)

`.github/workflows/admin-ci-cd.yml` handles everything:

- **Pull request to `main`**: install, lint (report-only for now), type-check and build.
- **Push/merge to `main`**: the same checks, then the built `dist/` is copied over SSH to the
  Hostinger VPS and goes live at https://admin.strikeapp.in. The job then checks that the live
  site serves the new bundle.
- **Manual redeploy**: GitHub → Actions → *Admin Panel CI/CD* → *Run workflow*.

The script on the server (`scripts/deploy-admin-remote.sh`) keeps the previous release in
`<web-root>.prev` and restores it automatically if the deploy fails. `https://admin.strikeapp.in/version.txt`
shows the commit that is live.

**One-time setup** (Settings → Secrets and variables → Actions):

| Name | Kind | Value |
|---|---|---|
| `VPS_HOST` | secret | same as in Strike_Backend |
| `VPS_USER` | secret | same as in Strike_Backend |
| `VPS_SSH_PRIVATE_KEY` | secret | same as in Strike_Backend |
| `ADMIN_WEB_ROOT` | variable (optional) | nginx `root` for admin.strikeapp.in; found automatically if unset |
| `VITE_API_BASE_URL` | variable (optional) | defaults to `https://api.strikeapp.in` |
