/**
 * Riot card catalog boundary.
 * The browser talks only to our own server-side proxy. Keep the Riot app key
 * server-side; never add it to a VITE_* variable or ship it to the browser.
 */
import { supabase } from './supabase';

export type OfficialCard = {
  id: string;
  name: string;
  type: string;
  domains: string[];
  energy?: number;
  might?: number;
  rules?: string;
  code?: string;
  image?: string;
  set?: string;
};

const proxyUrl = import.meta.env.VITE_RIOT_CARD_CATALOG_PROXY_URL as string | undefined;

function asString(value: unknown): string {
  return value == null ? '' : String(value);
}

export function normalizeOfficialCatalog(payload: unknown): OfficialCard[] {
  const root = payload as any;
  const records = Array.isArray(root) ? root : (root?.cards ?? root?.data?.cards ?? root?.data ?? []);
  if (!Array.isArray(records)) return [];
  return records.map((record: any, index: number) => ({
    id: asString(record.id ?? record.cardId ?? record.code ?? index),
    name: asString(record.name ?? record.title ?? 'Unknown card'),
    type: asString(record.type ?? record.cardType ?? 'Card'),
    domains: Array.isArray(record.domains) ? record.domains.map(asString) : (record.domain ? [asString(record.domain)] : []),
    energy: record.energy == null ? undefined : Number(record.energy),
    might: record.might == null ? undefined : Number(record.might),
    rules: asString(record.rulesText ?? record.text ?? record.ability),
    code: asString(record.publicCode ?? record.code),
    image: asString(record.imageUrl ?? record.image_url ?? record.image),
    set: asString(record.setName ?? record.set?.name ?? record.set),
  }));
}

export async function loadOfficialCatalog(signal?: AbortSignal): Promise<OfficialCard[]> {
  if (proxyUrl) {
    const response = await fetch(proxyUrl, { signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Official card service returned ${response.status}.`);
    const cards = normalizeOfficialCatalog(await response.json());
    if (!cards.length) throw new Error('The official card service returned no cards in the expected format.');
    return cards;
  }
  if (supabase) {
    const { data, error } = await supabase.from('card_catalog').select('card_id,name,card_type,domains,energy_cost,might,rules_text,collector_number,image_url,set_code').order('name');
    if (error) throw new Error(`Could not load the official card catalog: ${error.message}`);
    if (data?.length) return data.map((row: any) => ({ id: row.card_id, name: row.name, type: row.card_type, domains: row.domains || [], energy: row.energy_cost == null ? undefined : Number(row.energy_cost), might: row.might == null ? undefined : Number(row.might), rules: row.rules_text || '', code: row.collector_number || '', image: row.image_url || '', set: row.set_code || '' }));
  }
  throw new Error('The official Riot card catalog is not populated yet. Apply for an app-specific Riot API key, then connect the authorized server-side sync.');
}