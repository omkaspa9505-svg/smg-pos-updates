const { google } = require('googleapis');
const path = require('path');

const FILE_ID = '1YVLSfUkp3kZTh-_3wZS_S5GOgQauGDqtyQOVMYzA1vY';
const credentialsPath = path.join(__dirname, 'credentials.json');

async function listRevisions() {
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ],
  });

  const drive = google.drive({ version: 'v3', auth });

  try {
    const res = await drive.revisions.list({
      fileId: FILE_ID,
      fields: 'revisions(id,modifiedTime,lastModifyingUser)'
    });

    const revisions = res.data.revisions;
    console.log('Total revisions:', revisions.length);
    revisions.forEach((rev, i) => {
      console.log(`[${i}] ID: ${rev.id} | Time: ${rev.modifiedTime} | By: ${rev.lastModifyingUser?.displayName}`);
    });

    return revisions;
  } catch (err) {
    console.error('Error:', err.message);
  }
}

listRevisions();
