# Riot Developer Portal application draft

Use this as the working draft for the Riftbound app-specific API key application. The deployed prototype is available at the URL below.

## App name
Riftbound Deck Workshop

## Public prototype
https://riftbound-deckbuilder-git-main-andrewscottfredrickson-8404.vercel.app

## App description / use case
Riftbound Deck Workshop is a free, independent community deckbuilding tool for the Riftbound physical trading card game. Its purpose is to help players browse the official card catalog, visually assemble and organize physical decklists, and prepare for in-person tabletop play. The current public prototype includes the visual deck workspace, card search interface, deck import/export, local deck persistence, and account-based private deck saving. The official card catalog will be populated from Riot's authorized Riftbound content API after approval and credential provisioning.

The project is not a digital game client. It does not simulate matches, automate gameplay, resolve game actions, provide matchmaking, rank players, or publish win-rate or other metagame-defining analytics. It is free to use and currently has no advertising, paid tier, or paywall.

## Demonstration and user flow
1. A visitor opens the public prototype and views the card-library and deckbuilding interface.
2. Once Riot API access is approved and configured, the visitor searches and filters official card data and card assets provided by Riot.
3. The visitor adds cards to the visual deck workspace, adjusts quantities, and organizes a decklist for physical tabletop play.
4. The visitor can import or export a decklist. A signed-in user can save a private deck to their account.
5. Future community publishing/sharing features, if implemented, will remain limited to decklists and will not include gameplay simulation or metagame analytics.

## Distribution and platforms
- Distribution: public website at https://riftbound-deckbuilder-git-main-andrewscottfredrickson-8404.vercel.app
- Platforms: responsive web application for desktop, tablet, and mobile browsers.
- Access: free for all players; no ads, paid tiers, or paywalls.

## API use
The app will use only Riftbound card data, card art, translations, and other assets authorized and provided through Riot's Riftbound content API. Riot credentials will be stored server-side and never exposed in browser code or public environment variables. The app will respect Riot's API terms, caching guidance, and asset-use requirements.

## Policy alignment
The project is an independent fan tool and will include the required Legal Jibber Jabber notice without implying Riot endorsement. It will follow the Riftbound Digital Tools Policy. It will not implement automated gameplay, rule enforcement during play, matchmaking, skill rankings, or metagame-defining analytics. Any future deck-construction validation will reflect Riot's current official rules and formats without modifying them.
