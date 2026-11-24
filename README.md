# Riftbound Deckbuilder

An independent, Archidekt-inspired Riftbound TCG deck-building project. It uses original UI/code and is not affiliated with or endorsed by Riot Games or Archidekt.

## Current project features

- Responsive three-panel visual deck-building workspace.
- Card search and filters once the approved Riot card catalog proxy is configured.
- Add/remove cards, adjust quantities, and organize cards into deck zones.
- Browser-local draft autosave and text deck import/export.
- Deck overview, type breakdown, domain identity, and energy curve.
- Seven-card opening-hand sampler for tabletop deck testing.
- Supabase email/password registration and sign-in.
- Private cloud deck load/save for signed-in users.
- Supabase schema for profiles, decks, collection inventory, likes, card sets, and the public card catalog.

## Run locally

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill in the Supabase values in `.env.local`. The publishable key is intended for browser use; never put a Supabase service-role key or Riot API key in a `VITE_*` variable.

## Supabase setup

The Supabase project and schema have already been created for this app. Project URL:

`https://cenzofnbiluivakqviny.supabase.co`

Use the project's publishable key from the Supabase dashboard in `.env.local`. Database migrations are in `supabase/migrations/` for reproducibility.

## Riot card data — approval required

Riot's current Riftbound Digital Tools Policy requires a written license or an app-specific Riot API key. Deckbuilders and card libraries are listed as supported use cases. The app must use Riftbound assets supplied through Riot's authorized API; do not substitute third-party card APIs or assets. Riot's key application asks for the app description/use case, demo and user flow, distribution location, platforms, and a valid URL. Riot may accept a working prototype or detailed mock-up while the app is being completed.

Official policy and application instructions: https://developer.riotgames.com/docs/riftbound

The frontend reads the public `card_catalog` table in Supabase after a trusted server-side sync has populated it. Optionally, `VITE_RIOT_CARD_CATALOG_PROXY_URL` can point to a server-side endpoint returning normalized card JSON. That server endpoint must authenticate to Riot using the approved app-specific credentials, normalize the official response, and cache results. Keep the Riot key in server-side secrets only. The actual API endpoint/schema must be implemented against the access and documentation Riot provides after approval; this project intentionally does not scrape or depend on unofficial card services.

Expected normalized card shape:

```json
{
  "cards": [
    {
      "id": "stable-official-card-id",
      "name": "Card name",
      "type": "Unit",
      "domains": ["Fury"],
      "energy": 3,
      "might": 4,
      "rulesText": "Official rules text",
      "publicCode": "SET-001/100",
      "imageUrl": "https://...",
      "setName": "Set name"
    }
  ]
}
```

## Important product-policy constraints

- No automated gameplay or automated rule enforcement. Deck legality guidance must reflect official published construction rules, without changing official formats or banlists.
- No skill ranking, matchmaking, win-rate analytics, or retained metagame-defining data.
- No in-app ads or monetization unless permitted by Riot's current policy and the app has the required approved API key and free tier.
- Clearly state that the project is an independent fan tool and include Riot's required Legal Jibber Jabber notice before public launch.

## Remaining launch work

1. Obtain Riot's app-specific API key or written license and implement the server-side catalog proxy/cache using the authorized API schema.
2. Complete official card filters, printings, image handling, set metadata, and current ruleset data.
3. Implement deck construction validation from the official rules (without automated gameplay enforcement).
4. Finish collection inventory UI, profile editing, public deck pages, visibility/share controls, and community discovery.
5. Add tests, accessibility checks, abuse controls, privacy policy/terms, production auth redirect settings, and hosting/deployment.
6. Run a clean dependency install and production build; npm installation timed out in this environment, so the current local changes have not been build-verified.
