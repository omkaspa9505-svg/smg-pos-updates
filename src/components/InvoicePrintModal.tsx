import React from 'react'
import { createPortal } from 'react-dom'
import { Receipt } from 'lucide-react'

interface Props {
  completedInvoice: any
  printers: any[]
  selectedPrinter: string
  onPrinterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  onClose: () => void
}

export default function InvoicePrintModal({
  completedInvoice,
  printers,
  selectedPrinter,
  onPrinterChange,
  onClose
}: Props) {
  if (!completedInvoice) return null

  const handlePrint = async () => {
    // We use the browser's native print preview which the user prefers.
    setTimeout(() => {
      window.print();
      onClose();
    }, 100);
  }

  const renderContent = (isPreview: boolean) => (
    <div className={`bg-white text-black border border-black flex flex-col ${isPreview ? 'w-[210mm] h-[148mm] shadow-xl overflow-hidden' : 'w-[210mm] h-[148mm] overflow-hidden'}`} style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* Header row */}
      <div className="flex border-b border-black" style={{ minHeight: 0 }}>
        {/* Left - Customer Info */}
        <div className="w-[30%] px-1.5 py-1 border-r border-black flex flex-col justify-center" style={{ fontSize: '8px', lineHeight: '1.3' }}>
          <p><strong>Name :</strong> {completedInvoice.customer_name || ''}</p>
          <p><strong>Phone :</strong> {completedInvoice.customer_mobile || ''}</p>
          <p><strong>Address :</strong> {completedInvoice.customer_address || ''}</p>
          <p><strong>GST :</strong> {completedInvoice.customer_gst || ''}</p>
        </div>

        {/* Center - Shop Name (BIGGEST element on the page) */}
        <div className="w-[45%] px-1 py-1 text-center flex flex-col justify-center items-center">
          <h1 style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: 1.1 }}>SHREE MAHA GANESH JEWELLERS</h1>
          <p style={{ fontSize: '7px', marginTop: '2px', lineHeight: 1.2 }}>Shop No. 4 &amp; 5, Sindhu Nilayam, Sri Ram Nagar Colony, Gangaram, Chandanagar, Hyderabad-50. TG.</p>
          <p style={{ fontSize: '8px', fontWeight: 700, marginTop: '2px' }}>📞 8008666199  📞 9014659444</p>
        </div>

        {/* Right - Invoice Info */}
        <div className="w-[25%] px-1.5 py-1 border-l border-black flex flex-col justify-center text-right" style={{ fontSize: '8px', lineHeight: '1.3' }}>
          <p><strong>Date :</strong> {new Date(completedInvoice.date || completedInvoice.created_at).toLocaleDateString()}</p>
          <p><strong>Invoice No :</strong> {completedInvoice.invoice_number}</p>
          <p><strong>GSTIN :</strong> 36AETFS3971D1ZK</p>
        </div>
      </div>

      {/* GST INVOICE Title */}
      <div className="text-center font-bold uppercase tracking-widest border-b border-black bg-gray-50 print:bg-white" style={{ fontSize: '8px', padding: '2px 0', lineHeight: 1 }}>
        GST - INVOICE
      </div>

      {/* Table */}
      <table className="w-full border-collapse" style={{ fontSize: '7px' }}>
        <thead className="border-b border-black bg-gray-50 print:bg-white">
          <tr>
            <th className="border-r border-black px-0.5 text-center w-5" style={{ padding: '2px 2px', fontWeight: 700 }}>Sno</th>
            <th className="border-r border-black px-0.5 text-left" style={{ padding: '2px 2px', fontWeight: 700 }}>Description</th>
            <th className="border-r border-black px-0.5 text-center" style={{ padding: '2px 2px', fontWeight: 700 }}>HSN</th>
            <th className="border-r border-black px-0.5 text-center w-5" style={{ padding: '2px 2px', fontWeight: 700 }}>Qty</th>
            <th className="border-r border-black px-0.5 text-right" style={{ padding: '2px 2px', fontWeight: 700 }}>Gr.Wt<br/><span style={{ fontSize: '5px', fontWeight: 400 }}>g</span></th>
            <th className="border-r border-black px-0.5 text-right" style={{ padding: '2px 2px', fontWeight: 700 }}>Net.Wt<br/><span style={{ fontSize: '5px', fontWeight: 400 }}>g</span></th>
            <th className="border-r border-black px-0.5 text-right" style={{ padding: '2px 2px', fontWeight: 700 }}>Rate<br/><span style={{ fontSize: '5px', fontWeight: 400 }}>/g</span></th>
            <th className="border-r border-black px-0.5 text-right" style={{ padding: '2px 2px', fontWeight: 700 }}>VA</th>
            <th className="border-r border-black px-0.5 text-right" style={{ padding: '2px 2px', fontWeight: 700 }}>St.Amt</th>
            <th className="px-0.5 text-right" style={{ padding: '2px 4px', fontWeight: 700, fontSize: '8px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {completedInvoice.items && completedInvoice.items.map((i: any, x: number) => (
            <tr key={x} className="border-b border-black" style={{ height: '18px' }}>
              <td className="border-r border-black text-center" style={{ padding: '0 2px', fontSize: '7px' }}>{x + 1}</td>
              <td className="border-r border-black" style={{ padding: '1px 3px' }}>
                {/* Product name — MOST IMPORTANT, biggest in table */}
                <div style={{ fontSize: '9px', fontWeight: 800, lineHeight: 1.1 }}>{i.category}</div>
                <div style={{ fontSize: '6px', color: '#555', lineHeight: 1 }}>{i.purity} · {i.barcode}</div>
              </td>
              <td className="border-r border-black text-center" style={{ padding: '0 2px', fontSize: '7px' }}>{i.hsn_code}</td>
              <td className="border-r border-black text-center" style={{ padding: '0 2px', fontSize: '7px' }}>{i.qty || 1}</td>
              <td className="border-r border-black text-right" style={{ padding: '0 2px', fontSize: '7px' }}>{i.gross_wt}</td>
              <td className="border-r border-black text-right" style={{ padding: '0 2px', fontSize: '7px' }}>{i.net_wt}</td>
              <td className="border-r border-black text-right" style={{ padding: '0 2px', fontSize: '7px' }}>{i.rate_per_gram || (i.net_wt ? (i.metal_value / i.net_wt).toFixed(0) : '0')}</td>
              <td className="border-r border-black text-right" style={{ padding: '0 2px', fontSize: '7px' }}>{i.va_amount}</td>
              <td className="border-r border-black text-right" style={{ padding: '0 2px', fontSize: '7px' }}>{i.st_amount}</td>
              {/* Amount — MOST IMPORTANT, bold and bigger */}
              <td className="text-right" style={{ padding: '0 4px', fontSize: '10px', fontWeight: 800 }}>{(i.salePrice || (i.metal_value + i.making_charge)).toFixed(2)}</td>
            </tr>
          ))}
          {completedInvoice.exchanges && completedInvoice.exchanges.map((i: any, x: number) => (
            <tr key={`exc-${x}`} className="border-b border-black" style={{ height: '18px', fontStyle: 'italic', color: '#444' }}>
              <td className="border-r border-black text-center" style={{ padding: '0 2px', fontSize: '7px' }}>*</td>
              <td className="border-r border-black" style={{ padding: '1px 3px', fontSize: '8px', fontWeight: 700 }}>Old {i.metal} Exchange</td>
              <td className="border-r border-black text-center" style={{ padding: '0 2px', fontSize: '7px' }}>-</td>
              <td className="border-r border-black text-center" style={{ padding: '0 2px', fontSize: '7px' }}>1</td>
              <td className="border-r border-black text-right" style={{ padding: '0 2px', fontSize: '7px' }}>{i.gross_wt}</td>
              <td className="border-r border-black text-right" style={{ padding: '0 2px', fontSize: '7px' }}>-</td>
              <td className="border-r border-black text-right" style={{ padding: '0 2px', fontSize: '7px' }}>-</td>
              <td className="border-r border-black text-right" style={{ padding: '0 2px', fontSize: '7px' }}>-</td>
              <td className="border-r border-black text-right" style={{ padding: '0 2px', fontSize: '7px' }}>-</td>
              <td className="text-right" style={{ padding: '0 4px', fontSize: '10px', fontWeight: 800, color: '#c00' }}>- {i.value?.toFixed(2) || i.net_value?.toFixed(2)}</td>
            </tr>
          ))}
          {/* Fixed empty rows to always fill 6-row space */}
          {(() => {
            const filledRows = (completedInvoice.items?.length || 0) + (completedInvoice.exchanges?.length || 0)
            const emptyRows = Math.max(0, 6 - filledRows)
            return Array.from({ length: emptyRows }).map((_, i) => (
              <tr key={`empty-${i}`} className="border-b border-black" style={{ height: '18px' }}>
                <td className="border-r border-black px-0.5">&nbsp;</td>
                <td className="border-r border-black px-0.5"></td>
                <td className="border-r border-black px-0.5"></td>
                <td className="border-r border-black px-0.5"></td>
                <td className="border-r border-black px-0.5"></td>
                <td className="border-r border-black px-0.5"></td>
                <td className="border-r border-black px-0.5"></td>
                <td className="border-r border-black px-0.5"></td>
                <td className="border-r border-black px-0.5"></td>
                <td className="px-0.5"></td>
              </tr>
            ))
          })()}
        </tbody>
      </table>

      {/* Footer Section */}
      <div className="flex border-t border-black mt-auto">
        {/* Bottom Left */}
        <div className="w-[75%] border-r border-black flex flex-col">
          <div className="flex border-b border-black flex-1">
            {/* Payment info */}
            <div className="w-[50%] px-1.5 py-1 border-r border-black flex flex-col" style={{ fontSize: '7px', lineHeight: '1.3' }}>
              <p><strong>SMID :</strong> {completedInvoice.sales_person_id || ''}</p>
              <div className="mt-auto">
                <p style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #ccc', paddingBottom: '1px', marginBottom: '2px' }}>
                  PAID VIA {completedInvoice.payment_mode || 'CASH'}:
                </p>
                {completedInvoice.payment_breakdown && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {Object.entries(
                      typeof completedInvoice.payment_breakdown === 'string'
                        ? JSON.parse(completedInvoice.payment_breakdown)
                        : completedInvoice.payment_breakdown
                    ).map(([k, v]: any) => (
                      <span key={k} style={{ fontWeight: 700, fontSize: '8px' }}>{k}: {Number(v).toFixed(2)}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* T&C — intentionally tiny */}
            <div className="w-[50%] px-1.5 py-1" style={{ fontSize: '6px', lineHeight: '1.2' }}>
              <p style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '2px' }}>Terms and Conditions</p>
              <ol style={{ paddingLeft: '10px' }}>
                <li>AFTER 2 DAYS NO EXCHANGE - NO CASH REFUND</li>
                <li>VA, MAKING CHARGES AND GST MANDATORY</li>
                <li>No Guarantee For Breakage, Durability and Falling of Stones</li>
              </ol>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end px-2 pb-1" style={{ height: '30px', fontSize: '7px' }}>
            <div className="flex items-end">
              <p style={{ borderTop: '1px solid black', paddingTop: '2px' }}>Customer Sign</p>
            </div>
            <div className="text-center" style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '1px' }}>
              THANK YOU *** VISIT AGAIN
            </div>
            <div className="text-right flex flex-col justify-between items-end h-full">
              <p style={{ fontSize: '6px' }}>For SHREE MAHA GANESH JEWELLERS</p>
              <p style={{ borderTop: '1px solid black', paddingTop: '2px' }}>Authorized Sign</p>
            </div>
          </div>
        </div>

        {/* Totals — Net Total is the BIGGEST number */}
        <div className="w-[25%] flex flex-col justify-end">
          <div className="flex justify-between px-1.5 py-0.5 border-b border-black" style={{ fontSize: '7px' }}>
            <span>Discount :</span>
            <span>-{(completedInvoice.discount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between px-1.5 py-0.5 border-b border-black" style={{ fontSize: '7px' }}>
            <span>Taxable :</span>
            <span>{(completedInvoice.taxable_amount || (completedInvoice.subtotal - (completedInvoice.discount || 0))).toFixed(2)}</span>
          </div>
          <div className="flex justify-between px-1.5 py-0.5 border-b border-black" style={{ fontSize: '7px' }}>
            <span>CGST :</span>
            <span>{(completedInvoice.cgst || (completedInvoice.gst_amount / 2))?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between px-1.5 py-0.5 border-b border-black" style={{ fontSize: '7px' }}>
            <span>SGST :</span>
            <span>{(completedInvoice.sgst || (completedInvoice.gst_amount / 2))?.toFixed(2)}</span>
          </div>
          {/* Net Total — largest, boldest number in the footer */}
          <div className="flex justify-between items-center px-1.5 py-1" style={{ background: '#f0f0f0', borderTop: '1px solid black' }}>
            <span style={{ fontSize: '8px', fontWeight: 800 }}>Net Total :</span>
            <span style={{ fontSize: '12px', fontWeight: 900 }}>₹{completedInvoice.grand_total?.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )


  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center border-b border-gray-800 print:hidden">
          <h2 className="text-xl font-bold flex items-center gap-2"><Receipt size={24}/> Print Invoice</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-gray-100">
          {renderContent(true)}
        </div>

        {/* PORTALED PRINT TEMPLATE (Hidden on screen, shown on print) */}
        {createPortal(
          <div id="print-invoice" className="hidden print:block absolute top-0 left-0 w-full bg-white text-black p-0 m-0 z-[9999]">
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
