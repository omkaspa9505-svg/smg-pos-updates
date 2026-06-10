const { google } = require('googleapis');
const path = require('path');

const SPREADSHEET_ID = '1YVLSfUkp3kZTh-_3wZS_S5GOgQauGDqtyQOVMYzA1vY';
const credentialsPath = path.join(__dirname, 'credentials.json');

async function formatHeaders() {
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const res = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    const requests = [];

    res.data.sheets.forEach(sheet => {
      const sheetId = sheet.properties.sheetId;
      const title = sheet.properties.title;
      
      if (['SCHEME DATA', 'INVENTORY DATA', 'SALES DATA'].includes(title)) {
        requests.push({
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 1
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
                textFormat: {
                  foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                  bold: true,
                  fontSize: 11
                },
                horizontalAlignment: 'CENTER'
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
          }
        });
      }
    });

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests
        }
      });
      console.log('Successfully formatted headers!');
    }
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

formatHeaders();
