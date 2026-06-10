const { google } = require('googleapis');
const path = require('path');
const auth = new google.auth.GoogleAuth({
  keyFile: 'C:/Users/omkas/Desktop/SMG_POS/credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });
sheets.spreadsheets.values.get({
  spreadsheetId: '1YVLSfUkp3kZTh-_3wZS_S5GOgQauGDqtyQOVMYzA1vY',
  range: 'SCHEME DATA!A1:Z5'
}).then(res => console.log(JSON.stringify(res.data.values, null, 2))).catch(console.error);
