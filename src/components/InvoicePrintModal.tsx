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
    <div className={`bg-white text-black border border-black flex flex-col text-[10px] ${isPreview ? 'w-[210mm] min-h-[148mm] h-max shadow-xl' : 'w-full h-full'}`} style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header row */}
      <div className="flex border-b border-black">
        {/* Left Customer Info */}
        <div className="w-[30%] p-1 border-r border-black leading-none flex flex-col justify-center text-[9px]">
          <p><span className="font-bold">Name :</span> {completedInvoice.customer_name || ''}</p>
          <p className="mt-0.5"><span className="font-bold">Phone :</span> {completedInvoice.customer_mobile || ''}</p>
          <p className="mt-0.5"><span className="font-bold">Address :</span> {completedInvoice.customer_address || ''}</p>
          <p className="mt-0.5"><span className="font-bold">GST :</span> {completedInvoice.customer_gst || ''}</p>
        </div>
        
        {/* Center Shop Info */}
        <div className="w-[45%] p-1 text-center flex flex-col justify-center items-center relative">
          <h1 className="text-lg font-black tracking-tight uppercase leading-none">SHREE MAHA GANESH JEWELLERS</h1>
          <p className="text-[8px] mt-0.5 leading-none">Shop No. 4 & 5, Sindhu Nilayam, Sri Ram Nagar Colony, Gangaram, Chandanagar, Hyderabad-50. TG.</p>
          <p className="text-[8px] font-bold mt-0.5 leading-none">📞 8008666199  📞 9014659444</p>
        </div>
        
        {/* Right Invoice Info */}
        <div className="w-[25%] p-1 border-l border-black text-right leading-none flex flex-col justify-center text-[9px]">
          <p><span className="font-bold">Date :</span> {new Date(completedInvoice.date || completedInvoice.created_at).toLocaleDateString()}</p>
          <p className="mt-0.5"><span className="font-bold">Invoice No :</span> {completedInvoice.invoice_number}</p>
          <p className="mt-0.5"><span className="font-bold">GSTIN :</span> 36AETFS3971D1ZK</p>
        </div>
      </div>
      
      {/* GST INVOICE Title */}
      <div className="text-center font-bold uppercase tracking-widest text-[9px] py-0.5 border-b border-black bg-gray-50 print:bg-white leading-none">
        GST - INVOICE
      </div>
      
      {/* Table */}
      <table className="w-full text-[8px] border-collapse leading-none">
        <thead className="border-b border-black bg-gray-50 print:bg-white">
          <tr>
            <th className="border-r border-black py-0.5 px-0.5 text-center w-6">Sno</th>
            <th className="border-r border-black py-0.5 px-0.5 text-left">Description</th>
            <th className="border-r border-black py-0.5 px-0.5 text-center">HSN Code</th>
            <th className="border-r border-black py-0.5 px-0.5 text-center w-6">Qty</th>
            <th className="border-r border-black py-0.5 px-0.5 text-right">Gross Wt.<br/><span className="text-[6px] font-normal">Grams</span></th>
            <th className="border-r border-black py-0.5 px-0.5 text-right">Net Wt.<br/><span className="text-[6px] font-normal">Grams</span></th>
            <th className="border-r border-black py-0.5 px-0.5 text-right">Rate<br/><span className="text-[6px] font-normal">/Gram</span></th>
            <th className="border-r border-black py-0.5 px-0.5 text-right">VA</th>
            <th className="border-r border-black py-0.5 px-0.5 text-right">St. Amt.</th>
            <th className="py-0.5 px-0.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {completedInvoice.items && completedInvoice.items.map((i: any, x: number) => (
            <tr key={x} className="border-b border-black">
              <td className="border-r border-black py-1 px-0.5 text-center">{x + 1}</td>
              <td className="border-r border-black py-1 px-0.5">
                <div className="font-bold">{i.category}</div>
                <div className="text-[6px] text-gray-600">{i.purity} {i.barcode}</div>
              </td>
              <td className="border-r border-black py-1 px-0.5 text-center">{i.hsn_code}</td>
              <td className="border-r border-black py-1 px-0.5 text-center">{i.qty || 1}</td>
              <td className="border-r border-black py-1 px-0.5 text-right">{i.gross_wt}</td>
              <td className="border-r border-black py-1 px-0.5 text-right">{i.net_wt}</td>
              <td className="border-r border-black py-1 px-0.5 text-right">{i.rate_per_gram || (i.net_wt ? (i.metal_value / i.net_wt).toFixed(2) : '0.00')}</td>
              <td className="border-r border-black py-1 px-0.5 text-right">{i.va_amount}</td>
              <td className="border-r border-black py-1 px-0.5 text-right">{i.st_amount}</td>
              <td className="py-1 px-0.5 text-right font-bold">{(i.salePrice || (i.metal_value + i.making_charge)).toFixed(2)}</td>
            </tr>
          ))}
          {completedInvoice.exchanges && completedInvoice.exchanges.map((i: any, x: number) => (
            <tr key={`exc-${x}`} className="border-b border-black italic text-gray-700">
              <td className="border-r border-black py-1 px-0.5 text-center">*</td>
              <td className="border-r border-black py-1 px-0.5">Old {i.metal} Exchange</td>
              <td className="border-r border-black py-1 px-0.5 text-center">-</td>
              <td className="border-r border-black py-1 px-0.5 text-center">1</td>
              <td className="border-r border-black py-1 px-0.5 text-right">{i.gross_wt}</td>
              <td className="border-r border-black py-1 px-0.5 text-right">-</td>
              <td className="border-r border-black py-1 px-0.5 text-right">-</td>
              <td className="border-r border-black py-1 px-0.5 text-right">-</td>
              <td className="border-r border-black py-1 px-0.5 text-right">-</td>
              <td className="py-1 px-0.5 text-right text-red-600 font-bold">- {i.value?.toFixed(2) || i.net_value?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Empty space filler to push footer down */}
      <div className="flex-1 min-h-[20px]"></div>

      {/* Footer Section */}
      <div className="flex border-t border-black mt-auto">
        {/* Bottom Left Grid */}
        <div className="w-[75%] border-r border-black flex flex-col">
          <div className="flex border-b border-black flex-1">
            <div className="w-[50%] p-1 border-r border-black text-[8px] leading-tight flex flex-col">
              <p><span className="font-bold">SMID :</span> {completedInvoice.sales_person_id || ''}</p>
              <p className="mt-0.5 uppercase">IN WORDS : <span className="font-bold"></span></p>
              
              {/* Payment Info */}
              <div className="mt-auto pt-1">
                <p className="font-bold uppercase text-[9px] border-b border-gray-300 print:border-none mb-0.5 pb-0.5">
                  PAID VIA {completedInvoice.payment_mode || 'CASH'}:
                </p>
                {completedInvoice.payment_breakdown && (
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    {Object.entries(
                      typeof completedInvoice.payment_breakdown === 'string' 
                        ? JSON.parse(completedInvoice.payment_breakdown) 
                        : completedInvoice.payment_breakdown
                    ).map(([k, v]: any) => (
                      <span key={k} className="font-bold">{k}: {Number(v).toFixed(2)}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="w-[50%] p-1 text-[7px] leading-none">
              <p className="font-bold underline mb-0.5">Terms and Conditions</p>
              <ol className="list-decimal pl-3 space-y-0.5">
                <li>AFTER 2 DAYS NO EXCHANGE - NO CASH REFUND</li>
                <li>VA, MAKING CHARGES AND GST MANDATORY</li>
                <li>No Guarantee For Breakage, Durability and Falling of Stones</li>
              </ol>
            </div>
          </div>
          
          {/* Signatures */}
          <div className="flex justify-between items-end p-1 pb-1 mt-auto text-[8px] h-[35px]">
            <div className="w-1/3 flex items-end">
              <div>
                <p className="border-t border-black pt-0.5 inline-block">Customer Sign</p>
              </div>
            </div>
            <div className="w-1/3 text-center font-bold tracking-widest text-[9px] mb-0.5">
              THANK YOU *** VISIT AGAIN
            </div>
            <div className="w-1/3 text-right flex flex-col justify-between items-end h-full">
              <p className="text-[6px]">For SHREE MAHA GANESH JEWELLERS</p>
              <p className="border-t border-black pt-0.5 inline-block mt-auto">Authorized Sign</p>
            </div>
          </div>
        </div>
        
        {/* Bottom Right - Totals */}
        <div className="w-[25%] text-[8px] flex flex-col justify-end leading-none">
          <div className="flex justify-between p-1 border-b border-black">
            <span>Discount :</span>
            <span>-{(completedInvoice.discount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between p-1 border-b border-black bg-gray-50 print:bg-white">
            <span>Taxable :</span>
            <span>{(completedInvoice.taxable_amount || (completedInvoice.subtotal - (completedInvoice.discount || 0))).toFixed(2)}</span>
          </div>
          <div className="flex justify-between p-1 border-b border-black">
            <span>CGST :</span>
            <span>{(completedInvoice.cgst || (completedInvoice.gst_amount / 2))?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between p-1 border-b border-black">
            <span>SGST :</span>
            <span>{(completedInvoice.sgst || (completedInvoice.gst_amount / 2))?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between p-1 bg-gray-100 print:bg-gray-200">
            <span className="font-bold">Net Total :</span>
            <span className="font-bold text-[10px]">{completedInvoice.grand_total?.toFixed(2)}</span>
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
