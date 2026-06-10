const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function test() {
  try {
    const db = await open({ filename: 'C:/Users/omkas/AppData/Roaming/smg-pos/smg_pos.db', driver: sqlite3.Database });
    const row = await db.get('SELECT COUNT(*) as count FROM inventory');
    let barcode = 'SMG-' + (1000 + row.count + 1);
    console.log('Barcode:', barcode);
    const result = await db.run(`
      INSERT INTO inventory (barcode, category, purity, gross_wt, net_wt, stone_wt, making_charge_type, making_charge_rate, vendor_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, barcode, 'Ring', '22k', 3.33, 3.33, 0, 'percentage', 13, 'SOJAV SILVER');
    console.log('Success:', result);
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
