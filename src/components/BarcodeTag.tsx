import { useEffect, useState } from 'react'
import Barcode from 'react-barcode'
import { Printer, X, CheckCircle, AlertCircle, Settings2, Tag, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  item: any
  onClose: () => void
}

// ─── RAT-TAIL TAG ZPL (NORMAL TAG) ──────────────────────────────────────────────
function generateRatTailZpl(item: any, leftX: number, offsetY: number, rightX: number): string {
  const sanitize = (s: any) => String(s ?? '').replace(/[^a-zA-Z0-9 ./:_\-]/g, '').substring(0, 40)

  const catPurity = sanitize(`${item.category || ''} ${item.purity || ''}`)
  const weights   = sanitize(`GW:${item.gross_wt || 0}g SW:${item.stone_wt || 0}g NW:${item.net_wt || 0}g`)
  const huid      = item.huid ? sanitize(`HUID: ${item.huid}`) : ''
  const barcode   = sanitize(item.barcode || '000000')

  const lines = [
    '~SD25', // Set Darkness to 25
    '^XA',
    '^PR2,2,2', // Print Rate
    // --- RIGHT HALF: Shop Name, Details, Weights ---
    `^FO${rightX},${offsetY}^A0N,18,18^FDSMG Jewellers^FS`,
    `^FO${rightX},${offsetY + 22}^A0N,16,16^FD${catPurity}^FS`,
    `^FO${rightX},${offsetY + 44}^A0N,16,16^FD${weights}^FS`,
    // --- LEFT HALF: Barcode & HUID ---
    huid ? `^FO${leftX},${offsetY}^A0N,18,18^FD${huid}^FS` : '',
    // Barcode - height 20 dots, width 1
    `^FO${leftX},${offsetY + 22}^BY1^BCN,20,Y,N,N^FD${barcode}^FS`,
    '^XZ'
  ]

  return lines.filter(Boolean).join('\r\n')
}

// ─── SQUARE TAG ZPL (SHORT TAG / HALF TAG) ──────────────────────────────────
// It uses the exact same leftX and offsetY as the normal tag's left flap.
function generateSquareZpl(item: any, leftX: number, offsetY: number): string {
  const sanitize = (s: any) => String(s ?? '').replace(/[^a-zA-Z0-9 ./:_\-]/g, '').substring(0, 40)

  let vendorInitials = ''
  if (item.vendor_name) {
    const parts = item.vendor_name.trim().split(' ')
    vendorInitials = parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : item.vendor_name.substring(0, 2).toUpperCase()
  }

  const category   = sanitize(item.category || '')
  const purity     = sanitize(item.purity || '')
  const weights    = sanitize(`W:${item.gross_wt || 0}g S:${item.stone_wt || 0}g`)
  const identifier = sanitize(item.barcode || item.huid || '')

  const lines = [
    '~SD25',
    '^XA',
    '^PR2,2,2',
    // --- SHORT TAG (0.5" x 1.2" = ~100x240 dots) ---
    // Everything is packed strictly onto the left flap (leftX)
    `^FO${leftX},${offsetY}^A0N,16,16^FDSMG ${category} ${purity}^FS`,
    `^FO${leftX},${offsetY + 18}^A0N,14,14^FD${weights}^FS`,
    `^FO${leftX},${offsetY + 34}^BY1^BCN,20,Y,N,N^FD${identifier}^FS`,
    // Vertical vendor initials strictly on the far right edge of the left flap
    vendorInitials ? `^FO${leftX + 210},${offsetY + 4}^A0B,14,14^FD${vendorInitials}^FS` : '',
    '^XZ'
  ]

  return lines.filter(Boolean).join('\r\n')
}

export default function BarcodeTag({ item, onClose }: Props) {
  const [tagFormat, setTagFormat] = useState<'rat-tail' | 'square'>(
    (localStorage.getItem('zplTagFormat') as 'rat-tail' | 'square') || 'rat-tail'
  )

  const [printers, setPrinters] = useState<any[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>(localStorage.getItem('barcodePrinter') || '')
  const [status, setStatus] = useState<'idle' | 'printing' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  const [offsetX, setOffsetX] = useState(Number(localStorage.getItem('zplOffsetX') || 250))
  const [offsetY, setOffsetY] = useState(Number(localStorage.getItem('zplOffsetY') || 10))
  const legacyGap = Number(localStorage.getItem('zplGap') || 150)
  const legacyLeft = Number(localStorage.getItem('zplOffsetX') || 250)
  const [rightOffsetX, setRightOffsetX] = useState(
    Number(localStorage.getItem('zplRightOffsetX') || (legacyLeft + legacyGap))
  )

  useEffect(() => {
    localStorage.setItem('zplOffsetX', String(offsetX))
    localStorage.setItem('zplOffsetY', String(offsetY))
    localStorage.setItem('zplRightOffsetX', String(rightOffsetX))
  }, [offsetX, offsetY, rightOffsetX])

  useEffect(() => {
    localStorage.setItem('zplTagFormat', tagFormat)
  }, [tagFormat])

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
          if (def) setSelectedPrinter(def.name)
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
  }
  const handleRightOffsetXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setRightOffsetX(val)
  }
  const handleOffsetYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setOffsetY(val)
  }

  const handlePrint = async () => {
    if (!selectedPrinter) {
      setErrorMsg('No printer selected')
      setStatus('error')
      return
    }
    setStatus('printing')
    setErrorMsg('')
    try {
      const zpl = tagFormat === 'rat-tail'
        ? generateRatTailZpl(item, offsetX, offsetY, rightOffsetX)
        : generateSquareZpl(item, offsetX, offsetY)

      await (window as any).api.printZpl({ zpl, printerName: selectedPrinter })
      setStatus('done')
      setTimeout(() => onClose(), 2000)
    } catch (err: any) {
      console.error('ZPL print failed:', err)
      setErrorMsg(err?.message || 'Print failed')
      setStatus('error')
    }
  }

  if (!item) return null

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

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setTagFormat('rat-tail')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-all ${tagFormat === 'rat-tail' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Tag size={16} /> Rat-Tail Tag
          </button>
          <button
            onClick={() => setTagFormat('square')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-all ${tagFormat === 'square' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <QrCode size={16} /> Square Tag (Half)
          </button>
        </div>

        <div className="flex flex-col items-center bg-gray-100 py-6 rounded-xl border border-gray-200 overflow-hidden shadow-inner">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-6">Live Print Preview (1:1 with Printer Dots)</p>

          {tagFormat === 'rat-tail' ? (
            <div className="relative w-[400px] h-[52px] flex items-start justify-start">
              <div
                className="absolute top-0 left-0 flex items-center justify-start drop-shadow-md"
                style={{ width: '800px', height: '104px', transform: 'scale(0.5)', transformOrigin: 'top left', backgroundColor: 'transparent' }}
              >
                <div className="bg-white rounded-l-3xl border border-gray-300 shadow-sm" style={{ width: '280px', height: '104px' }} />
                <div className="bg-white rounded-r-3xl border-y border-r border-gray-300 relative shadow-sm" style={{ width: '280px', height: '104px' }}>
                  <div className="absolute left-0 top-3 bottom-3 w-[1px] border-l-[3px] border-dashed border-gray-200" />
                </div>
                <div className="bg-white border-y border-r border-gray-300 rounded-r-full shadow-sm" style={{ width: '240px', height: '24px' }} />

                <div style={{ position: 'absolute', left: offsetX, top: offsetY }}>
                  {item.huid && (
                    <div style={{ position: 'absolute', left: 0, top: 0, fontSize: 18, fontWeight: 800, fontFamily: 'sans-serif', whiteSpace: 'nowrap', color: 'black' }}>
                      HUID: {item.huid}
                    </div>
                  )}
                  <div style={{ position: 'absolute', left: 0, top: 22 }}>
                    <Barcode value={item.barcode || '000000'} width={2} height={35} fontSize={18} margin={0} displayValue={true} background="transparent" lineColor="#000000" />
                  </div>
                </div>

                <div style={{ position: 'absolute', left: rightOffsetX, top: offsetY }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, fontSize: 18, fontWeight: 800, fontFamily: 'sans-serif', whiteSpace: 'nowrap', color: 'black' }}>
                    SMG Jewellers
                  </div>
                  <div style={{ position: 'absolute', left: 0, top: 22, fontSize: 16, fontWeight: 700, fontFamily: 'sans-serif', whiteSpace: 'nowrap', textTransform: 'uppercase', color: 'black' }}>
                    {item.category} {item.purity}
                  </div>
                  <div style={{ position: 'absolute', left: 0, top: 44, fontSize: 16, fontFamily: 'sans-serif', whiteSpace: 'nowrap', color: 'black' }}>
                    GW:{item.gross_wt || 0}g SW:{item.stone_wt || 0}g NW:{item.net_wt || 0}g
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative" style={{ width: '140px', height: '140px' }}>
              <div className="bg-white border border-gray-300 shadow-sm" style={{ width: '240px', height: '100px', transform: 'scale(0.5)', transformOrigin: 'top left' }}>
                <div style={{ position: 'absolute', left: offsetX, top: offsetY }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, fontSize: '12px', fontWeight: 'bold', lineHeight: '12px', color: 'black' }}>
                    {item.category} {item.purity}
                  </div>
                  <div style={{ position: 'absolute', left: 0, top: 12, fontSize: '10px', fontWeight: 'bold', color: 'black', lineHeight: '10px' }}>
                    W:{item.gross_wt || 0}g S:{item.stone_wt || 0}g
                  </div>
                  <div style={{ position: 'absolute', left: 0, top: 22 }}>
                    <Barcode value={item.barcode || item.huid || '0000'} height={15} width={1} displayValue={true} fontSize={10} margin={0} />
                  </div>
                  {item.vendor_name && (
                    <div style={{ position: 'absolute', left: 150, top: 0, fontSize: 10, fontWeight: 'bold', fontFamily: 'sans-serif', color: 'black', transform: 'rotate(-90deg)', transformOrigin: 'top left' }}>
                      {item.vendor_name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <Settings2 size={16} />
          {showSettings ? 'Hide Printer Adjustments' : 'Adjust Print Position'}
        </button>

        {showSettings && (
          <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">

            {tagFormat === 'rat-tail' ? (
              <>
                <div>
                  <div className="flex justify-between items-center text-xs text-gray-700 font-semibold mb-2">
                    <span>LEFT HALF — BARCODE (X OFFSET)</span>
                    <span>{offsetX} dots</span>
                  </div>
                  <input
                    type="range" min="0" max="1000" step="5"
                    value={offsetX}
                    onChange={handleOffsetXChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Move the barcode side left or right independently.</p>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs text-gray-700 font-semibold mb-2">
                    <span>RIGHT HALF — TEXT (X OFFSET)</span>
                    <span>{rightOffsetX} dots</span>
                  </div>
                  <input
                    type="range" min="0" max="1000" step="5"
                    value={rightOffsetX}
                    onChange={handleRightOffsetXChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Move SMG Jewellers text side independently.</p>
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
                  <p className="text-[10px] text-gray-400 mt-1">Move the text up or down on the label.</p>
                </div>
              </>
            ) : (
              <>
                {/* Square X */}
                <div>
                  <div className="flex justify-between items-center text-xs text-gray-700 font-semibold mb-2">
                    <span>LEFT MARGIN (X OFFSET)</span>
                    <span>{offsetX} dots</span>
                  </div>
                  <input
                    type="range" min="0" max="1000" step="5"
                    value={offsetX}
                    onChange={handleOffsetXChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Move the text side left or right.</p>
                </div>
                {/* Square Y */}
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
                  <p className="text-[10px] text-gray-400 mt-1">Move the text up or down on the label.</p>
                </div>
              </>
            )}

            {/* Printer Selector */}
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
