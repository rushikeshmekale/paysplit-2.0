import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import { getBalance, getStats, getExpenses, deleteExpense } from '../lib/api'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Microphone, Trash, ArrowUp, ArrowDown, ArrowRight, Lightning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

const COLORS    = ['#7c3aed','#a855f7','#c084fc','#ddd6fe','#ede9fe']
const CAT_ICONS = { Food:'🍜', Transport:'🚗', Entertainment:'🎬', Shopping:'🛍️', Bills:'💡', Other:'📦' }

const Home = () => {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [balance,  setBalance]  = useState({ you_owe:0, they_owe:0, net:0 })
  const [stats,    setStats]    = useState({ total_expenses:0, categories:{}, expense_count:0 })
  const [expenses, setExpenses] = useState([])
  const [isRec,    setIsRec]    = useState(false)
  const [recog,    setRecog]    = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => { fetchAll(); initVoice() }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([
      getBalance().then(setBalance).catch(() => {}),
      getStats().then(setStats).catch(() => {}),
      getExpenses().then((d) => setExpenses(d.slice(0, 6))).catch(() => {}),
    ])
    setLoading(false)
  }

  const initVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const r = new SR()
    r.continuous = false
    r.interimResults = false
    r.lang = 'en-IN'
    r.onresult = (e) => parseVoice(e.results[0][0].transcript)
    r.onerror  = () => { toast.error('Voice error, try again'); setIsRec(false) }
    r.onend    = () => setIsRec(false)
    setRecog(r)
  }

  const startRec = () => {
    if (recog) {
      setIsRec(true)
      recog.start()
      toast.info('🎙️ Listening… say "I paid Aryan 300 for food"')
    } else {
      toast.error('Voice not supported in this browser')
    }
  }

  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''

  const parseVoice = (t) => {
    const raw = t.toLowerCase().trim()
    console.log('Voice input:', raw)

    let paidBy = user.name
    let title = 'Voice Expense'
    let amount = 0
    let friendName = ''
    let iAmPayer = true

    // Pattern 1: "I paid Aryan 300 for food" / "paid Aryan 300"
    const iPaidPattern = /(?:i\s+)?(?:paid|gave|given|lent|sent|transferred)\s+(\w+)\s+(?:rs\.?|₹|rupees?)?\s*(\d+(?:\.\d+)?)(?:\s+for\s+(.+))?/i
    // Pattern 2: "Aryan paid me 300" / "Aryan gave me 300 for food"
    const theyPaidPattern = /(\w+)\s+(?:paid|gave|given|sent|transferred)\s+(?:me|us)\s+(?:rs\.?|₹|rupees?)?\s*(\d+(?:\.\d+)?)(?:\s+for\s+(.+))?/i
    // Pattern 3: "Aryan owes me 300"
    const owesPattern = /(\w+)\s+owes?\s+(?:me|us)\s+(?:rs\.?|₹|rupees?)?\s*(\d+(?:\.\d+)?)(?:\s+for\s+(.+))?/i
    // Pattern 4: "I owe Aryan 300"
    const iOwePattern = /(?:i\s+)?owe\s+(\w+)\s+(?:rs\.?|₹|rupees?)?\s*(\d+(?:\.\d+)?)(?:\s+for\s+(.+))?/i
    // Pattern 5: "300 for food with Aryan" / "300 to Aryan"
    const amountFirstPattern = /(?:rs\.?|₹|rupees?)?\s*(\d+(?:\.\d+)?)\s+(?:for\s+\w+\s+)?(?:to|with|from)\s+(\w+)(?:\s+for\s+(.+))?/i

    let match = null

    if ((match = raw.match(iPaidPattern))) {
      friendName = cap(match[1])
      amount = parseFloat(match[2])
      title = match[3] ? cap(match[3].trim()) : `Payment to ${friendName}`
      paidBy = user.name
      iAmPayer = true
    } else if ((match = raw.match(theyPaidPattern))) {
      friendName = cap(match[1])
      amount = parseFloat(match[2])
      title = match[3] ? cap(match[3].trim()) : `Payment from ${friendName}`
      paidBy = friendName
      iAmPayer = false
    } else if ((match = raw.match(owesPattern))) {
      friendName = cap(match[1])
      amount = parseFloat(match[2])
      title = match[3] ? cap(match[3].trim()) : `${friendName} owes me`
      paidBy = user.name
      iAmPayer = true
    } else if ((match = raw.match(iOwePattern))) {
      friendName = cap(match[1])
      amount = parseFloat(match[2])
      title = match[3] ? cap(match[3].trim()) : `I owe ${friendName}`
      paidBy = friendName
      iAmPayer = false
    } else if ((match = raw.match(amountFirstPattern))) {
      amount = parseFloat(match[1])
      friendName = cap(match[2])
      title = match[3] ? cap(match[3].trim()) : `Payment with ${friendName}`
      paidBy = user.name
      iAmPayer = true
    } else {
      // Fallback: old format "Rohit 80, me 60, paid by me"
      const parts = raw.split(',')
      const participants = []
      let pb = user.name
      parts.forEach((part) => {
        const s = part.trim()
        if (s.includes('paid by')) {
          const p = s.replace('paid by', '').trim()
          pb = p === 'me' ? user.name : cap(p)
        } else {
          const m2 = s.match(/(\w+)\s+(\d+(?:\.\d+)?)/)
          if (m2) participants.push({ name: m2[1] === 'me' ? user.name : cap(m2[1]), amount: parseFloat(m2[2]) })
        }
      })
      if (participants.length) {
        navigate('/expenses', {
          state: {
            voiceData: {
              participants,
              paidBy: pb,
              totalAmount: participants.reduce((s, p) => s + p.amount, 0),
              title: 'Voice Expense',
              split_mode: 'custom',
            }
          }
        })
        return
      }
      toast.error('Try: "I paid Aryan 300 for food" or "Aryan paid me 200"')
      return
    }

    if (friendName && amount > 0) {
      // Skip common words mistaken as names
      const skipWords = ['me', 'us', 'him', 'her', 'them', 'you', 'my', 'the', 'a', 'an']
      if (skipWords.includes(friendName.toLowerCase())) {
        toast.error('Could not detect friend name. Try: "I paid Aryan 300 for food"')
        return
      }

      const participants = iAmPayer
        ? [
            { name: user.name, amount: 0, percentage: 0 },
            { name: friendName, amount: amount, percentage: 100 },
          ]
        : [
            { name: user.name, amount: amount, percentage: 100 },
            { name: friendName, amount: 0, percentage: 0 },
          ]

      toast.success(`🎙️ "${title}" ₹${amount} — ${iAmPayer ? `you paid ${friendName}` : `${friendName} paid you`}`)

      navigate('/expenses', {
        state: {
          voiceData: {
            participants,
            paidBy,
            totalAmount: amount,
            title,
            split_mode: 'custom',
          }
        }
      })
    } else {
      toast.error('Try: "I paid Aryan 300 for food" or "Aryan paid me 200"')
    }
  }

  const handleDelete = async (id) => {
    try { await deleteExpense(id); toast.success('Removed'); fetchAll() }
    catch { toast.error('Failed to delete') }
  }

  const timeAgo = (d) => {
    const h = Math.floor((Date.now() - new Date(d)) / 3600000)
    if (h < 1) return 'Just now'
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  const chartData = Object.entries(stats.categories).map(([name, value]) => ({ name, value }))

  return (
    <div className="min-h-screen max-w-md mx-auto relative pb-32">
      <div className="p-5 space-y-5 page-enter">

        {/* Header */}
        <div className="flex justify-between items-center pt-2">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-gray-400">PaySplit</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Hi, {user?.name ?? 'there'} 👋</h1>
          </div>
          <div className="relative cursor-pointer" onClick={() => navigate('/profile')}>
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
              <img
                src={user?.profile_image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                alt="" className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
        </div>

        {/* Expense Ring */}
        <div className="glass-card p-6 hover-lift">
          <div className="flex flex-col items-center">
            <div className="relative w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.length ? chartData : [{ name: 'empty', value: 1 }]}
                    cx="50%" cy="50%" innerRadius={64} outerRadius={84}
                    paddingAngle={chartData.length ? 3 : 0} dataKey="value"
                    startAngle={90} endAngle={-270}
                  >
                    {(chartData.length ? chartData : [{ name: 'e', value: 1 }]).map((_, i) => (
                      <Cell key={i} fill={chartData.length ? COLORS[i % COLORS.length] : '#f3f4f6'} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold text-gray-900">₹{stats.total_expenses.toFixed(0)}</p>
                <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mt-1">Total Spent</p>
              </div>
            </div>
            <div className="w-full mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-3">Monthly Flow</p>
              {chartData.length ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.categories).map(([cat, amt]) => (
                    <div key={cat} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-full border border-purple-100">
                      <span>{CAT_ICONS[cat] ?? '📦'}</span>
                      <span className="text-xs font-semibold text-gray-700">{cat}</span>
                      <span className="text-xs font-bold text-[#7c3aed]">₹{amt.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-2">Add your first expense below!</p>
              )}
            </div>
          </div>
        </div>

        {/* Voice Card */}
        <div className="relative overflow-hidden rounded-3xl p-6"
          style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#a855f7 60%,#c084fc 100%)' }}>
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-8 w-20 h-20 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative flex items-center justify-between">
            <div className="flex-1 mr-4">
              <p className="text-white/70 text-xs font-bold tracking-widest uppercase mb-1">Quick Add</p>
              <p className="text-white text-xl font-bold">New Expense?</p>
              <p className="text-white/60 text-[11px] mt-1 leading-relaxed">
                Say: "I paid Aryan 300 for food"<br/>
                or "Aryan paid me 500"
              </p>
            </div>
            <button
              onClick={startRec} disabled={isRec}
              className={`w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border-2 border-white/30 transition-all active:scale-95 flex-shrink-0 ${
                isRec ? 'recording-pulse bg-white/30' : 'hover:bg-white/30'
              }`}
            >
              <Microphone size={28} weight={isRec ? 'fill' : 'regular'} />
            </button>
          </div>
          {isRec && (
            <div className="relative mt-3 flex items-center gap-2">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="w-1 bg-white/70 rounded-full animate-pulse"
                  style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }} />
              ))}
              <span className="text-white/70 text-xs ml-1">Listening…</span>
            </div>
          )}
        </div>

        {/* Balance Card — only show if there are pending amounts */}
        {(balance.you_owe > 0 || balance.they_owe > 0) && (
          <div className="glass-card p-5 hover-lift">
            <p className="text-xs font-bold tracking-widests uppercase text-gray-400 mb-4">Pending Settlements</p>
            <div className="space-y-3">
              {balance.you_owe > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <ArrowDown size={18} className="text-red-500" weight="bold" />
                    <span className="text-sm font-semibold text-gray-700">You owe</span>
                  </div>
                  <span className="text-lg font-bold text-red-500">₹{balance.you_owe.toFixed(2)}</span>
                </div>
              )}
              {balance.they_owe > 0 && (
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <ArrowUp size={18} className="text-emerald-500" weight="bold" />
                    <span className="text-sm font-semibold text-gray-700">They owe you</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-500">₹{balance.they_owe.toFixed(2)}</span>
                </div>
              )}
              {balance.net !== 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs font-bold tracking-widest uppercase text-gray-400">Net</span>
                  <span className={`text-base font-bold ${balance.net > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {balance.net > 0 ? '+' : ''}₹{balance.net.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold tracking-widest uppercase text-gray-400">Recent Activity</p>
            <button onClick={() => navigate('/expenses')} className="flex items-center gap-1 text-xs font-bold text-[#7c3aed]">
              View all <ArrowRight size={12} weight="bold" />
            </button>
          </div>
          <div className="space-y-2.5">
            {loading ? (
              [1,2,3].map((i) => (
                <div key={i} className="glass-card p-4 flex items-center gap-3 animate-pulse">
                  <div className="w-11 h-11 bg-gray-100 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                    <div className="h-2 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              ))
            ) : expenses.length > 0 ? (
              expenses.map((exp, idx) => (
                <div key={exp.id}
                  className="glass-card p-4 flex items-center gap-3 list-item-enter hover-lift"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' }}>
                    {CAT_ICONS[exp.category] ?? '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{exp.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Paid by <span className="text-[#7c3aed] font-bold">{exp.paid_by}</span>
                      {' · '}{timeAgo(exp.created_at)}
                      {exp.split_mode === 'no_split' && <span className="ml-1 text-amber-500">· Gift 🎁</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-gray-900 text-sm">₹{Number(exp.total_amount).toFixed(0)}</span>
                    <button onClick={() => handleDelete(exp.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-all">
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-card p-10 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm font-bold text-gray-400">No expenses yet</p>
                <p className="text-xs text-gray-300 mt-1">Tap mic or add expense above!</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-2">
              <Lightning size={20} className="text-[#7c3aed]" weight="fill" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.expense_count}</p>
            <p className="text-xs text-gray-400 font-semibold">Transactions</p>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
              <ArrowUp size={18} className="text-emerald-500" weight="bold" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.categories).length}</p>
            <p className="text-xs text-gray-400 font-semibold">Categories</p>
          </div>
        </div>

      </div>
      <BottomNav />
    </div>
  )
}

export default Home