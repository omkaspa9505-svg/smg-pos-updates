import { useState, useEffect, useRef } from 'react'
import { ShoppingCart, ScanLine, CheckCircle, Trash2, Plus, Receipt } from 'lucide-react'
import { Decimal } from 'decimal.js'
import toast from 'react-hot-toast'

export default function POS() {
  const [rates, setRates] = useState({ gold_22k: 0, gold_24k: 0, silver: 0 })
  const [barcodeInput, setBarcodeInput] = useState('')
  const [cart, setCart] = useState<any[]>([])
  const [exchangeItems, setExchangeItems] = useState<any[]>([])
  const [showExchangeModal, setShowExchangeModal] = useState(false)
  const [newExchange, setNewExchange] = useState({ metal: 'Silver', gross_wt: '', purity_yield: '65' })
  const [customer, setCustomer] = useState({ name: '', mobile: '', address: '' })
  
  const [payments, setPayments] = useState<Record<string, string>>({ Cash: '', UPI: '', Card: '' })
  const [discount, setDiscount] = useState<string>('')
  const [applyGST, setApplyGST] = useState<boolean>(true)
  
  const [printers, setPrinters] = useState<any[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>(localStorage.getItem('receiptPrinter') || '')
  
  const scanInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if ((window as any).api) {
      ;(window as any).api.getPrinters().then((list: any[]) => {
        setPrinters(list)
        if (!selectedPrinter && list.length > 0) {
          const defaultPrinter = list.find((p: any) => p.isDefault)?.name || list[0].name
          setSelectedPrinter(defaultPrinter)
        }
      })
    }
    loadRates(new Date().toLocaleDateString('en-CA'))
    scanInputRef.current?.focus()

    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        e.key.length === 1
      ) {
        scanInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleGlobalKeydown)
    return () => window.removeEventListener('keydown', handleGlobalKeydown)
  }, [])

  const loadRates = async (d: string) => {
    if ((window as any).api) {
      const saved = await (window as any).api.getRates(d)
      if (saved) setRates(saved)
    }
  }

  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim() !== '') {
      if (rates.gold_22k === 0 || rates.gold_24k === 0 || rates.silver === 0) {
        toast.error("Please set today's board rates in the Dashboard first!")
        setBarcodeInput('')
        return
      }

      if ((window as any).api) {
        const item = await (window as any).api.scanBarcode(barcodeInput.trim().toUpperCase())
        if (item) {
          let rate = 0
          if (item.purity === '22k') rate = rates.gold_22k
          if (item.purity === '24k') rate = rates.gold_24k
          if (item.purity === 'Silver') rate = rates.silver
          
          let stAmount = 0
          if (item.stones) {
            try {
              const parsedStones = JSON.parse(item.stones)
              stAmount = parsedStones.reduce((sum: number, stone: any) => sum + ((Number(stone.carats) || 0) * (Number(stone.rate) || 0)), 0)
            } catch (e) {}
          }
          
          const metalValue = Number(new Decimal(item.net_wt).mul(rate).toFixed(2))
          const makingValue = item.making_charge_type === 'per_gram' 
            ? Number(new Decimal(item.net_wt).mul(item.making_charge_rate).toFixed(2))
            : item.making_charge_type === 'percentage'
              ? Number(new Decimal(metalValue).mul(item.making_charge_rate).div(100).toFixed(2))
              : Number(new Decimal(item.making_charge_rate).toFixed(2))
            
          const salePrice = Number(new Decimal(metalValue).plus(makingValue).plus(stAmount).toFixed(2))
          
          setCart([...cart, { 
            ...item, 
            qty: 1, 
            hsn_code: item.category === 'Silver' ? '7106' : '7108',
            rate_per_gram: rate,
            va_amount: makingValue,
            st_amount: stAmount,
            salePrice 
          }])
        } else {
          toast.error('Item not found or already sold!')
        }
      }
      setBarcodeInput('')
    }
  }

  const handleUpdateCartItem = (idx: number, field: string, value: string) => {
    const newCart = [...cart]
    newCart[idx][field] = value

    const nWt = Number(newCart[idx].net_wt) || 0
    const rate = Number(newCart[idx].rate_per_gram) || 0
    const va = Number(newCart[idx].va_amount) || 0
    const st = Number(newCart[idx].st_amount) || 0
    newCart[idx].salePrice = Number(new Decimal(nWt).mul(rate).plus(va).plus(st).toFixed(2))
    
    setCart(newCart)
  }

  const handleAddExchange = () => {
    const gwt = Number(newExchange.gross_wt);
    const yieldPct = Number(newExchange.purity_yield);
    
    if (isNaN(gwt) || gwt <= 0) return toast.error('Please enter a valid gross weight');
    if (isNaN(yieldPct) || yieldPct <= 0 || yieldPct > 100) return toast.error('Please enter a valid purity yield percentage');

    const rate = newExchange.metal === 'Silver' ? rates.silver : rates.gold_24k
    const value = Number(new Decimal(gwt).mul(new Decimal(yieldPct).div(100)).mul(rate).toFixed(2))
    
    setExchangeItems([...exchangeItems, { ...newExchange, value }])
    setShowExchangeModal(false)
    setNewExchange({ metal: 'Silver', gross_wt: '', purity_yield: '65' })
    toast.success('Old metal exchange added')
  }

  const [completedInvoice, setCompletedInvoice] = useState<any>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  // Calculations
  const totalItemsAmount = Number(cart.reduce((sum, item) => new Decimal(sum).plus(item.salePrice), new Decimal(0)).toFixed(2))
  const totalExchangeValue = Number(exchangeItems.reduce((sum, item) => new Decimal(sum).plus(item.value), new Decimal(0)).toFixed(2))
  const discountAmt = Number(discount) || 0
  const taxableAmount = Math.max(0, Number(new Decimal(totalItemsAmount).minus(discountAmt).minus(totalExchangeValue).toFixed(2)))
  
  const cgst = applyGST ? Number(new Decimal(taxableAmount).mul(0.015).toFixed(2)) : 0
  const sgst = applyGST ? Number(new Decimal(taxableAmount).mul(0.015).toFixed(2)) : 0
  const grandTotal = Number(new Decimal(taxableAmount).plus(cgst).plus(sgst).toFixed(2))

  const handleCheckout = async () => {
    if (cart.length === 0 && exchangeItems.length === 0) return toast.error('Nothing to bill!')
    
    // Validate payments
    const totalPaid = Object.values(payments).reduce((sum, val) => sum + (Number(val) || 0), 0)
    if (Math.abs(totalPaid - grandTotal) > 1) {
      if (totalPaid === 0 && grandTotal > 0) {
        setPayments(prev => ({ ...prev, Cash: grandTotal.toString() }))
      }
    }

    const finalPayments = totalPaid === 0 && grandTotal > 0 
      ? { Cash: grandTotal } 
      : Object.fromEntries(Object.entries(payments).map(([k, v]) => [k, Number(v) || 0] as [string, number]).filter(([_, v]) => v > 0))

    const invoiceData = {
      customer_name: customer.name || 'Walk-in',
      customer_mobile: customer.mobile || '',
      customer_address: customer.address || '',
      total_metal_value: totalItemsAmount, // Storing subtotal here for backward compatibility
      total_making_charges: 0,
      gst_amount: cgst + sgst,
      grand_total: grandTotal,
      payment_mode: Object.keys(finalPayments).join(', ') || 'Exchange',
      payment_breakdown: finalPayments,
      discount: discountAmt,
      cgst,
      sgst,
      taxable_amount: taxableAmount,
      date: new Date().toLocaleString('sv-SE'),
      items: cart,
      exchanges: exchangeItems
    }

    if ((window as any).api) {
      try {
        const result = await (window as any).api.createInvoice(invoiceData)
        if (result.success) {
          if (customer.mobile && (window as any).api) {
            const msg = `🎉 Thank you for shopping with SMG Jewellers!\n\nYour Invoice: *${result.invoice_number}*\nTotal Amount: *Rs. ${grandTotal.toLocaleString('en-IN')}*\n\nWe look forward to serving you again!`
            ;(window as any).api.sendWhatsAppMessage(customer.mobile, msg).catch((e: any) => console.error(e))
          }

          toast.success(`Sale Completed! Invoice #: ${result.invoice_number}`)
          
          setCompletedInvoice({ ...invoiceData, invoice_number: result.invoice_number })
          setShowPreviewModal(true)
          
          setCart([])
          setExchangeItems([])
          setCustomer({ name: '', mobile: '', address: '' })
          setPayments({ Cash: '', UPI: '', Card: '' })
          setDiscount('')
        } else {
          toast.error('Failed to create invoice')
        }
      } catch (error) {
        toast.error('An error occurred during checkout')
        console.error(error)
      }
    }
  }

  const handlePrintConfirm = () => {
    setShowPreviewModal(false)
    ;(window as any).api.printReceipt(selectedPrinter)
  }

  const handlePrinterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedPrinter(val)
    localStorage.setItem('receiptPrinter', val)
  }

  const isCartEmpty = cart.length === 0 && exchangeItems.length === 0;

  return (
    <div className="p-4 md:p-6 h-full flex flex-col max-w-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <ShoppingCart className="text-blue-600" /> Point of Sale
        </h1>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-bold ${rates.gold_22k === 0 ? 'bg-red-50 text-red-800 border-red-200' : 'bg-yellow-50 text-yellow-800 border-yellow-200'}`}>
          {rates.gold_22k === 0 ? "⚠️ Rates Not Set for Today!" : `Today's 22k Rate: Rs. ${rates.gold_22k}/g`}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 flex-1">
        
        {/* Left Side: Cart & Grid */}
        <div className="xl:w-2/3 flex flex-col gap-4">
          <div 
            onClick={() => scanInputRef.current?.focus()}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 cursor-text transition-colors"
          >
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
              <ScanLine size={24} />
            </div>
            <div className="flex-1">
              <label htmlFor="barcode-input" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 cursor-text">
                Scan Barcode
              </label>
              <input 
                id="barcode-input"
                ref={scanInputRef}
                type="text" 
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={handleScan}
                className="w-full text-lg outline-none font-mono bg-transparent"
                autoFocus
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-auto flex flex-col relative">
            {isCartEmpty ? (
              <div className="flex flex-col items-center justify-center flex-1 p-8 text-gray-400">
                <ShoppingCart size={48} className="mb-3 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">Cart is empty</p>
                <p className="text-sm mt-1">Scan a barcode to start billing</p>
              </div>
            ) : (
              <div className="min-w-[800px]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 font-semibold">Desc</th>
                      <th className="p-3 font-semibold w-20">HSN</th>
                      <th className="p-3 font-semibold w-16">Qty</th>
                      <th className="p-3 font-semibold w-20">G.Wt</th>
                      <th className="p-3 font-semibold w-20">S.Wt</th>
                      <th className="p-3 font-semibold w-20">N.Wt</th>
                      <th className="p-3 font-semibold w-24">Rate/g</th>
                      <th className="p-3 font-semibold w-24">VA/MC</th>
                      <th className="p-3 font-semibold w-24">St.Amt</th>
                      <th className="p-3 font-semibold w-28 text-right">Amount</th>
                      <th className="p-3 font-semibold w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cart.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="p-2">
                          <div className="font-bold text-gray-800">{item.category}</div>
                          <div className="text-xs text-gray-500">{item.barcode} | {item.purity}</div>
                        </td>
                        <td className="p-2"><input type="text" className="w-full p-1.5 border rounded" value={item.hsn_code || ''} onChange={e => handleUpdateCartItem(idx, 'hsn_code', e.target.value)} /></td>
                        <td className="p-2"><input type="number" className="w-full p-1.5 border rounded" value={item.qty} onChange={e => handleUpdateCartItem(idx, 'qty', e.target.value)} /></td>
                        <td className="p-2"><input type="number" className="w-full p-1.5 border rounded" value={item.gross_wt} onChange={e => handleUpdateCartItem(idx, 'gross_wt', e.target.value)} /></td>
                        <td className="p-2"><input type="number" className="w-full p-1.5 border rounded" value={item.stone_wt || ''} onChange={e => handleUpdateCartItem(idx, 'stone_wt', e.target.value)} /></td>
                        <td className="p-2"><input type="number" className="w-full p-1.5 border rounded bg-blue-50/50" value={item.net_wt} onChange={e => handleUpdateCartItem(idx, 'net_wt', e.target.value)} /></td>
                        <td className="p-2"><input type="number" className="w-full p-1.5 border rounded" value={item.rate_per_gram} onChange={e => handleUpdateCartItem(idx, 'rate_per_gram', e.target.value)} /></td>
                        <td className="p-2"><input type="number" className="w-full p-1.5 border rounded bg-blue-50/50" value={item.va_amount} onChange={e => handleUpdateCartItem(idx, 'va_amount', e.target.value)} /></td>
                        <td className="p-2"><input type="number" className="w-full p-1.5 border rounded" value={item.st_amount} onChange={e => handleUpdateCartItem(idx, 'st_amount', e.target.value)} /></td>
                        <td className="p-2 text-right font-bold text-gray-800">
                          {item.salePrice.toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-red-500 p-1.5 hover:bg-red-50 rounded" title="Remove item">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {exchangeItems.map((item, idx) => (
                      <tr key={`exc-${idx}`} className="bg-yellow-50/50">
                        <td className="p-3" colSpan={3}>
                          <div className="font-bold text-yellow-800">Old {item.metal} Exchange</div>
                          <div className="text-xs text-yellow-600">Yield: {item.purity_yield}%</div>
                        </td>
                        <td className="p-3 text-yellow-700 font-medium" colSpan={5}>{item.gross_wt}g</td>
                        <td className="p-3 text-right font-bold text-red-600">- {item.value.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <button onClick={() => setExchangeItems(exchangeItems.filter((_, i) => i !== idx))} className="text-red-500 p-1.5 hover:bg-red-50 rounded" title="Remove exchange">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Checkout & Totals */}
        <div className="xl:w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col relative">
          
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-800 mb-3 flex justify-between items-center">
              Customer Details
            </h2>
            <div className="space-y-3">
              <input type="text" placeholder="Customer Name" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <input type="text" placeholder="Phone Number" value={customer.mobile} onChange={e => setCustomer({...customer, mobile: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <textarea placeholder="Address" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[60px]" />
            </div>
          </div>

          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800 mb-3">Calculations</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-800">{totalItemsAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Discount</span>
                <input type="number" placeholder="0" value={discount} onChange={e => setDiscount(e.target.value)} className="w-24 p-1.5 border rounded text-right outline-none focus:border-blue-500" />
              </div>
              {exchangeItems.length > 0 && (
                <div className="flex justify-between items-center text-red-500">
                  <span>Old Metal</span>
                  <span>- {totalExchangeValue.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="font-semibold">Taxable Amount</span>
                <span className="font-bold text-gray-800">{taxableAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={applyGST} onChange={e => setApplyGST(e.target.checked)} className="rounded text-blue-600" />
                  <span>Apply GST (3%)</span>
                </label>
                <div className="text-right">
                  <div className="text-xs">CGST: {cgst.toFixed(2)}</div>
                  <div className="text-xs">SGST: {sgst.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex-1">
            <h2 className="text-sm font-bold text-gray-800 mb-3">Payment Modes (Split)</h2>
            <div className="space-y-2">
              {['Cash', 'UPI', 'Card'].map(mode => (
                <div key={mode} className="flex items-center justify-between gap-3 bg-white p-2 border border-gray-200 rounded-lg group">
                  <span className="text-sm font-medium text-gray-600 w-16">{mode}</span>
                  <input 
                    type="number" 
                    placeholder="Amount" 
                    value={payments[mode]} 
                    onChange={e => setPayments({...payments, [mode]: e.target.value})} 
                    className="flex-1 p-1.5 bg-gray-50 border border-gray-100 rounded text-right outline-none focus:ring-1 focus:ring-blue-500 text-sm transition-all" 
                  />
                </div>
              ))}
              <button
                onClick={(e) => { e.stopPropagation(); setShowExchangeModal(true); }}
                className="w-full mt-2 bg-yellow-50 text-yellow-700 p-2 rounded-lg font-bold border border-yellow-200 hover:bg-yellow-100 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                + Add Old Metal
              </button>
            </div>
          </div>
          
          <div className="p-5 flex flex-col justify-end bg-white">
            <div className="flex justify-between items-end mb-4">
              <span className="text-gray-500 font-medium">Net Total</span>
              <span className="text-3xl font-black text-blue-600">Rs. {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            
            <button 
              disabled={isCartEmpty}
              onClick={handleCheckout}
              className={`w-full p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-md ${
                isCartEmpty 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              <CheckCircle size={24} />
              Complete Sale
            </button>
          </div>
        </div>

      </div>

      <div
        style={{ display: showExchangeModal ? 'flex' : 'none' }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm items-center justify-center p-4 z-50 animate-in fade-in"
        onClick={() => setShowExchangeModal(false)}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
            <div className="p-1.5 bg-yellow-100 text-yellow-600 rounded-lg"><Plus size={20}/></div>
            Add Old Metal
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Metal Type</label>
              <select value={newExchange.metal} onChange={e => setNewExchange({...newExchange, metal: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gross Weight (g)</label>
              <input type="number" value={newExchange.gross_wt} onChange={e => setNewExchange({...newExchange, gross_wt: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"  />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Purity Yield % (Melting)</label>
              <input type="number" value={newExchange.purity_yield} onChange={e => setNewExchange({...newExchange, purity_yield: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"  />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowExchangeModal(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-semibold">Cancel</button>
              <button onClick={handleAddExchange} className="px-5 py-2.5 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 font-bold shadow-sm">Add Exchange</button>
            </div>
          </div>
        </div>
      </div>

      {showPreviewModal && completedInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            
            <div className="bg-gray-900 text-white p-5 flex justify-between items-center border-b border-gray-800">
              <h2 className="text-xl font-bold flex items-center gap-2"><Receipt size={24}/> Print Invoice</h2>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-gray-100">
              {/* PRINT TEMPLATE */}
              <div id="print-invoice" className="print-only bg-white text-black p-8 shadow-xl w-full max-w-3xl min-h-[500px] h-max" style={{ fontFamily: 'Arial, sans-serif' }}>
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-black tracking-tight">SHREE MAHA GANESH JEWELLERS</h1>
                  <p className="text-sm mt-1">Shop No: 4 & 5, Sindhu Nilayam, Sri Ram Nagar Colony, Gangaram, Chandanagar, Hyderabad-50, TG.</p>
                  <p className="text-sm font-bold mt-1">GSTIN: 36AETFS3971D1ZK</p>
                  <div className="inline-block border border-black px-4 py-1 mt-3 font-bold uppercase tracking-widest text-sm">GST - INVOICE</div>
                </div>
                
                <div className="flex justify-between border border-black p-2 mb-4 text-sm">
                  <div>
                    <p><span className="font-bold">Customer Name:</span> {completedInvoice.customer_name}</p>
                    {completedInvoice.customer_mobile && <p><span className="font-bold">Mobile:</span> {completedInvoice.customer_mobile}</p>}
                    {completedInvoice.customer_address && <p><span className="font-bold">Address:</span> {completedInvoice.customer_address}</p>}
                  </div>
                  <div className="text-right">
                    <p><span className="font-bold">Invoice No:</span> {completedInvoice.invoice_number}</p>
                    <p><span className="font-bold">Date:</span> {new Date(completedInvoice.date).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <table className="w-full text-sm border-collapse border border-black mb-4">
                  <thead className="bg-gray-50 border-b border-black text-xs uppercase">
                    <tr>
                      <th className="border-r border-black py-2 px-2 text-center w-8">S.No</th>
                      <th className="border-r border-black py-2 px-2 text-left">Description</th>
                      <th className="border-r border-black py-2 px-2 text-center">HSN</th>
                      <th className="border-r border-black py-2 px-2 text-center">Qty</th>
                      <th className="border-r border-black py-2 px-2 text-right">Gr. Wt</th>
                      <th className="border-r border-black py-2 px-2 text-right">Nt. Wt</th>
                      <th className="border-r border-black py-2 px-2 text-right">Rate/g</th>
                      <th className="border-r border-black py-2 px-2 text-right">VA</th>
                      <th className="border-r border-black py-2 px-2 text-right">St.Amt</th>
                      <th className="py-2 px-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedInvoice.items.map((i: any, x: number) => (
                      <tr key={x} className="border-b border-black">
                        <td className="border-r border-black py-2 px-2 text-center">{x + 1}</td>
                        <td className="border-r border-black py-2 px-2">
                          <div className="font-bold">{i.category}</div>
                          <div className="text-xs text-gray-600">{i.purity} {i.barcode}</div>
                        </td>
                        <td className="border-r border-black py-2 px-2 text-center">{i.hsn_code}</td>
                        <td className="border-r border-black py-2 px-2 text-center">{i.qty}</td>
                        <td className="border-r border-black py-2 px-2 text-right">{i.gross_wt}</td>
                        <td className="border-r border-black py-2 px-2 text-right">{i.net_wt}</td>
                        <td className="border-r border-black py-2 px-2 text-right">{i.rate_per_gram}</td>
                        <td className="border-r border-black py-2 px-2 text-right">{i.va_amount}</td>
                        <td className="border-r border-black py-2 px-2 text-right">{i.st_amount}</td>
                        <td className="py-2 px-2 text-right font-bold">{i.salePrice.toFixed(2)}</td>
                      </tr>
                    ))}
                    {completedInvoice.exchanges && completedInvoice.exchanges.map((i: any, x: number) => (
                      <tr key={`p-exc-${x}`} className="border-b border-black italic text-gray-700">
                        <td className="border-r border-black py-2 px-2 text-center">*</td>
                        <td className="border-r border-black py-2 px-2">Old {i.metal} Exchange</td>
                        <td className="border-r border-black py-2 px-2 text-center">-</td>
                        <td className="border-r border-black py-2 px-2 text-center">1</td>
                        <td className="border-r border-black py-2 px-2 text-right">{i.gross_wt}</td>
                        <td className="border-r border-black py-2 px-2 text-right">-</td>
                        <td className="border-r border-black py-2 px-2 text-right">-</td>
                        <td className="border-r border-black py-2 px-2 text-right">-</td>
                        <td className="border-r border-black py-2 px-2 text-right">-</td>
                        <td className="py-2 px-2 text-right text-red-600 font-bold">- {i.value.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="flex gap-4">
                  <div className="flex-1 border border-black p-3 text-xs leading-relaxed flex flex-col justify-between">
                    <div>
                      <p className="font-bold underline mb-1">Terms & Conditions:</p>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>After 2 days no exchange.</li>
                        <li>VA, MAKING CHARGES AND GST MANDATORY.</li>
                        <li>No Guarantee for Polish & Stone.</li>
                        <li>Subject to local jurisdiction only.</li>
                      </ol>
                    </div>
                    <div className="mt-8 flex justify-between px-2">
                      <div className="border-t border-black pt-1">Customer Sign</div>
                      <div className="border-t border-black pt-1">Authorised Sign</div>
                    </div>
                  </div>
                  
                  <div className="w-[250px] border border-black text-sm flex flex-col">
                    <div className="flex justify-between p-2 border-b border-black">
                      <span>Total Amount:</span>
                      <span className="font-bold">{completedInvoice.total_metal_value.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-2 border-b border-black">
                      <span>Discount:</span>
                      <span>{completedInvoice.discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-2 border-b border-black bg-gray-50">
                      <span className="font-bold">Taxable Amount:</span>
                      <span className="font-bold">{completedInvoice.taxable_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-2 border-b border-black">
                      <span>CGST:</span>
                      <span>{completedInvoice.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-2 border-b border-black">
                      <span>SGST:</span>
                      <span>{completedInvoice.sgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-100 flex-1 items-center">
                      <span className="font-black text-lg">Net Total:</span>
                      <span className="font-black text-lg">Rs. {completedInvoice.grand_total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payments Section */}
                <div className="mt-4 border border-black p-2 text-xs flex gap-4">
                  <span className="font-bold">Paid By:</span>
                  {Object.entries(completedInvoice.payment_breakdown).map(([k, v]: any) => (
                    <span key={k} className="bg-gray-100 px-2 rounded border">{k}: {v.toFixed(2)}</span>
                  ))}
                </div>

              </div>
            </div>
            
            <div className="bg-gray-50 p-5 border-t flex flex-col gap-3">
              {printers.length > 0 && (
                <div className="flex items-center justify-end gap-3 text-sm text-gray-700 w-full">
                  <span className="font-medium">Select Printer:</span>
                  <select 
                    value={selectedPrinter} 
                    onChange={handlePrinterChange}
                    className="bg-white border border-gray-300 rounded-lg p-2 outline-none max-w-[300px] shadow-sm font-medium"
                  >
                    {printers.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-4 mt-2">
                <button 
                  onClick={() => setShowPreviewModal(false)} 
                  className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={handlePrintConfirm} 
                  className="px-8 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <Receipt size={20} />
                  Print Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
