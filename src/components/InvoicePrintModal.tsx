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
    // The CSS in index.css handles hiding everything except the invoice
    // and removing fixed height constraints so long invoices print perfectly.
    setTimeout(() => {
      window.print();
      onClose();
    }, 100);
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        
        <div className="bg-gray-900 text-white p-5 flex justify-between items-center border-b border-gray-800 print:hidden">
          <h2 className="text-xl font-bold flex items-center gap-2"><Receipt size={24}/> Print Invoice</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-gray-100">
          {/* VISUAL PREVIEW TEMPLATE */}
          <div className="bg-white text-black p-8 shadow-xl w-full max-w-3xl min-h-[500px] h-max" style={{ fontFamily: 'Arial, sans-serif' }}>
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
                <p><span className="font-bold">Date:</span> {new Date(completedInvoice.date || completedInvoice.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <table className="w-full text-sm border-collapse border border-black mb-4">
              <thead className="bg-gray-50 border-b border-black text-xs uppercase print:bg-white">
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
                {completedInvoice.items && completedInvoice.items.map((i: any, x: number) => (
                  <tr key={x} className="border-b border-black">
                    <td className="border-r border-black py-2 px-2 text-center">{x + 1}</td>
                    <td className="border-r border-black py-2 px-2">
                      <div className="font-bold">{i.category}</div>
                      <div className="text-xs text-gray-600">{i.purity} {i.barcode}</div>
                    </td>
                    <td className="border-r border-black py-2 px-2 text-center">{i.hsn_code}</td>
                    <td className="border-r border-black py-2 px-2 text-center">{i.qty || 1}</td>
                    <td className="border-r border-black py-2 px-2 text-right">{i.gross_wt}</td>
                    <td className="border-r border-black py-2 px-2 text-right">{i.net_wt}</td>
                    <td className="border-r border-black py-2 px-2 text-right">{i.rate_per_gram || i.metal_value / (i.net_wt || 1)}</td>
                    <td className="border-r border-black py-2 px-2 text-right">{i.va_amount}</td>
                    <td className="border-r border-black py-2 px-2 text-right">{i.st_amount}</td>
                    <td className="py-2 px-2 text-right font-bold">{(i.salePrice || (i.metal_value + i.making_charge)).toFixed(2)}</td>
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
                    <td className="py-2 px-2 text-right text-red-600 font-bold">- {i.value?.toFixed(2) || i.net_value?.toFixed(2)}</td>
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
                  <span className="font-bold">{(completedInvoice.total_metal_value || completedInvoice.subtotal)?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-black">
                  <span>Discount:</span>
                  <span>{(completedInvoice.discount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-black bg-gray-50 print:bg-white">
                  <span className="font-bold">Taxable Amount:</span>
                  <span className="font-bold">{(completedInvoice.taxable_amount || (completedInvoice.subtotal - (completedInvoice.discount || 0))).toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-black">
                  <span>CGST:</span>
                  <span>{(completedInvoice.cgst || (completedInvoice.gst_amount / 2))?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-black">
                  <span>SGST:</span>
                  <span>{(completedInvoice.sgst || (completedInvoice.gst_amount / 2))?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-100 flex-1 items-center print:bg-white">
                  <span className="font-black text-lg">Net Total:</span>
                  <span className="font-black text-lg">Rs. {completedInvoice.grand_total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payments Section */}
            {completedInvoice.payment_breakdown && (
              <div className="mt-4 border border-black p-2 text-xs flex gap-4">
                <span className="font-bold">Paid By ({completedInvoice.payment_mode}):</span>
                {Object.entries(
                  typeof completedInvoice.payment_breakdown === 'string' 
                    ? JSON.parse(completedInvoice.payment_breakdown) 
                    : completedInvoice.payment_breakdown
                ).map(([k, v]: any) => (
                  <span key={k} className="bg-gray-100 px-2 rounded border print:bg-white print:border-none">{k}: {Number(v).toFixed(2)}</span>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* PORTALED PRINT TEMPLATE (Hidden on screen, shown on print) */}
        {createPortal(
          <div id="print-invoice" className="hidden print:block absolute top-0 left-0 w-full bg-white text-black p-0 m-0 z-[9999]" style={{ fontFamily: 'Arial, sans-serif' }}>
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
                <p><span className="font-bold">Date:</span> {new Date(completedInvoice.date || completedInvoice.created_at).toLocaleDateString()}</p>
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
                {completedInvoice.items && completedInvoice.items.map((i: any, x: number) => (
                  <tr key={x} className="border-b border-black">
                    <td className="border-r border-black py-2 px-2 text-center">{x + 1}</td>
                    <td className="border-r border-black py-2 px-2">
                      <div className="font-bold">{i.category}</div>
                      <div className="text-xs text-gray-600">{i.purity} {i.barcode}</div>
                    </td>
                    <td className="border-r border-black py-2 px-2 text-center">{i.hsn_code}</td>
                    <td className="border-r border-black py-2 px-2 text-center">{i.qty || 1}</td>
                    <td className="border-r border-black py-2 px-2 text-right">{i.gross_wt}</td>
                    <td className="border-r border-black py-2 px-2 text-right">{i.net_wt}</td>
                    <td className="border-r border-black py-2 px-2 text-right">{i.rate_per_gram || i.metal_value / (i.net_wt || 1)}</td>
                    <td className="border-r border-black py-2 px-2 text-right">{i.va_amount}</td>
                    <td className="border-r border-black py-2 px-2 text-right">{i.st_amount}</td>
                    <td className="py-2 px-2 text-right font-bold">{(i.salePrice || (i.metal_value + i.making_charge)).toFixed(2)}</td>
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
                    <td className="py-2 px-2 text-right text-red-600 font-bold">- {i.value?.toFixed(2) || i.net_value?.toFixed(2)}</td>
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
                  <span className="font-bold">{(completedInvoice.total_metal_value || completedInvoice.subtotal)?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-black">
                  <span>Discount:</span>
                  <span>{(completedInvoice.discount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-black bg-gray-50 print:bg-white">
                  <span className="font-bold">Taxable Amount:</span>
                  <span className="font-bold">{(completedInvoice.taxable_amount || (completedInvoice.subtotal - (completedInvoice.discount || 0))).toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-black">
                  <span>CGST:</span>
                  <span>{(completedInvoice.cgst || (completedInvoice.gst_amount / 2))?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-black">
                  <span>SGST:</span>
                  <span>{(completedInvoice.sgst || (completedInvoice.gst_amount / 2))?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-100 flex-1 items-center print:bg-white">
                  <span className="font-black text-lg">Net Total:</span>
                  <span className="font-black text-lg">Rs. {completedInvoice.grand_total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payments Section */}
            {completedInvoice.payment_breakdown && (
              <div className="mt-4 border border-black p-2 text-xs flex gap-4">
                <span className="font-bold">Paid By ({completedInvoice.payment_mode}):</span>
                {Object.entries(
                  typeof completedInvoice.payment_breakdown === 'string' 
                    ? JSON.parse(completedInvoice.payment_breakdown) 
                    : completedInvoice.payment_breakdown
                ).map(([k, v]: any) => (
                  <span key={k} className="bg-gray-100 px-2 rounded border print:bg-white print:border-none">{k}: {Number(v).toFixed(2)}</span>
                ))}
              </div>
            )}
          </div>,
          document.body
        )}
        
        <div className="bg-gray-50 p-5 border-t flex flex-col gap-3 print:hidden">
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
          <div className="flex justify-end gap-4 mt-2">
            <button 
              onClick={onClose} 
              className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            <button 
              onClick={handlePrint} 
              className="px-8 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
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
