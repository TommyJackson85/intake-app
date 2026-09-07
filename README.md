# LawIntake

LawIntake is a client-intake and matter-management workspace for real estate law firms. It
combines guided intake, matter details, documents, AML workflows, and a client portal in one
Next.js application.

[Project site](https://tommyjackson85.github.io/intake-app/) ·
[Live application](https://intake-app-dun.vercel.app/) ·
[Interactive demo](https://intake-app-dun.vercel.app/demo)

## Local development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npm run type-check
npm test
npm run check:compliance
```

Environment setup and database instructions are available in
[`docs/dev-setup.md`](docs/dev-setup.md).

## GitHub Pages

The marketing landing files at the repository root (`index.html`, `styles.css`, `script.js`) remain
available for the existing Pages site. The Next.js app can also be built as a **static export** for
project Pages under the repository base path `/intake-app`.

### Static export (route-safe for `/intake-app`)

GitHub Pages has no Node server, so export mode is **opt-in** and must not be used for Vercel:

```bash
npm run build:github-pages
```

This sets `GITHUB_PAGES=true`, which configures `next.config.js` with:

| Setting | Value | Why |
| --- | --- | --- |
| `output` | `'export'` | Emit static HTML/CSS/JS into `./out` |
| `basePath` / `assetPrefix` | `/intake-app` | Match `https://tommyjackson85.github.io/intake-app/` |
| `trailingSlash` | `true` | Emit `…/demo/index.html` so Pages serves folder URLs |
| `images.unoptimized` | `true` | Image Optimization API is unavailable on static hosts |

Vercel / `npm run build` leave `GITHUB_PAGES` unset, so those deployments keep root paths, server
headers, and the normal Next server output.

Publish the generated `./out` directory as the GitHub Pages artifact (or copy it into your Pages
publishing folder). Client navigation via `next/link` and bundled assets include the `/intake-app`
prefix automatically when built this way.

**Not included in the static export** (stashed only for that build, then restored):

- All `app/api/**` route handlers and `app/auth/logout`
- `app/auth/post-login` (`force-dynamic`) and `app/auth/signup` (Server Action)
- `app/dashboard/**` (server/cookie-backed product UI)
- Dynamic segments without `generateStaticParams`: `/demo/portal/[token]`,
  `/demo/intake/[token]`, `/demo/fincen-cert/[token]`, `/intake/[token]`
- `proxy.ts` (request-time middleware replacement; unsupported for export)

`/demo/matters/[id]` is included in the static export: `generateStaticParams` emits one page
per seeded demo matter `file_id`.

Those capabilities remain on Vercel. Hardcoded absolute `<a href="/…">` strings (not `next/link`)
are not rewritten by `basePath`; prefer `next/link` for in-app navigation.
