import pkg from 'whatsapp-web.js'
import type { Client } from 'whatsapp-web.js'
const { Client: ClientClass, LocalAuth } = pkg
import { BrowserWindow } from 'electron'

let client: Client | null = null
let qrCodeValue = ''
let isReady = false

import fs from 'fs'

function getBrowserPath() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ]
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined; // fallback to puppeteer's downloaded chromium if in dev
}

export function initWhatsApp(mainWindow: BrowserWindow) {
  client = new ClientClass({
    authStrategy: new LocalAuth({ dataPath: './whatsapp_auth' }),
    puppeteer: {
      headless: true,
      executablePath: getBrowserPath(),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--single-process', '--disable-gpu']
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
    client?.initialize()
  })

  client.initialize()
}

export function getWhatsAppStatus() {
  return { isReady, qr: qrCodeValue }
}

export async function sendWhatsAppMessage(number: string, message: string) {
  if (!client || !isReady) {
    throw new Error('WhatsApp client is not ready')
  }

  // Number format: 919876543210@c.us
  let chatId = number
  if (!chatId.includes('@c.us')) {
    chatId = `91${number}@c.us` // Assuming India prefix +91
  }

  return await client.sendMessage(chatId, message)
}
