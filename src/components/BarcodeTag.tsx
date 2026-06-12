import { useRef, useEffect, useState } from 'react'
import Barcode from 'react-barcode'
import { Printer, X } from 'lucide-react'

interface Props {
  item: any
  onClose: () => void
}

export default function BarcodeTag({ item, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const [printers, setPrinters] = useState<any[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>(localStorage.getItem('barcodePrinter') || '')

  useEffect(() => {
    if ((window as any).api) {
      ;(window as any).api.getPrinters().then((list: any[]) => {
        setPrinters(list)
        if (!selectedPrinter && list.length > 0) {
          const defaultPrinter = list.find(p => p.isDefault)?.name || list[0].name
          setSelectedPrinter(defaultPrinter)
        }
      })
    }
  }, [])

  const handlePrinterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedPrinter(val)
    localStorage.setItem('barcodePrinter', val)
  }

  if (!item) return null

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML
    if (!printContents) return

    // 2" x 1" label = 50.8mm x 25.4mm = 50800 x 25400 micrometers (Zebra ZD421 standard jewelry tag)
    const labelPageSize = { width: 50800, height: 25400 }

    const htmlContent = `
      <html>
        <head>
          <style>
            @page { size: 2in 1in; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { width: 2in; height: 1in; overflow: hidden; background: white; font-family: Arial, sans-serif; }
            .tag-wrapper { width: 2in; height: 1in; display: flex; flex-direction: column; }
            .tag-section { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2px; }
            .tag-name { font-size: 9px; font-weight: 800; }
            .tag-detail { font-size: 8px; font-weight: 700; text-transform: uppercase; }
            .tag-wt { font-size: 8px; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `
    if ((window as any).api) {
      ;(window as any).api.printHtml({
        html: htmlContent,
        printerName: selectedPrinter,
        options: {
          silent: false, // SHOW PRINT DIALOG
          printBackground: true,
          color: false,
          copies: 1,
          margins: { marginType: 'none' },
          pageSize: labelPageSize
        }
      })
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6 min-w-[320px]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center w-full">
          <h2 className="text-lg font-bold text-gray-800">Print Preview</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Preview */}
        <div ref={printRef} className="tag-wrapper" style={{ fontFamily: 'sans-serif' }}>
          {/* Barcode Side */}
          <div className="tag-section" style={{ border: '1px dashed #999', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', marginBottom: '4px' }}>
            <Barcode value={item.barcode} width={1.5} height={40} fontSize={10} margin={0} displayValue={true} />
          </div>

          {/* Details Side */}
          <div className="tag-section" style={{ border: '1px dashed #999', padding: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <span className="tag-name" style={{ fontSize: '11px', fontWeight: '800' }}>SMG Jewellers</span>
            <span className="tag-detail" style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
              {item.category} • {item.purity}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '2px' }}>
              <span className="tag-wt" style={{ fontSize: '9px' }}>
                GW: <strong>{item.gross_wt}g</strong> | NW: <strong>{item.net_wt}g</strong>
              </span>
              {item.huid && (
                <span style={{ fontSize: '9px' }}>HUID: <strong>{item.huid}</strong></span>
              )}
              {item.hsn_code && (
                <span style={{ fontSize: '9px' }}>HSN: <strong>{item.hsn_code}</strong></span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full mt-2">
          {printers.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 w-full">
              <Printer size={14} className="text-gray-400 shrink-0" />
              <select 
                value={selectedPrinter} 
                onChange={handlePrinterChange}
                className="flex-1 bg-gray-50 border border-gray-200 rounded p-1 outline-none truncate"
              >
                {printers.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg"
            >
              <Printer size={16} /> Print Tag
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
