import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tolzqxflecqbjdefohom.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const ADMIN_CODE   = process.env.ADMIN_CODE || 'joan123';

const ADMOB_APPS = [
  { name: 'Nexusia', appId: 'ca-app-pub-4903263409458961~5751005760', color: '#7c3aed' },
  { name: 'Lanzarus',  appId: 'ca-app-pub-4903263409458961~1005307516', color: '#00ff88' },
  { name: 'r3dm/guia', appId: 'ca-app-pub-4903263409458961~2391607033', color: '#00d4ff' },
];

// ─── Supabase helper ─────────────────────────────────────────────────────────
async function supa(path: string, opts: RequestInit = {}): Promise<any> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...((opts.headers as Record<string, string>) || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text}`);
  try { return JSON.parse(text); } catch { return text; }
}

// ─── Default state ────────────────────────────────────────────────────────────
const DEFAULT_STATE = {
  balance: 0,
  investedCapital: 0,
  totalWithdrawals: 0,
  reinvestmentFund: 0,
  netGains: 0,
  collaborators: [],
  transactions: [],
  webhookLogs: [],
  aiWorkers: [
    { id: 'w1', name: 'Bot Trader', role: 'Trading Automático', status: 'ACTIVE', level: 3, model: 'Gemini 1.5 Flash', baseIncomeRate: 0.45, unlocked: true, costToUnlock: 0, costToUpgrade: 50, totalGenerated: 127.30, icon: '🤖' },
    { id: 'w2', name: 'Analista', role: 'Análisis de Mercado', status: 'ACTIVE', level: 2, model: 'Gemini 1.5 Flash', baseIncomeRate: 0.30, unlocked: true, costToUnlock: 0, costToUpgrade: 35, totalGenerated: 84.50, icon: '📊' },
    { id: 'w3', name: 'Arbitraje', role: 'Arbitraje Cripto', status: 'IDLE', level: 1, model: 'Gemini 2.0 Flash', baseIncomeRate: 0.60, unlocked: false, costToUnlock: 100, costToUpgrade: 75, totalGenerated: 0, icon: '⚡' },
    { id: 'w4', name: 'Scalper', role: 'Scalping', status: 'IDLE', level: 1, model: 'Gemini 2.0 Pro', baseIncomeRate: 0.90, unlocked: false, costToUnlock: 250, costToUpgrade: 150, totalGenerated: 0, icon: '🎯' },
  ],
  aiLogs: [],
  apiConfig: { geminiConnected: true, distributionWebhook: '', targetMarket: 'España · Latinoamérica', payoutModel: 'SPLIT_70_30' },
};

async function getState() {
  try {
    const rows = await supa('nexusia_state?select=*');
    if (rows && rows.length > 0) {
      const current = rows[0].state || {};
      return { ...DEFAULT_STATE, ...current };
    }
  } catch (e) { console.error('getState error:', e); }
  return DEFAULT_STATE;
}

async function saveState(state: any) {
  await supa('nexusia_state', {
    method: 'POST',
    body: JSON.stringify({ key: 'main', state, updated_at: new Date().toISOString() }),
    headers: { 'Prefer': 'resolution=merge-duplicates' },
  });
}

// ─── Route handlers ───────────────────────────────────────────────────────────

async function handleData(req: VercelRequest, res: VercelResponse) {
  const st = await getState();
  const txArr = await supa('nexusia_transactions?select=*&order=created_at.desc&limit=20');
  const rawTx = Array.isArray(txArr) ? txArr : [];
  const transactions = rawTx.map((t: any) => ({
    id: t.id, type: t.type || 'DEPOSIT', status: t.status || 'COMPLETED',
    amount: parseFloat(t.amount) || 0, date: t.created_at,
    reference: t.reference || '', description: t.description || '', gateway: t.gateway || 'INTERNAL',
  }));
  res.json({ ...st, transactions });
}

async function handleIncome(req: VercelRequest, res: VercelResponse) {
  const { amount, source } = req.body || {};
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Monto inválido' });
  const st = await getState();
  st.balance += amount;
  st.netGains += amount;
  // Reinversión automática del 30%
  const reinvest = amount * 0.3;
  st.reinvestmentFund += reinvest;
  st.balance -= reinvest;
  await saveState(st);
  // Registrar transacción
  await supa('nexusia_transactions', {
    method: 'POST',
    body: JSON.stringify({
      type: 'DEPOSIT', status: 'COMPLETED', amount: amount,
      reference: source || 'ingreso', description: `Ingreso ${source || 'anuncios'}`,
      gateway: 'AI_ENGINE',
    }),
  });
  res.json({ success: true, balance: st.balance, reinvested: reinvest });
}

async function handleWithdraw(req: VercelRequest, res: VercelResponse) {
  const code = req.headers['x-admin-code'] as string;
  if (code !== ADMIN_CODE) return res.status(401).json({ error: 'Código inválido' });
  const { amount, method, destination } = req.body || {};
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Monto inválido' });
  const st = await getState();
  if (amount > st.balance) return res.status(400).json({ error: 'Saldo insuficiente' });
  st.balance -= amount;
  st.totalWithdrawals += amount;
  await saveState(st);
  const txId = `w_${Date.now()}`;
  await supa('nexusia_transactions', {
    method: 'POST',
    body: JSON.stringify({
      id: txId, type: 'WITHDRAWAL', status: 'PENDING', amount: amount,
      reference: method, description: `Retiro a ${destination || method}`, gateway: 'CUSTOM',
    }),
  });
  res.json({ success: true, txId, balance: st.balance, amount });
}

async function handleReinvest(req: VercelRequest, res: VercelResponse) {
  const code = req.headers['x-admin-code'] as string;
  if (code !== ADMIN_CODE) return res.status(401).json({ error: 'Código inválido' });
  const st = await getState();
  if (st.reinvestmentFund <= 0) return res.status(400).json({ error: 'No hay fondos para reinvertir' });
  const amount = st.reinvestmentFund;
  st.investedCapital += amount;
  st.reinvestmentFund = 0;
  await saveState(st);
  await supa('nexusia_transactions', {
    method: 'POST',
    body: JSON.stringify({
      type: 'AI_REINVEST', status: 'COMPLETED', amount: amount,
      reference: 'auto-reinvest', description: 'Reinversión automática en bot de trading',
      gateway: 'INTERNAL',
    }),
  });
  res.json({ success: true, reinvested: amount, investedCapital: st.investedCapital });
}

async function handleAdmob(req: VercelRequest, res: VercelResponse) {
  res.json({ apps: ADMOB_APPS });
}

async function handleSync(req: VercelRequest, res: VercelResponse) {
  const code = req.headers['x-admin-code'] as string;
  if (code !== ADMIN_CODE) return res.status(401).json({ error: 'Código inválido' });
  const { state } = req.body || {};
  if (!state) return res.status(400).json({ error: 'State requerido' });
  await saveState(state);
  res.json({ success: true });
}

// ─── Router ───────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-code');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const url = new URL(req.url || '', 'http://localhost');
    const path = url.pathname.replace(/\/api\//, '').split('?')[0];
    switch (path) {
      case 'data': return await handleData(req, res);
      case 'income': return await handleIncome(req, res);
      case 'withdraw': return await handleWithdraw(req, res);
      case 'reinvest': return await handleReinvest(req, res);
      case 'admob': return await handleAdmob(req, res);
      case 'sync': return await handleSync(req, res);
      default: return res.status(404).json({ error: 'Not found' });
    }
  } catch (e: any) {
    console.error('handler error:', e);
    res.status(500).json({ error: e.message || 'Error interno' });
  }
}