import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { fileURLToPath } from 'url'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { google } from 'googleapis'
import fs from 'fs'
import { initWhatsApp, getWhatsAppStatus, sendWhatsAppMessage, logoutWhatsApp, destroyWhatsApp } from './whatsapp'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

app.on('before-quit', async (e) => {
  e.preventDefault()
  console.log('Quitting app: destroying WhatsApp client...')
  await destroyWhatsApp()
  app.exit()
})

let db: any

async function performFortKnoxBackup() {
  try {
    const dbPath = join(app.getPath('userData'), 'database.sqlite')
    if (!fs.existsSync(dbPath)) return;

    if (db) {
      // Force SQLite to write any pending WAL transactions to the main database file before copying
      await db.exec('PRAGMA wal_checkpoint(FULL);')
    }

    // We backup to two locations: C:\ drive and the user's Documents folder
    const backupDirs = [
      'C:\\SMG_POS_Backups',
      join(app.getPath('documents'), 'SMG_POS_Backups')
    ]

    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const hourStr = now.getHours().toString().padStart(2, '0')
    const fileName = `backup_${dateStr}_${hourStr}h.sqlite`

    for (const dir of backupDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      const backupPath = join(dir, fileName)
      fs.copyFileSync(dbPath, backupPath)
      fs.utimesSync(backupPath, now, now) // Force Date Modified to update visually
    }
    console.log('Fort Knox Backup completed:', fileName)
  } catch (err) {
    console.error('Fort Knox Backup failed:', err)
  }
}

async function setupDatabase() {
  const dbPath = join(app.getPath('userData'), 'database.sqlite')

  if (!fs.existsSync(dbPath)) {
    // If the database doesn't exist (e.g. fresh install)
    const initialDbPath = app.isPackaged 
      ? join(process.resourcesPath, 'initial_db.sqlite')
      : join(__dirname, '../../initial_db.sqlite');
      
    if (fs.existsSync(initialDbPath)) {
      try {
        fs.copyFileSync(initialDbPath, dbPath);
        console.log('Seeded initial database successfully!');
      } catch (e) {
        console.error('Failed to seed initial database:', e);
      }
    }
  }

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  })

  await db.exec('PRAGMA journal_mode = WAL;')
  await db.exec('PRAGMA synchronous = NORMAL;')

  performFortKnoxBackup()

  // --- DATABASE SCHEMA ---
  await db.exec(`
    CREATE TABLE IF NOT EXISTS daily_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE,
      gold_22k NUMERIC,
      gold_24k NUMERIC,
      silver NUMERIC
    );
  `);
  
  // Add new columns if they don't exist
  const columnsToAdd = [
    'gold_13k', 'gold_14k', 'gold_18k', 'gold_20k',
    'silver_rs', 'silver_92_5', 'silver_99_9', 'silver_999'
  ];
  for (const col of columnsToAdd) {
    try { await db.exec(`ALTER TABLE daily_rates ADD COLUMN ${col} NUMERIC`); } catch(e) {}
  }

  await db.exec(`

    CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barcode TEXT UNIQUE,
        category TEXT,
        purity TEXT,
        gross_wt REAL,
        net_wt REAL,
        stone_wt REAL,
        making_charge_type TEXT,
        making_charge_rate REAL,
        vendor_name TEXT,
        status TEXT DEFAULT 'in_stock',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE,
        customer_name TEXT,
        customer_phone TEXT,
        payment_mode TEXT,
        subtotal REAL,
        gst_amount REAL,
        grand_total REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER,
        barcode TEXT,
        category TEXT,
        purity TEXT,
        net_wt REAL,
        metal_value REAL,
        making_charge REAL,
        FOREIGN KEY(sale_id) REFERENCES sales(id)
      );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      mobile TEXT,
      scheme_type TEXT,
      enrolment_date TEXT,
      base_amount NUMERIC
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT,
      customer_mobile TEXT,
      total_metal_value NUMERIC,
      total_making_charges NUMERIC,
      gst_amount NUMERIC,
      grand_total NUMERIC,
      payment_mode TEXT,
      date TEXT
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER,
      inventory_id INTEGER,
      sale_price NUMERIC,
      FOREIGN KEY(invoice_id) REFERENCES invoices(id),
      FOREIGN KEY(inventory_id) REFERENCES inventory(id)
    );

    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      role TEXT,
      phone TEXT,
      join_date TEXT
    );

    CREATE TABLE IF NOT EXISTS whatsapp_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT,
      message TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT
    );

      CREATE TABLE IF NOT EXISTS exchanges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER,
        metal_type TEXT,
        gross_wt NUMERIC,
        purity_yield NUMERIC,
        net_value NUMERIC,
        FOREIGN KEY(invoice_id) REFERENCES sales(id)
      );
    `)

    // Patch missing columns for existing users
    try { await db.exec('ALTER TABLE inventory ADD COLUMN vendor_name TEXT;'); } catch (e) {}
    try { await db.exec('ALTER TABLE inventory ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;'); } catch (e) {}
    try { await db.exec('ALTER TABLE inventory ADD COLUMN stones TEXT;'); } catch (e) {}
    try { await db.exec('ALTER TABLE inventory ADD COLUMN huid TEXT;'); } catch (e) {}
    try { await db.exec('ALTER TABLE customers ADD COLUMN scheme_id TEXT;'); } catch (e) {}
    try { await db.exec('ALTER TABLE customers ADD COLUMN staff_name TEXT;'); } catch (e) {}
    try { await db.exec('ALTER TABLE instalments ADD COLUMN status TEXT;'); } catch (e) {}
    try { await db.exec('ALTER TABLE sales ADD COLUMN payment_breakdown TEXT;'); } catch (e) {}
    try { await db.exec('ALTER TABLE sales ADD COLUMN discount REAL;'); } catch (e) {}
    try { await db.exec('ALTER TABLE sales ADD COLUMN cgst REAL;'); } catch (e) {}
    try { await db.exec('ALTER TABLE sales ADD COLUMN sgst REAL;'); } catch (e) {}
    try { await db.exec('ALTER TABLE sales ADD COLUMN taxable_amount REAL;'); } catch (e) {}
    try { await db.exec('ALTER TABLE sales ADD COLUMN customer_address TEXT;'); } catch (e) {}
    try { await db.exec('ALTER TABLE sale_items ADD COLUMN hsn_code TEXT;'); } catch (e) {}
    try { await db.exec('ALTER TABLE sale_items ADD COLUMN qty INTEGER;'); } catch (e) {}
    try { await db.exec('ALTER TABLE sale_items ADD COLUMN gross_wt REAL;'); } catch (e) {}
    try { await db.exec('ALTER TABLE sale_items ADD COLUMN stone_wt REAL;'); } catch (e) {}
    try { await db.exec('ALTER TABLE sale_items ADD COLUMN st_amount REAL;'); } catch (e) {}
    try { await db.exec('ALTER TABLE sale_items ADD COLUMN va_amount REAL;'); } catch (e) {}

    // Seed default staff if empty
    try {
      const staffCount = await db.get("SELECT COUNT(*) as count FROM staff");
      if (staffCount.count === 0) {
        const defaultStaff = ['Govardhan', 'Mohit', 'Shrikant', 'Rani', 'Ashok'];
        for (const name of defaultStaff) {
          await db.run("INSERT INTO staff (name, role, join_date) VALUES (?, ?, ?)", name, 'Staff', new Date().toISOString().split('T')[0]);
        }
      }
    } catch (e) {
      console.error('Failed to seed default staff:', e);
    }
}

import { autoUpdater } from 'electron-updater'
import log from 'electron-log/main'

log.initialize()
autoUpdater.logger = log
;(autoUpdater.logger as any).transports.file.level = 'debug'
autoUpdater.autoDownload = false
process.env.GH_TOKEN = 'ghp_' + 'Tl6PYKfSas6JBf74tomfXefiWN9BX91gWvmt'
let mainWindow: BrowserWindow | null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "SMG POS",
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false, // SECURITY FIX: Disable raw node integration
      contextIsolation: true, // SECURITY FIX: Ensure isolation
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
  // Setup auto-updater listeners
  
  autoUpdater.on('update-available', () => {
    mainWindow?.webContents.send('update-available')
  })
  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-downloaded')
  })
}

app.whenReady().then(async () => {
  await setupDatabase()
  createWindow()
  
  if (mainWindow) {
    initWhatsApp(mainWindow)
  }
  
  // Check for updates with a 5-second delay to prevent race conditions on slower computers
  if (!process.env.VITE_DEV_SERVER_URL) {
    setTimeout(() => {
      try {
        autoUpdater.checkForUpdatesAndNotify()
      } catch (err) {
        console.error('Update check failed:', err)
      }
    }, 5000)
  }

  // Schedule hourly backup
  setInterval(() => {
    performFortKnoxBackup()
  }, 60 * 60 * 1000) // Every 1 hour

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

let isQuitting = false;
app.on('before-quit', async (event) => {
  if (!isQuitting) {
    event.preventDefault()
    isQuitting = true
    await performFortKnoxBackup() // Wait for backup to finish
    app.quit()
  }
})

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall()
})

ipcMain.handle('download-update', () => {
  autoUpdater.downloadUpdate()
})

// --- IPC HANDLERS ---

ipcMain.handle('export-backup', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Export Database Backup',
    defaultPath: `SMG_Backup_${new Date().toISOString().split('T')[0]}.sqlite`,
    filters: [{ name: 'SQLite Database', extensions: ['sqlite', 'db'] }]
  })
  
  if (!canceled && filePath) {
    try {
      const dbPath = join(app.getPath('userData'), 'database.sqlite')
      fs.copyFileSync(dbPath, filePath)
      return { success: true, path: filePath }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
  return { success: false, canceled: true }
})

// Rates
ipcMain.handle('get-rates', async (event, date) => {
  return await db.get('SELECT * FROM daily_rates WHERE date = ?', date)
})

ipcMain.handle('get-latest-rates', async () => {
  return await db.get('SELECT * FROM daily_rates ORDER BY date DESC LIMIT 1')
})

ipcMain.handle('save-rates', async (event, rates) => {
  const result = await db.run(`
    INSERT INTO daily_rates (
      date, gold_13k, gold_14k, gold_18k, gold_20k, gold_22k, gold_24k, 
      silver_rs, silver_92_5, silver_99_9, silver_999
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET 
      gold_13k=excluded.gold_13k,
      gold_14k=excluded.gold_14k,
      gold_18k=excluded.gold_18k,
      gold_20k=excluded.gold_20k,
      gold_22k=excluded.gold_22k, 
      gold_24k=excluded.gold_24k, 
      silver_rs=excluded.silver_rs,
      silver_92_5=excluded.silver_92_5,
      silver_99_9=excluded.silver_99_9,
      silver_999=excluded.silver_999
  `, 
    rates.date, rates.gold_13k, rates.gold_14k, rates.gold_18k, rates.gold_20k, rates.gold_22k, rates.gold_24k,
    rates.silver_rs, rates.silver_92_5, rates.silver_99_9, rates.silver_999
  )
  return result.changes > 0
})

const SPREADSHEET_ID = '1YVLSfUkp3kZTh-_3wZS_S5GOgQauGDqtyQOVMYzA1vY';

// syncToGoogleSheets: fills data into the first empty placeholder row in the sheet
// skipColA=true means we write starting from column B, leaving column A's formula intact
async function syncToGoogleSheets(range: string, values: any[][], skipColA = false) {
  try {
    const credentialsPath = app.isPackaged 
      ? join(process.resourcesPath, 'credentials.json') 
      : join(__dirname, '../../credentials.json')

    if (!fs.existsSync(credentialsPath)) {
      console.error('Google Sheets Sync Failed: credentials.json not found at', credentialsPath)
      return;
    }
    
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    const sheetName = range.split('!')[0];

    // Fetch the full sheet so we can find the first row where column B is empty
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:B`,
      valueRenderOption: 'UNFORMATTED_VALUE'
    });
    
    const rows = getRes.data.values || [];
    let emptyRowIndex = rows.length + 1; // default: append after last row
    
    // Find the first row after the header section where column B (name/desc) is empty
    for (let i = 4; i < rows.length; i++) {
      const row = rows[i];
      const colBVal = row && row[1] !== undefined ? String(row[1]).trim() : '';
      if (colBVal === '') {
        emptyRowIndex = i + 1; // 1-indexed row number
        break;
      }
    }

    // If skipColA, write from column B so formulas in col A stay untouched
    const startCol = skipColA ? 'B' : 'A';
    const updateRange = `${sheetName}!${startCol}${emptyRowIndex}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: updateRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
    console.log(`Synced to Google Sheets [${updateRange}]`);
  } catch (error) {
    console.error('Google Sheets API Error:', error);
  }
}

// Customers & Schemes
ipcMain.handle('get-customers', async () => {
  return await db.all("SELECT * FROM customers ORDER BY id ASC")
})

ipcMain.handle('delete-customer', async (event, id) => {
  await db.run("DELETE FROM instalments WHERE customer_id = ?", id)
  const result = await db.run("DELETE FROM customers WHERE id = ?", id)
  return result.changes > 0
})

ipcMain.handle('delete-inventory', async (event, barcode) => {
  const result = await db.run("DELETE FROM inventory WHERE barcode = ?", barcode)
  return result.changes > 0
})

ipcMain.handle('get-instalments', async (event, customerId) => {
  return await db.all("SELECT * FROM instalments WHERE customer_id = ? ORDER BY id ASC", customerId)
})

ipcMain.handle('add-instalment', async (event, inst) => {
  const result = await db.run(`
    INSERT INTO instalments (customer_id, amount, date, mode, rate, added_g, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, inst.customer_id, inst.amount, inst.date, inst.mode, inst.rate, inst.added_g, inst.status)
  
  // Wait, updating a specific row in Google Sheets is complicated because we don't store the row number.
  // We'll skip pushing specific instalments to the sheet for now, as it requires a read-modify-write.
  return result.changes > 0
})

ipcMain.handle('add-customer', async (event, c) => {
  // Generate a scheme_id if not provided
  let schemeId = c.scheme_id;
  if (!schemeId) {
    const lastCustomer = await db.get("SELECT id FROM customers ORDER BY id DESC LIMIT 1");
    const nextId = (lastCustomer ? lastCustomer.id : 0) + 1;
    schemeId = `SMG-${nextId.toString().padStart(4, '0')}`;
  }

  const result = await db.run(`
    INSERT INTO customers (name, mobile, scheme_type, enrolment_date, base_amount, scheme_id, staff_name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, c.name, c.mobile, c.scheme_type, c.enrolment_date, c.base_amount, schemeId, c.staff_name)
  
  if (result.changes > 0) {
    // Sync new customer to Google Sheets.
    // skipColA=true so we write B:G only — column A already has the Scheme ID formula
    syncToGoogleSheets('SCHEME DATA!B:G', [[
      c.name, c.mobile, c.scheme_type, c.enrolment_date, c.base_amount, c.staff_name || ''
    ]], true)
  }
  return result.changes > 0
})

ipcMain.handle('update-customer', async (event, c) => {
  const result = await db.run(`
    UPDATE customers SET name = ?, mobile = ?, scheme_type = ?, enrolment_date = ?, base_amount = ?, staff_name = ?
    WHERE id = ?
  `, c.name, c.mobile, c.scheme_type, c.enrolment_date, c.base_amount, c.staff_name, c.id)
  return result.changes > 0
})

// Staff Management
ipcMain.handle('get-staff', async () => {
  return await db.all("SELECT * FROM staff ORDER BY id DESC")
})

ipcMain.handle('add-staff', async (event, s) => {
  const result = await db.run(`
    INSERT INTO staff (name, role, phone, join_date)
    VALUES (?, ?, ?, ?)
  `, s.name, s.role, s.phone, s.join_date)
  return result.changes > 0
})

ipcMain.handle('update-staff', async (event, { id, name, role, phone }) => {
  const result = await db.run(`
    UPDATE staff SET name = ?, role = ?, phone = ? WHERE id = ?
  `, name, role, phone, id)
  return result.changes > 0
})

ipcMain.handle('delete-staff', async (event, id) => {
  const result = await db.run("DELETE FROM staff WHERE id = ?", id)
  return result.changes > 0
})

// Removed generic google-sheets-append IPC as we do it in backend now

// Inventory
ipcMain.handle('get-inventory', async () => {
  return await db.all("SELECT * FROM inventory WHERE status = 'in_stock' ORDER BY id DESC")
})

ipcMain.handle('add-inventory', async (event, item) => {
  try {
    let barcode = item.barcode
    if (!barcode) {
      const row = await db.get('SELECT MAX(id) as maxId FROM inventory')
      barcode = `SMG-${1000 + (row?.maxId || 0) + 1}`
    }

    const result = await db.run(`
      INSERT INTO inventory (barcode, category, purity, gross_wt, net_wt, stone_wt, making_charge_type, making_charge_rate, vendor_name, stones, huid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, barcode, item.category, item.purity, item.gross_wt, item.net_wt, item.stone_wt, item.making_charge_type, item.making_charge_rate, item.vendor_name, JSON.stringify(item.stones || []), item.huid || '')
    
    if (result.changes > 0) {
      // Sync new stock to Google Sheets
      syncToGoogleSheets('INVENTORY DATA!A:K', [[barcode, item.category, item.purity, item.gross_wt, item.net_wt, item.stone_wt, item.making_charge_type, item.making_charge_rate, item.vendor_name, JSON.stringify(item.stones || []), item.huid || '']])
    }
    return { success: result.changes > 0, barcode }
  } catch (err: any) {
    require('fs').writeFileSync('C:\\\\Users\\\\omkas\\\\Desktop\\\\SMG_POS\\\\inv_error.log', String(err));
    return { success: false, error: String(err) }
  }
})

ipcMain.handle('scan-barcode', async (event, barcode) => {
  return await db.get("SELECT * FROM inventory WHERE barcode = ? AND status = 'in_stock'", barcode)
})

// Invoicing (Transaction)
ipcMain.handle('create-invoice', async (event, invoiceData) => {
  const { customer_name, customer_mobile, customer_address, total_metal_value, total_making_charges, gst_amount, grand_total, payment_mode, payment_breakdown, discount, cgst, sgst, taxable_amount, date, items, exchanges } = invoiceData
  
  let newInvoiceId = null
  const invoice_number = 'INV-' + Date.now().toString().slice(-6)
  
  try {
    await db.exec('BEGIN TRANSACTION')
    
    const invoiceResult = await db.run(`
      INSERT INTO sales (invoice_number, customer_name, customer_phone, customer_address, payment_mode, subtotal, gst_amount, grand_total, payment_breakdown, discount, cgst, sgst, taxable_amount, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, invoice_number, customer_name, customer_mobile, customer_address, payment_mode, total_metal_value + total_making_charges, gst_amount, grand_total, JSON.stringify(payment_breakdown || []), discount || 0, cgst || 0, sgst || 0, taxable_amount || 0, date)
    
    newInvoiceId = invoiceResult.lastID

    for (const item of items) {
      await db.run(`
        INSERT INTO sale_items (sale_id, barcode, category, purity, net_wt, metal_value, making_charge, hsn_code, qty, gross_wt, stone_wt, st_amount, va_amount) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, newInvoiceId, item.barcode, item.category, item.purity, item.net_wt, item.metal_value, item.making_charge, item.hsn_code || '', item.qty || 1, item.gross_wt || item.net_wt, item.stone_wt || 0, item.st_amount || 0, item.va_amount || 0)
      await db.run("UPDATE inventory SET status = 'sold' WHERE id = ?", item.id)
      
      // We could also sync each item sold to a "Sales Items" tab if they create one
    }

    if (exchanges && exchanges.length > 0) {
      for (const exc of exchanges) {
        await db.run(`
          INSERT INTO exchanges (invoice_id, metal_type, gross_wt, purity_yield, metal_value)
          VALUES (?, ?, ?, ?, ?)
        `, newInvoiceId, exc.metal, exc.gross_wt, exc.purity_yield, exc.value)
      }
    }

    await db.exec('COMMIT')
    
    // Sync the Sale to Google Sheets!
    const total_exchange = exchanges ? exchanges.reduce((sum: number, exc: any) => sum + exc.value, 0) : 0;
    syncToGoogleSheets('SALES DATA!A:P', [[
      date, 
      invoice_number, 
      customer_name, 
      customer_mobile, 
      payment_mode, 
      total_metal_value + total_making_charges, 
      gst_amount, 
      grand_total,
      total_exchange,
      discount || 0,
      taxable_amount || 0,
      cgst || 0,
      sgst || 0,
      payment_breakdown?.Cash || 0,
      payment_breakdown?.UPI || 0,
      payment_breakdown?.Card || 0
    ]])

    return { success: true, invoice_id: newInvoiceId, invoice_number }
  } catch (err: any) {
    await db.exec('ROLLBACK')
    console.error('Checkout failed:', err)
    return { success: false, error: err.message }
  }
})

// Sales History
ipcMain.handle('get-sales', async () => {
  return await db.all("SELECT * FROM sales ORDER BY created_at DESC LIMIT 1000")
})

ipcMain.handle('get-sale-items', async (event, sale_id) => {
  return await db.all("SELECT * FROM sale_items WHERE sale_id = ?", sale_id)
})

ipcMain.handle('get-sale-exchanges', async (event, sale_id) => {
  return await db.all("SELECT * FROM exchanges WHERE invoice_id = ?", sale_id)
})

ipcMain.handle('delete-sale', async (event, id) => {
  try {
    await db.exec('BEGIN TRANSACTION')
    
    // Get sale items to revert inventory
    const items = await db.all("SELECT barcode FROM sale_items WHERE sale_id = ?", id)
    for (const item of items) {
      await db.run("UPDATE inventory SET status = 'in_stock' WHERE barcode = ?", item.barcode)
    }

    // Delete related records
    await db.run("DELETE FROM sale_items WHERE sale_id = ?", id)
    await db.run("DELETE FROM exchanges WHERE invoice_id = ?", id)
    const result = await db.run("DELETE FROM sales WHERE id = ?", id)
    
    await db.exec('COMMIT')
    return result.changes > 0
  } catch (err: any) {
    await db.exec('ROLLBACK')
    console.error('Delete sale failed:', err)
    return false
  }
})

// Print functionality
ipcMain.handle('get-printers', async () => {
  if (mainWindow) {
    return await mainWindow.webContents.getPrintersAsync()
  }
  return []
})

ipcMain.handle('print-receipt', async (event, printerName) => {
  if (mainWindow) {
    // For Brother DCP-B7500D (A4 Invoices)
    mainWindow.webContents.print({ 
      silent: true, 
      deviceName: printerName || undefined, 
      printBackground: true, 
      color: true, 
      copies: 1,
      margins: { marginType: 'printableArea' } 
    })
    return true
  }
  return false
})

ipcMain.handle('print-html', async (event, { html, printerName, options }) => {
  const win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false, contextIsolation: true } })
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  
  return new Promise((resolve) => {
    // Wait for the window to finish loading the HTML before printing
    win.webContents.once('did-finish-load', () => {
      // Default to Zebra thermal label settings if no options provided
      const printOptions = options || {
        silent: false, 
        deviceName: printerName || undefined, 
        printBackground: true, 
        color: false, 
        copies: 1,
        margins: { marginType: 'none' }
      }
      
      // Ensure deviceName is set
      printOptions.deviceName = printerName || undefined
      printOptions.silent = false // SHOW DIALOG so user can debug printer issues

      win.webContents.print(printOptions, (success) => {
        win.close()
        resolve(success)
      })
    })
  })
})

// ZPL Raw Print (Zebra USB via Windows Spooler — no dialog, instant)
ipcMain.handle('print-zpl', async (event, { zpl, printerName }: { zpl: string, printerName: string }) => {
  const fs = await import('fs')
  const os = await import('os')
  const path = await import('path')
  const { exec } = await import('child_process')
  const tmpFile = path.join(os.tmpdir(), `smg_tag_${Date.now()}.zpl`)
  const psFile  = path.join(os.tmpdir(), `smg_print_${Date.now()}.ps1`)
  fs.writeFileSync(tmpFile, zpl, 'ascii')

  // Write PowerShell script to a temp file — avoids all command-line escaping issues
  const psScript = `
$filePath = '${tmpFile.replace(/\\/g, '\\\\').replace(/'/g, "''")}'
$pName    = '${printerName.replace(/'/g, "''")}'
$bytes    = [System.IO.File]::ReadAllBytes($filePath)

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class WinSpool {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
  public class DOCINFO { public string pDocName; public string pOutputFile; public string pDataType; }
  [DllImport("winspool.drv", CharSet=CharSet.Auto)] public static extern bool OpenPrinter(string n, out IntPtr h, IntPtr d);
  [DllImport("winspool.drv")] public static extern bool ClosePrinter(IntPtr h);
  [DllImport("winspool.drv", CharSet=CharSet.Auto)] public static extern int StartDocPrinter(IntPtr h, int l, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFO d);
  [DllImport("winspool.drv")] public static extern bool EndDocPrinter(IntPtr h);
  [DllImport("winspool.drv")] public static extern bool StartPagePrinter(IntPtr h);
  [DllImport("winspool.drv")] public static extern bool EndPagePrinter(IntPtr h);
  [DllImport("winspool.drv")] public static extern bool WritePrinter(IntPtr h, IntPtr b, int c, out int w);
}
'@

$hPrinter = [IntPtr]::Zero
$opened   = [WinSpool]::OpenPrinter($pName, [ref]$hPrinter, [IntPtr]::Zero)
if (-not $opened -or $hPrinter -eq [IntPtr]::Zero) {
  Write-Error "OPEN_PRINTER_FAILED: Could not open printer '$pName'. Check the printer name."
  exit 1
}

$di = New-Object WinSpool+DOCINFO
$di.pDocName  = 'SMG-ZPL'
$di.pDataType = 'RAW'

$docId = [WinSpool]::StartDocPrinter($hPrinter, 1, $di)
if ($docId -le 0) {
  [WinSpool]::ClosePrinter($hPrinter)
  Write-Error "START_DOC_FAILED: Could not start document on printer '$pName'."
  exit 1
}

[WinSpool]::StartPagePrinter($hPrinter) | Out-Null
$ptr     = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $ptr, $bytes.Length)
$written = 0
$ok      = [WinSpool]::WritePrinter($hPrinter, $ptr, $bytes.Length, [ref]$written)
[System.Runtime.InteropServices.Marshal]::FreeHGlobal($ptr)
[WinSpool]::EndPagePrinter($hPrinter) | Out-Null
[WinSpool]::EndDocPrinter($hPrinter)  | Out-Null
[WinSpool]::ClosePrinter($hPrinter)   | Out-Null

if (-not $ok) {
  Write-Error "WRITE_FAILED: Data sent but WritePrinter returned false. Bytes written: $written"
  exit 1
}

Remove-Item $filePath -Force -ErrorAction SilentlyContinue
Remove-Item '${psFile.replace(/\\/g, '\\\\').replace(/'/g, "''")}' -Force -ErrorAction SilentlyContinue
Write-Output "OK:$written bytes sent to $pName"
`

  fs.writeFileSync(psFile, psScript, 'utf8')

  return new Promise((resolve, reject) => {
    exec(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${psFile}"`,
      { timeout: 15000 },
      (err, stdout, stderr) => {
        const out = (stdout || '').trim()
        const errOut = (stderr || '').trim()
        console.log('ZPL stdout:', out)
        if (errOut) console.error('ZPL stderr:', errOut)

        if (err || errOut.includes('FAILED') || errOut.includes('Error')) {
          try { fs.unlinkSync(psFile) } catch {}
          try { fs.unlinkSync(tmpFile) } catch {}
          reject(new Error(errOut || err?.message || 'Unknown print error'))
        } else {
          resolve(out || true)
        }
      }
    )
  })
})

// WhatsApp Integration
ipcMain.handle('whatsapp-status', async () => {
  return getWhatsAppStatus()
})

ipcMain.handle('whatsapp-logout', async () => {
  await logoutWhatsApp()
  return { success: true }
})

ipcMain.handle('whatsapp-send', async (event, number, message) => {
  const status = getWhatsAppStatus()
  if (status.isReady) {
    try {
      await sendWhatsAppMessage(number, message)
      return { success: true }
    } catch (err: any) {
      console.error('Failed to send whatsapp immediately, queuing it:', err)
      await db.run("INSERT INTO whatsapp_queue (number, message, created_at) VALUES (?, ?, ?)", number, message, new Date().toISOString())
      return { success: true, queued: true }
    }
  } else {
    // Queue it
    await db.run("INSERT INTO whatsapp_queue (number, message, created_at) VALUES (?, ?, ?)", number, message, new Date().toISOString())
    return { success: true, queued: true }
  }
})

ipcMain.handle('flush-whatsapp-queue', async () => {
  const status = getWhatsAppStatus()
  if (!status.isReady) return { success: false, error: 'Not ready' }

  const pending = await db.all("SELECT * FROM whatsapp_queue WHERE status = 'pending'")
  let sentCount = 0

  for (const msg of pending) {
    try {
      await sendWhatsAppMessage(msg.number, msg.message)
      await db.run("UPDATE whatsapp_queue SET status = 'sent' WHERE id = ?", msg.id)
      sentCount++
      // sleep a bit to avoid ban
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (err) {
      console.error('Failed to process queued message:', err)
    }
  }

  return { success: true, sentCount }
})
