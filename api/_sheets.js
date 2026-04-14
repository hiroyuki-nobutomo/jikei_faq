import { google } from "googleapis";

let _sheets = null;

function getSheets() {
  if (_sheets) return _sheets;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  _sheets = google.sheets({ version: "v4", auth });
  return _sheets;
}

const SPREADSHEET_ID = () => process.env.GOOGLE_SHEETS_ID;

/**
 * シートからデータを全行読み取る。
 * 1行目をヘッダーとして、各行をオブジェクトに変換して返す。
 */
export async function readSheet(sheetName) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID(),
    range: `${sheetName}!A:Z`,
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) return [];

  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ""; });
    return obj;
  });
}

/**
 * シートに1行追加する。
 */
export async function appendRow(sheetName, rowObj) {
  const sheets = getSheets();

  // ヘッダー取得
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID(),
    range: `${sheetName}!1:1`,
  });

  const headers = headerRes.data.values?.[0];
  if (!headers) throw new Error(`Sheet "${sheetName}" has no headers`);

  const row = headers.map(h => rowObj[h] ?? "");

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID(),
    range: `${sheetName}!A:Z`,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });
}

/**
 * シートの特定行を更新する（id列でマッチ）。
 */
export async function updateRow(sheetName, id, updates) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID(),
    range: `${sheetName}!A:Z`,
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) return false;

  const headers = rows[0];
  const idCol = headers.indexOf("id");
  if (idCol === -1) return false;

  const rowIndex = rows.findIndex((r, i) => i > 0 && r[idCol] === id);
  if (rowIndex === -1) return false;

  const updatedRow = [...rows[rowIndex]];
  for (const [key, val] of Object.entries(updates)) {
    const col = headers.indexOf(key);
    if (col !== -1) updatedRow[col] = val;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID(),
    range: `${sheetName}!A${rowIndex + 1}`,
    valueInputOption: "RAW",
    requestBody: { values: [updatedRow] },
  });
  return true;
}

/**
 * シートの特定行を削除する（id列でマッチ）。
 */
export async function deleteRow(sheetName, id) {
  const sheets = getSheets();
  const spreadsheetId = SPREADSHEET_ID();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) return false;

  const headers = rows[0];
  const idCol = headers.indexOf("id");
  if (idCol === -1) return false;

  const rowIndex = rows.findIndex((r, i) => i > 0 && r[idCol] === id);
  if (rowIndex === -1) return false;

  // シートIDを取得
  const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = sheetMeta.data.sheets.find(s => s.properties.title === sheetName);
  if (!sheet) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheet.properties.sheetId,
            dimension: "ROWS",
            startIndex: rowIndex,
            endIndex: rowIndex + 1,
          }
        }
      }]
    }
  });
  return true;
}

/**
 * シートが存在しなければヘッダー付きで初期化する。
 */
export async function ensureSheet(sheetName, headers) {
  const sheets = getSheets();
  const spreadsheetId = SPREADSHEET_ID();

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = meta.data.sheets.some(s => s.properties.title === sheetName);

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheetName } } }]
      }
    });
  }

  // ヘッダー確認
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  });

  if (!headerRes.data.values || headerRes.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
  }
}
