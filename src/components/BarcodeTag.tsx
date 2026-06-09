import Barcode from 'react-barcode'

export default function BarcodeTag({ item, forwardRef }: { item: any, forwardRef?: any }) {
  if (!item) return null

  return (
    <div ref={forwardRef} className="print-only hidden print:flex print:flex-col items-center justify-center p-2 bg-white" style={{ width: '2in', height: '1in', margin: 0 }}>
      {/* Front Side: Barcode */}
      <div className="flex flex-col items-center justify-center border border-dashed border-gray-400 p-1 w-full" style={{ height: '0.45in', pageBreakAfter: 'always' }}>
        <Barcode value={item.barcode} width={1.5} height={30} fontSize={10} margin={0} displayValue={true} />
      </div>

      {/* Back Side: Details */}
      <div className="flex flex-col items-center justify-center border border-dashed border-gray-400 p-1 w-full mt-2 text-center" style={{ height: '0.45in' }}>
        <span className="font-bold text-xs">SMG Jewellers</span>
        <span className="text-[10px] uppercase font-bold">{item.category} • {item.purity}</span>
        <span className="text-[10px]">Net Wt: <span className="font-bold">{item.net_wt}g</span></span>
      </div>
    </div>
  )
}
