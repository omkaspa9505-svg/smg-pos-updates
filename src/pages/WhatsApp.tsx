import { useState, useEffect } from 'react'
import { MessageCircle, CheckCircle, Smartphone, LogOut, Send, Loader2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'

export default function WhatsAppSettings() {
  const [status, setStatus] = useState({ isReady: false, qr: '' })
  const [loading, setLoading] = useState(true)
  const [isTesting, setIsTesting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [showDisconnectModal, setShowDisconnectModal] = useState(false)

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 2000)

    if ((window as any).api) {
      ;(window as any).api.onWhatsAppQR((qr: string) => {
        setStatus({ isReady: false, qr })
      })

      ;(window as any).api.onWhatsAppReady(async () => {
        setStatus({ isReady: true, qr: '' })
        const res = await (window as any).api.flushWhatsAppQueue()
        if (res.success && res.sentCount > 0) {
          toast.success(`Successfully sent ${res.sentCount} queued offline messages!`)
        }
      })
    }
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkStatus = async () => {
    // Only show full loading state if we don't have a status yet
    if (!status.isReady && !status.qr) {
        setLoading(true)
    }
    if ((window as any).api) {
      const stat = await (window as any).api.getWhatsAppStatus()
      setStatus(stat)
    }
    setLoading(false)
  }

  const handleTestMessage = async () => {
    setIsTesting(true)
    const toastId = toast.loading('Sending test message...')
    try {
        const num = "919966377325"
        if ((window as any).api) {
            const res = await (window as any).api.sendWhatsAppMessage(num, "Hello from SMG POS! Your WhatsApp integration is working perfectly. 🎉")
            if (res.success) {
                toast.success("Test message sent successfully to " + num + "!", { id: toastId })
            } else {
                toast.error("Failed to send: " + res.error, { id: toastId })
            }
        } else {
            toast.error("API is not available", { id: toastId })
        }
    } catch(err:any) {
        toast.error("An error occurred while sending", { id: toastId })
    } finally {
        setIsTesting(false)
    }
  }

  return (
    <div className="p-8 h-full overflow-auto flex flex-col items-center bg-gray-50/50">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <MessageCircle className="text-green-500" size={32} /> WhatsApp Integration
        </h1>
        <p className="text-gray-500 mb-8">Link your shop's WhatsApp account to automatically send invoices and scheme reminders.</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center min-h-[400px] justify-center transition-all duration-300">
          {loading && !status.isReady && !status.qr ? (
            <div className="flex flex-col items-center p-12 text-gray-500 animate-in fade-in duration-500">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full blur-xl bg-green-200 animate-pulse"></div>
                <Loader2 className="animate-spin relative z-10 text-green-500" size={48} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Connecting...</h3>
              <p className="text-center text-gray-500">Please wait while we connect to the WhatsApp engine.</p>
            </div>
          ) : status.isReady ? (
            <div className="flex flex-col items-center p-12 text-center animate-in zoom-in-95 duration-500">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-green-100 rounded-full scale-150 blur-xl opacity-50"></div>
                <CheckCircle className="text-green-500 relative z-10 drop-shadow-sm" size={72} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">WhatsApp is Connected!</h2>
              <p className="text-gray-500 mb-10 max-w-md">
                Your POS is securely linked to WhatsApp. Automated messages and receipts will be sent from this device.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={handleTestMessage}
                  disabled={isTesting}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:hover:shadow-md flex items-center gap-2 active:scale-95"
                >
                  {isTesting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  Send Test Message
                </button>
                <button 
                  onClick={() => setShowDisconnectModal(true)}
                  disabled={isDisconnecting}
                  className="bg-white text-red-600 border-2 border-red-100 px-6 py-3 rounded-xl font-semibold hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95"
                >
                  {isDisconnecting ? <Loader2 className="animate-spin" size={20} /> : <LogOut size={20} />}
                  Disconnect
                </button>
              </div>
            </div>
          ) : status.qr ? (
            <div className="flex flex-col items-center p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
              <div className="flex items-center gap-3 mb-6 bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-medium">
                <Smartphone size={20} /> Link Device to SMG POS
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full max-w-4xl">
                <div className="text-left space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800">Scan QR Code</h2>
                    <ol className="text-gray-600 space-y-4">
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm">1</span>
                            <span>Open <strong>WhatsApp</strong> on your phone</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm">2</span>
                            <span>Tap <strong>Menu</strong> (⋮) or <strong>Settings</strong> (⚙️)</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm">3</span>
                            <span>Tap <strong>Linked Devices</strong></span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm">4</span>
                            <span>Tap <strong>Link a Device</strong> and point your phone to scan the QR code</span>
                        </li>
                    </ol>
                </div>
                
                <div className="flex justify-center">
                    <div className="bg-white p-6 border-2 border-gray-100 rounded-2xl shadow-lg relative">
                        <QRCodeSVG value={status.qr} size={260} level="H" />
                        <div className="absolute inset-0 border-4 border-green-500 rounded-2xl opacity-0 animate-[pulse_2s_ease-in-out_infinite]"></div>
                    </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center p-12 text-gray-400 animate-in fade-in duration-500">
              <Loader2 className="animate-spin mb-4 text-green-500" size={48} />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Starting Engine...</h3>
              <p>Initializing WhatsApp client, please wait a moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <LogOut className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Disconnect WhatsApp?</h3>
              <p className="text-gray-500 text-sm mb-6">
                Are you sure you want to disconnect WhatsApp? You will need to scan the QR code again to reconnect.
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowDisconnectModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowDisconnectModal(false)
                    setIsDisconnecting(true)
                    const toastId = toast.loading('Disconnecting from WhatsApp...')
                    try {
                        await (window as any).api.whatsappLogout();
                        toast.success('Disconnected successfully', { id: toastId })
                        setTimeout(checkStatus, 2000);
                    } catch(err:any) {
                        toast.error('Failed to disconnect', { id: toastId })
                    } finally {
                        setIsDisconnecting(false)
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold shadow-sm transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
