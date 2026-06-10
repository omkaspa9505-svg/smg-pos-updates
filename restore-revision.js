const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const FILE_ID = '1YVLSfUkp3kZTh-_3wZS_S5GOgQauGDqtyQOVMYzA1vY';
const RESTORE_REVISION_ID = '125'; // Last good version before today's damage
const credentialsPath = path.join(__dirname, 'credentials.json');

async function restoreRevision() {
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ],
  });

  const drive = google.drive({ version: 'v3', auth });
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Step 1: Download the old revision as xlsx
    console.log(`Downloading revision ${RESTORE_REVISION_ID} as xlsx...`);
    const res = await drive.revisions.list({ fileId: FILE_ID, fields: '*' });
    const target = res.data.revisions.find(r => r.id === RESTORE_REVISION_ID);
    const exportUrl = target.exportLinks['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

    const token = await auth.getAccessToken();
    const dlRes = await axios.get(exportUrl, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer'
    });

    const xlsxPath = path.join(__dirname, 'restored.xlsx');
    fs.writeFileSync(xlsxPath, Buffer.from(dlRes.data));
    console.log(`Downloaded. Size: ${dlRes.data.byteLength} bytes`);

    // Step 2: Upload it back over the existing file to restore
    const { Readable } = require('stream');
    const fileStream = fs.createReadStream(xlsxPath);

    await drive.files.update({
      fileId: FILE_ID,
      media: {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: fileStream
      }
    });

    console.log('✅ Successfully restored your Google Sheet to version from 2026-06-09 07:35!');
    fs.unlinkSync(xlsxPath);
  } catch (err) {
    console.error('Error:', err.message);
    if (err.response?.data) console.error('Details:', JSON.stringify(err.response.data).slice(0, 500));
  }
}

restoreRevision();
