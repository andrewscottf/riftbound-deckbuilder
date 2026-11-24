import { useEffect, useMemo, useState } from 'react';
import { Plus, Minus, Trash2, Search, Library, Sparkles } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { OfficialCard } from '../lib/riot';
import { supabase } from '../lib/supabase';

type Props = { user: User | null; cards: OfficialCard[] };
type InventoryRow = { id: string; card_id: string; quantity: number; finish: string; notes: string };
const finishLabel = (finish: string) => finish === 'foil' ? 'Foil' : 'Normal';

export default function CollectionPanel({ user, cards }: Props) {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [finish, setFinish] = useState('normal');
  const [error, setError] = useState('');

  async function loadCollection() {
    if (!supabase || !user) { setRows([]); return; }
    setLoading(true); setError('');
    const { data, error: loadError } = await supabase
      .from('collection_cards')
      .select('id,card_id,quantity,finish,notes')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false });
    if (loadError) setError(loadError.message);
    else setRows((data || []) as InventoryRow[]);
    setLoading(false);
  }

  useEffect(() => { void loadCollection(); }, [user?.id]);

  const cardMap = useMemo(() => new Map(cards.map(card => [card.id, card])), [cards]);
  const visibleRows = useMemo(() => rows.filter(row => {
    const card = cardMap.get(row.card_id);
    return card && (card.name.toLowerCase().includes(query.toLowerCase()) ||
      card.type.toLowerCase().includes(query.toLowerCase()) ||
      (card.code || '').toLowerCase().includes(query.toLowerCase()));
  }), [rows, cardMap, query]);
  const total = rows.reduce((sum, row) => sum + row.quantity, 0);
  const unique = new Set(rows.map(row => row.card_id)).size;

  async function addCard(card: OfficialCard) {
    if (!supabase || !user) return;
    setSaving(true); setError('');
    const existing = rows.find(row => row.card_id === card.id && row.finish === finish);
    const { error: saveError } = await supabase.from('collection_cards').upsert({
      owner_id: user.id, card_id: card.id, finish,
      quantity: (existing?.quantity || 0) + 1,
      notes: existing?.notes || '',
    }, { onConflict: 'owner_id,card_id,finish' });
    if (saveError) setError(saveError.message);
    else await loadCollection();
    setSaving(false);
  }

  async function changeQuantity(row: InventoryRow, delta: number) {
    if (!supabase || !user) return;
    setSaving(true); setError('');
    const result = row.quantity + delta <= 0
      ? await supabase.from('collection_cards').delete().eq('id', row.id).eq('owner_id', user.id)
      : await supabase.from('collection_cards').update({ quantity: row.quantity + delta }).eq('id', row.id).eq('owner_id', user.id);
    if (result.error) setError(result.error.message);
    else await loadCollection();
    setSaving(false);
  }

  async function removeRow(row: InventoryRow) {
    if (!supabase || !user) return;
    setSaving(true); setError('');
    const { error: removeError } = await supabase.from('collection_cards').delete().eq('id', row.id).eq('owner_id', user.id);
    if (removeError) setError(removeError.message);
    else await loadCollection();
    setSaving(false);
  }

  if (!user) return <section className="panel collection-panel">
    <div className="panel-heading"><div><span className="eyebrow">YOUR CARDS</span><h2>Collection</h2></div><Library/></div>
    <div className="collection-empty"><Library size={34}/><h3>Your collection lives here.</h3><p>Sign in to track the cards you own, quantities, and foil copies. Your collection is private to your account.</p></div>
  </section>;

  return <section className="panel collection-panel">
    <div className="collection-heading">
      <div><span className="eyebrow">YOUR CARDS</span><h2>Collection</h2><p>{total} cards · {unique} unique</p></div>
      <div className="collection-add-controls">
        <select aria-label="Card finish" value={finish} onChange={e => setFinish(e.target.value)}><option value="normal">Normal</option><option value="foil">Foil</option></select>
      </div>
    </div>
    <div className="collection-layout">
      <div className="collection-owned">
        <div className="searchbox"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search your collection…"/></div>
        {error && <p className="collection-error" role="alert">{error}</p>}
        {loading ? <div className="collection-empty">Loading your collection…</div> :
          visibleRows.length ? <div className="collection-list">{visibleRows.map(row => {
            const card = cardMap.get(row.card_id)!;
            return <div className="collection-row" key={row.id}>
              <div className="collection-thumb">{card.image ? <img src={card.image} alt=""/> : <Library size={18}/>}</div>
              <div className="collection-card-info"><strong>{card.name}</strong><small>{card.type} · {finishLabel(row.finish)}</small></div>
              <div className="quantity"><button onClick={() => void changeQuantity(row, -1)} disabled={saving} aria-label="Remove one"><Minus size={13}/></button><b>{row.quantity}</b><button onClick={() => void changeQuantity(row, 1)} disabled={saving} aria-label="Add one"><Plus size={13}/></button></div>
              <button className="remove-btn" onClick={() => void removeRow(row)} disabled={saving} aria-label="Remove finish from collection"><Trash2 size={15}/></button>
            </div>;
          })}</div> : <div className="collection-empty"><Library size={30}/><strong>{rows.length ? 'No matching cards' : 'Your collection is empty'}</strong><p>{rows.length ? 'Try another search.' : 'Add cards from the catalog to start tracking what you own.'}</p></div>}
      </div>
      <div className="collection-catalog">
        <div className="collection-subhead"><div><span className="eyebrow">QUICK ADD</span><h3>Add cards</h3></div><span>{cards.length} available</span></div>
        {cards.length ? <div className="collection-add-grid">{cards.slice(0, 80).map(card => <button className="collection-add-card" key={card.id} onClick={() => void addCard(card)} disabled={saving} title={`Add ${card.name} · ${finishLabel(finish)}`}>
          <span className="collection-add-art">{card.image ? <img src={card.image} alt=""/> : <Library size={18}/>}</span><span>{card.name}</span><Plus size={14}/>
        </button>)}</div> : <div className="collection-empty compact"><Sparkles size={24}/><p>The official card catalog will appear here as soon as Riot grants API access and the first sync completes.</p></div>}
      </div>
    </div>
  </section>;
}
