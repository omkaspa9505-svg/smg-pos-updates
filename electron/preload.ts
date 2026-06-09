import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Rates
  getRates: (date: string) => ipcRenderer.invoke('get-rates', date),
  saveRates: (data: any) => ipcRenderer.invoke('save-rates', data),
  
  // Inventory
  getInventory: () => ipcRenderer.invoke('get-inventory'),
  addInventory: (item: any) => ipcRenderer.invoke('add-inventory', item),
  scanBarcode: (barcode: string) => ipcRenderer.invoke('scan-barcode', barcode),
  
  // Customers
  getCustomers: () => ipcRenderer.invoke('get-customers'),
  addCustomer: (cust: any) => ipcRenderer.invoke('add-customer', cust),
  
  // Staff
  getStaff: () => ipcRenderer.invoke('get-staff'),
  addStaff: (staff: any) => ipcRenderer.invoke('add-staff', staff),
  updateStaff: (staff: any) => ipcRenderer.invoke('update-staff', staff),
  deleteStaff: (id: number) => ipcRenderer.invoke('delete-staff', id),
  
  // Google Sheets
  googleSheetsAppend: (spreadsheetId: string, credentialsPath: string, range: string, values: any[][]) => ipcRenderer.invoke('google-sheets-append', spreadsheetId, credentialsPath, range, values),
  
  // Invoicing & Sales
  createInvoice: (data: any) => ipcRenderer.invoke('create-invoice', data),
  getSales: () => ipcRenderer.invoke('get-sales'),
  getSaleItems: (saleId: number) => ipcRenderer.invoke('get-sale-items', saleId),
  
  // Hardware
  printReceipt: () => ipcRenderer.invoke('print-receipt'),

  // WhatsApp
  getWhatsAppStatus: () => ipcRenderer.invoke('whatsapp-status'),
  sendWhatsAppMessage: (number: string, message: string) => ipcRenderer.invoke('whatsapp-send', number, message),
  flushWhatsAppQueue: () => ipcRenderer.invoke('flush-whatsapp-queue'),
  onWhatsAppQR: (callback: (qr: string) => void) => {
    ipcRenderer.removeAllListeners('whatsapp-qr')
    ipcRenderer.on('whatsapp-qr', (_event, qr) => callback(qr))
  },
  onWhatsAppReady: (callback: () => void) => {
    ipcRenderer.removeAllListeners('whatsapp-ready')
    ipcRenderer.on('whatsapp-ready', () => callback())
  },
  
  // Auto Updater
  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update-available', () => callback())
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', () => callback())
  },
  installUpdate: () => ipcRenderer.invoke('install-update')
})
