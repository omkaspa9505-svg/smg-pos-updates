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
    const res = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    let sheetId = -1;
    res.data.sheets.forEach(sheet => {
      if (sheet.properties.title === 'SCHEME DATA') {
        sheetId = sheet.properties.sheetId;
      }
    });

    if (sheetId === -1) {
      console.error('SCHEME DATA sheet not found');
      return;
    }

    // 1. Fetch the data from rows 505 and 506
    const dataRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'SCHEME DATA!A505:Z506'
    });
    
    const rowsToMove = dataRes.data.values;
    if (rowsToMove && rowsToMove.length > 0) {
      // 2. Put them in row 10 and 11
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'SCHEME DATA!A10',
        valueInputOption: 'RAW',
        requestBody: {
          values: rowsToMove
        }
      });
      console.log('Moved rows up to row 10.');
    }

    // 3. Delete rows 12 to 506 (0-indexed: startIndex 11, endIndex 506)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: 11,
                endIndex: 506
              }
            }
          }
        ]
      }
    });
    console.log('Deleted the empty pre-filled rows.');

  } catch (err) {
    console.error('Failed:', err.message);
  }
}

fixSheet();
