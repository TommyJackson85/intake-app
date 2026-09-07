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

**Not included in the static export** (stashed only for that build, then restored): API route
handlers, request-time proxy/middleware, force-dynamic pages, server actions, and dynamic App
Router segments that lack `generateStaticParams` (for example `/demo/matters/[id]`, portal/intake
token routes). Those remain on Vercel.
