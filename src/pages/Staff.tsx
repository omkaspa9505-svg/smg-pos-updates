import { useState, useEffect } from 'react'
import { UserCheck, Plus, Trash2, Edit2, Phone } from 'lucide-react'

export default function Staff() {
  const [staffList, setStaffList] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentStaff, setCurrentStaff] = useState({
    id: 0, name: '', role: 'Sales Exec', phone: '', join_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadStaff()
  }, [])

  const loadStaff = async () => {
    if ((window as any).api && (window as any).api.getStaff) {
      const data = await (window as any).api.getStaff()
      setStaffList(data || [])
    }
  }

  const handleSaveStaff = async () => {
    if ((window as any).api) {
      if (editMode) {
        await (window as any).api.updateStaff(currentStaff)
      } else {
        await (window as any).api.addStaff(currentStaff)
      }
      setShowModal(false)
      loadStaff()
    }
  }

  const handleEdit = (staff: any) => {
    setCurrentStaff(staff)
    setEditMode(true)
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      if ((window as any).api) {
        await (window as any).api.deleteStaff(id)
        loadStaff()
      }
    }
  }

  const openNewModal = () => {
    setCurrentStaff({
      id: 0, name: '', role: 'Sales Exec', phone: '', join_date: new Date().toISOString().split('T')[0]
    })
    setEditMode(false)
    setShowModal(true)
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <UserCheck className="text-indigo-500" /> Staff Management
        </h1>
        <button 
          onClick={openNewModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} /> Add Staff
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm sticky top-0">
            <tr>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Phone Number</th>
              <th className="p-4 font-medium">Joined On</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staffList.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No staff members found.</td></tr>
            ) : null}
            {staffList.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-4 font-bold text-gray-800">{s.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${s.role === 'Manager' ? 'bg-purple-100 text-purple-800' : 'bg-gray-200 text-gray-800'}`}>
                    {s.role}
                  </span>
                </td>
                <td className="p-4 text-gray-600 flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {s.phone}</td>
                <td className="p-4 text-gray-600">{s.join_date}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleEdit(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded mr-2">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editMode ? 'Edit Staff Details' : 'Add New Staff'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Full Name</label>
                <input type="text" value={currentStaff.name} onChange={e => setCurrentStaff({...currentStaff, name: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Srikanth" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Role</label>
                  <select value={currentStaff.role} onChange={e => setCurrentStaff({...currentStaff, role: e.target.value})} className="w-full p-2 border rounded bg-gray-50 outline-none">
                    <option>Sales Exec</option>
                    <option>Manager</option>
                    <option>Cashier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Phone Number</label>
                  <input type="text" value={currentStaff.phone} onChange={e => setCurrentStaff({...currentStaff, phone: e.target.value})} className="w-full p-2 border rounded outline-none" placeholder="98765..." />
                </div>
              </div>
              {!editMode && (
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Join Date</label>
                  <input type="date" value={currentStaff.join_date} onChange={e => setCurrentStaff({...currentStaff, join_date: e.target.value})} className="w-full p-2 border rounded outline-none" />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded font-medium">Cancel</button>
                <button onClick={handleSaveStaff} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold">
                  {editMode ? 'Save Changes' : 'Add Staff'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
