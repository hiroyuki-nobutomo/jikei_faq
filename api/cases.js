import { getDoc } from './utils/sheets.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { caseRecord } = req.body;
    
    if (!process.env.GOOGLE_SHEET_ID) {
      return res.json({ success: true, dummy: true });
    }

    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['CasesDB'];
    
    if (!sheet) {
      throw new Error('CasesDB sheet not found');
    }

    await sheet.addRow({
      id: caseRecord.id,
      timestamp: caseRecord.timestamp,
      topic: caseRecord.topic,
      disability: caseRecord.disability,
      org: caseRecord.org,
      status: caseRecord.status,
      inquiry: caseRecord.initialInquiry,
      latestReply: caseRecord.latestReply
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving case:', error);
    res.status(500).json({ error: 'Failed to save case record' });
  }
}
