import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, Target, Package, Trash2, Receipt } from 'lucide-react'
import toast from 'react-hot-toast'
import InvoicePrintModal from '../components/InvoicePrintModal'

export default function Reports() {
  const [sales, setSales] = useState<any[]>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState<number | null>(null)
  const [password, setPassword] = useState('')
  const [printers, setPrinters] = useState<any[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>('')
  const [reprintInvoice, setReprintInvoice] = useState<any>(null)

  useEffect(() => {
    loadSales()
    loadPrinters()
  }, [])

  const loadPrinters = async () => {
    if ((window as any).api) {
      const prs = await (window as any).api.getPrinters()
      setPrinters(prs)
      const defaultPrinter = prs.find((p: any) => p.isDefault)
      if (defaultPrinter) setSelectedPrinter(defaultPrinter.name)
      else if (prs.length > 0) setSelectedPrinter(prs[0].name)
    }
  }

  const loadSales = async () => {
    if ((window as any).api) {
      const data = await (window as any).api.getSales()
      setSales(data || [])
    }
  }

  const handleDeleteClick = (id: number) => {
    setSaleToDelete(id)
    setPassword('')
    setDeleteModalOpen(true)
  }

  const handleReprintClick = async (sale: any) => {
    if ((window as any).api) {
      const items = await (window as any).api.getSaleItems(sale.id)
      const exchanges = await (window as any).api.getSaleExchanges(sale.id)
      setReprintInvoice({
        ...sale,
        items: items,
        exchanges: exchanges
      })
    }
  }

  const confirmDelete = async () => {
    if (password === "4444") {
      if ((window as any).api && saleToDelete !== null) {
        const success = await (window as any).api.deleteSale(saleToDelete)
        if (success) {
          toast.success("Sale deleted successfully.")
          loadSales()
        } else {
          toast.error("Failed to delete sale.")
        }
      }
      setDeleteModalOpen(false)
    } else {
      toast.error("Incorrect password.")
    }
  }

  // Calculate this month's stats
  const now = new Date()
  const thisMonthSales = sales.filter(s => {
    const d = new Date(s.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  
  const lastMonthSales = sales.filter(s => {
    const d = new Date(s.created_at)
    let lastM = now.getMonth() - 1
    let y = now.getFullYear()
    if (lastM < 0) { lastM = 11; y-- }
    return d.getMonth() === lastM && d.getFullYear() === y
  })

  const thisMonthTotal = thisMonthSales.reduce((sum, s) => sum + s.grand_total, 0)
  const lastMonthTotal = lastMonthSales.reduce((sum, s) => sum + s.grand_total, 0)
  
  const growth = lastMonthTotal === 0 ? 100 : Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)

  return (
    <div className="p-8 h-full overflow-auto relative">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Performance Dashboard</h1>
      
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500 mb-4">
            <span className="font-bold">Total Sales (This Month)</span>
            <DollarSign className="text-blue-500 bg-blue-50 p-2 rounded-lg" size={40}/>
          </div>
          <div className="text-3xl font-black text-gray-800 mb-2">Rs. {thisMonthTotal.toLocaleString('en-IN')}</div>
          <div className="text-sm font-medium flex items-center gap-1 text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded">
            <TrendingUp size={16}/> {growth > 0 ? '+' : ''}{growth}% from last month
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500 mb-4">
            <span className="font-bold">GST Collected</span>
            <Target className="text-purple-500 bg-purple-50 p-2 rounded-lg" size={40}/>
          </div>
          <div className="text-3xl font-black text-gray-800 mb-2">
            Rs. {thisMonthSales.reduce((sum, s) => sum + s.gst_amount, 0).toLocaleString('en-IN')}
          </div>
          <div className="text-sm text-gray-400">Ready for CA export</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500 mb-4">
            <span className="font-bold">Total Transactions</span>
            <Package className="text-orange-500 bg-orange-50 p-2 rounded-lg" size={40}/>
          </div>
          <div className="text-3xl font-black text-gray-800 mb-2">{thisMonthSales.length} Invoices</div>
          <div className="text-sm text-gray-400">This month</div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Sales History</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-4 font-medium">Invoice No</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Subtotal</th>
              <th className="p-4 font-medium">CGST & SGST (3%)</th>
              <th className="p-4 font-medium">Grand Total</th>
              <th className="p-4 font-medium">Payment</th>
              <th className="p-4 font-medium w-10 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-gray-400">No sales recorded yet.</td></tr>}
            {sales.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-4 font-mono font-bold text-gray-800">{s.invoice_number}</td>
                <td className="p-4 text-gray-600">{new Date(s.created_at).toLocaleDateString()}</td>
                <td className="p-4 text-gray-600">{s.customer_name || 'Walk-in'}</td>
                <td className="p-4 text-gray-600">Rs. {s.subtotal.toLocaleString('en-IN')}</td>
                <td className="p-4 text-gray-600">Rs. {s.gst_amount.toLocaleString('en-IN')}</td>
                <td className="p-4 font-bold text-gray-800">Rs. {s.grand_total.toLocaleString('en-IN')}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold uppercase">{s.payment_mode}</span>
                </td>
                <td className="p-4 flex justify-center gap-2">
                  <button
                    onClick={() => handleReprintClick(s)}
                    className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center justify-center w-full"
                    title="Reprint Invoice"
                  >
                    <Receipt size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(s.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center justify-center w-full"
                    title="Delete Sale"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Admin Authorization</h3>
            <p className="text-sm text-gray-500 mb-4">Please enter the admin password to delete this invoice. This will return the items to stock.</p>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 mb-6 font-mono tracking-widest text-lg"
              placeholder="••••"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') confirmDelete() }}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg font-bold flex items-center gap-2 shadow-sm">
                <Trash2 size={16} /> Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {reprintInvoice && (
        <InvoicePrintModal
          completedInvoice={reprintInvoice}
          printers={printers}
          selectedPrinter={selectedPrinter}
          onPrinterChange={(e) => setSelectedPrinter(e.target.value)}
          onClose={() => setReprintInvoice(null)}
        />
      )}
    </div>
  )
}
