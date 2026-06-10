import { useState, useEffect } from 'react'
import { Users, Plus, CreditCard, Trash2, X, Inbox } from 'lucide-react'
import { toast } from 'react-hot-toast'

const DEFAULT_NEW_CUST = {
  name: '',
  mobile: '',
  scheme_type: 'GOLD ACCUMULATION',
  enrolment_date: new Date().toISOString().split('T')[0],
  base_amount: '',
  staff_name: '',
}

const DEFAULT_NEW_INST = {
  amount: '',
  date: new Date().toISOString().split('T')[0],
  mode: 'Cash',
  rate: '',
  added_g: '',
  status: 'PAID',
}

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showInstalmentsModal, setShowInstalmentsModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<{id: number, name: string} | null>(null)
  const [instalments, setInstalments] = useState<any[]>([])
  const [newCust, setNewCust] = useState({ ...DEFAULT_NEW_CUST })
  const [newInst, setNewInst] = useState({ ...DEFAULT_NEW_INST })
  const [staffList, setStaffList] = useState<any[]>([])
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    loadCustomers()
    loadStaff()
  }, [])

  const loadStaff = async () => {
    if ((window as any).api && (window as any).api.getStaff) {
      try {
        const data = await (window as any).api.getStaff()
        setStaffList(data || [])
      } catch (err) { }
    }
  }

  const loadCustomers = async () => {
    if ((window as any).api && (window as any).api.getCustomers) {
      try {
        const data = await (window as any).api.getCustomers()
        setCustomers(data || [])
      } catch (err) {
        toast.error('Failed to load customers.')
      }
    }
  }

  // Reset form state then open modal
  const handleOpenModal = () => {
    setNewCust({
      ...DEFAULT_NEW_CUST,
      enrolment_date: new Date().toISOString().split('T')[0],
    })
    setEditMode(false)
    setShowModal(true)
  }

  const handleEditCustomer = (c: any) => {
    setNewCust({ ...c })
    setEditMode(true)
    setShowModal(true)
  }

  const handleAddCustomer = async () => {
    if (!newCust.name.trim() || !newCust.mobile.trim() || !newCust.base_amount || !newCust.staff_name.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }

    if ((window as any).api) {
      try {
        if (editMode && (window as any).api.updateCustomer) {
          await (window as any).api.updateCustomer({
            ...newCust,
            base_amount: Number(newCust.base_amount),
          })
          toast.success('Customer updated successfully!')
        } else if ((window as any).api.addCustomer) {
          await (window as any).api.addCustomer({
            ...newCust,
            base_amount: Number(newCust.base_amount),
          })
          toast.success('Customer enrolled successfully!')
        }
        setShowModal(false)
        loadCustomers()
      } catch (err) {
        toast.error('Failed to enroll customer.')
      }
    } else {
      toast.error('IPC not ready yet.')
    }
  }

  const confirmDelete = (id: number, name: string) => {
    setDeleteTarget({ id, name })
  }

  const handleDeleteCustomer = async () => {
    if (!deleteTarget) return
    if ((window as any).api && (window as any).api.deleteCustomer) {
      try {
        await (window as any).api.deleteCustomer(deleteTarget.id)
        toast.success(`${deleteTarget.name} deleted successfully!`)
        loadCustomers()
      } catch (err) {
        toast.error(`Failed to delete ${deleteTarget.name}.`)
      } finally {
        setDeleteTarget(null)
      }
    }
  }

  const handleViewInstalments = async (cust: any) => {
    setSelectedCustomer(cust)
    if ((window as any).api && (window as any).api.getInstalments) {
      try {
        const data = await (window as any).api.getInstalments(cust.id)
        setInstalments(data || [])
      } catch (err) {
        toast.error('Failed to load instalments.')
      }
    }
    setNewInst({ ...DEFAULT_NEW_INST, date: new Date().toISOString().split('T')[0] })
    setShowInstalmentsModal(true)
  }

  const handleAddInstalment = async () => {
    if (!newInst.amount || Number(newInst.amount) <= 0) {
      toast.error('Please enter a valid amount.')
      return
    }

    if (isGoldScheme && (!newInst.rate || !newInst.added_g)) {
      toast.error('Please fill in rate and added gold fields for Gold Scheme.')
      return
    }

    if ((window as any).api && (window as any).api.addInstalment && selectedCustomer) {
      try {
        await (window as any).api.addInstalment({
          ...newInst,
          customer_id: selectedCustomer.id,
          amount: Number(newInst.amount),
        })
        toast.success('Instalment added successfully!')
        // Refresh instalments
        const data = await (window as any).api.getInstalments(selectedCustomer.id)
        setInstalments(data || [])
        setNewInst({ ...DEFAULT_NEW_INST, date: new Date().toISOString().split('T')[0] })
      } catch (err) {
        toast.error('Failed to add instalment.')
      }
    }
  }

  const isGoldScheme = selectedCustomer?.scheme_type?.includes('GOLD')

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Users className="text-purple-500" /> Customers &amp; Schemes
        </h1>
        <div className="flex gap-3">
          <button
            onClick={handleOpenModal}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} /> Enroll Customer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-auto flex flex-col">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 p-12 text-center text-gray-500 h-full">
            <div className="bg-purple-50 p-6 rounded-full mb-4">
              <Inbox size={48} className="text-purple-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No customers enrolled yet</h3>
            <p className="max-w-md mb-6">
              Get started by enrolling a new customer. You'll be able to manage their scheme and track monthly instalments here.
            </p>
            <button
              onClick={handleOpenModal}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} /> Enroll First Customer
            </button>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm sticky top-0 z-10">
              <tr>
                <th className="p-4 font-medium">Scheme ID</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Mobile</th>
                <th className="p-4 font-medium">Scheme Type</th>
                <th className="p-4 font-medium">Monthly Amount</th>
                <th className="p-4 font-medium">Staff Name</th>
                <th className="p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="p-4 font-bold text-purple-600">{c.scheme_id}</td>
                  <td className="p-4 font-bold text-gray-800">{c.name}</td>
                  <td className="p-4 text-gray-600">{c.mobile}</td>
                  <td className="p-4">
                    <span
                      className={
                        'px-2 py-1 rounded text-xs font-bold whitespace-nowrap ' +
                        (c.scheme_type?.includes('GOLD')
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800')
                      }
                    >
                      {c.scheme_type}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-gray-700">Rs. {c.base_amount}</td>
                  <td className="p-4 text-gray-600">{c.staff_name}</td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => handleViewInstalments(c)}
                      className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-bold hover:bg-blue-100 flex items-center gap-1 whitespace-nowrap"
                    >
                      <CreditCard size={14} /> Instalments
                    </button>
                    <button
                      onClick={() => handleEditCustomer(c)}
                      className="text-sm bg-gray-50 text-gray-600 px-3 py-1 rounded-lg font-bold hover:bg-gray-100 flex items-center gap-1"
                      title="Edit Customer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(c.id, c.name)}
                      className="text-sm bg-red-50 text-red-600 px-3 py-1 rounded-lg font-bold hover:bg-red-100 flex items-center gap-1"
                      title="Delete Customer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Instalments Modal (always in DOM) ── */}
      <div
        style={{ display: showInstalmentsModal ? 'flex' : 'none' }}
        className="fixed inset-0 bg-black/50 items-center justify-center p-4 z-50"
        onClick={() => setShowInstalmentsModal(false)}
      >
        <div
          className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-xl font-bold">
              Instalments – {selectedCustomer?.name} ({selectedCustomer?.scheme_id})
            </h2>
            <button
              onClick={() => setShowInstalmentsModal(false)}
              className="ml-4 text-gray-400 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Manage all monthly payments for this scheme here.
          </p>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-bold text-gray-600 mb-1">Amount *</label>
              <input
                type="number"
                value={newInst.amount}
                onChange={e => setNewInst({ ...newInst, amount: e.target.value })}
                className="w-full p-2 border rounded text-sm"
                
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-bold text-gray-600 mb-1">Date Paid</label>
              <input
                type="date"
                value={newInst.date}
                onChange={e => setNewInst({ ...newInst, date: e.target.value })}
                className="w-full p-2 border rounded text-sm"
              />
            </div>
            <div className="flex-1 min-w-[100px]">
              <label className="block text-xs font-bold text-gray-600 mb-1">Mode</label>
              <select
                value={newInst.mode}
                onChange={e => setNewInst({ ...newInst, mode: e.target.value })}
                className="w-full p-2 border rounded text-sm"
              >
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Bank Transfer</option>
              </select>
            </div>
            {isGoldScheme && (
              <>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Rate/g *</label>
                  <input
                    type="number"
                    step="any"
                    value={newInst.rate}
                    onChange={e => setNewInst({ ...newInst, rate: e.target.value })}
                    className="w-full p-2 border rounded text-sm"
                    
                  />
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Added (g) *</label>
                  <input
                    type="number"
                    step="any"
                    value={newInst.added_g}
                    onChange={e => setNewInst({ ...newInst, added_g: e.target.value })}
                    className="w-full p-2 border rounded text-sm"
                    
                  />
                </div>
              </>
            )}
            <button
              onClick={handleAddInstalment}
              className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 h-[38px] text-sm whitespace-nowrap flex-shrink-0"
            >
              Add Payment
            </button>
          </div>

          <div className="flex-1 overflow-auto rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-600 font-bold sticky top-0">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Mode</th>
                  {isGoldScheme && <th className="p-3">Rate/g</th>}
                  {isGoldScheme && <th className="p-3">Added (g)</th>}
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {instalments.map((i, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-3">{i.date}</td>
                    <td className="p-3 font-bold text-green-700">Rs. {i.amount}</td>
                    <td className="p-3">{i.mode}</td>
                    {isGoldScheme && <td className="p-3">{i.rate}</td>}
                    {isGoldScheme && <td className="p-3">{i.added_g} g</td>}
                    <td className="p-3 font-bold text-green-600">{i.status}</td>
                  </tr>
                ))}
                {instalments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <Inbox size={32} className="text-gray-300 mb-2" />
                        <p>No instalments recorded yet.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t">
            <button
              onClick={() => setShowInstalmentsModal(false)}
              className="px-6 py-2 bg-gray-100 text-gray-800 font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* ── Add Customer Modal (always in DOM) ── */}
      <div
        style={{ display: showModal ? 'flex' : 'none' }}
        className="fixed inset-0 bg-black/50 items-center justify-center p-4 z-50"
        onClick={() => setShowModal(false)}
      >
        <div
          className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{editMode ? 'Edit Customer' : 'Enroll New Customer'}</h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-gray-700 p-1"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={newCust.name}
                onChange={e => setNewCust({ ...newCust, name: e.target.value })}
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                value={newCust.mobile}
                onChange={e => setNewCust({ ...newCust, mobile: e.target.value })}
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Scheme Type</label>
                <select
                  value={newCust.scheme_type}
                  onChange={e => setNewCust({ ...newCust, scheme_type: e.target.value })}
                  className="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="GOLD ACCUMULATION">GOLD ACCUMULATION</option>
                  <option value="GOLD SCHEME">GOLD SCHEME</option>
                  <option value="DIAMOND SCHEME">DIAMOND SCHEME</option>
                  <option value="SILVER ACCUMULATION">SILVER ACCUMULATION</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Staff Name *</label>
                <select
                  value={newCust.staff_name}
                  onChange={e => setNewCust({ ...newCust, staff_name: e.target.value })}
                  className="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Select Staff</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Enrolment Date</label>
                <input
                  type="date"
                  value={newCust.enrolment_date}
                  onChange={e => setNewCust({ ...newCust, enrolment_date: e.target.value })}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Monthly Amount (Rs) *</label>
                <input
                  type="number"
                  value={newCust.base_amount}
                  onChange={e => setNewCust({ ...newCust, base_amount: e.target.value })}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomer}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold shadow-sm transition-colors"
              >
                {editMode ? 'Save Changes' : 'Save Customer'}
              </button>
            </div>
          </div>
        </div>
      </div>

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
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Customer?</h3>
              <p className="text-gray-500 text-sm mb-6">
                Are you sure you want to delete <span className="font-bold text-gray-800">{deleteTarget.name}</span> and all their instalments? This action cannot be undone.
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCustomer}
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
