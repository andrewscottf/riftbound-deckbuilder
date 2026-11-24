import { FormEvent, useState } from 'react';
import { X, Mail, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Props = { onClose: () => void };

export default function AuthDialog({ onClose }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) { setError('Supabase is not configured. Add the project URL and publishable key to .env.local.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password });
        if (authError) throw authError;
        setMessage(data.session ? 'Account created. You are signed in.' : 'Account created. Check your email to confirm your address, then sign in.');
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        onClose();
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.'); }
    finally { setBusy(false); }
  }

  return <div className="modal-backdrop" onClick={onClose}><section className="auth-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="auth-title">
    <div className="modal-head"><div><span className="eyebrow">PLAYER ACCOUNT</span><h2 id="auth-title">{mode === 'signin' ? 'Welcome back' : 'Join the community'}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X/></button></div>
    <p className="auth-intro">Save decks to your account and access them across devices.</p>
    <form onSubmit={submit} className="auth-form">
      <label><span><Mail size={14}/> Email</span><input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/></label>
      <label><span><Lock size={14}/> Password</span><input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters"/></label>
      {error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-message" role="status">{message}</p>}
      <button className="button primary auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
    </form>
    <div className="auth-switch">{mode === 'signin' ? "New here?" : 'Already have an account?'} <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }}>{mode === 'signin' ? 'Create an account' : 'Sign in'}</button></div>
  </section></div>;
}