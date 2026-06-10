import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import POS from './pages/POS'
import Customers from './pages/Customers'
import Staff from './pages/Staff'
import Reports from './pages/Reports'
import WhatsAppSettings from './pages/WhatsApp'

function App() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const api = (window as any).api
    if (api) {
      api.onUpdateAvailable(() => setUpdateAvailable(true))
      api.onUpdateDownloaded(() => setUpdateDownloaded(true))
    }
  }, [])

  const handleDownload = () => {
    setIsDownloading(true)
    ;(window as any).api?.downloadUpdate()
  }

  const handleInstall = () => {
    (window as any).api?.installUpdate()
  }

  return (
    <Router>
      <div className="flex flex-col h-screen bg-gray-100 font-sans overflow-hidden">
        {/* Update Banner */}
        {updateDownloaded && (
          <div style={{
            background: 'linear-gradient(90deg, #1a1a2e, #16213e)',
            color: 'white',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 9999,
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>🎉</span>
              <span style={{ fontWeight: 600 }}>A new update has been downloaded and is ready to install!</span>
            </div>
            <button
              onClick={handleInstall}
              style={{
                background: '#f0c040',
                color: '#1a1a2e',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Update Now ✨
            </button>
          </div>
        )}
        {updateAvailable && !updateDownloaded && !isDownloading && (
          <div style={{
            background: '#1e3a5f',
            color: '#a8d8f0',
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            fontSize: '13px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>⬇️</span>
              <span>New update available! Click download to get the latest features.</span>
            </div>
            <button
              onClick={handleDownload}
              className="pointer-events-auto hover:bg-[#3d8ad9]"
              style={{
                background: '#4da6ff',
                color: '#fff',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Download Update 📥
            </button>
          </div>
        )}
        {isDownloading && !updateDownloaded && (
          <div style={{
            background: '#1e3a5f',
            color: '#a8d8f0',
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
            fontSize: '13px'
          }}>
            <span>⏳</span>
            <span style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>Downloading update... please wait.</span>
          </div>
        )}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/whatsapp" element={<WhatsAppSettings />} />
            </Routes>
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </Router>
  )
}

export default App
