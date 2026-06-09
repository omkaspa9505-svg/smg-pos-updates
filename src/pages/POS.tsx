import { useState, useEffect, useRef } from 'react'
import { ShoppingCart, ScanLine, CheckCircle } from 'lucide-react'
import { Decimal } from 'decimal.js'

export default function POS() {
  const [rates, setRates] = useState({ gold_22k: 7200, gold_24k: 7800, silver: 95 })
  const [barcodeInput, setBarcodeInput] = useState('')
  const [cart, setCart] = useState<any[]>([])
  const [exchangeItems, setExchangeItems] = useState<any[]>([])
  const [showExchangeModal, setShowExchangeModal] = useState(false)
  const [newExchange, setNewExchange] = useState({ metal: 'Silver', gross_wt: '', purity_yield: '65' })
  const [customer, setCustomer] = useState({ name: '', mobile: '' })
  const [paymentMode] = useState('Cash')
  
  const scanInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadRates(new Date().toISOString().split('T')[0])
    // Focus the scanner input so the USB barcode scanner just types into it
    scanInputRef.current?.focus()
  }, [])

  const loadRates = async (d: string) => {
    if ((window as any).api) {
      const saved = await (window as any).api.getRates(d)
      if (saved) setRates(saved)
    }
  }

  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim() !== '') {
      if ((window as any).api) {
        const item = await (window as any).api.scanBarcode(barcodeInput.trim())
        if (item) {
          // Calculate price based on today's rates
          let rate = 0
          if (item.purity === '22k') rate = rates.gold_22k
          if (item.purity === '24k') rate = rates.gold_24k
          if (item.purity === 'Silver') rate = rates.silver
          
          const metalValue = Number(new Decimal(item.net_wt).mul(rate).toFixed(2))
          const makingValue = item.making_charge_type === 'per_gram' 
            ? Number(new Decimal(item.net_wt).mul(item.making_charge_rate).toFixed(2))
            : item.making_charge_type === 'percentage'
              ? Number(new Decimal(metalValue).mul(item.making_charge_rate).div(100).toFixed(2))
              : Number(new Decimal(item.making_charge_rate).toFixed(2))
            
          const salePrice = Number(new Decimal(metalValue).plus(makingValue).toFixed(2))
          
          setCart([...cart, { ...item, metalValue, makingValue, salePrice }])
        } else {
          alert('Item not found or already sold!')
        }
      }
      setBarcodeInput('')
    }
  }

  const handleAddExchange = () => {
    const rate = newExchange.metal === 'Silver' ? rates.silver : rates.gold_24k
    const value = Number(new Decimal(newExchange.gross_wt).mul(new Decimal(newExchange.purity_yield).div(100)).mul(rate).toFixed(2))
    setExchangeItems([...exchangeItems, { ...newExchange, value }])
    setShowExchangeModal(false)
    setNewExchange({ metal: 'Silver', gross_wt: '', purity_yield: '65' })
  }

  const handleCheckout = async (paymentMode: string) => {
    if (cart.length === 0 && exchangeItems.length === 0) return alert('Nothing to bill!')
    
    const total_metal_value = Number(cart.reduce((sum, item) => new Decimal(sum).plus(item.metalValue), new Decimal(0)).toFixed(2))
    const total_making_charges = Number(cart.reduce((sum, item) => new Decimal(sum).plus(item.makingValue), new Decimal(0)).toFixed(2))
    const subtotal = Number(new Decimal(total_metal_value).plus(total_making_charges).toFixed(2))
    const gst_amount = Number(new Decimal(subtotal).mul(0.03).toFixed(2))
    
    const totalExchangeValue = Number(exchangeItems.reduce((sum, item) => new Decimal(sum).plus(item.value), new Decimal(0)).toFixed(2))
    const grand_total = Number(new Decimal(subtotal).plus(gst_amount).minus(totalExchangeValue).toFixed(2))

    const invoiceData = {
      customer_name: customer.name || 'Walk-in',
      customer_mobile: customer.mobile || '',
      total_metal_value,
      total_making_charges,
      gst_amount,
      grand_total,
      payment_mode: paymentMode,
      date: new Date().toISOString(),
      items: cart,
      exchanges: exchangeItems
    }

    if ((window as any).api) {
      const result = await (window as any).api.createInvoice(invoiceData)
      if (result.success) {
        // Send automated WhatsApp Thank You message
        if (customer.mobile && (window as any).api) {
          const msg = `🎉 Thank you for shopping with SMG Jewellers!\n\nYour Invoice: *${result.invoice_number}*\nTotal Amount: *Rs. ${grand_total.toLocaleString('en-IN')}*\n\nWe look forward to serving you again!`
          ;(window as any).api.sendWhatsAppMessage(customer.mobile, msg).catch((e: any) => console.error(e))
        }

        alert(`Sale Completed! Invoice #: ${result.invoice_number}`)
        setCart([])
        setExchangeItems([])
        setCustomer({ name: '', mobile: '' })
        // Automatically trigger print
        ;(window as any).api.printReceipt()
      }
    }
  }

  // Calculations
  const totalMetal = Number(cart.reduce((sum, item) => new Decimal(sum).plus(item.metalValue), new Decimal(0)).toFixed(2))
  const totalMaking = Number(cart.reduce((sum, item) => new Decimal(sum).plus(item.makingValue), new Decimal(0)).toFixed(2))
  const gst = Number(new Decimal(totalMetal).plus(totalMaking).mul(0.03).toFixed(2))
  const totalExchangeValue = Number(exchangeItems.reduce((sum, item) => new Decimal(sum).plus(item.value), new Decimal(0)).toFixed(2))
  const grandTotal = Number(new Decimal(totalMetal).plus(totalMaking).plus(gst).minus(totalExchangeValue).toFixed(2))

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <ShoppingCart className="text-green-500" /> Point of Sale
        </h1>
        <div className="flex items-center gap-2 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg border border-yellow-200 font-bold">
          Today's 22k Rate: Rs. {rates.gold_22k}/g
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Left Side: Scanner & Cart */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Scanner Input & Actions */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
              <ScanLine size={24} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Scan Barcode</label>
              <input 
                ref={scanInputRef}
                type="text" 
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={handleScan}
                placeholder="Ready to scan... (e.g. SMG-1001)"
                className="w-full text-lg outline-none font-mono"
                autoFocus
              />
            </div>
            <button
              onClick={() => setShowExchangeModal(true)}
              className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg font-bold border border-yellow-200 hover:bg-yellow-100 whitespace-nowrap"
            >
              + Add Old Metal
            </button>
          </div>

          {/* Cart Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm sticky top-0">
                <tr>
                  <th className="p-4 font-medium">Item</th>
                  <th className="p-4 font-medium">Net Wt</th>
                  <th className="p-4 font-medium">Metal Val</th>
                  <th className="p-4 font-medium">Making Chg</th>
                  <th className="p-4 font-medium text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cart.length === 0 && (
                  <tr><td colSpan={5} className="p-12 text-center text-gray-400">Cart is empty. Scan an item.</td></tr>
                )}
                {cart.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{item.category}</div>
                      <div className="text-xs text-gray-500 font-mono">{item.barcode} | {item.purity}</div>
                    </td>
                    <td className="p-4 text-gray-600">{item.net_wt}g</td>
                    <td className="p-4 text-gray-600">Rs. {item.metalValue.toFixed(2)}</td>
                    <td className="p-4 text-gray-600">Rs. {item.makingValue.toFixed(2)}</td>
                    <td className="p-4 text-right font-bold text-gray-800">Rs. {item.salePrice.toFixed(2)}</td>
                  </tr>
                ))}
                {exchangeItems.map((item, idx) => (
                  <tr key={`exc-${idx}`} className="bg-yellow-50">
                    <td className="p-4">
                      <div className="font-bold text-yellow-800">Old {item.metal} Exchange</div>
                      <div className="text-xs text-yellow-600 font-mono">Yield: {item.purity_yield}%</div>
                    </td>
                    <td className="p-4 text-yellow-700">{item.gross_wt}g</td>
                    <td className="p-4 text-yellow-700">-</td>
                    <td className="p-4 text-yellow-700">-</td>
                    <td className="p-4 text-right font-bold text-yellow-800">- Rs. {item.value.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Checkout Panel */}
        <div className="bg-gray-900 rounded-xl shadow-sm text-white flex flex-col relative overflow-hidden">
          {/* Print media specific container (hidden on screen, visible on print) */}
          <div id="print-invoice" className="hidden print:block absolute inset-0 bg-white text-black p-8 z-50">
            <div className="text-center mb-8 border-b pb-4">
              <h1 className="text-3xl font-black">SMG JEWELLERS</h1>
              <p className="text-sm">GST INVOICE</p>
            </div>
            <div className="mb-4">
              <p>Customer: {customer.name || 'Walk-in'}</p>
              <p>Date: {new Date().toLocaleDateString()}</p>
            </div>
            <table className="w-full text-sm mb-8">
              <thead className="border-y">
                <tr>
                  <th className="py-2 text-left">Item</th>
                  <th className="py-2 text-right">Net Wt</th>
                  <th className="py-2 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((i, x) => (
                  <tr key={x}>
                    <td className="py-2">{i.category} ({i.purity})</td>
                    <td className="py-2 text-right">{i.net_wt}g</td>
                    <td className="py-2 text-right">{i.salePrice.toFixed(2)}</td>
                  </tr>
                ))}
                {exchangeItems.map((i, x) => (
                  <tr key={`p-exc-${x}`} className="italic text-gray-600">
                    <td className="py-2">Old {i.metal} Exchange</td>
                    <td className="py-2 text-right">{i.gross_wt}g</td>
                    <td className="py-2 text-right">- {i.value.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t pt-4 text-right space-y-1">
              <p>Subtotal: {(totalMetal + totalMaking).toFixed(2)}</p>
              <p>GST (3%): {gst.toFixed(2)}</p>
              {totalExchangeValue > 0 && <p>Less Exchange: - {totalExchangeValue.toFixed(2)}</p>}
              <h2 className="text-xl font-bold mt-2">TOTAL: Rs. {grandTotal.toFixed(2)}</h2>
            </div>
          </div>

          <div className="p-6 border-b border-gray-800">
            <h2 className="text-lg font-bold mb-4">Customer Details</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Name" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="w-full p-3 rounded-lg bg-gray-800 border-none outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Mobile" value={customer.mobile} onChange={e => setCustomer({...customer, mobile: e.target.value})} className="w-full p-3 rounded-lg bg-gray-800 border-none outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          
          <div className="p-6 flex-1 flex flex-col justify-end">
            <div className="space-y-3 mb-6 text-gray-300">
              <div className="flex justify-between">
                <span>Metal Value</span>
                <span>Rs. {totalMetal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Making Charges</span>
                <span>Rs. {totalMaking.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-4">
                <span>GST (3%)</span>
                <span>Rs. {gst.toFixed(2)}</span>
              </div>
              {exchangeItems.length > 0 && (
                <div className="flex justify-between text-yellow-400 border-b border-gray-700 pb-4">
                  <span>Less: Old Metal Exchange</span>
                  <span>- Rs. {totalExchangeValue.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-black text-white pt-2">
                <span>Total</span>
                <span>Rs. {grandTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              onClick={() => handleCheckout(paymentMode)}
              className="w-full bg-green-500 hover:bg-green-600 text-white p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
              <CheckCircle size={24} />
              Complete Sale & Print
            </button>
          </div>
        </div>

      </div>

      {showExchangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md text-gray-800">
            <h2 className="text-xl font-bold mb-4">Add Old Metal Exchange</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Metal Type</label>
                <select value={newExchange.metal} onChange={e => setNewExchange({...newExchange, metal: e.target.value})} className="w-full p-2 border rounded">
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold 24k</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Gross Weight (g)</label>
                <input type="number" value={newExchange.gross_wt} onChange={e => setNewExchange({...newExchange, gross_wt: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g. 50" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Purity Yield % (Melting)</label>
                <input type="number" value={newExchange.purity_yield} onChange={e => setNewExchange({...newExchange, purity_yield: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g. 65" />
                <p className="text-xs text-gray-400 mt-1">Example: 60-80% for old silver</p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowExchangeModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                <button onClick={handleAddExchange} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 font-bold">Calculate & Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
