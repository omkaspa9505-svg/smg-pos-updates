const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join('C:', 'Users', 'omkas', 'AppData', 'Roaming', 'smg-pos', 'smg_pos.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("ALTER TABLE customers ADD COLUMN scheme_id TEXT", (err) => {
    if (err && !err.message.includes('duplicate column')) console.log(err.message);
  });
  db.run("ALTER TABLE customers ADD COLUMN staff_name TEXT", (err) => {
    if (err && !err.message.includes('duplicate column')) console.log(err.message);
  });

  db.run("CREATE TABLE IF NOT EXISTS instalments (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER, amount REAL, date TEXT, mode TEXT, rate TEXT, added_g TEXT, status TEXT, FOREIGN KEY(customer_id) REFERENCES customers(id))");

  const leadsRaw = fs.readFileSync('C:/Users/omkas/Desktop/SMG_POS/imported_leads.json', 'utf8');
  const leads = JSON.parse(leadsRaw);

  const stmtCustomer = db.prepare("INSERT INTO customers (name, mobile, scheme_type, enrolment_date, base_amount, scheme_id, staff_name) VALUES (?, ?, ?, ?, ?, ?, ?)");
  const stmtInstalment = db.prepare("INSERT INTO instalments (customer_id, amount, date, mode, rate, added_g, status) VALUES (?, ?, ?, ?, ?, ?, ?)");

  leads.forEach(lead => {
    if (!lead.name) return; // skip empty
    
    db.get('SELECT id FROM customers WHERE scheme_id = ? OR mobile = ?', [lead.scheme_id, lead.mobile], (err, row) => {
      if (row) {
        console.log('Skipping existing lead:', lead.name);
      } else {
        stmtCustomer.run([lead.name, lead.mobile, lead.scheme_type, lead.enrolment_date, parseFloat(lead.base_amount), lead.scheme_id, lead.staff_name], function(err) {
          if (err) {
            console.error('Error inserting customer:', err.message);
          } else {
            console.log('Inserted customer:', lead.name, 'with ID:', this.lastID);
            const customerId = this.lastID;
            
            if (lead.instalments && lead.instalments.length > 0) {
              const inst = lead.instalments[0];
              if (inst.amount) {
                stmtInstalment.run([customerId, parseFloat(inst.amount), inst.date, inst.mode, inst.rate, inst.added_g, inst.status]);
              }
            }
          }
        });
      }
    });
  });
});

setTimeout(() => {
  db.close();
  console.log('Done.');
}, 2000);
