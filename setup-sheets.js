const { google } = require('googleapis');
const path = require('path');

const SPREADSHEET_ID = '1YVLSfUkp3kZTh-_3wZS_S5GOgQauGDqtyQOVMYzA1vY';
const credentialsPath = path.join(__dirname, 'credentials.json');

async function setupHeaders() {
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const headers = [
    {
      range: 'SCHEME DATA!A1:G1',
      values: [['Scheme ID', 'Customer Name', 'Mobile', 'Scheme Type', 'Enrolment Date', 'Base Amount', 'Staff Name']]
    },
    {
      range: 'INVENTORY DATA!A1:K1',
      values: [['Barcode', 'Category', 'Purity', 'Gross Wt', 'Net Wt', 'Stone Wt', 'Charge Type', 'Charge Rate', 'Vendor Name', 'Stones Detail', 'HUID']]
    },
    {
      range: 'SALES DATA!A1:P1',
      values: [['Date', 'Invoice No', 'Customer Name', 'Mobile', 'Payment Mode', 'Items Value', 'GST Amount', 'Grand Total', 'Exchange Value', 'Discount', 'Taxable Amount', 'CGST', 'SGST', 'Cash Amount', 'UPI Amount', 'Card Amount']]
    }
  ];

  for (const h of headers) {
    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: h.range,
        valueInputOption: 'RAW',
        requestBody: {
          values: h.values
        }
      });
      console.log(`Updated headers for ${h.range}`);
    } catch (err) {
      console.error(`Failed to update ${h.range}:`, err.message);
    }
  }
}

setupHeaders();
