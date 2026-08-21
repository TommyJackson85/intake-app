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

The static project site lives in [`site/`](site/) and is intentionally separate from the
server-backed Next.js application. The
[`Deploy GitHub Pages`](.github/workflows/pages.yml) workflow publishes it after changes reach
`main`. GitHub Pages cannot run the application's API routes, authentication, or database
integrations; the complete product remains hosted on Vercel.
