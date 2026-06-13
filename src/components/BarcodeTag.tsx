import { useRef, useEffect, useState } from 'react'
import Barcode from 'react-barcode'
import { Printer, X, CheckCircle, AlertCircle } from 'lucide-react'

interface Props {
  item: any
  onClose: () => void
}

// Generate ZPL - no hardcoded PW/LL, printer uses its own calibrated label size
function generateZpl(item: any): string {
  const sanitize = (s: any) => String(s ?? '').replace(/[^a-zA-Z0-9 ./:_\-]/g, '').substring(0, 30)

  const catPurity = sanitize(`${item.category || ''} ${item.purity || ''}`)
  const weights   = sanitize(`GW:${item.gross_wt || 0}g  NW:${item.net_wt || 0}g`)
  const huid      = item.huid ? sanitize(`HUID: ${item.huid}`) : ''
  const barcode   = sanitize(item.barcode || '000000')

  // No ^PW / ^LL — let the ZDesigner driver use its own label size calibration
  const lines = [
    '^XA',
    '^CF0,20',                                      // default font size 20
    '^FO10,10^CF0,22^FDSMG Jewellers^FS',          // shop name
    `^FO10,36^CF0,18^FD${catPurity}^FS`,           // category + purity
    `^FO10,58^CF0,16^FD${weights}^FS`,             // weights
    huid ? `^FO10,78^CF0,14^FD${huid}^FS` : '',   // HUID if present
    `^FO10,${huid ? 96 : 80}^BCN,55,Y,N,N^FD${barcode}^FS`, // barcode
    '^XZ'
  ]

  return lines.filter(Boolean).join('\r\n')
}

export default function BarcodeTag({ item, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const [printers, setPrinters] = useState<any[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>(localStorage.getItem('barcodePrinter') || '')
  const [status, setStatus] = useState<'idle' | 'printing' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if ((window as any).api) {
      ;(window as any).api.getPrinters().then((list: any[]) => {
        setPrinters(list)
        // Try to auto-select the Zebra printer
        const stored = localStorage.getItem('barcodePrinter')
        if (stored && list.find(p => p.name === stored)) {
          setSelectedPrinter(stored)
        } else {
          // Zebra printers show as "ZDesigner ..." with official driver
          const zebra = list.find(p => 
            p.name.toLowerCase().includes('zebra') || 
            p.name.toLowerCase().includes('zdesigner') ||
            p.name.toLowerCase().includes('zd') ||
            p.name.toLowerCase().includes('zt')
          )
          const def = zebra || list.find(p => p.isDefault) || list[0]
          if (def) {
            setSelectedPrinter(def.name)
          }
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

  const handlePrint = async () => {
    if (!selectedPrinter) {
      setErrorMsg('No printer selected')
      setStatus('error')
      return
    }

    setStatus('printing')
    setErrorMsg('')

    try {
      const zpl = generateZpl(item)
      await (window as any).api.printZpl({ zpl, printerName: selectedPrinter })
      setStatus('done')
      setTimeout(() => onClose(), 2000)
    } catch (err: any) {
      console.error('ZPL print failed:', err)
      // Show the raw error message so we can diagnose
      setErrorMsg(err?.message || 'Print failed')
      setStatus('error')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-5 min-w-[320px]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center w-full">
          <h2 className="text-lg font-bold text-gray-800">Print Barcode Tag</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Preview */}
        <div ref={printRef} style={{ fontFamily: 'sans-serif', width: 192, border: '1px dashed #ccc', padding: 6 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800 }}>SMG Jewellers</span>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
              {item.category} • {item.purity}
            </span>
            <span style={{ fontSize: 9 }}>GW: <strong>{item.gross_wt}g</strong> | NW: <strong>{item.net_wt}g</strong></span>
            {item.huid && <span style={{ fontSize: 9 }}>HUID: <strong>{item.huid}</strong></span>}
            <div style={{ marginTop: 4 }}>
              <Barcode value={item.barcode} width={1.2} height={40} fontSize={9} margin={0} displayValue={true} />
            </div>
          </div>
        </div>

        {/* Status */}
        {status === 'done' && (
          <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
            <CheckCircle size={16} /> Sent to Zebra printer!
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-500 font-medium text-sm text-center">
            <AlertCircle size={16} /> {errorMsg || 'Print failed. Check printer name.'}
          </div>
        )}

        {/* Printer Selector */}
        {printers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 w-full">
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
            disabled={status === 'printing' || status === 'done'}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
          >
            <Printer size={16} />
            {status === 'printing' ? 'Printing...' : 'Print Tag'}
          </button>
        </div>
      </div>
    </div>
  )
}
