import { useState, useEffect } from 'react'
import { Coins, Save, Activity, Inbox } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'))
  // Store as strings so the input can be freely edited (empty, partial, etc.)
  const [gold22k, setGold22k] = useState('')
  const [gold24k, setGold24k] = useState('')
  const [silver, setSilver] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [recentTransactions, setRecentTransactions] = useState<any[]>([])

  useEffect(() => { loadRates(date); loadTransactions(date); }, [date])

  const loadTransactions = async (d: string) => {
    if ((window as any).api) {
      const allSales = await (window as any).api.getSales()
      // Filter sales where the created_at date starts with the selected date (e.g., '2026-06-10')
      const filtered = allSales.filter((s: any) => s.created_at.startsWith(d))
      setRecentTransactions(filtered || [])
    }
  }

  const loadRates = async (d: string) => {
    if ((window as any).api) {
      setIsLoading(true)
      try {
        const saved = await (window as any).api.getRates(d)
        if (saved) {
          setGold22k(String(saved.gold_22k ?? ''))
          setGold24k(String(saved.gold_24k ?? ''))
          setSilver(String(saved.silver ?? ''))
        } else {
          // No saved rates for this date — clear fields so user starts fresh
          setGold22k('')
          setGold24k('')
          setSilver('')
        }
      } catch (err) {
        toast.error('Failed to load rates for the selected date.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSaveRates = async () => {
    // Robust validation
    if (!gold22k.trim() || !gold24k.trim() || !silver.trim()) {
      toast.error('Please enter valid numeric values for all rates.')
      return
    }

    const parsed22k = Number(gold22k)
    const parsed24k = Number(gold24k)
    const parsedSilver = Number(silver)

    if (isNaN(parsed22k) || isNaN(parsed24k) || isNaN(parsedSilver) || parsed22k <= 0 || parsed24k <= 0 || parsedSilver <= 0) {
      toast.error('Rate values must be greater than zero.')
      return
    }

    if ((window as any).api) {
      try {
        const success = await (window as any).api.saveRates({
          date,
          gold_22k: parsed22k,
          gold_24k: parsed24k,
          silver: parsedSilver,
        })
        if (success) {
          toast.success('Board rates updated successfully!')
        } else {
          toast.error('Failed to save board rates.')
        }
      } catch (err) {
        toast.error('An error occurred while saving rates.')
      }
    } else {
      toast.error('API is not available.')
    }
  }

  const numericInput = (
    value: string,
    setter: (v: string) => void,
    label: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={e => {
          // Allow only digits
          const v = e.target.value.replace(/[^0-9]/g, '')
          setter(v)
        }}
        
        className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-lg font-semibold text-gray-800 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-300"
      />
    </div>
  )

  return (
    <div className="p-8 pb-24 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{color: '#B8860B'}}>✦ Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of today's business and live board rates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Rates Module */}
        <div className="lg:col-span-1 bg-white p-7 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5 text-gray-800">
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
              <Coins size={20} className="stroke-[2.5px]" />
            </div>
            Daily Board Rates
          </h2>
          <div className="space-y-5 flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-800 font-medium outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {numericInput(gold22k, setGold22k, '22k Gold (per gram)')}
            {numericInput(gold24k, setGold24k, '24k Gold (per gram)')}
            {numericInput(silver, setSilver, 'Silver (per gram)')}
          </div>
          
          <button
            onClick={handleSaveRates}
            disabled={isLoading}
            className="w-full bg-gray-900 text-white p-4 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-gray-800 active:scale-[0.98] transition-all mt-6 shadow-md shadow-gray-900/10 disabled:opacity-70 disabled:active:scale-100"
          >
            <Save size={18} className="stroke-[2.5px]" /> 
            {isLoading ? 'Saving...' : 'Save Today\'s Rates'}
          </button>
        </div>

        {/* Recent Activity Module - Example of a graceful empty state */}
        <div className="lg:col-span-2 bg-white p-7 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5 text-gray-800">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Activity size={20} className="stroke-[2.5px]" />
            </div>
            Recent Transactions
          </h2>
          
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="p-3 font-medium rounded-l-lg">Invoice No</th>
                    <th className="p-3 font-medium">Customer</th>
                    <th className="p-3 font-medium">Grand Total</th>
                    <th className="p-3 font-medium rounded-r-lg">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentTransactions.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-gray-800">{s.invoice_number}</td>
                      <td className="p-3 text-gray-600">{s.customer_name || 'Walk-in'}</td>
                      <td className="p-3 font-bold text-gray-800">Rs. {s.grand_total.toLocaleString('en-IN')}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold uppercase">{s.payment_mode}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 border border-gray-100">
                <Inbox size={28} className="text-gray-400 stroke-[1.5px]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">No transactions yet</h3>
              <p className="text-gray-500 max-w-sm text-sm">
                There are no recent transactions to display for today. Once sales are made, they will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
