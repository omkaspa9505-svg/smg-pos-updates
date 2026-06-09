import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Package, Users, UserCheck, BarChart3, MessageCircle, Download } from 'lucide-react'

export default function Sidebar() {
  const location = useLocation()
  const [updateStatus, setUpdateStatus] = useState<string | null>(null)

  useEffect(() => {
    if ((window as any).api) {
      (window as any).api.onUpdateAvailable(() => {
        setUpdateStatus('downloading')
      });
      (window as any).api.onUpdateDownloaded(() => {
        setUpdateStatus('ready')
      });
    }
  }, [])
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Point of Sale', path: '/pos', icon: <ShoppingCart size={20} /> },
    { name: 'Inventory', path: '/inventory', icon: <Package size={20} /> },
    { name: 'Customers & Schemes', path: '/customers', icon: <Users size={20} /> },
    { name: 'Staff Management', path: '/staff', icon: <UserCheck size={20} /> },
    { name: 'Performance Reports', path: '/reports', icon: <BarChart3 size={20} /> },
    { name: 'WhatsApp Setup', path: '/whatsapp', icon: <MessageCircle size={20} /> },
  ]

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-black tracking-wider text-yellow-500">SMG POS</h1>
        <p className="text-xs text-gray-400 mt-1">Jewellery Management</p>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white font-bold' : 'text-gray-300 hover:bg-gray-800'}`}
            >
              {item.icon}
              {item.name}
            </Link>
          )
        })}
      </nav>

      {updateStatus && (
        <div className="p-4 mt-auto border-t border-gray-800">
          {updateStatus === 'downloading' && (
            <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium animate-pulse bg-yellow-400/10 p-3 rounded-lg">
              <Download size={16} />
              Downloading Update...
            </div>
          )}
          {updateStatus === 'ready' && (
            <button 
              onClick={() => (window as any).api.installUpdate()}
              className="w-full flex items-center justify-center gap-2 text-white text-sm font-medium bg-green-600 hover:bg-green-700 p-3 rounded-lg transition-colors shadow-lg shadow-green-600/20"
            >
              <Download size={16} />
              Install Update
            </button>
          )}
        </div>
      )}
    </div>
  )
}
