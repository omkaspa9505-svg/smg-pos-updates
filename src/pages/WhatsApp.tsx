import { useState, useEffect } from 'react'
import { MessageCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export default function WhatsAppSettings() {
  const [status, setStatus] = useState({ isReady: false, qr: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkStatus()

    if ((window as any).api) {
      ;(window as any).api.onWhatsAppQR((qr: string) => {
        setStatus({ isReady: false, qr })
      })

      ;(window as any).api.onWhatsAppReady(async () => {
        setStatus({ isReady: true, qr: '' })
        const res = await (window as any).api.flushWhatsAppQueue()
        if (res.success && res.sentCount > 0) {
          alert(`Successfully sent ${res.sentCount} queued offline messages!`)
        }
      })
    }
  }, [])

  const checkStatus = async () => {
    setLoading(true)
    if ((window as any).api) {
      const stat = await (window as any).api.getWhatsAppStatus()
      setStatus(stat)
    }
    setLoading(false)
  }

  const handleTestMessage = async () => {
    const num = prompt("Enter mobile number to test (e.g. 9876543210):")
    if (num && (window as any).api) {
      const res = await (window as any).api.sendWhatsAppMessage(num, "Hello from SMG POS! Your WhatsApp integration is working perfectly. 🎉")
      if (res.success) {
        alert("Test message sent successfully!")
      } else {
        alert("Failed to send: " + res.error)
      }
    }
  }

  return (
    <div className="p-8 h-full overflow-auto flex flex-col items-center">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <MessageCircle className="text-green-500" size={32} /> WhatsApp Integration
        </h1>
        <p className="text-gray-500 mb-8">Link your shop's WhatsApp account to automatically send invoices and scheme reminders.</p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center">
          {loading ? (
            <div className="flex flex-col items-center p-12 text-gray-400">
              <RefreshCw className="animate-spin mb-4" size={40} />
              <p>Checking WhatsApp status...</p>
            </div>
          ) : status.isReady ? (
            <div className="flex flex-col items-center p-12 text-center">
              <CheckCircle className="text-green-500 mb-4" size={64} />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">WhatsApp is Connected!</h2>
              <p className="text-gray-600 mb-8">
                Your POS is securely linked to WhatsApp. Automated messages and receipts will be sent from this number.
              </p>
              <button 
                onClick={handleTestMessage}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-md"
              >
                Send Test Message
              </button>
            </div>
          ) : status.qr ? (
            <div className="flex flex-col items-center p-8 text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Link Device to SMG POS</h2>
              <ol className="text-left text-gray-600 mb-8 space-y-2 max-w-sm">
                <li>1. Open WhatsApp on your phone</li>
                <li>2. Tap <strong>Menu</strong> (⋮) or <strong>Settings</strong> (⚙️)</li>
                <li>3. Tap <strong>Linked Devices</strong></li>
                <li>4. Tap <strong>Link a Device</strong> and point your phone to this screen</li>
              </ol>
              
              <div className="bg-white p-4 border rounded-xl shadow-sm">
                <QRCodeSVG value={status.qr} size={250} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center p-12 text-gray-400">
              <RefreshCw className="animate-spin mb-4" size={40} />
              <p>Starting WhatsApp engine... Please wait a moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
