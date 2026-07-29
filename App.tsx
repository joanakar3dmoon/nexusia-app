import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Wallet, Activity, ArrowUpRight, ArrowDownLeft,
  RefreshCw, DollarSign, BarChart3, Clock, CheckCircle2, AlertCircle,
  Settings, Repeat, Youtube, Eye, ThumbsUp, Play,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Constants ────────────────────────────────────────────────────────────────
const fmt  = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : `${n}`;

// ─── Animated Counter ─────────────────────────────────────────────────────────
function Counter({ value }: { value: number }) {
  const [disp, setDisp] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 1200;
    const step = (ts: number) => {
      const p = Math.min((ts - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisp(value * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <>{fmt(disp)}</>;
}

// ─── SVG Sparkline ────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#7c3aed' }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const W = 400, H = 120;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H * 0.8 - 10}`);
  const d = `M ${pts.join(' L ')}`;
  const fill = `${d} L ${W},${H} L 0,${H} Z`;
  const id = `g${color.replace('#','')}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={`f${id}`}><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {[0.25,0.5,0.75].map(y => <line key={y} x1={0} y1={H*y} x2={W} y2={H*y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="5,4"/>)}
      <path d={fill} fill={`url(#${id})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#f${id})`}/>
    </svg>
  );
}

// ─── Balance Card ──────────────────────────────────────────────────────────────
function BalanceCard({ label, value, sub, icon: Icon, color }: { label: string; value: number; sub?: string; icon: any; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
        <div className="p-2 rounded-lg" style={{ background: `${color}15` }}><Icon size={16} color={color}/></div>
      </div>
      <div className="text-2xl font-bold tracking-tight"><Counter value={value}/>€</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </motion.div>
  );
}

// ─── Tab Button ────────────────────────────────────────────────────────────────
function Tab({ active, label, icon: Icon, onClick }: { active: boolean; label: string; icon: any; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`}>
      <Icon size={16} /> {label}
    </button>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState<'dashboard' | 'youtube' | 'withdraw'>('dashboard');
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'paypal' | 'bizum' | 'tarjeta'>('paypal');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [ytData, setYtData] = useState<any>(null);
  const [admobData, setAdmobData] = useState<any[]>([]);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      const data = await res.json();
      setState(data);
    } catch (e) {
      console.error('fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchYt = useCallback(async () => {
    try {
      const res = await fetch('/api/invergrow/youtube');
      if (res.ok) setYtData(await res.json());
    } catch {}
  }, []);

  const fetchAdmob = useCallback(async () => {
    try {
      const res = await fetch('/api/admob');
      if (res.ok) setAdmobData(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchState();
    fetchYt();
    fetchAdmob();
  }, [fetchState, fetchYt, fetchAdmob]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { setMessage({ type: 'error', text: 'Introduce un importe válido.' }); return; }
    if (amount > (state?.balance || 0)) { setMessage({ type: 'error', text: `Saldo insuficiente. Disponible: €${fmt(state?.balance)}` }); return; }
    if (withdrawMethod === 'bizum' && !phone.trim()) { setMessage({ type: 'error', text: 'Introduce tu número de teléfono para Bizum.' }); return; }
    if (withdrawMethod === 'tarjeta' && (!cardNumber.trim() || !cardHolder.trim())) { setMessage({ type: 'error', text: 'Introduce los datos de la tarjeta.' }); return; }
    try {
      const payload: any = { amount, method: withdrawMethod, note: `Retiro de €${amount}` };
      if (withdrawMethod === 'paypal') payload.destination = 'joanlazaro83@gmail.com';
      else if (withdrawMethod === 'bizum') payload.phoneNumber = phone;
      else if (withdrawMethod === 'tarjeta') { payload.cardNumber = cardNumber.replace(/\s/g,''); payload.accountHolder = cardHolder; }
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Retiro de €${fmt(amount)} procesado.` });
        setWithdrawAmount(''); setPhone(''); setCardNumber(''); setCardHolder('');
        fetchState();
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al procesar retiro' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    }
  };

  const balance = state?.balance || 0;
  const totalWithdrawals = state?.totalWithdrawals || 0;
  const netGains = state?.netGains || 0;
  const transactions = state?.transactions || [];

  // Sparkline from real transactions (last 30 days)
  const sparklineData = transactions.length > 0
    ? transactions.slice(0, 12).map((t: any) => t.amount).reverse()
    : [0];

  return (
    <div className="min-h-screen" style={{ background: '#040608' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-xl" style={{ background: 'rgba(4,6,8,0.8)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <DollarSign size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-sm">Nexusia</span>
              <span className="text-[10px] text-gray-500 ml-2">v1.0</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { fetchState(); fetchYt(); fetchAdmob(); }} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 transition-all">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-4 flex gap-2 overflow-x-auto">
        <Tab active={tab === 'dashboard'} label="Dashboard" icon={BarChart3} onClick={() => setTab('dashboard')} />
        <Tab active={tab === 'youtube'} label="YouTube" icon={Youtube} onClick={() => setTab('youtube')} />
        <Tab active={tab === 'withdraw'} label="Retiros" icon={Wallet} onClick={() => setTab('withdraw')} />
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={`max-w-6xl mx-auto px-4 mb-4 text-sm py-3 rounded-xl ${
              message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DASHBOARD ── */}
      {tab === 'dashboard' && (
        <div className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <BalanceCard label="Balance" value={balance} icon={Wallet} color="#7c3aed" />
            <BalanceCard label="Retirado" value={totalWithdrawals} icon={ArrowUpRight} color="#10b981" />
            <BalanceCard label="Ganancias Netas" value={netGains} icon={Activity} color="#06b6d4" />
            <BalanceCard label="Transacciones" value={transactions.length} icon={Clock} color="#f59e0b" />
          </div>

          {/* Sparkline from real data */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold">Ganancias Reales</h3>
                <p className="text-xs text-gray-400">Últimas transacciones registradas</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-purple-400"><Counter value={balance}/>€</div>
                <div className="text-xs text-green-400">Saldo disponible</div>
              </div>
            </div>
            <div className="h-32">
              <Sparkline data={sparklineData} color="#7c3aed" />
            </div>
          </div>

          {/* AdMob Revenue — real desde API */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-purple-400" /> Ingresos por Anuncios (AdMob)
            </h3>
            {admobData.length > 0 ? (
              <div className="space-y-3">
                {admobData.map((app: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: `${app.color}20`, color: app.color }}>{app.name[0]}</div>
                      <div>
                        <div className="text-sm font-medium">{app.name}</div>
                        <div className="text-xs text-gray-400">{fmtK(app.impressions || 0)} impresiones</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold" style={{ color: app.color }}>{fmt(app.revenue || 0)}€</div>
                      <div className="text-xs text-gray-400">eCPM {app.ecpm || 0}€</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-gray-500">Cargando datos de AdMob...</p>
              </div>
            )}
          </div>

          {/* Últimas transacciones reales */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Activity size={16} className="text-purple-400" /> Últimos Movimientos
            </h3>
            {transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.slice(0, 10).map((t: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: t.type==='DEPOSIT'||t.type==='INGRESO' ? 'rgba(0,255,136,0.08)' : 'rgba(239,68,68,0.08)' }}>
                        {t.type==='DEPOSIT'||t.type==='INGRESO' ? <ArrowDownLeft className="w-3.5 h-3.5" style={{ color: '#00ff88' }} /> : <ArrowUpRight className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{t.description || t.type}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{t.date ? new Date(t.date).toLocaleDateString('es-ES') : ''}</p>
                      </div>
                    </div>
                    <span className="text-sm font-black" style={{ color: t.type==='DEPOSIT'||t.type==='INGRESO' ? '#00ff88' : '#ef4444' }}>
                      {t.type==='DEPOSIT'||t.type==='INGRESO' ? '+' : '-'}€{fmt(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 gap-3">
                <Activity className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.15)' }} />
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Aún no hay transacciones</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── YOUTUBE ── */}
      {tab === 'youtube' && (
        <div className="max-w-6xl mx-auto px-4 pb-20">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Youtube size={20} className="text-red-400" /> YouTube — @Equilibrio-c2k
          </h2>

          {ytData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-400"><Counter value={ytData.subscribers}/></div>
                  <div className="text-xs text-gray-400 mt-1">Suscriptores</div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400"><Counter value={ytData.totalViews}/></div>
                  <div className="text-xs text-gray-400 mt-1">Visitas totales</div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-400"><Counter value={ytData.totalVideos}/></div>
                  <div className="text-xs text-gray-400 mt-1">Vídeos</div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400"><Counter value={ytData.monthlyRevenue}/></div>
                  <div className="text-xs text-gray-400 mt-1">Ingresos mensuales (€)</div>
                </div>
              </div>

              {ytData.recentVideos?.length > 0 && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                  <h3 className="text-sm font-semibold mb-4">Últimos vídeos</h3>
                  <div className="space-y-2">
                    {ytData.recentVideos.map((v: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                          <Play size={14} className="text-red-400" />
                          <span className="text-xs text-white">{v.title}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Eye size={12} />{fmtK(v.views)}</span>
                          <span className="flex items-center gap-1"><ThumbsUp size={12} />{fmtK(v.likes)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <Youtube size={48} className="mx-auto text-red-400/30 mb-4" />
              <p className="text-sm text-gray-500">Conectando con YouTube API...</p>
            </div>
          )}
        </div>
      )}

      {/* ── WITHDRAW ── */}
      {tab === 'withdraw' && (
        <div className="max-w-6xl mx-auto px-4 pb-20">
          <h2 className="text-lg font-bold mb-6">Retirar Ganancias</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-400"><Counter value={balance}/>€</div>
              <div className="text-xs text-gray-400">Balance disponible</div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400"><Counter value={totalWithdrawals}/>€</div>
              <div className="text-xs text-gray-400">Total retirado</div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400"><Counter value={netGains}/>€</div>
              <div className="text-xs text-gray-400">Ganancias netas</div>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 max-w-md mx-auto">
            <h3 className="text-sm font-semibold mb-4">Nuevo retiro</h3>
            <div className="space-y-4">
              {/* Método */}
              <div>
                <label className="text-xs mb-1.5 block text-gray-500">Método de retiro</label>
                <div className="flex gap-2">
                  {(['paypal', 'bizum', 'tarjeta'] as const).map(m => (
                    <button key={m} type="button" onClick={() => setWithdrawMethod(m)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        withdrawMethod === m ? 'ring-2 ring-purple-500 bg-purple-600/20 text-purple-400' : 'bg-white/5 text-gray-400 border border-white/10'
                      }`}>
                      {m === 'paypal' ? 'PayPal' : m === 'bizum' ? 'Bizum' : 'Tarjeta'}
                    </button>
                  ))}
                </div>
              </div>

              {withdrawMethod === 'bizum' && (
                <div>
                  <label className="text-xs mb-1.5 block text-gray-500">Tu número de teléfono</label>
                  <input type="tel" placeholder="+34 6XX XXX XXX" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500" />
                </div>
              )}

              {withdrawMethod === 'tarjeta' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs mb-1.5 block text-gray-500">Número de tarjeta</label>
                    <input type="text" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={e => setCardNumber(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500" />
                  </div>
                  <div>
                    <label className="text-xs mb-1.5 block text-gray-500">Titular</label>
                    <input type="text" placeholder="Nombre y apellidos" value={cardHolder} onChange={e => setCardHolder(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs mb-1.5 block text-gray-500">Cantidad (€)</label>
                <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="0.00" min="0" step="0.01"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500" />
              </div>

              <button onClick={handleWithdraw}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold text-sm">
                Retirar {withdrawAmount ? `€${fmt(parseFloat(withdrawAmount))}` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-4 text-center text-xs text-gray-500">
        Nexusia · Ingresos Pasivos Reales · Datos desde AdMob, YouTube y Supabase
      </footer>
    </div>
  );
}