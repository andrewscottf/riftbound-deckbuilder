import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-card-sync-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function safeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aa = encoder.encode(a);
  const bb = encoder.encode(b);
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getImage(card: any): string | null {
  const direct = card?.art?.fullURL || card?.art?.thumbnailURL || card?.imageUrl || card?.image_url;
  if (typeof direct === "string" && direct.startsWith("https://")) return direct;
  const media = Array.isArray(card?.media) ? card.media : [];
  const preferred = media.find((item: any) => /full|card|large/i.test(String(item?.type ?? ""))) ?? media[0];
  const url = preferred?.url;
  return typeof url === "string" && url.startsWith("https://") ? url : null;
}

function domainsFor(card: any): string[] {
  const raw = card?.domains ?? card?.domain;
  if (Array.isArray(raw)) return raw.map((v) => String(v)).filter(Boolean);
  if (typeof raw === "string" && raw) return [raw];
  const known = new Set(["Fury", "Calm", "Mind", "Body", "Chaos", "Order", "Colorless"]);
  const tags = Array.isArray(card?.tags) ? card.tags : [];
  return tags.map((v: unknown) => String(v)).filter((v: string) => known.has(v));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const riotKey = Deno.env.get("RIOT_API_KEY");
  const syncSecret = Deno.env.get("CARD_SYNC_SECRET");

  if (req.method === "GET") {
    return json({ ready: Boolean(riotKey && syncSecret), source: "Riot Riftbound Content API" });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (!syncSecret) return json({ error: "Catalog sync is not configured. Add CARD_SYNC_SECRET in Supabase Edge Function secrets." }, 503);

  const suppliedSecret = req.headers.get("x-card-sync-secret") ?? "";
  if (!safeEqual(suppliedSecret, syncSecret)) return json({ error: "Unauthorized." }, 401);
  if (!riotKey) return json({ error: "RIOT_API_KEY is not configured in Supabase." }, 503);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
  const legacyServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  let serviceKey = legacyServiceKey;
  if (!serviceKey && secretKeysRaw) {
    try {
      const keys = JSON.parse(secretKeysRaw);
      serviceKey = keys.default ?? Object.values(keys)[0] as string | undefined;
    } catch {
      return json({ error: "Supabase server credentials could not be read." }, 500);
    }
  }
  if (!supabaseUrl || !serviceKey) return json({ error: "Supabase server credentials are unavailable." }, 503);

  let locale = "en";
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.locale && body.locale !== "en") return json({ error: "Riot Riftbound content currently supports English only." }, 400);
    locale = body?.locale || "en";
  } catch {
    // Empty request bodies are allowed.
  }

  const region = Deno.env.get("RIOT_ROUTING_REGION") || "americas";
  if (!["americas", "asia", "europe"].includes(region)) return json({ error: "RIOT_ROUTING_REGION must be americas, asia, or europe." }, 500);

  const upstream = await fetch(`https://${region}.api.riotgames.com/riftbound/content/v1/contents?locale=${locale}`, {
    headers: { "X-Riot-Token": riotKey, "Accept": "application/json" },
  });
  if (!upstream.ok) {
    const status = upstream.status === 429 ? 429 : upstream.status === 401 || upstream.status === 403 ? 502 : 502;
    return json({ error: `Riot content request failed (HTTP ${upstream.status}). Check the API key and Riot access.` }, status);
  }

  const payload = await upstream.json();
  if (!Array.isArray(payload?.sets) || payload.sets.length === 0) {
    return json({ error: "Riot returned an unexpected or empty content response; the existing catalog was left unchanged." }, 502);
  }

  const now = new Date().toISOString();
  const updatedAt = payload.lastUpdated && !Number.isNaN(Date.parse(payload.lastUpdated))
    ? new Date(payload.lastUpdated).toISOString()
    : now;

  const sets = payload.sets.map((set: any, index: number) => ({
    set_code: String(set.id),
    name: String(set.name || set.id),
    is_released: true,
    sort_order: index,
    source_updated_at: updatedAt,
    raw_data: set,
    updated_at: now,
  }));

  const cards = payload.sets.flatMap((set: any) =>
    (Array.isArray(set.cards) ? set.cards : []).map((card: any) => {
      const stats = card.stats ?? {};
      const collectorNumber = card.collectorNumber == null ? null : String(card.collectorNumber);
      const tags = Array.isArray(card.tags) ? card.tags : [];
      return {
        card_id: String(card.id),
        name: String(card.name || "Unknown card"),
        set_code: String(set.id),
        collector_number: collectorNumber,
        card_type: String(card.type || "Card"),
        domains: domainsFor(card),
        energy_cost: numberOrNull(stats.energy ?? stats.cost),
        might: numberOrNull(stats.might),
        rarity: card.rarity ? String(card.rarity) : null,
        rules_text: String(card.description || ""),
        image_url: getImage(card),
        is_preview: tags.some((tag: unknown) => /preview|unreleased/i.test(String(tag))),
        source_updated_at: updatedAt,
        raw_data: card,
        updated_at: now,
      };
    }),
  );

  if (!cards.length) return json({ error: "Riot returned sets but no cards; the existing catalog was left unchanged." }, 502);

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: setError } = await db.from("card_sets").upsert(sets, { onConflict: "set_code" });
  if (setError) return json({ error: `Could not update card sets: ${setError.message}` }, 500);

  for (let i = 0; i < cards.length; i += 250) {
    const { error } = await db.from("card_catalog").upsert(cards.slice(i, i + 250), { onConflict: "card_id" });
    if (error) return json({ error: `Card import stopped at batch ${Math.floor(i / 250) + 1}: ${error.message}` }, 500);
  }

  return json({
    success: true,
    source: "Riot Riftbound Content API",
    version: payload.version ?? null,
    lastUpdated: payload.lastUpdated ?? null,
    setsImported: sets.length,
    cardsImported: cards.length,
  });
});
