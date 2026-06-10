import pkg from 'whatsapp-web.js'
import type { Client } from 'whatsapp-web.js'
const { Client: ClientClass, LocalAuth } = pkg
import { app, BrowserWindow } from 'electron'
import path from 'path'

let client: Client | null = null
let qrCodeValue = ''
let isReady = false

import fs from 'fs'

function getBrowserPath() {
  const localAppData = process.env.LOCALAPPDATA || 'C:\\\\Users\\\\Default\\\\AppData\\\\Local'
  const paths = [
    'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
    'C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
    'C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe',
    'C:\\\\Program Files\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe',
    `${localAppData}\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe`,
    `${localAppData}\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe`
  ]
  for (const p of paths) {
    if (fs.existsSync(p)) {
      console.log('Found browser at:', p)
      return p;
    }
  }
  console.log('NO BROWSER FOUND IN STANDARD PATHS!')
  return undefined; 
}

import { execSync } from 'child_process'

function killOrphanedChrome() {
  try {
    const cmd = `Get-WmiObject Win32_Process | Where-Object { ($_.Name -eq 'chrome.exe' -or $_.Name -eq 'msedge.exe') -and $_.CommandLine -match 'whatsapp_auth' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`
    execSync(cmd, { shell: 'powershell.exe' })
    console.log('Killed orphaned WhatsApp chrome/edge processes.')
  } catch (e) {
    console.error('Failed to kill orphaned chrome/edge:', e)
  }
}

export function initWhatsApp(mainWindow: BrowserWindow) {
  killOrphanedChrome()
  const authPath = path.join(app.getPath('userData'), 'whatsapp_auth')
  client = new ClientClass({
    authStrategy: new LocalAuth({ dataPath: authPath }),
    puppeteer: {
      headless: true,
      executablePath: getBrowserPath(),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--disable-gpu']
    }
  })

  client.on('qr', (qr) => {
    // We send this QR string back to the frontend to render it
    qrCodeValue = qr
    isReady = false
    mainWindow.webContents.send('whatsapp-qr', qr)
  })

  client.on('ready', () => {
    console.log('WhatsApp Client is ready!')
    isReady = true
    qrCodeValue = ''
    mainWindow.webContents.send('whatsapp-ready')
  })

  client.on('authenticated', () => {
    console.log('WhatsApp Authenticated')
  })

  client.on('auth_failure', msg => {
    console.error('WhatsApp AUTHENTICATION FAILURE', msg)
  })

  client.on('disconnected', (reason) => {
    console.log('WhatsApp Client was logged out', reason)
    isReady = false
    client?.destroy()
    client?.initialize().catch(err => {
      fs.writeFileSync('C:\\SMG_POS_Backups\\wa_error.log', String(err));
    })
  })

  client.initialize().catch(err => {
    fs.writeFileSync('C:\\SMG_POS_Backups\\wa_error.log', String(err) + '\\n' + err.stack);
  })
}

export function getWhatsAppStatus() {
  return { isReady, qr: qrCodeValue }
}

export async function sendWhatsAppMessage(number: string, message: string) {
  if (!client || !isReady) {
    throw new Error('WhatsApp client is not ready')
  }

  // Robust number format: clean up any non-digit characters
  let cleanNumber = number.replace(/\D/g, '');
  if (cleanNumber.length === 10) {
    cleanNumber = `91${cleanNumber}`;
  } else if (cleanNumber.length > 10 && !cleanNumber.startsWith('91')) {
    // If it's another country code, assume it's correct
  }
  
  let chatId = `${cleanNumber}@c.us`

  return await client.sendMessage(chatId, message)
}

export async function destroyWhatsApp() {
  if (client) {
    try {
      await client.destroy()
    } catch(e) {}
    client = null
  }
  killOrphanedChrome()
}

export async function logoutWhatsApp() {
  await destroyWhatsApp()
  const authPath = path.join(app.getPath('userData'), 'whatsapp_auth');
  if (fs.existsSync(authPath)) {
    fs.rmSync(authPath, { recursive: true, force: true });
  }
  isReady = false;
  qrCodeValue = '';
  setTimeout(() => {
    // Reinitialize to generate a fresh QR code
    initWhatsApp(BrowserWindow.getAllWindows()[0])
  }, 1000);
}
