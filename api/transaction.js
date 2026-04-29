export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = req.headers['authorization'];
  if (apiKey !== `Bearer ${process.env.API_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  async function redisGet(key) {
    const r = await fetch(`${UPSTASH_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
    });
    const data = await r.json();
    return data.result ? JSON.parse(data.result) : [];
  }

  async function redisSet(key, value) {
    await fetch(`${UPSTASH_URL}/set/${key}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(JSON.stringify(value))
    });
  }

  if (req.method === 'GET') {
    const transactions = await redisGet('transactions');
    return res.status(200).json(transactions);
  }

  if (req.method === 'POST') {
    const tx = { ...req.body, id: Date.now() };
    const existing = await redisGet('transactions');
    existing.push(tx);
    await redisSet('transactions', existing);
    return res.status(200).json({ ok: true, transaction: tx });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    const existing = await redisGet('transactions');
    await redisSet('transactions', existing.filter(t => String(t.id) !== String(id)));
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
