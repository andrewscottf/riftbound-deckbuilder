# Riot Riftbound catalog sync

The card catalog is imported from Riot's official `riftbound-content-v1` endpoint by a Supabase Edge Function. The Riot API key is read only inside Supabase and is never sent to the browser.

## Supabase secrets

In Supabase Dashboard → Edge Functions → Secrets, confirm `RIOT_API_KEY` exists, then add:

- `CARD_SYNC_SECRET`: a new, randomly generated secret of at least 32 characters. Keep it private; do not commit it or put it in a Vite environment variable.
- Optional `RIOT_ROUTING_REGION`: `americas`, `asia`, or `europe` (defaults to `americas`).

The function uses Supabase's server-side secret key automatically. No service-role key is needed in the frontend or repository.

## Check readiness

```sh
curl https://cenzofnbiluivakqviny.supabase.co/functions/v1/sync-riot-catalog
```

A ready response means both the Riot key and sync secret are present.

## Run a sync

Send a POST request with the sync secret in the header. Do not include the Riot key in this request.

```sh
curl -X POST \
  https://cenzofnbiluivakqviny.supabase.co/functions/v1/sync-riot-catalog \
  -H "Content-Type: application/json" \
  -H "x-card-sync-secret: YOUR_CARD_SYNC_SECRET" \
  -d '{"locale":"en"}'
```

A successful response includes the Riot content version and the number of sets and cards imported. The function upserts in batches and preserves the existing catalog if Riot returns an empty or unexpected payload.

## Notes

- Riot's development keys expire every 24 hours. Use one only for private testing; switch to the approved production key before the public app relies on this sync.
- The sync currently imports the English locale and stores the complete upstream card/set records in `raw_data` so additional official fields can be mapped into the UI later.
- Do not add automated gameplay or rules enforcement. Keep the product focused on card search, deckbuilding, collection management, and deck sharing in line with Riot's Riftbound digital tools policy.
