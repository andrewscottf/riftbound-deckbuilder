# Riot Developer Portal application draft

Use this as a starting point for the Riftbound app-specific API key application. Replace the bracketed items with the final public URL and contact details before submitting.

## App name
Riftbound Deck Workshop

## App description / use case
Riftbound Deck Workshop is a free, community-focused deckbuilder and card library for the Riftbound physical trading card game. Players can search the official card catalog, build and organize decks in a visual deck-building workspace, save private decks to individual accounts, and optionally publish/share decklists with the community. The app is designed to help players theorycraft and prepare physical decks for in-person tabletop play. It does not simulate matches, automate gameplay, enforce rules during play, provide matchmaking, rank players, or publish win-rate or metagame analytics.

## Demonstration and user flow
1. A visitor opens the public card library and searches/filter cards by name, type, domain, set, and other properties exposed by Riot's API.
2. A visitor creates a free account or signs in to save decks across devices.
3. The player adds cards to the visual deck workspace, adjusts quantities, and organizes cards into the official deck zones.
4. The app displays deck composition summaries and links to official rules; any legality guidance will reflect the current official construction rules without changing official formats or banlists.
5. The player saves a private deck or chooses to publish a decklist and share its URL.

## Distribution and platforms
- Distribution: public website at [PUBLIC WEBSITE URL].
- Platforms: responsive web application for desktop, tablet, and mobile browsers.
- Access: free for all players; no ads, paid tiers, or paywalls.

## API use
The app will use only Riftbound assets and card data made available through Riot's authorized API. API credentials will be stored server-side and never exposed in the browser. The app will not bulk mirror card art outside the permissions and technical requirements Riot provides.

## Policy alignment
The project is an independent fan tool. It will include the exact Legal Jibber Jabber notice, will not imply Riot endorsement, and will follow the Riftbound Digital Tools Policy. It will not implement automated gameplay or rule enforcement, skill rankings, matchmaking, or metagame-defining analytics.
