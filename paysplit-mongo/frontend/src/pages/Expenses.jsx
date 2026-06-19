import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import SplitSlider from '../components/SplitSlider'
import { createExpense, getExpenses, deleteExpense } from '../lib/api'
import { Plus, Trash, X, Receipt, CaretDown } from '@phosphor-icons/react'
import { toast } from 'sonner'

const CATEGORIES = ['Food','Transport','Entertainment','Shopping','Bills','Other']
const CAT_ICONS  = { Food:'🍜', Transport:'🚗', Entertainment:'🎬', Shopping:'🛍️', Bills:'💡', Other:'📦' }
const SPLIT_BADGE = { no_split:'🎁 Gift', equal:'⚖️ Equal', percentage:'📊 Custom %', custom:'✏️ Manual' }

const inp = 'w-full px-4 py-3.5 bg-gray-50/80 border border-gray-100 rounded-2xl text-sm font-medium text-gray-800 placeholder-gray-300 focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed]/40 focus:bg-white transition-all outline-none'

const Expenses = () => {
  const { user }  = useAuth()
  const location  = useLocation()
  const navigate = useNavigate()
  const [expenses,   setExpenses]   = useState([])
  const [showModal,  setShowModal]  = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [title,        setTitle]        = useState('')
  const [paidBy,       setPaidBy]       = useState('')
  const [participants, setParticipants] = useState([{ name:'', amount:'', percentage:0 }])
  const [category,     setCategory]     = useState('Food')
  const [splitMode, setSplitMode] = useState('custom')
  const [totalBill,    setTotalBill]    = useState('')

  const validP      = participants.filter((p) => p.name.trim())
  const totalAmount = validP.reduce((s, p) => s + parseFloat(p.amount || 0), 0)

 useEffect(() => {
  fetchExpenses()

  if (location.state?.voiceData) {
    const {
      participants: vp,
      paidBy: vpb,
      title: vt,
      split_mode: vsm,
      totalAmount: vta
    } = location.state.voiceData

    // clear old form values first
    resetForm()

    // apply voice values
    setPaidBy(vpb)

    setParticipants(
      vp.map((p) => ({
        name: p.name,
        amount: p.amount.toString(),
        percentage: 0
      }))
    )

    setTitle(vt || 'Voice Expense')
    setSplitMode(vsm || 'custom')

    if (vta) {
      setTotalBill(vta.toString())
    }

    setShowModal(true)

    // consume voice data once only
    navigate(location.pathname, {
      replace: true,
      state: {}
    })
  }
}, [location])

  // Lock body scroll when modal is open (prevents background scroll on mobile)
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showModal])

  const fetchExpenses = async () => {
    setLoading(true)
    try { setExpenses(await getExpenses()) }
    catch { toast.error('Could not load expenses') }
    setLoading(false)
  }

  const resetForm = () => {
    setTitle(''); setPaidBy(''); setTotalBill('')
    setParticipants([{ name:'', amount:'', percentage:0 }])
    setCategory('Food'); setSplitMode('equal')
  }

  const addP    = () => setParticipants([...participants, { name:'', amount:'', percentage:0 }])
  const removeP = (i) => setParticipants(participants.filter((_, idx) => idx !== i))
  const updateP = (i, field, val) => {
    const u = [...participants]; u[i] = { ...u[i], [field]: val }; setParticipants(u)
  }

  // Recalculate amounts when total bill changes (for equal/percentage modes)
  const handleTotalBillChange = (val) => {
    setTotalBill(val)
    const tot = parseFloat(val) || 0
    const names = participants.filter((p) => p.name.trim())
    if (!names.length || tot === 0) return
    if (splitMode === 'equal') {
      const each = Math.round((tot / names.length) * 100) / 100
      setParticipants((prev) => prev.map((p) =>
        p.name.trim() ? { ...p, amount: each.toString(), percentage: Math.round((100 / names.length) * 10) / 10 } : p
      ))
    }
  }

  const handleSplitChange = (updated) => {
    setParticipants((prev) =>
      prev.map((p) => {
        const u = updated.find((x) => x.name === p.name)
        return u ? { ...p, amount: u.amount.toString(), percentage: u.percentage } : p
      })
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validP.length) { toast.error('Add at least one participant'); return }
    if (!title.trim())  { toast.error('Add a title'); return }

    const finalP = validP.map((p) => ({
      name:       p.name.trim(),
      amount:     splitMode === 'no_split' ? 0 : parseFloat(p.amount || 0),
      percentage: parseFloat(p.percentage || 0),
    }))

    const finalTotal = splitMode === 'no_split'
      ? parseFloat(totalBill) || totalAmount
      : finalP.reduce((s, p) => s + p.amount, 0) || parseFloat(totalBill) || totalAmount

    setSubmitting(true)
    try {
      await createExpense({
        title,
        paid_by: paidBy.trim() || user.name,
        paid_by_id: null,
        participants: finalP,
        total_amount: finalTotal,
        category,
        split_mode: splitMode,
      })
      toast.success('Expense added! 🎉')
      setShowModal(false)
      resetForm()
      fetchExpenses()
    } catch (err) {
      toast.error(err.message ?? 'Failed to add expense')
    }
    setSubmitting(false)
  }

  const handleDelete = async (id) => {
    try { await deleteExpense(id); toast.success('Deleted'); fetchExpenses() }
    catch { toast.error('Failed to delete') }
  }

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { month:'short', day:'numeric', year:'numeric' })

  const grouped = expenses.reduce((acc, exp) => {
    const k = fmtDate(exp.created_at)
    if (!acc[k]) acc[k] = []
    acc[k].push(exp)
    return acc
  }, {})

  const sliderTotal = parseFloat(totalBill) || (splitMode === 'custom' ? totalAmount : 0) || 100

  return (
    <div className="min-h-screen max-w-md mx-auto relative pb-32">
      <div className="p-5 space-y-5 page-enter">

        {/* Header */}
        <div className="flex justify-between items-center pt-2">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-gray-400">Your Ledger</p>
            <h1 className="text-2xl font-bold text-gray-900">All Expenses</h1>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true) }}
            className="btn-primary w-12 h-12 rounded-2xl flex items-center justify-center">
            <Plus size={22} weight="bold" />
          </button>
        </div>

        {/* Summary */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <Receipt size={18} className="text-[#7c3aed]" weight="fill" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold">Total Records</p>
              <p className="text-base font-bold text-gray-900">{expenses.length} expenses</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 font-semibold">Total Spent</p>
            <p className="text-base font-bold text-[#7c3aed]">
              ₹{expenses.reduce((s, e) => s + Number(e.total_amount), 0).toFixed(0)}
            </p>
          </div>
        </div>

        {/* List */}
        {loading ? (
          [1,2,3].map((i) => (
            <div key={i} className="glass-card p-5 space-y-3 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-1/3" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))
        ) : expenses.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-5xl mb-4">💸</div>
            <p className="font-bold text-gray-400 mb-1">No expenses yet</p>
            <p className="text-xs text-gray-300">Tap + to add your first expense</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, dayExp]) => (
            <div key={date}>
              <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-2 px-1">{date}</p>
              <div className="space-y-2.5">
                {dayExp.map((expense, idx) => (
                  <div key={expense.id} className="glass-card p-5 list-item-enter hover-lift"
                    style={{ animationDelay:`${idx*0.05}s` }}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background:'linear-gradient(135deg,#f5f3ff,#ede9fe)' }}>
                          {CAT_ICONS[expense.category] ?? '📦'}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">{expense.title}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-[#7c3aed] rounded-full">
                              {expense.category}
                            </span>
                            {expense.split_mode && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">
                                {SPLIT_BADGE[expense.split_mode] ?? expense.split_mode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(expense.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-all flex-shrink-0">
                        <Trash size={16} />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-gray-500">
                        Paid by <span className="font-bold text-[#7c3aed]">{expense.paid_by}</span>
                        {expense.split_mode === 'no_split' && (
                          <span className="ml-2 text-amber-500 font-semibold">· No debt</span>
                        )}
                      </p>
                      <div className="bg-gray-50/80 rounded-xl p-3 space-y-1.5">
                        {(expense.participants ?? []).map((p, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-[8px] font-bold text-[#7c3aed]">{p.name[0]}</span>
                              </div>
                              <span className="text-xs font-medium text-gray-700">{p.name}</span>
                              {p.percentage > 0 && (
                                <span className="text-[9px] text-gray-400">({p.percentage}%)</span>
                              )}
                            </div>
                            <span className="text-xs font-bold text-gray-900">
                              {expense.split_mode === 'no_split' ? '— gift' : `₹${Number(p.amount).toFixed(2)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-xs font-semibold text-gray-400">Total paid</span>
                        <span className="text-base font-bold text-gray-900">₹{Number(expense.total_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Add Expense Modal ─────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-end justify-center z-[100]">
          <div className="w-full max-w-md bg-white rounded-t-[28px] flex flex-col" style={{ maxHeight: '90vh', boxShadow: '0 -8px 40px rgba(0,0,0,0.14)' }}>

            {/* Sticky header */}
            <div className="px-6 pt-6 pb-2 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add Expense</h2>
                  <p className="text-xs text-gray-400">Who paid? Who owes? How much?</p>
                </div>
                <button onClick={() => setShowModal(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex-shrink-0">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable form body */}
            <form onSubmit={handleSubmit} id="expense-form" className="flex-1 overflow-y-auto px-6">
              <div className="space-y-5 pt-2">

                {/* Title */}
                <div>
                  <label className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-2">Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Jio recharge for Priya, Dinner at hotel"
                    className={inp} required />
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-2">Category</label>
                  <div className="relative">
                    <select value={category} onChange={(e) => setCategory(e.target.value)}
                      className={`${inp} appearance-none pr-10`}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                    </select>
                    <CaretDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Paid By */}
                <div>
                  <label className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-2">Paid By</label>
                  <input type="text" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}
                    placeholder={user?.name ?? 'Your name'} className={inp} />
                </div>

                {/* Participants */}
                <div>
                  <label className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-2">Participants</label>
                  <div className="space-y-2">
                    {participants.map((p, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input type="text" value={p.name} onChange={(e) => updateP(i,'name',e.target.value)}
                          placeholder="Name"
                          className="flex-1 px-4 py-3 bg-gray-50/80 border border-gray-100 rounded-2xl text-sm font-medium placeholder-gray-300 focus:ring-2 focus:ring-[#7c3aed]/30 focus:bg-white transition-all outline-none" />
                        {splitMode === 'custom' && (
                          <div className="relative w-28">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
                            <input type="number" step="0.01" min="0" value={p.amount}
                              onChange={(e) => updateP(i,'amount',e.target.value)}
                              placeholder="0"
                              className="w-full pl-7 pr-3 py-3 bg-gray-50/80 border border-gray-100 rounded-2xl text-sm font-bold placeholder-gray-300 focus:ring-2 focus:ring-[#7c3aed]/30 focus:bg-white transition-all outline-none" />
                          </div>
                        )}
                        {participants.length > 1 && (
                          <button type="button" onClick={() => removeP(i)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 flex-shrink-0">
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addP}
                    className="mt-3 text-sm font-bold text-[#7c3aed] flex items-center gap-1">
                    <Plus size={16} weight="bold" /> Add Participant
                  </button>
                </div>

                {/* Total bill — shown for equal/percentage/no_split modes */}
                {splitMode !== 'custom' && (
                  <div>
                    <label className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-2">
                      Total Bill Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                      <input type="number" step="0.01" min="0" value={totalBill}
                        onChange={(e) => handleTotalBillChange(e.target.value)}
                        placeholder="Enter total amount paid"
                        className="w-full pl-8 pr-4 py-3.5 bg-gray-50/80 border border-gray-100 rounded-2xl text-sm font-bold placeholder-gray-300 focus:ring-2 focus:ring-[#7c3aed]/30 focus:bg-white transition-all outline-none" />
                    </div>
                  </div>
                )}

                {/* SplitSlider */}
                {validP.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <SplitSlider
                      participants={validP.map((p) => ({
                        name: p.name,
                        amount: parseFloat(p.amount || 0),
                        percentage: parseFloat(p.percentage || 0),
                      }))}
                      totalAmount={sliderTotal}
                      onChange={handleSplitChange}
                      onModeChange={setSplitMode}
                    />
                  </div>
                )}

                {/* Custom mode total preview */}
                {splitMode === 'custom' && totalAmount > 0 && (
                  <div className="p-3 bg-purple-50 rounded-2xl flex justify-between">
                    <span className="text-xs font-semibold text-purple-600">Total Amount</span>
                    <span className="text-sm font-bold text-[#7c3aed]">₹{totalAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Spacer so content never hides behind sticky submit button */}
              <div className="h-4" />
            </form>

            {/* Sticky submit button — always visible, never scrolls away, sits above safe-area */}
            <div
              className="flex-shrink-0 px-6 pt-3 border-t border-gray-100 bg-white"
              style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}
            >
              <button
                type="submit"
                form="expense-form"
                disabled={submitting}
                className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm"
              >
                {submitting
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : 'Add Expense 🎉'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

export default Expenses