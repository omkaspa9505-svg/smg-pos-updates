import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Receipt } from 'lucide-react'
import { numberToWords } from '../utils/numberToWords'

interface Props {
  completedInvoice: any
  printers: any[]
  selectedPrinter: string
  onPrinterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  onClose: () => void
}

const SmgLogo = () => (
  <svg viewBox="0 0 100 100" className="h-16 w-auto" fill="none" stroke="currentColor">
    <circle cx="50" cy="50" r="45" strokeWidth="2" stroke="#000" />
    <text x="50%" y="45%" textAnchor="middle" fontSize="24" strokeWidth="1" stroke="#000" fill="#000" fontWeight="bold">SMG</text>
    <text x="50%" y="65%" textAnchor="middle" fontSize="10" strokeWidth="0" fill="#000">Jewellers</text>
  </svg>
)

const BisLogo = () => (
  <svg viewBox="0 0 100 100" className="h-16 w-auto" fill="none" stroke="currentColor">
    <path d="M10 90 L50 10 L90 90 Z" strokeWidth="2" stroke="#000" />
    <circle cx="50" cy="65" r="8" fill="#000" />
    <text x="50%" y="105%" textAnchor="middle" fontSize="10" strokeWidth="0" fill="#000" fontWeight="bold">BIS HALL MARKED</text>
  </svg>
)

const SmgWatermark = () => (
  <svg viewBox="0 0 100 100" className="w-1/2 h-auto opacity-10" fill="none" stroke="currentColor">
    <circle cx="50" cy="50" r="45" strokeWidth="1" stroke="#000" />
    <text x="50%" y="45%" textAnchor="middle" fontSize="30" strokeWidth="1" stroke="#000" fill="#000" fontWeight="bold">SMG</text>
    <text x="50%" y="65%" textAnchor="middle" fontSize="14" strokeWidth="0" fill="#000">Jewellers</text>
  </svg>
)

export default function InvoicePrintModal({
  completedInvoice,
  printers,
  selectedPrinter,
  onPrinterChange,
  onClose
}: Props) {
  // Default scale 
  const [scale, setScale] = useState(1.4)

  if (!completedInvoice) return null

  const handlePrint = async () => {
    setTimeout(() => {
      window.print();
      onClose();
    }, 100);
  }

  // Calculate totals
  const items = completedInvoice.items || [];
  const exchanges = completedInvoice.exchanges || [];
  
  const totalGross = items.reduce((acc: number, i: any) => acc + (parseFloat(i.gross_wt) || 0), 0) + exchanges.reduce((acc: number, i: any) => acc + (parseFloat(i.gross_wt) || 0), 0);
  const totalNet = items.reduce((acc: number, i: any) => acc + (parseFloat(i.net_wt) || 0), 0) + exchanges.reduce((acc: number, i: any) => acc + (parseFloat(i.net_wt) || 0), 0);
  const totalAmount = items.reduce((acc: number, i: any) => acc + (i.salePrice || (i.metal_value + i.making_charge) || 0), 0) - exchanges.reduce((acc: number, i: any) => acc + (i.value || i.net_value || 0), 0);

  const amountInWords = numberToWords(Math.round(completedInvoice.grand_total || totalAmount));

  const renderContent = (isPreview: boolean) => (
    <div className={`bg-white text-black p-1 flex flex-col relative ${isPreview ? 'w-[210mm] h-[148mm] shadow-xl overflow-hidden' : 'w-[210mm] h-[148mm] overflow-hidden'}`} style={{ fontFamily: 'Arial, sans-serif' }}>
      
      {/* Outer Border */}
      <div className="border-2 border-black flex flex-col h-full relative z-10">
        
        {/* WATERMARK */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 mt-20">
          <SmgWatermark />
        </div>

        {/* HEADER */}
        <div className="flex border-b border-black items-center px-4 py-2 relative z-10 bg-white">
          <div className="w-[15%] flex justify-center"> 
            <SmgLogo /> 
          </div>
          <div className="w-[70%] text-center flex flex-col items-center">
            <h1 style={{ fontSize: `${14 * scale}px`, fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: 1.1, color: '#333' }}>
              SHREE MAHA GANESH JEWELLERS
            </h1>
            <p style={{ fontSize: `${6 * scale}px`, marginTop: '4px', lineHeight: 1.2 }}>
              Shop No: 4 &amp; 5, Sindhu Nilayam, Sri Ram Nagar Colony, Gangaram, Chandanagar, Hyderabad-50, TG.
            </p>
            <p style={{ fontSize: `${7 * scale}px`, fontWeight: 700, marginTop: '2px' }}>
              📱 8008666199  📱 9014659444
            </p>
          </div>
          <div className="w-[15%] flex justify-center"> 
            <BisLogo /> 
          </div>
        </div>

        {/* CUSTOMER INFO */}
        <div className="flex border-b border-black px-2 py-1 relative z-10 bg-white" style={{ fontSize: `${7 * scale}px`, lineHeight: '1.4' }}>
          <div className="w-1/3">
            <div className="flex"><span className="w-14">Name</span><span>: {completedInvoice.customer_name || ''}</span></div>
            <div className="flex"><span className="w-14">Phone</span><span>: {completedInvoice.customer_mobile || ''}</span></div>
            <div className="flex"><span className="w-14">Address</span><span>: {completedInvoice.customer_address || ''}</span></div>
            <div className="flex"><span className="w-14">GST</span><span>: {completedInvoice.customer_gst || ''}</span></div>
          </div>
          <div className="w-1/3 flex items-center justify-center font-bold" style={{ fontSize: `${9 * scale}px` }}>
            GST - INVOICE
          </div>
          <div className="w-1/3 text-right flex flex-col items-end">
             <div className="flex w-36 justify-between"><span>Date</span><span>: {new Date(completedInvoice.date || completedInvoice.created_at).toLocaleDateString('en-GB')}</span></div>
             <div className="flex w-36 justify-between"><span>Invoice No</span><span>: {completedInvoice.invoice_number}</span></div>
             <div className="flex w-36 justify-between"><span>GSTIN</span><span>: 36AETFS3971D1ZK</span></div>
          </div>
        </div>

        {/* TABLE */}
        <table className="w-full border-collapse relative z-10" style={{ fontSize: `${7 * scale}px` }}>
          <thead className="border-b border-black">
            <tr>
              <th className="border-r border-black font-bold p-1 w-8 text-center">Sno</th>
              <th className="border-r border-black font-bold p-1 text-left">Description</th>
              <th className="border-r border-black font-bold p-1 text-center w-16">HSN Code</th>
              <th className="border-r border-black font-bold p-1 text-center w-8">Qty</th>
              <th className="border-r border-black font-bold p-1 text-center w-16">Gross Wt.<br/>(Grams)</th>
              <th className="border-r border-black font-bold p-1 text-center w-16">Net. Wt.<br/>(Grams)</th>
              <th className="border-r border-black font-bold p-1 text-center w-16">Rate<br/>/Gram</th>
              <th className="border-r border-black font-bold p-1 text-right w-12">VA</th>
              <th className="border-r border-black font-bold p-1 text-right w-14">St. Amt.</th>
              <th className="font-bold p-1 text-right w-20">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i: any, x: number) => (
              <tr key={x} style={{ height: `${14 * scale}px` }}>
                <td className="border-r border-black text-center px-1 py-0.5">{x + 1}</td>
                <td className="border-r border-black px-2 py-0.5" style={{ fontSize: `${8 * scale}px`, fontWeight: 600 }}>{i.category} {i.purity} {i.barcode && `(${i.barcode})`}</td>
                <td className="border-r border-black text-center px-1 py-0.5">{i.hsn_code}</td>
                <td className="border-r border-black text-center px-1 py-0.5">{i.qty || 1}</td>
                <td className="border-r border-black text-center px-1 py-0.5">{parseFloat(i.gross_wt).toFixed(3)}</td>
                <td className="border-r border-black text-center px-1 py-0.5">{parseFloat(i.net_wt).toFixed(3)}</td>
                <td className="border-r border-black text-center px-1 py-0.5">{i.rate_per_gram || (i.net_wt ? (i.metal_value / i.net_wt).toFixed(0) : '0')}</td>
                <td className="border-r border-black text-right px-1 py-0.5">{parseFloat(i.va_amount || 0).toFixed(2)}</td>
                <td className="border-r border-black text-right px-1 py-0.5">{parseFloat(i.st_amount || 0).toFixed(2)}</td>
                <td className="text-right px-1 py-0.5 font-medium">{(i.salePrice || (i.metal_value + i.making_charge)).toFixed(2)}</td>
              </tr>
            ))}
            {exchanges.map((i: any, x: number) => (
              <tr key={`exc-${x}`} style={{ height: `${14 * scale}px`, fontStyle: 'italic' }}>
                <td className="border-r border-black text-center px-1 py-0.5">{items.length + x + 1}</td>
                <td className="border-r border-black px-2 py-0.5" style={{ fontSize: `${8 * scale}px`, fontWeight: 600 }}>Old {i.metal} Exchange</td>
                <td className="border-r border-black text-center px-1 py-0.5">-</td>
                <td className="border-r border-black text-center px-1 py-0.5">1</td>
                <td className="border-r border-black text-center px-1 py-0.5">{parseFloat(i.gross_wt).toFixed(3)}</td>
                <td className="border-r border-black text-center px-1 py-0.5">-</td>
                <td className="border-r border-black text-center px-1 py-0.5">-</td>
                <td className="border-r border-black text-right px-1 py-0.5">-</td>
                <td className="border-r border-black text-right px-1 py-0.5">-</td>
                <td className="text-right px-1 py-0.5 font-medium text-red-600">-{(i.value || i.net_value).toFixed(2)}</td>
              </tr>
            ))}
            
            {/* Fill empty space */}
            {Array.from({ length: Math.max(0, 6 - (items.length + exchanges.length)) }).map((_, i) => (
              <tr key={`empty-${i}`} style={{ height: `${14 * scale}px` }}>
                <td className="border-r border-black px-1">&nbsp;</td>
                <td className="border-r border-black px-1"></td>
                <td className="border-r border-black px-1"></td>
                <td className="border-r border-black px-1"></td>
                <td className="border-r border-black px-1"></td>
                <td className="border-r border-black px-1"></td>
                <td className="border-r border-black px-1"></td>
                <td className="border-r border-black px-1"></td>
                <td className="border-r border-black px-1"></td>
                <td className="px-1"></td>
              </tr>
            ))}

            {/* Totals Row */}
            <tr className="border-t border-black font-bold">
              <td colSpan={4} className="border-r border-black text-right px-2 py-1 bg-white relative z-10"></td>
              <td className="border-r border-black text-center px-1 py-1 bg-white relative z-10">{totalGross.toFixed(3)}</td>
              <td className="border-r border-black text-center px-1 py-1 bg-white relative z-10">{totalNet.toFixed(3)}</td>
              <td colSpan={3} className="border-r border-black bg-white relative z-10"></td>
              <td className="text-right px-1 py-1 bg-white relative z-10">{totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex-1 border-t border-black bg-white relative z-10"></div>

        {/* FOOTER */}
        <div className="flex border-t border-black mt-auto relative z-10 bg-white" style={{ fontSize: `${7 * scale}px`, minHeight: `${40 * scale}px` }}>
          {/* Left Side */}
          <div className="w-[75%] px-2 py-1 flex flex-col justify-between">
            <div>
              <p>SMID : {completedInvoice.sales_person_id || ''}</p>
              <p className="mt-1 font-medium">IN WORDS: {amountInWords}</p>
              <p className="mt-1 font-bold">CASH:{completedInvoice.grand_total?.toFixed(2)}/-</p>
            </div>
            
            <div className="mt-2">
              <p className="underline italic mb-1" style={{ fontSize: `${8 * scale}px` }}>Terms and Conditions</p>
              <div style={{ lineHeight: 1.2 }}>
                <p>1. AFTER 2 DAYS NO EXCHANGE - NO CASH REFUND</p>
                <p>2. VA, MAKING CHARGES AND GST MANDATORY</p>
                <p>3. No Guarantee For Breakage, Durability and Falling of Stones</p>
              </div>
            </div>

            <div className="flex justify-between items-end mt-4">
              <p>Customer Sign</p>
              <p className="font-bold tracking-widest text-center" style={{ fontSize: `${9 * scale}px` }}>THANK YOU *** VISIT AGAIN</p>
              <p className="w-20"></p> {/* Spacer */}
            </div>
          </div>

          {/* Right Side Totals Box */}
          <div className="w-[25%] border-l border-black flex flex-col justify-between">
            <div className="w-full">
              <div className="flex justify-between px-2 py-0.5"><p>Discount :</p><p>-{(completedInvoice.discount || 0).toFixed(2)}</p></div>
              <div className="flex justify-between px-2 py-0.5"><p>Taxable :</p><p>{(completedInvoice.taxable_amount || (completedInvoice.subtotal - (completedInvoice.discount || 0))).toFixed(2)}</p></div>
              <div className="flex justify-between px-2 py-0.5"><p>CGST :</p><p>{(completedInvoice.cgst || (completedInvoice.gst_amount / 2))?.toFixed(2)}</p></div>
              <div className="flex justify-between px-2 py-0.5"><p>SGST :</p><p>{(completedInvoice.sgst || (completedInvoice.gst_amount / 2))?.toFixed(2)}</p></div>
              <div className="flex justify-between px-2 py-1 border-t border-black font-bold text-black bg-gray-50"><p>Net Total :</p><p>{completedInvoice.grand_total?.toFixed(2)}</p></div>
            </div>
            
            <div className="text-center px-1 py-1 mt-2 flex flex-col items-center justify-end h-full">
              <p style={{ fontSize: `${5 * scale}px` }}>For SHREE MAHA GANESH JEWELLERS</p>
              <p className="mt-8 mb-1">Authorized Sign.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[99999]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center border-b border-gray-800 print:hidden">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Receipt size={24}/> Print Invoice</h2>
            
            {/* Scale Slider */}
            <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg">
              <span className="text-sm font-medium text-gray-300">Invoice Scale: {scale.toFixed(1)}x</span>
              <input 
                type="range" 
                min="0.5" 
                max="2.5" 
                step="0.1" 
                value={scale} 
                onChange={e => setScale(parseFloat(e.target.value))}
                className="w-32 accent-blue-500"
              />
            </div>
          </div>
          
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-gray-100">
          {renderContent(true)}
        </div>

        {/* PORTALED PRINT TEMPLATE */}
        {createPortal(
          <div id="print-invoice" className="hidden print:block absolute top-0 left-0 w-full bg-white text-black p-0 m-0 z-[999999]">
            {renderContent(false)}
          </div>,
          document.body
        )}
        
        <div className="bg-gray-50 p-4 border-t flex flex-col gap-3 print:hidden">
          {printers.length > 0 && (
            <div className="flex items-center justify-end gap-3 text-sm text-gray-700 w-full">
              <span className="font-medium">Select Printer:</span>
              <select 
                value={selectedPrinter} 
                onChange={onPrinterChange}
                className="bg-white border border-gray-300 rounded-lg p-2 outline-none max-w-[300px] shadow-sm font-medium"
              >
                {printers.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-4 mt-1">
            <button 
              onClick={onClose} 
              className="px-6 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            <button 
              onClick={handlePrint} 
              className="px-8 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <Receipt size={20} />
              Print Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
