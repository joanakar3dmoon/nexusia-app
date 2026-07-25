import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Wallet, Activity, Users, ArrowUpRight, ArrowDownLeft,
  RefreshCw, Shield, Sparkles, ShoppingCart, DollarSign,
  Zap, BarChart3, Clock, CheckCircle2, AlertCircle, ChevronRight,
  Settings, Repeat, Bell, Star, Package, Bot, LineChart, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SystemState } from './types';

// ─── Constants ────────────────────────────────────────────────────────────────
const fmt  = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : `${n}`;

const C = {
  red: '#ff1a1a',
  redDark: '#cc0000',
  redBg: '#1a0000',
  green: '#10b981',
  amber: '#f59e0b',
  cyan: '#06b6d4',
  gray: '#6b7280',
};

const ADMOB = [
  { app: 'Nexusia', revenue: 3.10, ecpm: 0.75, impressions: 4133, color: C.red },
];

const AFFILIATE_PRODUCTS = [
  { name: 'Auriculares Sony WH-1000XM5', clicks: 84, sales: 3, commission: 4.20 },
  { name: 'Meditación Mindfulness libro', clicks: 61, sales: 2, commission: 1.80 },
  { name: 'Altavoz Bluetooth JBL Flip 6', clicks: 52, sales: 1, commission: 2.30 },
  { name: 'Diffuser aromas zen',           clicks: 47, sales: 1, commission: 1.40 },
];

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
function Sparkline({ data, color = C.red }: { data: number[]; color?: string }) {
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
      {data.map((_, i) => i % 2 === 0 && (
        <circle key={i} cx={(i/(data.length-1))*W} cy={H-((data[i]-min)/range)*H*0.8-10} r="3.5" fill={color} stroke="#0a0000" strokeWidth="1.5" filter={`url(#f${id})`}/>
      ))}
    </svg>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-24 text-right">{label}</span>
      <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden relative">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}/>
      </div>
      <span className="text-xs text-white/60 w-16 text-right font-mono">{fmt(value)}€</span>
    </div>
  );
}

// ─── Tab Button ────────────────────────────────────────────────────────────────
function Tab({ active, label, icon: Icon, onClick }: { active: boolean; label: string; icon: any; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`}>
      <Icon size={16} /> {label}
    </button>
  );
}

// ─── Static Balance Card ──────────────────────────────────────────────────────
function BalanceCard({ label, value, sub, icon: Icon, color, trend }: { label: string; value: number; sub?: string; icon: any; color: string; trend?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
        <div className="p-2 rounded-lg" style={{ background: `${color}15` }}><Icon size={16} color={color}/></div>
      </div>
      <div className="text-2xl font-bold tracking-tight"><Counter value={value}/>€</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
          {Math.abs(trend).toFixed(1)}% esta semana
        </div>
      )}
    </motion.div>
  );
}

// ─── AI Worker Card ───────────────────────────────────────────────────────────
function AIWorkerCard({ worker, onToggle, onUpgrade }: { worker: any; onToggle: () => void; onUpgrade: () => void }) {
  const statusColors: Record<string, string> = { ACTIVE: C.green, IDLE: C.gray, UPGRADING: C.amber };
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl">{worker.icon}</div>
          <div>
            <div className="font-semibold text-sm">{worker.name}</div>
            <div className="text-xs text-gray-400">{worker.role}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full`} style={{ background: statusColors[worker.status] || C.gray }}/>
          <span className="text-xs text-gray-400">{worker.status === 'ACTIVE' ? 'Activo' : worker.status === 'IDLE' ? 'Inactivo' : 'Mejorando'}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <div className="text-xs text-gray-500">Nivel</div>
          <div className="font-mono text-sm">{worker.level}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Ganancia/h</div>
          <div className="font-mono text-sm" style={{ color: C.red }}>{fmt(worker.baseIncomeRate)}€</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Generado</div>
          <div className="font-mono text-sm text-green-400">{fmt(worker.totalGenerated)}€</div>
        </div>
      </div>
      {worker.unlocked ? (
        <div className="flex gap-2">
          <button onClick={onToggle} className={`flex-1 text-xs py-2 rounded-lg font-medium transition-all ${
            worker.status === 'ACTIVE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
          }`}>
            {worker.status === 'ACTIVE' ? 'Detener' : 'Activar'}
          </button>
          <button onClick={onUpgrade} className="flex-1 text-xs py-2 rounded-lg" style={{ background: `${C.red}15`, color: C.red, border: `1px solid ${C.red}30` }}>
            Mejorar ({fmt(worker.costToUpgrade)}€)
          </button>
        </div>
      ) : (
        <button onClick={onToggle} className="w-full text-xs py-2 rounded-lg font-medium" style={{ background: `${C.red}20`, color: C.red, border: `1px solid ${C.red}30` }}>
          Desbloquear ({fmt(worker.costToUnlock)}€)
        </button>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState<'dashboard' | 'workers' | 'admin' | 'withdraw'>('dashboard');
  const [auth, setAuth] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [state, setState] = useState<SystemState | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'paypal' | 'bank' | 'reinvest'>('paypal');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  useEffect(() => { fetchState(); }, [fetchState]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) return;
    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-code': adminCode },
        body: JSON.stringify({ amount, method: withdrawMethod, destination: 'joanlazaro83@gmail.com' }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Retiro de ${fmt(amount)}€ procesado.` });
        setWithdrawAmount('');
        fetchState();
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al procesar retiro' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    }
  };

  const handleReinvest = async () => {
    try {
      const res = await fetch('/api/reinvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-code': adminCode },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Reinvertidos ${fmt(data.reinvested)}€ en el bot.` });
        fetchState();
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al reinvertir' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    }
  };

  const sparklineData = [12, 18, 14, 22, 19, 27, 24, 31, 28, 35, 33, 38];
  const totalRevenue = 3.10;
  const totalClicks = 244;
  const totalSales = 7;
  const totalCommission = 9.70;

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0000' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #ff1a1a, #cc0000)' }}>
              <Brain size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: C.red }}>Nexusia</h1>
            <p className="text-sm text-gray-400 mt-1">Panel de Ingresos Pasivos con IA</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
            <input type="password" value={adminCode} onChange={e => setAdminCode(e.target.value)}
              placeholder="Código de administrador"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 mb-4"
              onKeyDown={e => e.key === 'Enter' && setAuth(true)}/>
            <button onClick={() => setAuth(true)} className="w-full text-white py-3 rounded-xl font-semibold text-sm" style={{ background: 'linear-gradient(135deg, #ff1a1a, #cc0000)' }}>
              Acceder
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0000' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-xl" style={{ background: 'rgba(10,0,0,0.8)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff1a1a, #cc0000)' }}>
              <Brain size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-sm" style={{ color: C.red }}>Nexusia</span>
              <span className="text-[10px] text-gray-500 ml-2">v1.0</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchState()} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 transition-all">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'linear-gradient(135deg, #ff1a1a, #cc0000)' }}>A</div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-4 flex gap-2 overflow-x-auto">
        <Tab active={tab === 'dashboard'} label="Dashboard" icon={BarChart3} onClick={() => setTab('dashboard')} />
        <Tab active={tab === 'workers'} label="Bots IA" icon={Bot} onClick={() => setTab('workers')} />
        <Tab active={tab === 'admin'} label="Admin" icon={Settings} onClick={() => setTab('admin')} />
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

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <div className="max-w-6xl mx-auto px-4 pb-20">
          {/* Balance Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <BalanceCard label="Balance" value={state?.balance || 0} icon={Wallet} color={C.red} trend={12.5} />
            <BalanceCard label="Invertido" value={state?.investedCapital || 0} icon={TrendingUp} color={C.redDark} trend={8.2} />
            <BalanceCard label="Retirado" value={state?.totalWithdrawals || 0} icon={ArrowUpRight} color={C.green} />
            <BalanceCard label="Ganancias Netas" value={state?.netGains || 0} icon={Activity} color={C.cyan} trend={15.3} />
          </div>

          {/* Sparkline */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold">Ganancias (30 días)</h3>
                <p className="text-xs text-gray-400">Evolución del bot de reinversión</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold" style={{ color: C.red }}><Counter value={38}/>€</div>
                <div className="text-xs text-green-400">+26.3%</div>
              </div>
            </div>
            <div className="h-32">
              <Sparkline data={sparklineData} color={C.red} />
            </div>
          </div>

          {/* AdMob Revenue */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <DollarSign size={16} style={{ color: C.red }} /> Ingresos por Anuncios
            </h3>
            <div className="space-y-3">
              {ADMOB.map((ad, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: `${ad.color}20`, color: ad.color }}>N</div>
                    <div>
                      <div className="text-sm font-medium">{ad.app}</div>
                      <div className="text-xs text-gray-400">{fmtK(ad.impressions)} impresiones</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: ad.color }}>{fmt(ad.revenue)}€</div>
                    <div className="text-xs text-gray-400">eCPM {ad.ecpm}€</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Afiliados */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <ShoppingCart size={16} className="text-amber-400" /> Ingresos por Afiliados
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/[0.02] rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-amber-400">{fmtK(totalClicks)}</div>
                <div className="text-xs text-gray-400">Clicks</div>
              </div>
              <div className="bg-white/[0.02] rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-green-400">{totalSales}</div>
                <div className="text-xs text-gray-400">Ventas</div>
              </div>
            </div>
            <div className="space-y-2">
              {AFFILIATE_PRODUCTS.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-gray-300">{p.name}</span>
                  <span className="text-gray-400">{p.clicks} clicks · {p.sales} ventas · <span className="text-green-400">{fmt(p.commission)}€</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Workers */}
      {tab === 'workers' && (
        <div className="max-w-6xl mx-auto px-4 pb-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold">Bots de Reinversión IA</h2>
              <p className="text-xs text-gray-400">Trabajadores automáticos que generan y reinvierten beneficios</p>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.03] rounded-xl px-3 py-2">
              <Zap size={14} style={{ color: C.red }} />
              <span className="text-xs font-mono" style={{ color: C.red }}>{(state?.aiWorkers || []).filter((w: any) => w.status === 'ACTIVE').length} activos</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(state?.aiWorkers || []).map((worker: any) => (
              <AIWorkerCard key={worker.id} worker={worker} onToggle={() => {}} onUpgrade={() => {}} />
            ))}
          </div>
        </div>
      )}

      {/* Admin */}
      {tab === 'admin' && (
        <div className="max-w-6xl mx-auto px-4 pb-20">
          <h2 className="text-lg font-bold mb-6">Panel de Administración</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Settings size={16} style={{ color: C.red }} /> Configuración API
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Gemini IA</span>
                  <span className="text-green-400">Conectado</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Modelo de pago</span>
                  <span style={{ color: C.red }}>70/30 (Retiro/Reinversión)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Mercado objetivo</span>
                  <span className="text-white">España · Latinoamérica</span>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Repeat size={16} className="text-green-400" /> Reinversión Automática
              </h3>
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-green-400 mb-1"><Counter value={state?.reinvestmentFund || 0}/>€</div>
                <div className="text-xs text-gray-400">Fondo de reinversión disponible</div>
                <button onClick={handleReinvest} className="mt-4 text-white px-6 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #ff1a1a, #cc0000)' }}>
                  Reinvertir todo en el bot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw */}
      {tab === 'withdraw' && (
        <div className="max-w-6xl mx-auto px-4 pb-20">
          <h2 className="text-lg font-bold mb-6">Retirar Ganancias</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold" style={{ color: C.red }}><Counter value={state?.balance || 0}/>€</div>
              <div className="text-xs text-gray-400">Balance disponible</div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400"><Counter value={state?.totalWithdrawals || 0}/>€</div>
              <div className="text-xs text-gray-400">Total retirado</div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-400"><Counter value={state?.reinvestmentFund || 0}/>€</div>
              <div className="text-xs text-gray-400">En reinversión</div>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-sm font-semibold mb-4">Nuevo Retiro</h3>
            <div className="flex gap-2 mb-4">
              {(['paypal', 'bank', 'reinvest'] as const).map(m => (
                <button key={m} onClick={() => setWithdrawMethod(m)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                    withdrawMethod === m ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-gray-400 border border-white/10'
                  }`}>
                  {m === 'paypal' ? 'PayPal' : m === 'bank' ? 'Banco' : 'Reinvertir'}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="Cantidad en €"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500"/>
              <button onClick={handleWithdraw} className="text-white px-6 py-3 rounded-xl text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #ff1a1a, #cc0000)' }}>
                {withdrawMethod === 'reinvest' ? 'Reinvertir' : 'Retirar'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">Los retiros se procesan a tu PayPal: joanlazaro83@gmail.com</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-4 text-center text-xs text-gray-500">
        Nexusia v1.0 · Desarrollado por BrainLogic AI · Ingresos Pasivos con IA
      </footer>
    </div>
  );
}