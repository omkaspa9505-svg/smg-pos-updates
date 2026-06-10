const { google } = require('googleapis');
const path = require('path');

const SPREADSHEET_ID = '1YVLSfUkp3kZTh-_3wZS_S5GOgQauGDqtyQOVMYzA1vY';
const credentialsPath = path.join(__dirname, 'credentials.json');

async function fixSheet() {
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'SCHEME DATA!A1:B1000'
    });
    
    const rows = res.data.values;
    
    // Find rows where Column A has data but Column B is empty
    // And also find the two new rows at the bottom
    let toDeleteStart = -1;
    let toDeleteEnd = -1;
    
    let newRows = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row[0] && row[0].startsWith('SMG-') && !row[1]) {
        if (toDeleteStart === -1) toDeleteStart = i;
        toDeleteEnd = i;
      }
      if (row[0] && row[0].startsWith('SMG-') && row[1]) {
        // If it's a valid row but it's way down at the bottom (like 504)
        if (i > 500) {
           // We'll need to fetch the full row to move it up
           newRows.push(i + 1); // 1-indexed
        }
      }
    }
    
    console.log(`Empty pre-filled IDs from row ${toDeleteStart + 1} to ${toDeleteEnd + 1}`);
    console.log(`Valid new rows at the bottom: ${newRows.join(', ')}`);
    
    // We can just clear the empty rows and move the bottom rows up!
    
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

fixSheet();
