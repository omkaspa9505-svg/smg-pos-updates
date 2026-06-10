import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Package, Users, UserCheck, BarChart3, MessageCircle } from 'lucide-react'

export default function Sidebar() {
  const location = useLocation()

  
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


    </div>
  )
}
