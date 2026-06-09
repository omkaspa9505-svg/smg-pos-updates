import { useState, useEffect } from 'react'
import { Users, Plus, Target, Calendar } from 'lucide-react'

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [sheetConfig, setSheetConfig] = useState({ id: '', credsPath: '' })
  const [showConfig, setShowConfig] = useState(false)
  const [newCust, setNewCust] = useState({
    name: '', mobile: '', scheme_type: 'Money', enrolment_date: new Date().toISOString().split('T')[0], base_amount: ''
  })

  useEffect(() => {
    loadCustomers()
    const savedConfig = localStorage.getItem('smg_sheet_config')
    if (savedConfig) setSheetConfig(JSON.parse(savedConfig))
  }, [])

  const loadCustomers = async () => {
    if ((window as any).api && (window as any).api.getCustomers) {
      const data = await (window as any).api.getCustomers()
      setCustomers(data || [])
    } else {
      // Mock for now until IPC is fully hooked up
      setCustomers([{id: 1, name: 'Aditi Sharma', mobile: '9876543210', scheme_type: 'Money', enrolment_date: '2025-01-15', base_amount: 5000}])
    }
  }

  const handleAddCustomer = async () => {
    if ((window as any).api && (window as any).api.addCustomer) {
      await (window as any).api.addCustomer({
        ...newCust,
        base_amount: Number(newCust.base_amount)
      })

      // Push to Google Sheets if configured
      if (sheetConfig.id && sheetConfig.credsPath) {
        try {
          const rowData = [[
            newCust.name,
            newCust.mobile,
            newCust.scheme_type,
            newCust.enrolment_date,
            newCust.base_amount
          ]]
          await (window as any).api.googleSheetsAppend(
            sheetConfig.id,
            sheetConfig.credsPath,
            'Sheet1!A:E',
            rowData
          )
        } catch (err) {
          console.error("Failed to sync to Google Sheets:", err)
          alert("Customer saved locally, but failed to sync to Google Sheets. Check credentials.")
        }
      }

      setShowModal(false)
      loadCustomers()
    } else {
      alert("IPC not ready yet.")
    }
  }

  const saveSheetConfig = () => {
    localStorage.setItem('smg_sheet_config', JSON.stringify(sheetConfig))
    setShowConfig(false)
    alert("Google Sheets configuration saved!")
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Users className="text-purple-500" /> Customers & Schemes
        </h1>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowConfig(true)}
            className="text-gray-500 bg-white border border-gray-200 px-4 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors"
          >
            Google Sheets Settings
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} /> Enroll Customer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm sticky top-0">
            <tr>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Mobile</th>
              <th className="p-4 font-medium">Scheme Type</th>
              <th className="p-4 font-medium">Joined On</th>
              <th className="p-4 font-medium">Monthly Amount</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="p-4 font-bold text-gray-800">{c.name}</td>
                <td className="p-4 text-gray-600">{c.mobile}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${c.scheme_type === 'Money' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {c.scheme_type}
                  </span>
                </td>
                <td className="p-4 text-gray-600 flex items-center gap-2"><Calendar size={14} className="text-gray-400"/> {c.enrolment_date}</td>
                <td className="p-4 font-semibold text-gray-700">Rs. {c.base_amount}</td>
                <td className="p-4">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-max">
                    <Target size={12}/> Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Google Sheets Sync</h2>
            <p className="text-sm text-gray-500 mb-6">Connect your POS to automatically push enrolled customers to a Google Sheet.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Spreadsheet ID</label>
                <input type="text" value={sheetConfig.id} onChange={e => setSheetConfig({...sheetConfig, id: e.target.value})} className="w-full p-2 border rounded" placeholder="1BxiMVs0XRYFgCE..." />
                <p className="text-xs text-gray-400 mt-1">Found in the URL of your Google Sheet</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Service Account Credentials Path</label>
                <input type="text" value={sheetConfig.credsPath} onChange={e => setSheetConfig({...sheetConfig, credsPath: e.target.value})} className="w-full p-2 border rounded" placeholder="C:\keys\service-account.json" />
                <p className="text-xs text-gray-400 mt-1">Absolute path to your Google Cloud JSON key</p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowConfig(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                <button onClick={saveSheetConfig} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Save Settings</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Enroll New Customer</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Full Name</label>
                <input type="text" value={newCust.name} onChange={e => setNewCust({...newCust, name: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g. Ramesh Kumar" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Mobile Number</label>
                <input type="text" value={newCust.mobile} onChange={e => setNewCust({...newCust, mobile: e.target.value})} className="w-full p-2 border rounded" placeholder="9876543210" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Scheme Type</label>
                  <select value={newCust.scheme_type} onChange={e => setNewCust({...newCust, scheme_type: e.target.value})} className="w-full p-2 border rounded bg-gray-50">
                    <option>Money</option>
                    <option>Gold</option>
                    <option>Silver</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Enrolment Date</label>
                  <input type="date" value={newCust.enrolment_date} onChange={e => setNewCust({...newCust, enrolment_date: e.target.value})} className="w-full p-2 border rounded" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Monthly Base Amount (Rs)</label>
                <input type="number" value={newCust.base_amount} onChange={e => setNewCust({...newCust, base_amount: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g. 3000" />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                <button onClick={handleAddCustomer} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-medium">Save Customer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
