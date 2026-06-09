import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { fileURLToPath } from 'url'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { google } from 'googleapis'
import fs from 'fs'
import { initWhatsApp, getWhatsAppStatus, sendWhatsAppMessage } from './whatsapp'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

let db: any;

async function setupDatabase() {
  const dbPath = join(app.getPath('userData'), 'smg_pos.db')
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  })

  // --- DATABASE SCHEMA ---
  await db.exec(`
    CREATE TABLE IF NOT EXISTS daily_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE,
      gold_22k NUMERIC,
      gold_24k NUMERIC,
      silver NUMERIC
    );

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
      metal_value NUMERIC,
      FOREIGN KEY(invoice_id) REFERENCES sales(id)
    );
  `)
}

import { autoUpdater } from 'electron-updater'

function backupDatabase() {
  try {
    const backupDir = 'C:\\SMG_POS_Backups';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const dbPath = join(app.getPath('userData'), 'smg_pos.db');
    if (fs.existsSync(dbPath)) {
      const dateStr = new Date().toISOString().split('T')[0];
      const backupPath = join(backupDir, `smg_pos_backup_${dateStr}.db`);
      fs.copyFileSync(dbPath, backupPath);
      console.log('Database backed up to:', backupPath);
    }
  } catch (err) {
    console.error('Failed to backup database:', err);
  }
}

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
  
  // Check for updates
  if (!process.env.VITE_DEV_SERVER_URL) {
    autoUpdater.checkForUpdatesAndNotify()
  }

  // Schedule daily backup at 8:30 PM (20:30)
  setInterval(() => {
    const now = new Date()
    if (now.getHours() === 20 && now.getMinutes() === 30) {
      backupDatabase()
    }
  }, 60000) // Check every minute

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  backupDatabase() // Always backup on close
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall()
})

// --- IPC HANDLERS ---

// Rates
ipcMain.handle('get-rates', async (event, date) => {
  return await db.get('SELECT * FROM daily_rates WHERE date = ?', date)
})

ipcMain.handle('save-rates', async (event, { date, gold_22k, gold_24k, silver }) => {
  const result = await db.run(`
    INSERT INTO daily_rates (date, gold_22k, gold_24k, silver) 
    VALUES (?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET 
      gold_22k=excluded.gold_22k, 
      gold_24k=excluded.gold_24k, 
      silver=excluded.silver
  `, date, gold_22k, gold_24k, silver)
  return result.changes > 0
})

// Customers & Schemes
ipcMain.handle('get-customers', async () => {
  return await db.all("SELECT * FROM customers ORDER BY id DESC")
})

ipcMain.handle('add-customer', async (event, c) => {
  const result = await db.run(`
    INSERT INTO customers (name, mobile, scheme_type, enrolment_date, base_amount)
    VALUES (?, ?, ?, ?, ?)
  `, c.name, c.mobile, c.scheme_type, c.enrolment_date, c.base_amount)
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

ipcMain.handle('google-sheets-append', async (_, spreadsheetId: string, credentialsPath: string, range: string, values: any[][]) => {
  try {
    if (!fs.existsSync(credentialsPath)) {
      throw new Error('Credentials file not found at: ' + credentialsPath)
    }
    
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Google Sheets API Error:', error);
    throw error;
  }
})

// Inventory
ipcMain.handle('get-inventory', async () => {
  return await db.all("SELECT * FROM inventory WHERE status = 'in_stock' ORDER BY id DESC")
})

ipcMain.handle('add-inventory', async (event, item) => {
  let barcode = item.barcode
  if (!barcode) {
    const row = await db.get('SELECT COUNT(*) as count FROM inventory')
    barcode = `SMG-${1000 + row.count + 1}`
  }

  const result = await db.run(`
    INSERT INTO inventory (barcode, category, purity, gross_wt, net_wt, stone_wt, making_charge_type, making_charge_rate, vendor_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, barcode, item.category, item.purity, item.gross_wt, item.net_wt, item.stone_wt, item.making_charge_type, item.making_charge_rate, item.vendor_name)
  
  return { success: result.changes > 0, barcode }
})

ipcMain.handle('scan-barcode', async (event, barcode) => {
  return await db.get("SELECT * FROM inventory WHERE barcode = ? AND status = 'in_stock'", barcode)
})

// Invoicing (Transaction)
ipcMain.handle('create-invoice', async (event, invoiceData) => {
  const { customer_name, customer_mobile, total_metal_value, total_making_charges, gst_amount, grand_total, payment_mode, date, items, exchanges } = invoiceData
  
  let newInvoiceId = null
  const invoice_number = 'INV-' + Date.now().toString().slice(-6)
  
  try {
    await db.exec('BEGIN TRANSACTION')
    
    const invoiceResult = await db.run(`
      INSERT INTO sales (invoice_number, customer_name, customer_phone, payment_mode, subtotal, gst_amount, grand_total, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, invoice_number, customer_name, customer_mobile, payment_mode, total_metal_value + total_making_charges, gst_amount, grand_total, date)
    
    newInvoiceId = invoiceResult.lastID

    for (const item of items) {
      await db.run(`
        INSERT INTO sale_items (sale_id, barcode, category, purity, net_wt, metal_value, making_charge) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, newInvoiceId, item.barcode, item.category, item.purity, item.net_wt, item.metal_value, item.making_charge)
      await db.run("UPDATE inventory SET status = 'sold' WHERE id = ?", item.id)
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

// Print functionality
ipcMain.handle('print-receipt', async (event) => {
  if (mainWindow) {
    mainWindow.webContents.print({ silent: false, printBackground: true })
    return true
  }
  return false
})

// WhatsApp Integration
ipcMain.handle('whatsapp-status', async () => {
  return getWhatsAppStatus()
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
