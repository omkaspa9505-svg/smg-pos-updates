import { useRef, useEffect, useState } from 'react'
import Barcode from 'react-barcode'
import { Printer, X, CheckCircle, AlertCircle, Settings2 } from 'lucide-react'

interface Props {
  item: any
  onClose: () => void
}

// Generate ZPL for Jewelry Rat-Tail Tag
function generateZpl(item: any, offsetX: number, offsetY: number): string {
  const sanitize = (s: any) => String(s ?? '').replace(/[^a-zA-Z0-9 ./:_\-]/g, '').substring(0, 30)

  const catPurity = sanitize(`${item.category || ''} ${item.purity || ''}`)
  const weights   = sanitize(`GW:${item.gross_wt || 0}g  NW:${item.net_wt || 0}g`)
  const huid      = item.huid ? sanitize(`HUID: ${item.huid}`) : ''
  const barcode   = sanitize(item.barcode || '000000')

  // Jewelry tags are usually fed so the long axis (rat tail + printable rect) is along the printhead width (X-axis).
  // The printable rectangle is at the far end of the X-axis.
  // We use the offsetX to push the print area into the printable rectangle.
  // Height (Y-axis) is very small, so we use tiny fonts and tight spacing.
  const lines = [
    '^XA',
    // Shop Name
    `^FO${offsetX},${offsetY}^A0N,18,18^FDSMG Jewellers^FS`,
    // Category & Purity
    `^FO${offsetX},${offsetY + 22}^A0N,16,16^FD${catPurity}^FS`,
    // Weights
    `^FO${offsetX},${offsetY + 40}^A0N,16,16^FD${weights}^FS`,
    // HUID if present
    huid ? `^FO${offsetX},${offsetY + 58}^A0N,16,16^FD${huid}^FS` : '',
    // Barcode - small height (30 dots)
    `^FO${offsetX},${huid ? offsetY + 76 : offsetY + 58}^BCN,30,Y,N,N^FD${barcode}^FS`,
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
  const [showSettings, setShowSettings] = useState(false)

  // Jewelry tag offsets
  const [offsetX, setOffsetX] = useState(Number(localStorage.getItem('zplOffsetX') || 380))
  const [offsetY, setOffsetY] = useState(Number(localStorage.getItem('zplOffsetY') || 10))

  useEffect(() => {
    if ((window as any).api) {
      ;(window as any).api.getPrinters().then((list: any[]) => {
        setPrinters(list)
        const stored = localStorage.getItem('barcodePrinter')
        if (stored && list.find(p => p.name === stored)) {
          setSelectedPrinter(stored)
        } else {
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

  const handleOffsetXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setOffsetX(val)
    localStorage.setItem('zplOffsetX', String(val))
  }

  const handleOffsetYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setOffsetY(val)
    localStorage.setItem('zplOffsetY', String(val))
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
      const zpl = generateZpl(item, offsetX, offsetY)
      await (window as any).api.printZpl({ zpl, printerName: selectedPrinter })
      setStatus('done')
      setTimeout(() => onClose(), 2000)
    } catch (err: any) {
      console.error('ZPL print failed:', err)
      setErrorMsg(err?.message || 'Print failed')
      setStatus('error')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-5 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center w-full">
          <h2 className="text-xl font-bold text-gray-800">Print Jewelry Tag</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Visual Preview */}
        <div className="flex justify-center bg-gray-50 py-4 rounded-xl border border-gray-100">
          <div ref={printRef} style={{ fontFamily: 'sans-serif', width: 220, border: '1px dashed #ccc', padding: 8, backgroundColor: 'white' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
              <span style={{ fontSize: 11, fontWeight: 800 }}>SMG Jewellers</span>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                {item.category} • {item.purity}
              </span>
              <span style={{ fontSize: 9 }}>GW: <strong>{item.gross_wt}g</strong> | NW: <strong>{item.net_wt}g</strong></span>
              {item.huid && <span style={{ fontSize: 9 }}>HUID: <strong>{item.huid}</strong></span>}
              <div style={{ marginTop: 4, width: '100%' }}>
                <Barcode value={item.barcode} width={1} height={25} fontSize={9} margin={0} displayValue={true} />
              </div>
            </div>
          </div>
        </div>

        {/* Settings Toggle */}
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <Settings2 size={16} />
          {showSettings ? 'Hide Printer Adjustments' : 'Adjust Print Position'}
        </button>

        {/* Settings Panel */}
        {showSettings && (
          <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Left Margin (X Offset)</label>
                <span className="text-xs text-gray-500">{offsetX} dots</span>
              </div>
              <input 
                type="range" min="0" max="800" step="10" 
                value={offsetX} onChange={handleOffsetXChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[10px] text-gray-400 mt-1">Increase this to push the text further right onto the printable area.</p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Top Margin (Y Offset)</label>
                <span className="text-xs text-gray-500">{offsetY} dots</span>
              </div>
              <input 
                type="range" min="0" max="200" step="2" 
                value={offsetY} onChange={handleOffsetYChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[10px] text-gray-400 mt-1">Adjust this to move the text up or down on the label.</p>
            </div>

            {printers.length > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">Selected Printer</label>
                <div className="flex items-center gap-2 text-sm text-gray-600 w-full">
                  <Printer size={14} className="text-gray-400 shrink-0" />
                  <select
                    value={selectedPrinter}
                    onChange={handlePrinterChange}
                    className="flex-1 bg-white border border-gray-300 rounded p-1.5 outline-none truncate"
                  >
                    {printers.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status */}
        {status === 'done' && (
          <div className="flex items-center justify-center gap-2 text-green-600 font-medium text-sm p-2 bg-green-50 rounded-lg">
            <CheckCircle size={16} /> Sent to {selectedPrinter}
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center justify-center gap-2 text-red-500 font-medium text-sm text-center p-2 bg-red-50 rounded-lg">
            <AlertCircle size={16} /> {errorMsg || 'Print failed'}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            disabled={status === 'printing' || status === 'done'}
            className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 transition-colors"
          >
            <Printer size={18} />
            {status === 'printing' ? 'Printing...' : 'Print Tag'}
          </button>
        </div>
      </div>
    </div>
  )
}
