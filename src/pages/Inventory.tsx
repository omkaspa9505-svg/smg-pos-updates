import { useState, useEffect, useCallback } from 'react'
import { Package, Plus, Printer, QrCode, Trash2, X, ArchiveX } from 'lucide-react'
import { toast } from 'react-hot-toast'
import BarcodeTag from '../components/BarcodeTag'

const INITIAL_ITEM = {
  category: 'Ring',
  customCategory: '',
  purity: '22k',
  gross_wt: '',
  net_wt: '',
  stone_wt: '0',
  making_charge_type: 'percentage',
  making_charge_rate: '',
  vendor_name: '',
  huid: '',
  stones: [] as any[]
}

export default function Inventory() {
  const [items, setItems] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [printItem, setPrintItem] = useState<any>(null)
  const [newItem, setNewItem] = useState({ ...INITIAL_ITEM })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true)
      const api = (window as any).api
      if (api?.getInventory) {
        const data = await api.getInventory()
        setItems(data || [])
      }
    } catch (error) {
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadInventory() }, [loadInventory])

  const handlePrint = (item: any) => {
    setPrintItem(item)
  }

  const handleOpenModal = () => {
    setNewItem({ ...INITIAL_ITEM })
    setEditMode(false)
    setShowModal(true)
  }

  const handleEdit = (item: any) => {
    const parsedStones = typeof item.stones === 'string' ? JSON.parse(item.stones || '[]') : (item.stones || [])
    setNewItem({ ...item, stones: parsedStones })
    setEditMode(true)
    setShowModal(true)
  }

  const handleAddItem = async () => {
    if (saving) return

    // Validation
    const grossWt = Number(newItem.gross_wt)
    const netWt = Number(newItem.net_wt)
    const makingCharge = Number(newItem.making_charge_rate)
    
    let finalCategory = newItem.category
    if (finalCategory === 'Other') {
      finalCategory = newItem.customCategory?.trim() || 'Other'
      if (!finalCategory || finalCategory === 'Other') {
        toast.error('Please specify the custom category')
        return
      }
    }

    if (!grossWt || grossWt <= 0) {
      toast.error('Gross weight must be greater than 0')
      return
    }
    if (!netWt || netWt <= 0) {
      toast.error('Net weight must be greater than 0')
      return
    }
    if (!makingCharge || makingCharge <= 0) {
      toast.error('Making charge must be greater than 0')
      return
    }

    const api = (window as any).api
    if (!api?.addInventory) {
      toast.error('API not found')
      return
    }

    setSaving(true)
    try {
      let result;
      if (editMode && api.updateInventory) {
        result = await api.updateInventory({
          ...newItem,
          category: finalCategory,
          gross_wt: grossWt,
          net_wt: netWt,
          stone_wt: Number(newItem.stone_wt) || 0,
          making_charge_rate: makingCharge,
          stones: newItem.stones,
          huid: newItem.huid
        })
      } else {
        result = await api.addInventory({
          ...newItem,
          category: finalCategory,
          gross_wt: grossWt,
          net_wt: netWt,
          stone_wt: Number(newItem.stone_wt) || 0,
          making_charge_rate: makingCharge,
          stones: newItem.stones,
          huid: newItem.huid
        })
      }
      
      if (result?.success || editMode) {
        setShowModal(false)
        toast.success(editMode ? 'Stock updated successfully!' : 'Stock added successfully!')
        await loadInventory()
      } else {
        toast.error('Failed to save: ' + (result?.error || 'Unknown error'))
      }
    } catch (error) {
      toast.error('An unexpected error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (barcode: string) => {
    setDeleteTarget(barcode)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const api = (window as any).api
    if (api?.deleteInventory) {
      try {
        await api.deleteInventory(deleteTarget)
        toast.success('Item deleted successfully')
        await loadInventory()
      } catch (error) {
        toast.error('Failed to delete item')
      } finally {
        setDeleteTarget(null)
      }
    }
  }

  const set = (field: string, value: string) =>
    setNewItem(prev => ({ ...prev, [field]: value }))

  const recalcWeights = (grossWtStr: string, currentStones: any[], prev: any) => {
    const gWt = Number(grossWtStr) || 0
    let sWt = 0
    currentStones.forEach(s => {
      sWt += (Number(s.carats) || 0) * 0.2
    })
    return {
      ...prev,
      stones: currentStones,
      gross_wt: grossWtStr,
      stone_wt: sWt.toFixed(3),
      net_wt: Math.max(0, gWt - sWt).toFixed(3)
    }
  }

  const setGrossWt = (val: string) => {
    setNewItem(prev => recalcWeights(val, prev.stones, prev))
  }

  const addStone = () => {
    setNewItem(prev => ({
      ...prev,
      stones: [...(prev.stones || []), { name: '', carats: '', rate: '' }]
    }))
  }

  const removeStone = (index: number) => {
    setNewItem(prev => {
      const newStones = [...(prev.stones || [])]
      newStones.splice(index, 1)
      return recalcWeights(prev.gross_wt, newStones, prev)
    })
  }

  const updateStone = (index: number, field: string, value: string) => {
    setNewItem(prev => {
      const newStones = [...(prev.stones || [])]
      newStones[index] = { ...newStones[index], [field]: value }
      return recalcWeights(prev.gross_wt, newStones, prev)
    })
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="text-blue-600" size={28} />
            </div>
            Inventory Stock
          </h1>
          <p className="text-gray-500 mt-2">Manage your jewelry items and generate barcode tags.</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold hover:bg-blue-700 shadow-sm hover:shadow transition-all"
        >
          <Plus size={20} /> Add New Stock
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/80 text-gray-500 text-sm border-b border-gray-100">
            <tr>
              <th className="p-5 font-semibold">Barcode / ID</th>
              <th className="p-5 font-semibold">Category</th>
              <th className="p-5 font-semibold">Purity</th>
              <th className="p-5 font-semibold">Weights (G, N, S)</th>
              <th className="p-5 font-semibold">Making Charge</th>
              <th className="p-5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-gray-500 font-medium">Loading inventory...</div>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-16 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <ArchiveX className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No stock available</h3>
                    <p className="text-gray-500 mb-6">Your inventory is currently empty. Add your first jewelry item to get started.</p>
                    <button
                      onClick={handleOpenModal}
                      className="text-blue-600 font-semibold hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Plus size={18} /> Add New Item
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="p-5 font-mono font-semibold text-gray-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-gray-100 rounded-md text-gray-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <QrCode size={16} />
                      </div>
                      {item.barcode}
                    </div>
                  </td>
                  <td className="p-5 text-gray-600">
                    <div className="font-semibold text-gray-900">{item.category}</div>
                    {item.vendor_name && <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">Vendor: <span className="font-medium">{item.vendor_name}</span></div>}
                  </td>
                  <td className="p-5">
                    <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md text-xs font-bold border border-amber-200">
                      {item.purity}
                    </span>
                  </td>
                  <td className="p-5 text-sm text-gray-600">
                    <div className="space-y-1">
                      <div className="flex justify-between w-24"><span className="text-gray-400">Gross:</span> <span className="font-medium text-gray-800">{item.gross_wt}g</span></div>
                      <div className="flex justify-between w-24"><span className="text-gray-400">Net:</span> <span className="font-medium text-gray-800">{item.net_wt}g</span></div>
                    </div>
                  </td>
                  <td className="p-5 text-gray-600 font-medium">
                    {item.making_charge_type === 'percentage'
                      ? <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">{item.making_charge_rate}%</span>
                      : <span className="text-green-600 bg-green-50 px-2 py-1 rounded">₹ {item.making_charge_rate} {item.making_charge_type === 'per_gram' ? '/g' : 'Flat'}</span>}
                  </td>
                  <td className="p-5">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handlePrint(item)} className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 text-sm font-semibold" title="Print Tag">
                        <Printer size={18} />
                      </button>
                      <button onClick={() => handleEdit(item)} className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 text-sm font-semibold" title="Edit Item">
                        <span className="flex items-center">Edit</span>
                      </button>
                      <button onClick={() => confirmDelete(item.barcode)} className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors" title="Delete Item">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {printItem && <BarcodeTag item={printItem} onClose={() => setPrintItem(null)} />}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-gray-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Plus size={20}/></div>
                {editMode ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select
                    value={newItem.category}
                    onChange={e => set('category', e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option>Ring</option>
                    <option>Chain</option>
                    <option>Bangle</option>
                    <option>Earring</option>
                    <option>Necklace</option>
                    <option>Pendant</option>
                    <option>Coin</option>
                    <option>Bracelet</option>
                    <option value="Other">Other (Type manually)</option>
                  </select>
                  {newItem.category === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter custom category"
                      value={newItem.customCategory || ''}
                      onChange={e => set('customCategory', e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all mt-2"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Purity</label>
                  <select
                    value={newItem.purity}
                    onChange={e => set('purity', e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="24k">24k</option>
                    <option value="22k">22k</option>
                    <option value="20k">20k</option>
                    <option value="18k">18k</option>
                    <option value="14k">14k</option>
                    <option value="13k">13k</option>
                    <option value="RS">RS</option>
                    <option value="92.5">92.5</option>
                    <option value="99.9">99.9</option>
                    <option value="999">999</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Gross Wt <span className="text-gray-400 font-normal">(g)</span></label>
                  <input
                    type="number"
                    value={newItem.gross_wt}
                    onChange={e => setGrossWt(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Stone Wt <span className="text-gray-400 font-normal">(g)</span></label>
                  <input
                    type="number"
                    value={newItem.stone_wt}
                    onChange={e => set('stone_wt', e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Net Wt <span className="text-gray-400 font-normal">(g)</span></label>
                  <input
                    type="number"
                    value={newItem.net_wt}
                    onChange={e => set('net_wt', e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Charge Type</label>
                  <select
                    value={newItem.making_charge_type}
                    onChange={e => set('making_charge_type', e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="per_gram">Per Gram (₹)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Charge Rate</label>
                  <input
                    type="number"
                    value={newItem.making_charge_rate}
                    onChange={e => set('making_charge_rate', e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vendor / Supplier Name</label>
                <input
                  type="text"
                  value={newItem.vendor_name}
                  onChange={e => set('vendor_name', e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">HUID</label>
                <input
                  type="text"
                  value={newItem.huid || ''}
                  onChange={e => set('huid', e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all uppercase"
                  placeholder="e.g. AB123C"
                />
              </div>

              {/* Stones Section */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-800">Stones Details</h3>
                  <button onClick={addStone} className="text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-medium text-blue-600 hover:bg-gray-50 flex items-center gap-1">
                    <Plus size={14} /> Add Stone
                  </button>
                </div>
                {(!newItem.stones || newItem.stones.length === 0) ? (
                  <p className="text-sm text-gray-500 text-center py-2">No stones added.</p>
                ) : (
                  <div className="space-y-3">
                    {newItem.stones.map((stone: any, idx: number) => (
                      <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-gray-200">
                        <input
                          type="text"
                          placeholder="Name"
                          value={stone.name}
                          onChange={e => updateStone(idx, 'name', e.target.value)}
                          className="flex-1 p-2 bg-gray-50 border border-gray-100 rounded outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Carats"
                          value={stone.carats}
                          onChange={e => updateStone(idx, 'carats', e.target.value)}
                          className="w-24 p-2 bg-gray-50 border border-gray-100 rounded outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Rate/Ct"
                          value={stone.rate}
                          onChange={e => updateStone(idx, 'rate', e.target.value)}
                          className="w-24 p-2 bg-gray-50 border border-gray-100 rounded outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        />
                        <button onClick={() => removeStone(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-sm hover:shadow transition-all disabled:opacity-60 flex items-center gap-2"
                >
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {saving ? 'Saving...' : (editMode ? 'Save Changes' : 'Save & Generate Barcode')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Item?</h3>
              <p className="text-gray-500 text-sm mb-6">
                Are you sure you want to delete <span className="font-bold text-gray-800">{deleteTarget}</span>? This action cannot be undone.
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold shadow-sm transition-colors"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
