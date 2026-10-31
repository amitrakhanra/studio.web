'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Booking, BookingStatus, PortfolioItem, Review, Service } from '@/types';
import { ShieldCheck, Trash2, LogOut, Check, X, Upload, Pencil, MessageCircle } from 'lucide-react';

type Tab = 'bookings' | 'services' | 'portfolio' | 'reviews';
type Notice = { type: 'ok' | 'error'; text: string } | null;

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // Supabase free plan limit
const STORAGE_MARKER = '/storage/v1/object/public/portfolio/';

const STATUS_STYLES: Record<BookingStatus, string> = {
  Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Completed: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Cancelled: 'bg-zinc-800 text-zinc-500 border-zinc-700',
};

const inputCls = 'w-full bg-zinc-900 border border-zinc-800 p-2 text-sm rounded text-white';

export default function AdminPage() {
  // ---------- auth ----------
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // ---------- data ----------
  const [activeTab, setActiveTab] = useState<Tab>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);

  // new service form
  const [svcTitle, setSvcTitle] = useState('');
  const [svcDesc, setSvcDesc] = useState('');
  const [svcTotal, setSvcTotal] = useState('');
  const [svcAdvance, setSvcAdvance] = useState('');

  // edit service
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: '', description: '', total: '', advance: '' });

  // new media form
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'image' | 'video'>('image');
  const [newUrl, setNewUrl] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const showNotice = useCallback((type: 'ok' | 'error', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 5000);
  }, []);

  // ---------- session handling ----------
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadAll = useCallback(async () => {
    const [b, s, p, r] = await Promise.all([
      supabase.from('bookings').select('*').order('shoot_date', { ascending: true }),
      supabase.from('services').select('*').order('total_price', { ascending: true }),
      supabase.from('portfolio').select('*').order('created_at', { ascending: true }),
      supabase.from('reviews').select('*').order('created_at', { ascending: false }),
    ]);
    const firstError = b.error || s.error || p.error || r.error;
    if (firstError) showNotice('error', firstError.message);
    setBookings((b.data ?? []) as Booking[]);
    setServices((s.data ?? []) as Service[]);
    setPortfolio((p.data ?? []) as PortfolioItem[]);
    setReviews((r.data ?? []) as Review[]);
  }, [showNotice]);

  useEffect(() => {
    if (session) loadAll();
  }, [session, loadAll]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setLoginError('Invalid email or password.');
    setPassword('');
    setLoggingIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setBookings([]);
    setServices([]);
    setPortfolio([]);
    setReviews([]);
  };

  // ---------- bookings ----------
  const setBookingStatus = async (b: Booking, status: BookingStatus) => {
    if (
      status === 'Cancelled' &&
      !window.confirm(`Cancel the booking of ${b.client_name} on ${b.shoot_date}? The date will become available again.`)
    ) {
      return;
    }
    const { error } = await supabase.from('bookings').update({ status }).eq('id', b.id);
    if (error) return showNotice('error', error.message);
    setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, status } : x)));
    showNotice('ok', `Booking marked ${status}.`);
  };

  // ---------- services ----------
  const validPrices = (total: number, advance: number) => total > 0 && advance >= 0 && advance <= total;

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(svcTotal);
    const advance = Number(svcAdvance);
    if (!validPrices(total, advance)) {
      return showNotice('error', 'Total price must be above 0. The advance can be 0 (no advance) but not more than the total.');
    }
    setBusy(true);
    const { data, error } = await supabase
      .from('services')
      .insert([{ title: svcTitle.trim(), description: svcDesc.trim(), total_price: total, advance_amount: advance }])
      .select();
    setBusy(false);
    if (error || !data?.length) return showNotice('error', error?.message ?? 'Could not add the service.');
    setServices((prev) => [...prev, data[0] as Service].sort((a, b) => a.total_price - b.total_price));
    setSvcTitle('');
    setSvcDesc('');
    setSvcTotal('');
    setSvcAdvance('');
    showNotice('ok', 'Service added.');
  };

  const startEdit = (s: Service) => {
    setEditId(s.id);
    setDraft({
      title: s.title,
      description: s.description ?? '',
      total: String(s.total_price),
      advance: String(s.advance_amount),
    });
  };

  const saveEdit = async (id: string) => {
    const total = Number(draft.total);
    const advance = Number(draft.advance);
    if (!draft.title.trim()) return showNotice('error', 'Title cannot be empty.');
    if (!validPrices(total, advance)) {
      return showNotice('error', 'Total price must be above 0. The advance can be 0 (no advance) but not more than the total.');
    }
    const patch = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      total_price: total,
      advance_amount: advance,
    };
    const { error } = await supabase.from('services').update(patch).eq('id', id);
    if (error) return showNotice('error', error.message);
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)).sort((a, b) => a.total_price - b.total_price)
    );
    setEditId(null);
    showNotice('ok', 'Service updated.');
  };

  const handleDeleteService = async (s: Service) => {
    if (!window.confirm(`Delete the service "${s.title}"? Existing bookings are not affected.`)) return;
    const { error } = await supabase.from('services').delete().eq('id', s.id);
    if (error) return showNotice('error', error.message);
    setServices((prev) => prev.filter((x) => x.id !== s.id));
    showNotice('ok', 'Service deleted.');
  };

  // ---------- portfolio ----------
  const uploadFile = async (file: File, type: 'image' | 'video'): Promise<string | null> => {
    if (!file.type.startsWith(`${type}/`)) {
      showNotice('error', `Please choose an ${type} file.`);
      return null;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      showNotice('error', 'File is too large. Maximum size is 50 MB.');
      return null;
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const { error } = await supabase.storage
      .from('portfolio')
      .upload(path, file, { contentType: file.type, cacheControl: '3600' });
    if (error) {
      showNotice('error', error.message);
      return null;
    }
    return supabase.storage.from('portfolio').getPublicUrl(path).data.publicUrl;
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    let url = newUrl.trim();
    if (newFile) {
      const uploaded = await uploadFile(newFile, newType);
      if (!uploaded) return setBusy(false);
      url = uploaded;
    }
    if (url && !/^https?:\/\//i.test(url)) {
      setBusy(false);
      return showNotice('error', 'The URL must start with http:// or https://');
    }
    const { data, error } = await supabase
      .from('portfolio')
      .insert([{ title: newTitle.trim(), media_type: newType, media_url: url || null }])
      .select();
    setBusy(false);
    if (error || !data?.length) return showNotice('error', error?.message ?? 'Could not save the frame.');
    setPortfolio((prev) => [...prev, data[0] as PortfolioItem]);
    setNewTitle('');
    setNewUrl('');
    setNewFile(null);
    setFileKey((k) => k + 1);
    showNotice('ok', url ? 'Work added to the portfolio.' : 'Blank frame saved.');
  };

  const handleFillSlot = async (item: PortfolioItem, file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    const uploaded = await uploadFile(file, item.media_type);
    if (!uploaded) return setBusy(false);
    const { error } = await supabase.from('portfolio').update({ media_url: uploaded }).eq('id', item.id);
    setBusy(false);
    if (error) return showNotice('error', error.message);
    setPortfolio((prev) => prev.map((p) => (p.id === item.id ? { ...p, media_url: uploaded } : p)));
    showNotice('ok', 'Media uploaded.');
  };

  const handleDeleteMedia = async (item: PortfolioItem) => {
    if (!window.confirm(`Delete "${item.title}" from the portfolio?`)) return;
    const { error } = await supabase.from('portfolio').delete().eq('id', item.id);
    if (error) return showNotice('error', error.message);
    // also remove the file from storage if it was uploaded here
    const url = item.media_url ?? '';
    const idx = url.indexOf(STORAGE_MARKER);
    if (idx >= 0) {
      await supabase.storage.from('portfolio').remove([decodeURIComponent(url.slice(idx + STORAGE_MARKER.length))]);
    }
    setPortfolio((prev) => prev.filter((p) => p.id !== item.id));
    showNotice('ok', 'Deleted.');
  };

  // ---------- reviews ----------
  const handleApproveReview = async (r: Review) => {
    const { error } = await supabase.from('reviews').update({ approved: true }).eq('id', r.id);
    if (error) return showNotice('error', error.message);
    setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, approved: true } : x)));
    showNotice('ok', 'Review is now visible on the site.');
  };

  const handleDeleteReview = async (r: Review) => {
    if (!window.confirm(`Delete the review by ${r.client_name}?`)) return;
    const { error } = await supabase.from('reviews').delete().eq('id', r.id);
    if (error) return showNotice('error', error.message);
    setReviews((prev) => prev.filter((x) => x.id !== r.id));
    showNotice('ok', 'Review deleted.');
  };

  // ---------- render: login ----------
  if (authLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-xs text-zinc-500">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl w-full max-w-sm space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Owner Login</span>
          </div>
          <p className="text-xs text-zinc-400">Restricted area for the website owner.</p>
          {loginError && (
            <div className="p-2.5 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">{loginError}</div>
          )}
          <input
            type="email"
            required
            autoComplete="username"
            placeholder="Owner email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 text-white p-2.5 rounded-lg text-sm"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 text-white p-2.5 rounded-lg text-sm"
          />
          <button
            type="submit"
            disabled={loggingIn}
            className="w-full bg-white text-black font-semibold text-sm py-2 rounded-lg disabled:opacity-60"
          >
            {loggingIn ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    );
  }

  // ---------- render: dashboard ----------
  const pendingCount = bookings.filter((b) => b.status === 'Pending').length;
  const pendingReviews = reviews.filter((r) => !r.approved).length;
  const sortedReviews = [...reviews].sort((a, b) => Number(a.approved) - Number(b.approved));

  const tabs: { id: Tab; label: string }[] = [
    { id: 'bookings', label: `Bookings (${pendingCount} pending)` },
    { id: 'services', label: 'Services & Prices' },
    { id: 'portfolio', label: 'Upload Work / Media' },
    { id: 'reviews', label: `Reviews (${pendingReviews} to approve)` },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-3 pb-6 border-b border-zinc-800 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Owner Control Panel</h1>
          <p className="text-xs text-zinc-400">Signed in as {session.user.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-zinc-400 hover:text-white">View Live Site →</a>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs border border-zinc-700 px-3 py-1.5 rounded-full text-zinc-300 hover:text-white"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`mb-6 p-3 text-xs rounded-lg border ${
            notice.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold ${
              activeTab === t.id ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ---------- Bookings ---------- */}
      {activeTab === 'bookings' && (
        <div className="overflow-x-auto border border-zinc-800 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900 text-zinc-400 text-xs uppercase">
              <tr>
                <th className="p-3">Shoot Date</th>
                <th className="p-3">Client</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Package</th>
                <th className="p-3">Advance</th>
                <th className="p-3">UPI Ref / UTR</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-xs text-zinc-500">No bookings yet.</td>
                </tr>
              )}
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-zinc-800 hover:bg-zinc-900/40">
                  <td className="p-3 font-semibold text-emerald-400 whitespace-nowrap">{b.shoot_date}</td>
                  <td className="p-3">{b.client_name}</td>
                  <td className="p-3 whitespace-nowrap">
                    <a
                      href={`https://wa.me/91${b.client_phone.replace(/\D/g, '').slice(-10)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-emerald-400"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      {b.client_phone}
                    </a>
                  </td>
                  <td className="p-3">{b.service_title}</td>
                  <td className="p-3 font-bold">₹{b.advance_paid}</td>
                  <td className="p-3 font-mono text-xs text-zinc-300">{b.transaction_id.startsWith('NOADV-') ? 'No advance' : b.transaction_id}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap space-x-2">
                    {b.status === 'Pending' && (
                      <button
                        type="button"
                        onClick={() => setBookingStatus(b, 'Confirmed')}
                        className="text-[11px] font-semibold bg-emerald-500 text-black px-2.5 py-1 rounded"
                      >
                        Confirm
                      </button>
                    )}
                    {b.status === 'Confirmed' && (
                      <button
                        type="button"
                        onClick={() => setBookingStatus(b, 'Completed')}
                        className="text-[11px] font-semibold bg-blue-500 text-black px-2.5 py-1 rounded"
                      >
                        Completed
                      </button>
                    )}
                    {(b.status === 'Pending' || b.status === 'Confirmed') && (
                      <button
                        type="button"
                        onClick={() => setBookingStatus(b, 'Cancelled')}
                        className="text-[11px] font-semibold border border-red-500/40 text-red-400 px-2.5 py-1 rounded"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------- Services ---------- */}
      {activeTab === 'services' && (
        <div className="space-y-8">
          <form onSubmit={handleAddService} className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4">
            <input required placeholder="Service Title" value={svcTitle} onChange={(e) => setSvcTitle(e.target.value)} className={inputCls} />
            <input required placeholder="Description" value={svcDesc} onChange={(e) => setSvcDesc(e.target.value)} className={inputCls} />
            <input required type="number" min={1} placeholder="Total Price (₹)" value={svcTotal} onChange={(e) => setSvcTotal(e.target.value)} className={inputCls} />
            <div className="flex gap-2">
              <input required type="number" min={0} placeholder="Advance (₹, 0 = none)" value={svcAdvance} onChange={(e) => setSvcAdvance(e.target.value)} className={inputCls} />
              <button type="submit" disabled={busy} className="bg-white text-black px-4 rounded text-xs font-bold disabled:opacity-60">Add</button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {services.map((s) =>
              editId === s.id ? (
                <div key={s.id} className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl space-y-2">
                  <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={inputCls} placeholder="Title" />
                  <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={inputCls} placeholder="Description" />
                  <input type="number" min={1} value={draft.total} onChange={(e) => setDraft({ ...draft, total: e.target.value })} className={inputCls} placeholder="Total (₹)" />
                  <input type="number" min={0} value={draft.advance} onChange={(e) => setDraft({ ...draft, advance: e.target.value })} className={inputCls} placeholder="Advance (₹)" />
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => saveEdit(s.id)} className="flex items-center gap-1 bg-emerald-500 text-black text-xs font-semibold px-3 py-1.5 rounded">
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                    <button type="button" onClick={() => setEditId(null)} className="flex items-center gap-1 border border-zinc-700 text-zinc-300 text-xs px-3 py-1.5 rounded">
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div key={s.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl relative">
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button type="button" onClick={() => startEdit(s)} aria-label="Edit service" className="text-zinc-500 hover:text-white">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => handleDeleteService(s)} aria-label="Delete service" className="text-zinc-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-bold pr-14">{s.title}</h4>
                  <p className="text-xs text-zinc-400 mb-2">{s.description}</p>
                  <div className="text-sm font-semibold">Total: ₹{s.total_price}</div>
                  <div className="text-xs text-emerald-400">Advance: ₹{s.advance_amount}</div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ---------- Portfolio ---------- */}
      {activeTab === 'portfolio' && (
        <div className="space-y-8">
          <form onSubmit={handleAddMedia} className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl space-y-4 max-w-lg">
            <h3 className="font-bold text-sm">Add New Work</h3>
            <input required placeholder="Title of work" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className={inputCls} />
            <select value={newType} onChange={(e) => setNewType(e.target.value as 'image' | 'video')} className={inputCls}>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Upload a file (max 50 MB)</label>
              <input
                key={fileKey}
                type="file"
                accept={newType === 'image' ? 'image/*' : 'video/*'}
                onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-zinc-400 file:mr-3 file:rounded file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-xs file:text-white"
              />
            </div>
            <input
              placeholder="...or paste an Image/Video URL (leave both empty for a blank frame)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              disabled={!!newFile}
              className={`${inputCls} font-mono disabled:opacity-50`}
            />
            <button type="submit" disabled={busy} className="bg-white text-black px-4 py-2 rounded text-xs font-semibold disabled:opacity-60">
              {busy ? 'Saving...' : 'Save Frame'}
            </button>
          </form>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {portfolio.map((item) => (
              <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl relative space-y-2">
                <button type="button" onClick={() => handleDeleteMedia(item)} aria-label="Delete" className="absolute top-2 right-2 text-zinc-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold block truncate pr-6">{item.title}</span>
                <span className="text-[10px] text-zinc-500 uppercase block">
                  {item.media_type} {item.media_url ? '(Uploaded)' : '(Blank)'}
                </span>
                {!item.media_url && (
                  <label className="flex items-center gap-1 text-[11px] text-emerald-400 cursor-pointer hover:underline">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload {item.media_type}</span>
                    <input
                      type="file"
                      accept={item.media_type === 'image' ? 'image/*' : 'video/*'}
                      className="hidden"
                      disabled={busy}
                      onChange={(e) => handleFillSlot(item, e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- Reviews ---------- */}
      {activeTab === 'reviews' && (
        <div className="space-y-3 max-w-2xl">
          {sortedReviews.length === 0 && <p className="text-xs text-zinc-500">No reviews yet.</p>}
          {sortedReviews.map((r) => (
            <div key={r.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sm">
                  {r.client_name} <span className="text-amber-400 text-xs ml-2">{'★'.repeat(r.rating)}</span>
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    r.approved ? STATUS_STYLES.Confirmed : STATUS_STYLES.Pending
                  }`}
                >
                  {r.approved ? 'Visible' : 'Waiting for approval'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mb-3">{r.comment}</p>
              <div className="flex gap-2">
                {!r.approved && (
                  <button type="button" onClick={() => handleApproveReview(r)} className="text-[11px] font-semibold bg-emerald-500 text-black px-2.5 py-1 rounded">
                    Approve
                  </button>
                )}
                <button type="button" onClick={() => handleDeleteReview(r)} className="text-[11px] font-semibold border border-red-500/40 text-red-400 px-2.5 py-1 rounded">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
