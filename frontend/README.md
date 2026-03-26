# Frontend

[Vite](https://vite.dev/) app with [TanStack Start](https://tanstack.com/start)
and file-based routes under `src/routes`. The root shell lives in
`src/routes/__root.tsx`.

## Getting Started

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm run start
```

Preview the production build locally:

```bash
npm run preview
```

## API client

Regenerate the TypeScript client from the backend OpenAPI spec:

```bash
npm run generate-openapi-client
```

## i18n

```bash
npm run i18n:extract
npm run i18n:types
npm run i18n:sync
npm run i18n:lint
npm run i18n:validate
```

## Testing

[Vitest](https://vitest.dev/):

```bash
npm run test
```

## Styling

[Tailwind CSS](https://tailwindcss.com/) (see `src/styles.css` and
`vite.config.ts`).

## Linting and formatting

[Biome](https://biomejs.dev/):

```bash
npm run lint
npm run format
npm run check
```
