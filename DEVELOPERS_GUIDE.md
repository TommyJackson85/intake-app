INTERNAL:
- app/api/leads/route.ts
- app/api/gdpr/export/route.ts
- app/api/clients/route.ts
- app/api/matters/route.ts
- app/api/aml/route.ts

EXTERNAL:
- app/api/external/leads/route.ts           (new)
- app/api/external/gdpr/export/route.ts     (new / moved)

BACKFILL PASSWORD command example
npm run backfill:password -- user@firm.com "TempP@ssw0rd!"
