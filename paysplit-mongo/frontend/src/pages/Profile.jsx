import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import {
  PencilSimple, CurrencyCircleDollar, CreditCard, Bell, Moon,
  ShieldCheck, Question, SignOut, Star, CaretRight,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

const Profile = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [darkMode,      setDarkMode]      = useState(false)
  const [autoReminders, setAutoReminders] = useState(true)
  const [pushNotifs,    setPushNotifs]    = useState(true)

  const handleLogout = async () => {
    await logout()
    toast.success('See you soon! 👋')
    navigate('/login')
  }

  const Toggle = ({ active, onToggle }) => (
    <button type="button" onClick={onToggle} className={`toggle-switch ${active ? 'active' : ''}`} />
  )

  const Row = ({ icon, label, right, testId, border = true, onClick }) => (
    <button
      data-testid={testId}
      type="button"
      onClick={onClick ?? (() => toast.info('Coming soon!'))}
      className={`w-full flex items-center justify-between py-3.5 text-left transition-colors active:bg-gray-50 ${border ? 'border-b border-gray-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">{right}</div>
    </button>
  )

  const score  = user?.social_credit_score ?? 850
  const sColor = score >= 800 ? 'text-emerald-500' : score >= 600 ? 'text-amber-500' : 'text-red-500'
  const sBg    = score >= 800 ? 'bg-emerald-50 border-emerald-100' : score >= 600 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'
  const sLabel = score >= 800 ? 'Excellent' : score >= 600 ? 'Good' : 'Fair'

  return (
    <div className="min-h-screen max-w-md mx-auto relative pb-32">
      <div className="p-5 space-y-5 page-enter">

        {/* Header */}
        <div className="pt-2">
          <p className="text-xs font-bold tracking-widest uppercase text-gray-400">Account</p>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        </div>

        {/* Profile card */}
        <div className="glass-card p-6 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white shadow-lg">
              <img
                src={user?.profile_image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => toast.info('Profile editing coming soon!')}
              className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center text-white shadow-md"
            >
              <PencilSimple size={14} weight="bold" />
            </button>
          </div>

          <h2 className="text-xl font-bold text-gray-900">{user?.name ?? 'User'}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>

          {/* Score badge */}
          <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border ${sBg}`}>
            <Star size={16} className={sColor} weight="fill" />
            <span className={`text-sm font-bold ${sColor}`}>{score}</span>
            <span className="text-xs font-semibold text-gray-500">Social Credit</span>
          </div>

          {/* Score bar */}
          <div className="mt-4 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#a855f7] transition-all"
              style={{ width: `${(score / 1000) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{score}/1000 · {sLabel}</p>
        </div>

        {/* Financial */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <CurrencyCircleDollar size={18} className="text-[#7c3aed]" weight="fill" />
            </div>
            <h3 className="font-bold text-gray-900">Financial</h3>
          </div>
          <Row
            icon={<span className="text-base font-bold text-gray-400">₹</span>}
            label="Default Currency"
            right={<span className="text-xs font-bold text-[#7c3aed]">INR (₹)</span>}
          />
          <Row
            icon={<CreditCard size={18} className="text-gray-400" />}
            label="Payment Methods"
            right={
              <>
                <span className="text-xs text-gray-400">UPI · Cards</span>
                <CaretRight size={16} className="text-gray-300" />
              </>
            }
            border={false}
          />
        </div>

        {/* Notifications */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Bell size={18} className="text-amber-500" weight="fill" />
            </div>
            <h3 className="font-bold text-gray-900">Notifications</h3>
          </div>
          <Row
            icon={<Bell size={18} className="text-gray-400" />}
            label="Auto-Reminders"
            right={<Toggle active={autoReminders} onToggle={() => setAutoReminders(!autoReminders)} />}
          />
          <Row
            icon={<Bell size={18} className="text-gray-400" />}
            label="Push Notifications"
            right={<Toggle active={pushNotifs} onToggle={() => setPushNotifs(!pushNotifs)} />}
            border={false}
          />
        </div>

        {/* App Preferences */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-600">APP</span>
            </div>
            <h3 className="font-bold text-gray-900">App Preferences</h3>
          </div>
          <Row
            icon={<Moon size={18} className="text-gray-400" />}
            label="Dark Mode"
            right={
              <Toggle
                active={darkMode}
                onToggle={() => { setDarkMode(!darkMode); toast.info('Dark mode coming soon!') }}
              />
            }
          />
          <Row
            icon={<span className="text-base">🎙️</span>}
            label="Voice Sensitivity"
            right={<span className="text-xs font-bold text-[#7c3aed]">High</span>}
          />
          <Row
            icon={<ShieldCheck size={18} className="text-gray-400" />}
            label="Privacy & Security"
            right={<CaretRight size={16} className="text-gray-300" />}
          />
          <Row
            icon={<Question size={18} className="text-gray-400" />}
            label="Help & Support"
            right={<CaretRight size={16} className="text-gray-300" />}
            border={false}
          />
        </div>

        {/* App info */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500">PAYSPLIT · v1.0.0</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center">
            <span className="text-white font-bold text-base">₹</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 border border-red-100 hover:bg-red-100"
        >
          <SignOut size={18} weight="bold" />
          Sign Out
        </button>

      </div>
      <BottomNav />
    </div>
  )
}

export default Profile
