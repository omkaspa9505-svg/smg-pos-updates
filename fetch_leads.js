const { google } = require('googleapis');
const fs = require('fs');

async function exportLeads() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'C:/Users/omkas/Desktop/SMG_POS/credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1YVLSfUkp3kZTh-_3wZS_S5GOgQauGDqtyQOVMYzA1vY',
    range: 'SCHEME DATA!A5:Z100'
  });
  
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return;
  }
  
  const leads = [];
  for (const row of rows) {
    if (!row[0]) continue; // Skip empty rows
    leads.push({
      scheme_id: row[0],
      name: row[1],
      mobile: row[2],
      scheme_type: row[3],
      enrolment_date: row[4],
      base_amount: row[5]?.replace(/,/g, ''),
      staff_name: row[6],
      instalments: [
        { amount: row[7]?.replace(/,/g, ''), date: row[8], mode: row[9], rate: row[10], added_g: row[11], status: row[12] }
        // We'll just grab the first instalment for the migration script to see what's there
      ]
    });
  }
  
  fs.writeFileSync('C:/Users/omkas/Desktop/SMG_POS/imported_leads.json', JSON.stringify(leads, null, 2));
  console.log('Exported ' + leads.length + ' leads to imported_leads.json');
}

exportLeads().catch(console.error);
