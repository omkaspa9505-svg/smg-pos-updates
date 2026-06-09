import { useState, useEffect } from 'react'
import { Package, Plus, Printer, QrCode } from 'lucide-react'
import BarcodeTag from '../components/BarcodeTag'

export default function Inventory() {
  const [items, setItems] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [printItem, setPrintItem] = useState<any>(null)

  const handlePrint = (item: any) => {
    setPrintItem(item)
    setTimeout(() => {
      window.print()
    }, 100)
  }
  const [newItem, setNewItem] = useState({
    category: 'Ring',
    purity: '22k',
    gross_wt: '',
    net_wt: '',
    stone_wt: '0',
    making_charge_type: 'per_gram',
    making_charge_rate: '',
    vendor_name: ''
  })

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    if ((window as any).api) {
      const data = await (window as any).api.getInventory()
      setItems(data || [])
    }
  }

  const handleAddItem = async () => {
    if ((window as any).api) {
      const result = await (window as any).api.addInventory({
        ...newItem,
        gross_wt: Number(newItem.gross_wt),
        net_wt: Number(newItem.net_wt),
        stone_wt: Number(newItem.stone_wt),
        making_charge_rate: Number(newItem.making_charge_rate)
      })
      if (result.success) {
        setShowModal(false)
        loadInventory()
        // Reset
        setNewItem({...newItem, gross_wt: '', net_wt: '', making_charge_rate: ''})
      }
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Package className="text-blue-500" /> Inventory Stock
        </h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} /> Add New Stock
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="p-4 font-medium">Barcode / ID</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium">Purity</th>
              <th className="p-4 font-medium">Weights (G, N, S)</th>
              <th className="p-4 font-medium">Making Charge</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">No stock available. Add items.</td></tr>
            )}
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 font-mono font-bold text-gray-800 flex items-center gap-2">
                  <QrCode size={16} className="text-gray-400"/> {item.barcode}
                </td>
                <td className="p-4 text-gray-600">
                  <div className="font-medium">{item.category}</div>
                  {item.vendor_name && <div className="text-xs text-gray-400 mt-1">Vendor: {item.vendor_name}</div>}
                </td>
                <td className="p-4 text-gray-600">
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">
                    {item.purity}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-600">
                  G: {item.gross_wt}g <br/> N: {item.net_wt}g
                </td>
                <td className="p-4 text-gray-600">
                  {item.making_charge_type === 'percentage' 
                    ? `${item.making_charge_rate}%` 
                    : `Rs. ${item.making_charge_rate} ${item.making_charge_type === 'per_gram' ? '/g' : 'Flat'}`}
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handlePrint(item)} className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50 transition-colors inline-flex items-center gap-1 text-sm font-medium">
                    <Printer size={16} /> Print Tag
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BarcodeTag item={printItem} />

      {/* Add Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Item</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Category</label>
                  <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full p-2 border rounded bg-gray-50">
                    <option>Ring</option>
                    <option>Chain</option>
                    <option>Bangle</option>
                    <option>Earring</option>
                    <option>Coin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Purity</label>
                  <select value={newItem.purity} onChange={e => setNewItem({...newItem, purity: e.target.value})} className="w-full p-2 border rounded bg-gray-50">
                    <option>22k</option>
                    <option>24k</option>
                    <option>18k</option>
                    <option>Silver</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Gross Wt</label>
                  <input type="number" value={newItem.gross_wt} onChange={e => setNewItem({...newItem, gross_wt: e.target.value})} className="w-full p-2 border rounded" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Stone Wt</label>
                  <input type="number" value={newItem.stone_wt} onChange={e => setNewItem({...newItem, stone_wt: e.target.value})} className="w-full p-2 border rounded" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Net Wt</label>
                  <input type="number" value={newItem.net_wt} onChange={e => setNewItem({...newItem, net_wt: e.target.value})} className="w-full p-2 border rounded" placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Charge Type</label>
                  <select value={newItem.making_charge_type} onChange={e => setNewItem({...newItem, making_charge_type: e.target.value})} className="w-full p-2 border rounded bg-gray-50">
                    <option value="per_gram">Per Gram (Rs)</option>
                    <option value="flat">Flat Amount (Rs)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Charge Rate</label>
                  <input type="number" value={newItem.making_charge_rate} onChange={e => setNewItem({...newItem, making_charge_rate: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g. 12" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-500 mb-1">Vendor / Supplier Name</label>
                <input type="text" value={newItem.vendor_name} onChange={e => setNewItem({...newItem, vendor_name: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g. Ramesh Jewellers" />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                <button onClick={handleAddItem} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Save Item & Generate Barcode</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
