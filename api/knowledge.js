import { getDoc } from './utils/sheets.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    if (!process.env.GOOGLE_SHEET_ID) {
       return res.json([]); 
    }
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['KnowledgeDB']; 
    
    if (!sheet) {
       return res.json([]);
    }

    const rows = await sheet.getRows();
    const knowledgeBase = rows.map(row => ({
      id: row.id,
      disability: row.disability,
      topic: row.topic,
      content: row.content
    }));

    res.json(knowledgeBase);
  } catch (error) {
    console.error('Error fetching knowledge:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge base from spreadsheet' });
  }
}
