import { useState, useEffect } from 'react'
import { Coins, Save, Activity, Inbox, Database } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'))
  const [rates, setRates] = useState({
    gold_13k: '', gold_14k: '', gold_18k: '', gold_20k: '', gold_22k: '', gold_24k: '',
    silver_rs: '', silver_92_5: '', silver_99_9: '', silver_999: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const [recentTransactions, setRecentTransactions] = useState<any[]>([])

  useEffect(() => { loadRates(date); loadTransactions(date); }, [date])

  const loadTransactions = async (d: string) => {
    if ((window as any).api) {
      const allSales = await (window as any).api.getSales()
      const filtered = allSales.filter((s: any) => s.created_at.startsWith(d))
      setRecentTransactions(filtered || [])
    }
  }

  const loadRates = async (d: string) => {
    if ((window as any).api) {
      setIsLoading(true)
      try {
        let saved = await (window as any).api.getRates(d)
        if (!saved) {
          // If no rates for TODAY, fetch the most recent ones so they persist!
          saved = await (window as any).api.getLatestRates()
        }
        if (saved) {
          setRates({
            gold_13k: String(saved.gold_13k ?? ''),
            gold_14k: String(saved.gold_14k ?? ''),
            gold_18k: String(saved.gold_18k ?? ''),
            gold_20k: String(saved.gold_20k ?? ''),
            gold_22k: String(saved.gold_22k ?? ''),
            gold_24k: String(saved.gold_24k ?? ''),
            silver_rs: String(saved.silver_rs ?? ''),
            silver_92_5: String(saved.silver_92_5 ?? ''),
            silver_99_9: String(saved.silver_99_9 ?? ''),
            silver_999: String(saved.silver_999 ?? ''),
          })
        } else {
          setRates({
            gold_13k: '', gold_14k: '', gold_18k: '', gold_20k: '', gold_22k: '', gold_24k: '',
            silver_rs: '', silver_92_5: '', silver_99_9: '', silver_999: ''
          })
        }
      } catch (err) {
        toast.error('Failed to load rates for the selected date.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSaveRates = async () => {
    const g24 = Number(rates.gold_24k) || 0
    const g22 = Number(rates.gold_22k) || 0
    const s999 = Number(rates.silver_999) || 0

    if (g24 <= 0 && g22 <= 0 && s999 <= 0) {
      toast.error('Please enter at least one base rate (> 0) to save.')
      return
    }

    const toSave: any = { 
      date,
      gold_24k: g24 || null,
      gold_22k: g22 || null,
      silver_999: s999 || null,
      
      gold_20k: g24 ? Math.round(g24 * (20/24)) : null,
      gold_18k: g24 ? Math.round(g24 * 0.75) : null,
      gold_14k: g24 ? Math.round(g24 * 0.583) : null,
      gold_13k: g24 ? Math.round(g24 * (13/24)) : null,
      
      silver_99_9: s999 || null,
      silver_92_5: s999 ? Math.round(s999 * 0.925) : null,
      silver_rs: s999 ? Math.round(s999 * 0.65) : null,
    }

    if ((window as any).api) {
      try {
        const success = await (window as any).api.saveRates(toSave)
        if (success) {
          toast.success('Board rates auto-calculated and saved successfully!')
          loadRates(date) // Reload to get calculated values in state
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
    key: keyof typeof rates,
    label: string
  ) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={rates[key]}
        onChange={e => {
          const v = e.target.value.replace(/[^0-9]/g, '')
          setRates(prev => ({ ...prev, [key]: v }))
        }}
        className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50/50 font-semibold text-gray-800 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  )

  return (
    <div className="p-8 pb-24 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{color: '#B8860B'}}>✦ Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of today's business and live board rates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Daily Rates Module */}
        <div className="xl:col-span-1 bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full max-h-[85vh] overflow-hidden">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2.5 text-gray-800 shrink-0">
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
              <Coins size={20} className="stroke-[2.5px]" />
            </div>
            Daily Board Rates
          </h2>
          
          <div className="mb-4 shrink-0">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-800 font-medium outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <div className="overflow-y-auto flex-1 pr-2 space-y-4 custom-scrollbar">
            <div>
              <h3 className="text-sm font-bold text-amber-600 mb-2 border-b border-amber-100 pb-1">Gold Rates (per g)</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {numericInput('gold_24k', '24k (Base)')}
                {numericInput('gold_22k', '22k (Base)')}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-100">
                <div className="flex justify-between"><span>20k:</span> <span>{rates.gold_20k || '-'}</span></div>
                <div className="flex justify-between"><span>18k:</span> <span>{rates.gold_18k || '-'}</span></div>
                <div className="flex justify-between"><span>14k:</span> <span>{rates.gold_14k || '-'}</span></div>
                <div className="flex justify-between"><span>13k:</span> <span>{rates.gold_13k || '-'}</span></div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-500 mb-2 border-b border-slate-100 pb-1">Silver Rates (per g)</h3>
              <div className="grid grid-cols-1 gap-3 mb-3">
                {numericInput('silver_999', '999 Pure Silver (Base)')}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div className="flex justify-between"><span>99.9:</span> <span>{rates.silver_99_9 || '-'}</span></div>
                <div className="flex justify-between"><span>92.5:</span> <span>{rates.silver_92_5 || '-'}</span></div>
                <div className="flex justify-between"><span>RS:</span> <span>{rates.silver_rs || '-'}</span></div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 leading-tight">Note: Lower purities are automatically calculated and updated on save based on the Base rates.</p>
          </div>
          
          <button
            onClick={handleSaveRates}
            disabled={isLoading}
            className="shrink-0 w-full bg-gray-900 text-white p-3.5 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-gray-800 active:scale-[0.98] transition-all mt-4 shadow-md disabled:opacity-70"
          >
            <Save size={18} className="stroke-[2.5px]" /> 
            {isLoading ? 'Saving...' : 'Save Rates'}
          </button>

          <button
            onClick={async () => {
              if ((window as any).api) {
                const res = await (window as any).api.exportBackup()
                if (res?.success) toast.success(`Backup saved to ${res.path}`)
                else if (!res?.canceled) toast.error('Failed to export backup: ' + res?.error)
              }
            }}
            className="shrink-0 w-full bg-blue-50 text-blue-700 border border-blue-100 p-3.5 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-blue-100 active:scale-[0.98] transition-all mt-3 shadow-sm"
          >
            <Database size={18} className="stroke-[2.5px]" /> 
            Export Database Backup
          </button>
        </div>

        {/* Recent Activity Module */}
        <div className="xl:col-span-2 bg-white p-7 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full">
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
