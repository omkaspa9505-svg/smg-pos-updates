const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function updateHeaders() {
  const SPREADSHEET_ID = '1YVLSfUkp3kZTh-_3wZS_S5GOgQauGDqtyQOVMYzA1vY';
  const credentialsPath = path.join(__dirname, 'credentials.json');

  if (!fs.existsSync(credentialsPath)) {
    console.error('Credentials not found at', credentialsPath);
    return;
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const inventoryHeaders = [
    'Barcode', 'Category', 'Purity', 'Gross Wt', 'Net Wt', 'Less', 
    'Making Charge Type', 'Making Charge Rate', 'Supplier / HUID'
  ];

  const salesHeaders = [
    'Invoice No', 'Date', 'Customer Name', 'Mobile', 'Total Metal Value', 
    'Total Making Charges', 'GST', 'Old Metal Exchange', 'Grand Total', 
    'Payment Mode', 'Items Sold', 'Exchanges'
  ];

  const schemeHeaders = [
    'Scheme ID', 'Customer Name', 'Mobile', 'Scheme Type', 'Enrolment Date', 'Monthly Amount', 'Staff Name'
  ]

  try {
    // Update Inventory headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'INVENTORY DATA!A1:I1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [inventoryHeaders] },
    });
    console.log('Inventory headers updated.');

    // Update Sales headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'SALES DATA!A1:L1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [salesHeaders] },
    });
    console.log('Sales headers updated.');

    // Update Scheme headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'SCHEME DATA!A1:G1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [schemeHeaders] },
    });
    console.log('Scheme headers updated.');

  } catch (error) {
    console.error('Error updating headers:', error);
  }
}

updateHeaders();
