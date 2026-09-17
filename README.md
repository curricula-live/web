# curricula.live web

React frontend for [curricula.live](https://curricula.live), a teacher-facing knowledge and planning platform.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- CSS Modules
- explicit CSS design tokens

Next.js provides the application structure, routing, rendering and build conventions around React. Product components should keep ordinary React concepts visible and avoid framework-specific abstraction unless it solves a concrete problem.

## Development

Requirements:

- Node.js 22 or newer
- npm

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Verification

Before opening or merging a pull request, run:

```bash
npm run lint
npm run typecheck
npm run build
```

The same checks run in GitHub Actions for pull requests to `dev` and `main`.

## Branch model

```text
main
  production

dev
  integration / preview

feat/*
  focused implementation branches
```

Normal work should follow:

```text
GitHub issue
  -> feature branch from dev
  -> pull request to dev
  -> CI + deployment preview
  -> review
  -> merge to dev
```

Production releases use an explicit `dev -> main` pull request.

## Initial product constraints

The frontend should remain search-first and teacher-facing. Product functionality will be introduced incrementally rather than mocked in the foundation.

Near-term decisions already established:

- global navigation will expose `Teacher Planning`, `About`, and a disabled `Sign in` affordance until Google SSO is implemented;
- anonymous browsing and concept selection should remain possible;
- Teacher Planning begins with concept selections only;
- search results will use real backend data and depend on `curricula-live/api#37`;
- `Curriculum` may appear as a disabled search category before curriculum mappings exist;
- student-stage filters are curriculum-neutral; Primary and Adult will initially remain unavailable while Lower secondary and Upper secondary are the first intended supported stages once backend metadata exists;
- concept pages are professional teacher reference surfaces rather than textbook-style student lessons;
- no large UI component library, glass effects, gradients, generic dashboard-card language, or fabricated API content.

## Project structure

```text
app/                  Next.js routes and layouts
styles/               shared design tokens
.github/workflows/     CI
```

Feature-specific component and data-access directories should be added only when the corresponding functionality exists.

## Backend

The public Django API is deployed separately at `api.curricula.live` and exposes its stable contract under `/v1/`.

The frontend should access backend data through small typed functions rather than scattering raw `fetch` calls throughout React components.

## Deployment

The intended deployment model is Vercel with Git-connected preview deployments for feature branches and `dev`, while `main` represents production. The public `curricula.live` domain should only be moved after the new frontend has been reviewed on a preview deployment.
