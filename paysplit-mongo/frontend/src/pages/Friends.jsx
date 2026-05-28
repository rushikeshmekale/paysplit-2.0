import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import { getFriends, settleWithFriend } from '../lib/api'
import { CurrencyCircleDollar, Handshake, Bell, Users, ArrowUp, ArrowDown } from '@phosphor-icons/react'
import { toast } from 'sonner'

const Friends = () => {
  const { user }   = useAuth()
  const [friends,  setFriends]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [settling, setSettling] = useState(null)

  useEffect(() => { fetchFriends() }, [])

  const fetchFriends = async () => {
    setLoading(true)
    try { setFriends(await getFriends()) }
    catch { toast.error('Could not load friends') }
    setLoading(false)
  }

  const handleSettle = async (name) => {
    setSettling(name)
    try {
      await settleWithFriend(name)
      toast.success(`Settled with ${name}! ✅`)
      fetchFriends()
    } catch {
      toast.error('Failed to settle')
    }
    setSettling(null)
  }

  const totalOwed  = friends.filter((f) => f.balance > 0).reduce((s, f) => s + f.balance, 0)
  const totalOwing = friends.filter((f) => f.balance < 0).reduce((s, f) => s + Math.abs(f.balance), 0)

  return (
    <div className="min-h-screen max-w-md mx-auto relative pb-32">
      <div className="p-5 space-y-5 page-enter">

        {/* Header */}
        <div className="pt-2">
          <p className="text-xs font-bold tracking-widest uppercase text-gray-400">Your Circle</p>
          <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                <ArrowUp size={16} className="text-emerald-500" weight="bold" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">You'll Receive</span>
            </div>
            <p className="text-xl font-bold text-emerald-500">₹{totalOwed.toFixed(0)}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                <ArrowDown size={16} className="text-red-500" weight="bold" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">You'll Pay</span>
            </div>
            <p className="text-xl font-bold text-red-500">₹{totalOwing.toFixed(0)}</p>
          </div>
        </div>

        {/* Friends list */}
        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-2 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
                <div className="h-10 bg-gray-100 rounded-2xl" />
              </div>
            ))
          ) : friends.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 bg-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-[#7c3aed]" weight="duotone" />
              </div>
              <p className="font-bold text-gray-400 mb-1">No friends yet</p>
              <p className="text-xs text-gray-300 leading-relaxed max-w-xs mx-auto">
                Register other users and add expenses using their names as participants — they'll appear here.
              </p>
            </div>
          ) : (
            friends.map((friend, idx) => {
              const isPos     = friend.balance > 0
              const isNeutral = friend.balance === 0
              return (
                <div key={friend.id}
                  className="glass-card p-5 hover-lift list-item-enter"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                        <img
                          src={friend.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.name}`}
                          alt={friend.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${friend.name}` }}
                        />
                      </div>
                      {!isNeutral && (
                        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${isPos ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900">{friend.name}</h3>
                      <p className="text-xs text-gray-400 truncate">{friend.email}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      {isNeutral ? (
                        <div className="px-3 py-1.5 bg-gray-100 rounded-full">
                          <p className="text-xs font-bold text-gray-500">Settled ✓</p>
                        </div>
                      ) : (
                        <>
                          <p className={`text-lg font-bold ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isPos ? '+' : '-'}₹{Math.abs(friend.balance).toFixed(0)}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{isPos ? 'owes you' : 'you owe'}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toast.info('Payment integration coming soon!')}
                      className="flex-1 py-2.5 bg-purple-50 text-[#7c3aed] rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 hover:bg-purple-100"
                    >
                      <CurrencyCircleDollar size={16} weight="fill" /> Pay
                    </button>
                    <button
                      onClick={() => handleSettle(friend.name)}
                      disabled={settling === friend.name}
                      className="flex-1 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 hover:bg-emerald-100 disabled:opacity-60"
                    >
                      {settling === friend.name
                        ? <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                        : <><Handshake size={16} weight="fill" /> Settle</>
                      }
                    </button>
                    <button
                      onClick={() => toast.success(`Pinged ${friend.name}! 🔔`)}
                      className="flex-1 py-2.5 bg-amber-50 text-amber-600 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 hover:bg-amber-100"
                    >
                      <Bell size={16} weight="fill" /> Ping
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Info box */}
        <div className="glass-card p-4 flex gap-3">
          <span className="text-xl flex-shrink-0">ℹ️</span>
          <div>
            <p className="text-xs font-bold text-gray-600">How balances work</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              When you add an expense with someone's name as a participant,
              the balance updates here automatically. "No Split" expenses are excluded from balances.
            </p>
          </div>
        </div>

      </div>
      <BottomNav />
    </div>
  )
}

export default Friends
