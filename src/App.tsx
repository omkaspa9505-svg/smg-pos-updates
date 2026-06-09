import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import POS from './pages/POS'
import Customers from './pages/Customers'
import Staff from './pages/Staff'
import Reports from './pages/Reports'
import WhatsAppSettings from './pages/WhatsApp'

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
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
    </Router>
  )
}

export default App
