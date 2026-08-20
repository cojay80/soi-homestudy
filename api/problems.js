// api/problems.js — 구글시트 TSV 프록시 (클라이언트가 직접 시트에 접근 못 할 때의 폴백)
const DEFAULT_SHEET_TSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdAWwA057OOm6VpUKTACcNzXnBc7XJ0JTIu1ZYYxKQRs1Fmo5UvabUx09Md39WHxHVVZlQ_F0Rw1zr/pub?output=tsv';

export default async function handler(req, res) {
  const GOOGLE_SHEET_TSV = process.env.GOOGLE_SHEET_TSV || DEFAULT_SHEET_TSV;
  try {
    const r = await fetch(GOOGLE_SHEET_TSV, { cache: 'no-store' });
    if (!r.ok) return res.status(502).send('Bad gateway: sheet');
    const tsv = await r.text();
    res.setHeader('Content-Type', 'text/tab-separated-values');
    res.status(200).send(tsv);
  } catch (e) {
    console.error('[sheet] error:', e.message);
    res.status(500).send('Sheet fetch error');
  }
}
