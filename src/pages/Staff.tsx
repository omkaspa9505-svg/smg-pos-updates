import { useState, useEffect } from 'react'
import { UserCheck, Plus, Trash2, Edit2, Phone, X, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Staff() {
  const [staffList, setStaffList] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [currentStaff, setCurrentStaff] = useState({
    id: 0, name: '', role: 'Sales Exec', phone: '', join_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadStaff()
  }, [])

  const loadStaff = async () => {
    try {
      if ((window as any).api && (window as any).api.getStaff) {
        const data = await (window as any).api.getStaff()
        setStaffList(data || [])
      }
    } catch (error) {
      toast.error('Failed to load staff list')
    }
  }

  const handleSaveStaff = async () => {
    if (!currentStaff.name.trim()) {
      toast.error('Please enter a valid name')
      return
    }
    if (!currentStaff.phone.trim() || currentStaff.phone.length < 10) {
      toast.error('Please enter a valid phone number (at least 10 digits)')
      return
    }

    try {
      if ((window as any).api) {
        if (editMode) {
          await (window as any).api.updateStaff(currentStaff)
          toast.success('Staff details updated successfully')
        } else {
          await (window as any).api.addStaff(currentStaff)
          toast.success('Staff added successfully')
        }
        setShowModal(false)
        loadStaff()
      }
    } catch (error) {
      toast.error('Failed to save staff details')
    }
  }

  const handleEdit = (staff: any) => {
    setCurrentStaff(staff)
    setEditMode(true)
    setShowModal(true)
  }

  const confirmDelete = (id: number) => {
    setDeleteTarget(id)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      if ((window as any).api) {
        await (window as any).api.deleteStaff(deleteTarget)
        toast.success('Staff member removed successfully')
        loadStaff()
      }
    } catch (error) {
      toast.error('Failed to remove staff member')
    } finally {
      setDeleteTarget(null)
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
        {staffList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-12 text-center">
            <div className="bg-indigo-50 p-6 rounded-full mb-6">
              <Users size={48} className="text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No staff members yet</h3>
            <p className="text-gray-500 max-w-sm mb-8 text-lg">
              You haven't added any staff members to your team. Add your first staff member to get started.
            </p>
            <button
              onClick={openNewModal}
              className="bg-indigo-100 text-indigo-700 px-6 py-3 rounded-lg flex items-center gap-2 font-bold hover:bg-indigo-200 transition-colors"
            >
              <Plus size={20} /> Add Your First Staff Member
            </button>
          </div>
        ) : (
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
              {staffList.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-800">{s.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${s.role === 'Manager' ? 'bg-purple-100 text-purple-800' : 'bg-gray-200 text-gray-800'}`}>
                      {s.role}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" /> {s.phone}
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{s.join_date}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleEdit(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded mr-2">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => confirmDelete(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 transition-opacity"
        style={{ display: showModal ? 'flex' : 'none', opacity: showModal ? 1 : 0 }}
        onClick={() => setShowModal(false)}
      >
        <div
          className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md transform transition-transform"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">{editMode ? 'Edit Staff Details' : 'Add New Staff'}</h2>
            <button
              onClick={() => setShowModal(false)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
              <input
                type="text"
                value={currentStaff.name}
                onChange={e => setCurrentStaff({...currentStaff, name: e.target.value})}
                className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Role</label>
                <select
                  value={currentStaff.role}
                  onChange={e => setCurrentStaff({...currentStaff, role: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                >
                  <option>Sales Exec</option>
                  <option>Manager</option>
                  <option>Cashier</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={currentStaff.phone}
                  onChange={e => setCurrentStaff({...currentStaff, phone: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  
                />
              </div>
            </div>
            {!editMode && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Join Date</label>
                <input
                  type="date"
                  value={currentStaff.join_date}
                  onChange={e => setCurrentStaff({...currentStaff, join_date: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={handleSaveStaff} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition-colors">
                {editMode ? 'Save Changes' : 'Add Staff'}
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Staff?</h3>
              <p className="text-gray-500 text-sm mb-6">
                Are you sure you want to remove this staff member? This action cannot be undone.
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
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
