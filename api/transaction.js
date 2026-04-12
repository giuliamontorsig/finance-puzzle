const { kv } = require('@vercel/kv');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = req.headers['authorization'];
  if (apiKey !== `Bearer ${process.env.API_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'POST') {
    const tx = req.body;
    tx.id = Date.now();
    const existing = await kv.get('transactions') || [];
    existing.push(tx);
    await kv.set('transactions', existing);
    return res.status(200).json({ ok: true, transaction: tx });
  }

  if (req.method === 'GET') {
    const transactions = await kv.get('transactions') || [];
    return res.status(200).json(transactions);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    const existing = await kv.get('transactions') || [];
    await kv.set('transactions', existing.filter(t => String(t.id) !== String(id)));
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
