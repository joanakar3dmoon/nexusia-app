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

// ─── Default state (sin datos ficticios) ─────────────────────────────────────
const DEFAULT_STATE = {
  balance: 0,
  investedCapital: 0,
  totalWithdrawals: 0,
  reinvestmentFund: 0,
  netGains: 0,
  collaborators: [],
  transactions: [],
  webhookLogs: [],
  aiWorkers: [],
  aiLogs: [],
  apiConfig: { geminiConnected: false, distributionWebhook: '', targetMarket: 'España', payoutModel: 'SPLIT_70_30' },
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
  await saveState(st);
  await supa('nexusia_transactions', {
    method: 'POST',
    body: JSON.stringify({
      type: 'INGRESO', status: 'COMPLETED', amount: amount,
      reference: source || 'ingreso', description: `Ingreso ${source || 'anuncios'}`,
      gateway: 'REAL',
    }),
  });
  res.json({ success: true, balance: st.balance });
}

async function handleWithdraw(req: VercelRequest, res: VercelResponse) {
  const { amount, method, note, phoneNumber, cardNumber, accountHolder, destination } = req.body || {};
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Monto inválido' });
  const st = await getState();
  if (amount > st.balance) return res.status(400).json({ error: 'Saldo insuficiente' });
  st.balance -= amount;
  st.totalWithdrawals += amount;
  await saveState(st);
  const methodLabel = method === 'paypal' ? `PayPal (${destination || 'joanlazaro83@gmail.com'})`
    : method === 'bizum' ? `Bizum (${phoneNumber || ''})`
    : method === 'tarjeta' ? `Tarjeta débito (${(cardNumber || '').slice(-4)})`
    : method;
  const txId = `w_${Date.now()}`;
  await supa('nexusia_transactions', {
    method: 'POST',
    body: JSON.stringify({
      id: txId, type: 'WITHDRAWAL', status: 'PENDING', amount: amount,
      reference: method, description: `Retiro a ${methodLabel}`, gateway: 'MANUAL',
    }),
  });
  res.json({ success: true, txId, balance: st.balance, amount });
}

async function handleAdmob(req: VercelRequest, res: VercelResponse) {
  // Simular datos reales de AdMob mientras la API responde
  // En producción reemplazar con fetch a Google AdMob API
  res.json(ADMOB_APPS.map(app => ({
    ...app,
    revenue: 0,
    ecpm: 0,
    impressions: 0,
  })));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const url = new URL(req.url || '', 'http://localhost');
    const path = url.pathname.replace(/\/api\//, '').split('?')[0];
    switch (path) {
      case 'data': return await handleData(req, res);
      case 'income': return await handleIncome(req, res);
      case 'withdraw': return await handleWithdraw(req, res);
      case 'admob': return await handleAdmob(req, res);
      default: return res.status(404).json({ error: 'Not found' });
    }
  } catch (e: any) {
    console.error('handler error:', e);
    res.status(500).json({ error: e.message || 'Error interno' });
  }
}