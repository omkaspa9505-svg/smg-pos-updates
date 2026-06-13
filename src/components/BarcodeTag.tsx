import { useEffect, useState } from 'react'
import Barcode from 'react-barcode'
import { Printer, X, CheckCircle, AlertCircle, Settings2, Tag, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  item: any
  onClose: () => void
}

// Generate ZPL for Jewelry Rat-Tail Tag (Split into two halves)
function generateRatTailZpl(item: any, offsetX: number, offsetY: number, gap: number): string {
  const sanitize = (s: any) => String(s ?? '').replace(/[^a-zA-Z0-9 ./:_\-]/g, '').substring(0, 40)

  const catPurity = sanitize(`${item.category || ''} ${item.purity || ''}`)
  const weights   = sanitize(`GW:${item.gross_wt || 0}g SW:${item.stone_wt || 0}g NW:${item.net_wt || 0}g`)
  const huid      = item.huid ? sanitize(`HUID: ${item.huid}`) : ''
  const barcode   = sanitize(item.barcode || '000000')

  const leftX = offsetX
  const rightX = offsetX + gap

  const lines = [
    '~SD25',
    '^XA',
    '^PR2,2,2',
    `^FO${rightX},${offsetY}^A0N,18,18^FDSMG Jewellers^FS`,
    `^FO${rightX},${offsetY + 22}^A0N,16,16^FD${catPurity}^FS`,
    `^FO${rightX},${offsetY + 44}^A0N,16,16^FD${weights}^FS`,
    huid ? `^FO${leftX},${offsetY}^A0N,18,18^FD${huid}^FS` : '',
    `^FO${leftX},${offsetY + 22}^BCN,35,Y,N,N^FD${barcode}^FS`,
    '^XZ'
  ]

  return lines.filter(Boolean).join('\r\n')
}

// Generate ZPL for Square Tag (Half Tag with QR Code)
function generateSquareZpl(item: any, offsetX: number, offsetY: number): string {
  const sanitize = (s: any) => String(s ?? '').replace(/[^a-zA-Z0-9 ./:_\-]/g, '').substring(0, 40)
  
  let vendorInitials = '';
  if (item.vendor_name) {
    const parts = item.vendor_name.trim().split(' ');
    vendorInitials = parts.length > 1 
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : item.vendor_name.substring(0, 2).toUpperCase();
  } else {
    vendorInitials = 'BS';
  }

  const category = sanitize(item.category || '');
  const purity = sanitize(item.purity || '');
  const grossWt = sanitize(`W: ${item.gross_wt || 0}`);
  const identifier = sanitize(item.barcode || item.huid || '');

  const lines = [
    '~SD25',
    '^XA',
    '^PR2,2,2',
    `^FO${offsetX},${offsetY}^A0N,22,22^FDSMG^FS`,
    `^FO${offsetX + 80},${offsetY}^A0N,22,22^FD${category}^FS`,
    `^FO${offsetX},${offsetY + 26}^A0N,22,22^FD${vendorInitials}^FS`,
    `^FO${offsetX + 80},${offsetY + 26}^A0N,22,22^FD${purity}^FS`,
    `^FO${offsetX + 80},${offsetY + 52}^A0N,22,22^FD${grossWt}^FS`,
    `^FO${offsetX + 80},${offsetY + 78}^A0N,22,22^FD${identifier}^FS`,
    `^FO${offsetX},${offsetY + 52}^BQN,2,4^FDQA,${identifier}^FS`,
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

  // Offsets (use v2 keys to reset old weird settings)
  const [offsetX, setOffsetX] = useState(Number(localStorage.getItem(`zplOffsetX_v2_${tagFormat}`) || 20))
  const [offsetY, setOffsetY] = useState(Number(localStorage.getItem(`zplOffsetY_v2_${tagFormat}`) || 10))
  const [gap, setGap] = useState(Number(localStorage.getItem('zplGap_v2_rat-tail') || 320))

  // Update localStorage when format changes so it remembers
  useEffect(() => {
    localStorage.setItem('zplTagFormat', tagFormat)
    setOffsetX(Number(localStorage.getItem(`zplOffsetX_v2_${tagFormat}`) || 20))
    setOffsetY(Number(localStorage.getItem(`zplOffsetY_v2_${tagFormat}`) || 10))
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
        ? generateRatTailZpl(item, offsetX, offsetY, gap)
        : generateSquareZpl(item, offsetX, offsetY);

      await (window as any).api.printZpl({ zpl, printerName: selectedPrinter })
      setStatus('done')
      setTimeout(() => onClose(), 2000)
    } catch (err: any) {
      console.error('ZPL print failed:', err)
      setErrorMsg(err?.message || 'Print failed')
      setStatus('error')
    }
  }

  const updateOffset = (key: 'X' | 'Y' | 'Gap', val: number) => {
    if (key === 'X') {
      setOffsetX(val)
      localStorage.setItem(`zplOffsetX_v2_${tagFormat}`, String(val))
    } else if (key === 'Y') {
      setOffsetY(val)
      localStorage.setItem(`zplOffsetY_v2_${tagFormat}`, String(val))
    } else if (key === 'Gap') {
      setGap(val)
      localStorage.setItem('zplGap_v2_rat-tail', String(val))
    }
  }

  let vendorInitials = 'BS';
  if (item.vendor_name) {
    const parts = item.vendor_name.trim().split(' ');
    vendorInitials = parts.length > 1 
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : item.vendor_name.substring(0, 2).toUpperCase();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-5 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        
        <div className="flex justify-between items-center w-full">
          <h2 className="text-xl font-bold text-gray-800">Print Jewelry Tag</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Tag Format Toggle */}
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

        {/* Visual Preview */}
        <div className="flex flex-col items-center bg-gray-100 py-6 rounded-xl border border-gray-200 overflow-hidden shadow-inner">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-6">Live Print Preview (1:1 with Printer Dots)</p>
          
          <div className="relative flex items-start justify-center w-full min-h-[100px]">
            {tagFormat === 'rat-tail' ? (
              // RAT TAIL PREVIEW
              <div className="relative w-[400px] h-[52px]">
                <div className="absolute top-0 left-0" style={{ width: '800px', height: '104px', transform: 'scale(0.5)', transformOrigin: 'top left' }}>
                  <div className="flex h-full">
                    <div className="bg-white rounded-l-3xl border border-gray-300 shadow-sm" style={{ width: '280px' }} />
                    <div className="bg-white rounded-r-3xl border-y border-r border-gray-300 relative shadow-sm" style={{ width: '280px' }}>
                      <div className="absolute left-0 top-3 bottom-3 border-l-2 border-dashed border-gray-200" />
                    </div>
                    <div className="bg-white border-y border-r border-gray-300 rounded-r-full shadow-sm" style={{ width: '240px', height: '24px' }} />
                  </div>

                  <div style={{ position: 'absolute', left: offsetX, top: offsetY }}>
                    {item.huid && <div style={{ fontSize: 18, fontWeight: 800, color: 'black' }}>HUID: {item.huid}</div>}
                    <div style={{ marginTop: item.huid ? '0' : '22px' }}>
                      <Barcode value={item.barcode || '000000'} width={2} height={35} fontSize={18} margin={0} displayValue={true} background="transparent" lineColor="#000000" />
                    </div>
                  </div>

                  <div style={{ position: 'absolute', left: offsetX + gap, top: offsetY }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'black' }}>SMG Jewellers</div>
                    <div style={{ fontSize: 16, fontWeight: 700, textTransform: 'uppercase', color: 'black' }}>{item.category} {item.purity}</div>
                    <div style={{ fontSize: 16, color: 'black' }}>GW:{item.gross_wt || 0}g SW:{item.stone_wt || 0}g NW:{item.net_wt || 0}g</div>
                  </div>
                </div>
              </div>
            ) : (
              // SQUARE TAG PREVIEW
              <div className="relative" style={{ width: '200px', height: '150px' }}>
                <div className="absolute top-0 left-0 bg-white border border-gray-300 shadow-sm rounded-lg flex flex-col p-4" 
                     style={{ width: '400px', height: '300px', transform: 'scale(0.5)', transformOrigin: 'top left' }}>
                  <div style={{ position: 'absolute', left: offsetX, top: offsetY, width: '100%', height: '100%'}}>
                    <div className="flex gap-16">
                      <div className="flex flex-col gap-2 font-bold text-[28px]">
                        <span>SMG</span>
                        <span>{vendorInitials}</span>
                      </div>
                      <div className="flex flex-col gap-2 text-[26px] font-semibold leading-snug">
                        <span>{item.category}</span>
                        <span>{item.purity}</span>
                        <span className="mt-2 text-[22px]">W: {item.gross_wt || 0}</span>
                        <span className="text-[22px] tracking-wide">{item.barcode || item.huid}</span>
                      </div>
                    </div>
                    <div style={{ position: 'absolute', left: 0, top: 110 }}>
                      <QRCodeSVG value={item.barcode || item.huid || '000000'} size={120} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Toggle */}
        <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-2 text-sm text-blue-600 font-medium mt-4">
          <Settings2 size={16} /> {showSettings ? 'Hide Printer Adjustments' : 'Adjust Print Position'}
        </button>

        {/* Settings Panel */}
        {showSettings && (
          <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 mt-2">
            <div>
              <div className="flex justify-between mb-2 text-xs font-semibold"><span>LEFT MARGIN (X OFFSET)</span><span>{offsetX} dots</span></div>
              <input type="range" min="0" max="400" step="5" value={offsetX} onChange={e => updateOffset('X', Number(e.target.value))} className="w-full" />
            </div>

            {tagFormat === 'rat-tail' && (
              <div>
                <div className="flex justify-between mb-2 text-xs font-semibold"><span>GAP BETWEEN HALVES</span><span>{gap} dots</span></div>
                <input type="range" min="50" max="600" step="5" value={gap} onChange={e => updateOffset('Gap', Number(e.target.value))} className="w-full" />
              </div>
            )}

            <div>
              <div className="flex justify-between mb-2 text-xs font-semibold"><span>TOP MARGIN (Y OFFSET)</span><span>{offsetY} dots</span></div>
              <input type="range" min="0" max="200" step="2" value={offsetY} onChange={e => updateOffset('Y', Number(e.target.value))} className="w-full" />
            </div>

            {printers.length > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <label className="text-xs font-semibold block mb-1">Selected Printer</label>
                <select value={selectedPrinter} onChange={e => { setSelectedPrinter(e.target.value); localStorage.setItem('barcodePrinter', e.target.value) }} className="w-full border p-1.5 rounded text-sm">
                  {printers.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {status === 'done' && <div className="text-green-600 font-medium text-sm p-2 bg-green-50 rounded-lg text-center mt-2"><CheckCircle className="inline mr-1" size={16} /> Sent to {selectedPrinter}</div>}
        {status === 'error' && <div className="text-red-500 font-medium text-sm p-2 bg-red-50 rounded-lg text-center mt-2"><AlertCircle className="inline mr-1" size={16} /> {errorMsg}</div>}

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-3 border rounded-xl font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handlePrint} disabled={status === 'printing' || status === 'done'} className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-black disabled:opacity-50">
            <Printer size={18} /> {status === 'printing' ? 'Printing...' : 'Print Tag'}
          </button>
        </div>
      </div>
    </div>
  )
}
