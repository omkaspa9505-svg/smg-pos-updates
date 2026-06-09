import { useState, useEffect } from 'react'
import { Coins, Save } from 'lucide-react'

export default function Dashboard() {
  const [rates, setRates] = useState({ gold_22k: 7200, gold_24k: 7800, silver: 95 })
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadRates(date)
  }, [date])

  const loadRates = async (d: string) => {
    if ((window as any).api) {
      const saved = await (window as any).api.getRates(d)
      if (saved) setRates(saved)
    }
  }

  const handleSaveRates = async () => {
    if ((window as any).api) {
      const success = await (window as any).api.saveRates({ date, ...rates })
      if (success) alert('Rates saved to local database!')
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily Rates Module */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Coins className="text-yellow-500" /> Daily Board Rates
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} 
                className="w-full p-3 border rounded-lg bg-gray-50 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">22k Gold (per gram)</label>
              <input type="number" value={rates.gold_22k} onChange={(e) => setRates({...rates, gold_22k: Number(e.target.value)})} 
                className="w-full p-3 border rounded-lg bg-gray-50 text-lg font-semibold outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">24k Gold (per gram)</label>
              <input type="number" value={rates.gold_24k} onChange={(e) => setRates({...rates, gold_24k: Number(e.target.value)})} 
                className="w-full p-3 border rounded-lg bg-gray-50 text-lg font-semibold outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Silver (per gram)</label>
              <input type="number" value={rates.silver} onChange={(e) => setRates({...rates, silver: Number(e.target.value)})} 
                className="w-full p-3 border rounded-lg bg-gray-50 text-lg font-semibold outline-none focus:border-blue-500" />
            </div>
            <button onClick={handleSaveRates} className="w-full bg-gray-900 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-bold hover:bg-gray-800 transition-colors mt-2">
              <Save size={18} /> Update Rates
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
