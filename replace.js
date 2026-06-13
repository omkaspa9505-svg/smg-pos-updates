const fs = require('fs');
const content = fs.readFileSync('src/components/InvoicePrintModal.tsx', 'utf8');

const replacement = `{/* VISUAL PREVIEW TEMPLATE - EXACT MATCH TO POS5.PDF */}
          <div className="bg-white text-black p-4 w-[210mm] min-h-[148mm] flex flex-col text-[12px] shadow-xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <div className="text-center mb-2">
              <h1 className="text-2xl font-black tracking-wide">SHREE MAHA GANESH JEWELLERS</h1>
              <p className="text-[11px] mt-1">Shop No: 4 & 5, Sindhu Nilayam, Sri Ram Nagar Colony, Gangaram, Chandanagar, Hyderabad-50, TG.</p>
              <p className="text-[12px] font-bold mt-1">GSTIN: 36AETFS3971D1ZK</p>
            </div>
            
            <div className="flex justify-center mb-2">
              <div className="border border-black px-4 py-1 font-bold text-sm tracking-wider">
                GST - INVOICE
              </div>
            </div>
            
            {/* Customer & Invoice Info */}
            <div className="border border-black flex justify-between p-2 mb-2">
              <div className="w-1/2 flex flex-col justify-center">
                <p><span className="font-bold">Customer Name:</span> {completedInvoice.customer_name || 'Walk-in'}</p>
              </div>
              <div className="w-1/2 flex flex-col items-end justify-center">
                <p><span className="font-bold">Invoice No:</span> {completedInvoice.invoice_number}</p>
                <p><span className="font-bold">Date:</span> {new Date(completedInvoice.date || completedInvoice.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            {/* Table */}
            <table className="w-full text-[11px] border-collapse mb-2">
              <thead>
                <tr className="border border-black">
                  <th className="border-r border-black p-1 text-center">S.NO</th>
                  <th className="border-r border-black p-1 text-left">DESCRIPTION</th>
                  <th className="border-r border-black p-1 text-center">HSN</th>
                  <th className="border-r border-black p-1 text-center">QTY</th>
                  <th className="border-r border-black p-1 text-right">GR. WT</th>
                  <th className="border-r border-black p-1 text-right">NT. WT</th>
                  <th className="border-r border-black p-1 text-right">RATE/G</th>
                  <th className="border-r border-black p-1 text-right">VA</th>
                  <th className="border-r border-black p-1 text-right">ST.AMT</th>
                  <th className="p-1 text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {completedInvoice.items && completedInvoice.items.map((i: any, x: number) => (
                  <tr key={x} className="border-x border-b border-black">
                    <td className="border-r border-black p-1 text-center align-top">{x+1}</td>
                    <td className="border-r border-black p-1 align-top">
                      <div className="font-bold">{i.category}</div>
                      <div className="text-gray-600 text-[10px]">{i.purity} {i.barcode}</div>
                    </td>
                    <td className="border-r border-black p-1 text-center align-top">{i.hsn_code}</td>
                    <td className="border-r border-black p-1 text-center align-top">{i.qty || 1}</td>
                    <td className="border-r border-black p-1 text-right align-top">{i.gross_wt}</td>
                    <td className="border-r border-black p-1 text-right align-top">{i.net_wt}</td>
                    <td className="border-r border-black p-1 text-right align-top">{i.rate_per_gram || (i.metal_value / (i.net_wt || 1)).toFixed(2)}</td>
                    <td className="border-r border-black p-1 text-right align-top">{i.va_amount}</td>
                    <td className="border-r border-black p-1 text-right align-top">{i.st_amount}</td>
                    <td className="p-1 text-right align-top font-bold">{(i.salePrice || (i.metal_value + i.making_charge)).toFixed(2)}</td>
                  </tr>
                ))}
                {completedInvoice.exchanges && completedInvoice.exchanges.map((i: any, x: number) => (
                  <tr key={\`exc-\${x}\`} className="border-x border-b border-black italic text-gray-700">
                    <td className="border-r border-black p-1 text-center align-top">*</td>
                    <td className="border-r border-black p-1 align-top">Old {i.metal} Exchange</td>
                    <td className="border-r border-black p-1 text-center align-top">-</td>
                    <td className="border-r border-black p-1 text-center align-top">1</td>
                    <td className="border-r border-black p-1 text-right align-top">{i.gross_wt}</td>
                    <td className="border-r border-black p-1 text-right align-top">-</td>
                    <td className="border-r border-black p-1 text-right align-top">-</td>
                    <td className="border-r border-black p-1 text-right align-top">-</td>
                    <td className="border-r border-black p-1 text-right align-top">-</td>
                    <td className="p-1 text-right align-top text-red-600 font-bold">- {i.value?.toFixed(2) || i.net_value?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer */}
            <div className="flex gap-2">
              {/* Left - Terms */}
              <div className="w-[65%] border border-black p-2 flex flex-col justify-between">
                <div>
                  <p className="font-bold underline mb-1">Terms & Conditions:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-[10px]">
                    <li>After 2 days no exchange.</li>
                    <li>VA, MAKING CHARGES AND GST MANDATORY.</li>
                    <li>No Guarantee for Polish & Stone.</li>
                    <li>Subject to local jurisdiction only.</li>
                  </ol>
                </div>
                <div className="flex justify-between mt-10 text-[10px]">
                  <div className="border-t border-black pt-1 w-32 text-center">Customer Sign</div>
                  <div className="border-t border-black pt-1 w-32 text-center">Authorised Sign</div>
                </div>
              </div>
              
              {/* Right - Totals */}
              <div className="w-[35%] flex flex-col">
                <div className="border border-black mb-1">
                   <div className="flex justify-between p-1.5 border-b border-black">
                     <span>Total Amount:</span>
                     <span className="font-bold">{completedInvoice.subtotal?.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between p-1.5 border-b border-black">
                     <span>Discount:</span>
                     <span>{(completedInvoice.discount || 0).toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between p-1.5 border-b border-black font-bold">
                     <span>Taxable Amount:</span>
                     <span>{(completedInvoice.taxable_amount || (completedInvoice.subtotal - (completedInvoice.discount || 0)))?.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between p-1.5 border-b border-black">
                     <span>CGST:</span>
                     <span>{(completedInvoice.cgst || (completedInvoice.gst_amount / 2))?.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between p-1.5 border-b border-black">
                     <span>SGST:</span>
                     <span>{(completedInvoice.sgst || (completedInvoice.gst_amount / 2))?.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between p-1.5 text-[14px] font-black">
                     <span>Net Total:</span>
                     <span>Rs. {completedInvoice.grand_total?.toFixed(2)}</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Payment info block */}
            {completedInvoice.payment_breakdown && (
              <div className="border border-black p-1.5 mt-1 flex text-[11px]">
                <span className="font-bold mr-4">Paid By (Cash, UPI):</span>
                {Object.entries(completedInvoice.payment_breakdown).map(([method, amt]) => (
                   (amt as number) > 0 ? <span key={method} className="mr-4 capitalize">{method}: {(amt as number).toFixed(2)}</span> : null
                ))}
              </div>
            )}
          </div>`;

const startIndex = content.indexOf('{/* VISUAL PREVIEW TEMPLATE');
const endDiv = '</div>\n            )}\n          </div>,';
const finalEndIndex = content.indexOf(endDiv, startIndex);

if (startIndex === -1 || finalEndIndex === -1) {
  console.log('Error: Could not find template bounds');
  process.exit(1);
}

const newContent = content.substring(0, startIndex) + replacement + content.substring(finalEndIndex);
fs.writeFileSync('src/components/InvoicePrintModal.tsx', newContent);
console.log('Successfully replaced visual template');
