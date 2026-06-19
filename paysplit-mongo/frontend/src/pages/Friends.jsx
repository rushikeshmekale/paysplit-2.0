import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import {
  getFriends,
  settleWithFriend,
  getContacts,
  updateContact
} from '../lib/api'
import {
  CurrencyCircleDollar, Handshake, Bell, Users,
  ArrowUp, ArrowDown, CheckCircle, Clock
} from '@phosphor-icons/react'
import { toast } from 'sonner'

const Friends = () => {
  const { user }    = useAuth()
  const [friends,   setFriends]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [settling,  setSettling]  = useState(null)
  const [filter,    setFilter]    = useState('all') // all | owe | owed

  // contacts shape: { [friendName]: { phone, upi_id } }
  const [contacts, setContacts] = useState({})

  const [editFor, setEditFor]     = useState(null) // friend name being edited
  const [phoneInput, setPhoneInput] = useState('')
  const [upiInput, setUpiInput]     = useState('')

  const [paymentFriend, setPaymentFriend] = useState(null)

  useEffect(() => {
    getContacts()
      .then(list => {
        const map = {}
        list.forEach(c => {
          map[c.friend_name] = { phone: c.phone, upi_id: c.upi_id }
        })
        setContacts(map)
      })
      .catch(() => {})
  }, [])

  useEffect(() => { fetchFriends() }, [])

  useEffect(() => {
    const onFocus = () => {
      const pending = localStorage.getItem('pending_payment')
      if (!pending) return
      const { friend } = JSON.parse(pending)
      setPaymentFriend(friend)
      localStorage.removeItem('pending_payment')
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const fetchFriends = async () => {
    setLoading(true)
    try { setFriends(await getFriends()) }
    catch { toast.error('Could not load friends') }
    setLoading(false)
  }

  const handleSettle = async (name) => {
    setSettling(name)
    try {
      const result = await settleWithFriend(name)
      if (result.settled_count > 0) {
        toast.success(`✅ Settled with ${name}!`)
      } else {
        toast.info(`Nothing to settle with ${name}`)
      }
      fetchFriends()
    } catch {
      toast.error('Failed to settle')
    }
    setSettling(null)
  }

  const onlyDigits = (value = '') => value.replace(/\D/g, '')

  const toIntlNumber = (phone = '') => {
    const digits = onlyDigits(phone)
    if (!digits) return null
    if (digits.length === 10) return `91${digits}`
    if (digits.length === 12 && digits.startsWith('91')) return digits
    return digits
  }

  const openContactEditor = (friend) => {
    setEditFor(friend.name)
    setPhoneInput(contacts[friend.name]?.phone || friend.phone || '')
    setUpiInput(contacts[friend.name]?.upi_id || '')
  }

  const saveContact = async () => {
    try {
      await updateContact(editFor, { phone: phoneInput, upi_id: upiInput })
      setContacts(prev => ({
        ...prev,
        [editFor]: { phone: phoneInput, upi_id: upiInput },
      }))
      toast.success('Contact saved')
      setEditFor(null)
    } catch {
      toast.error('Could not save contact')
    }
  }

  const handleRequest = (friend) => {
    if (!user?.upi_id) {
      toast.error('Add your UPI ID in Profile first')
      return
    }

    const rawPhone = contacts[friend.name]?.phone || friend.phone
    const intl = toIntlNumber(rawPhone)
    if (!intl) {
      toast.error(`Add a phone number for ${friend.name} first`)
      openContactEditor(friend)
      return
    }

    const amount = Math.abs(friend.balance).toFixed(0)

    const payLink =
      `upi://pay?pa=${encodeURIComponent(user.upi_id)}` +
      `&pn=${encodeURIComponent(user.name)}` +
      `&am=${amount}` +
      `&cu=INR` +
      `&tn=${encodeURIComponent('PaySplit settlement')}`

    const message =
      `💰 *Payment Request* 💰\n\n` +
      `Hey ${friend.name}! 👋\n\n` +
      `You owe me ₹${amount} on PaySplit.\n\n` +
      `Tap below to pay instantly 👇\n${payLink}\n\n` +
      `Thanks! 🙏`

    window.open(
      `https://wa.me/${intl}?text=${encodeURIComponent(message)}`,
      '_blank'
    )

    toast.success(`Opened WhatsApp request for ${friend.name}`)
  }

  const handlePay = (friend) => {
    const upiId = contacts[friend.name]?.upi_id

    if (!upiId) {
      toast.error(`Add a UPI ID for ${friend.name} first`)
      openContactEditor(friend)
      return
    }

    const amount = Math.abs(friend.balance).toFixed(2)

    const link =
      `upi://pay?pa=${encodeURIComponent(upiId)}` +
      `&pn=${encodeURIComponent(friend.name)}` +
      `&am=${amount}` +
      `&cu=INR` +
      `&tn=${encodeURIComponent('PaySplit settlement')}`

    localStorage.setItem(
      'pending_payment',
      JSON.stringify({ friend: friend.name })
    )

    window.location.href = link
  }

  const confirmSettlement = async () => {
    try {
      await settleWithFriend(paymentFriend)
      toast.success(`Settled with ${paymentFriend}`)
      fetchFriends()
      setPaymentFriend(null)
    } catch {
      toast.error('Could not settle')
    }
  }

  const totalOwed  = friends.filter(f => f.balance > 0).reduce((s, f) => s + f.balance, 0)
  const totalOwing = friends.filter(f => f.balance < 0).reduce((s, f) => s + Math.abs(f.balance), 0)

  const filtered = friends.filter(f => {
    if (filter === 'owe') return f.balance < 0
    if (filter === 'owed') return f.balance > 0
    return true
  })

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
          <div
            className={`glass-card p-4 cursor-pointer transition-all ${filter === 'owed' ? 'ring-2 ring-emerald-400' : ''}`}
            onClick={() => setFilter(filter === 'owed' ? 'all' : 'owed')}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                <ArrowUp size={16} className="text-emerald-500" weight="bold" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">You'll Receive</span>
            </div>
            <p className="text-xl font-bold text-emerald-500">₹{totalOwed.toFixed(0)}</p>
            <p className="text-[10px] text-gray-400 mt-1">{friends.filter(f => f.balance > 0).length} people owe you</p>
          </div>
          <div
            className={`glass-card p-4 cursor-pointer transition-all ${filter === 'owe' ? 'ring-2 ring-red-400' : ''}`}
            onClick={() => setFilter(filter === 'owe' ? 'all' : 'owe')}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                <ArrowDown size={16} className="text-red-500" weight="bold" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">You'll Pay</span>
            </div>
            <p className="text-xl font-bold text-red-500">₹{totalOwing.toFixed(0)}</p>
            <p className="text-[10px] text-gray-400 mt-1">You owe {friends.filter(f => f.balance < 0).length} people</p>
          </div>
        </div>

        {/* Filter tabs */}
        {friends.length > 0 && (
          <div className="flex gap-2">
            {['all', 'owed', 'owe'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filter === f
                    ? 'bg-[#7c3aed] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All' : f === 'owed' ? '💚 They Owe' : '❤️ You Owe'}
              </button>
            ))}
          </div>
        )}

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
          ) : filtered.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 bg-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-[#7c3aed]" weight="duotone" />
              </div>
              <p className="font-bold text-gray-400 mb-1">
                {filter === 'all' ? 'No friends yet' : 'No entries here'}
              </p>
              <p className="text-xs text-gray-300 leading-relaxed max-w-xs mx-auto">
                {filter === 'all'
                  ? 'Add expenses with someone\'s name — they\'ll appear here automatically.'
                  : 'Try switching to "All" filter.'}
              </p>
            </div>
          ) : (
            filtered.map((friend, idx) => {
              const isPos     = friend.balance > 0   // they owe me
              const isNeg     = friend.balance < 0   // I owe them
              const isNeutral = friend.balance === 0

              return (
                <div
                  key={friend.id ?? friend.name}
                  className="glass-card overflow-hidden hover-lift list-item-enter"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {/* Color strip on left */}
                  <div className="flex">
                    <div className={`w-1.5 flex-shrink-0 ${isPos ? 'bg-emerald-400' : isNeg ? 'bg-red-400' : 'bg-gray-200'}`} />

                    <div className="flex-1 p-4">
                      {/* Friend info row */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                            <img
                              src={friend.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.name}`}
                              alt={friend.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${friend.name}&backgroundColor=7c3aed&textColor=ffffff`
                              }}
                            />
                          </div>
                          {/* Status dot */}
                          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                            isNeutral ? 'bg-gray-300' : isPos ? 'bg-emerald-400' : 'bg-red-400'
                          }`}>
                            {isNeutral && <CheckCircle size={10} className="text-white" weight="fill" />}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900">{friend.name}</h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openContactEditor(friend)}
                              className="text-[10px] text-[#7c3aed] font-bold"
                            >
                              {contacts[friend.name]?.phone || contacts[friend.name]?.upi_id ? 'Edit Contact' : 'Add Contact'}
                            </button>
                          </div>
                          <p className="text-xs text-gray-400 truncate">{friend.email}</p>
                          {friend.is_registered && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-50 text-[#7c3aed] rounded-full">
                              PaySplit user
                            </span>
                          )}
                        </div>

                        {/* Balance badge */}
                        <div className="text-right flex-shrink-0">
                          {isNeutral ? (
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-xl">
                                <CheckCircle size={14} className="text-gray-400" weight="fill" />
                                <p className="text-xs font-bold text-gray-500">Settled</p>
                              </div>
                            </div>
                          ) : (
                            <div className={`px-3 py-1.5 rounded-2xl ${isPos ? 'bg-emerald-50' : 'bg-red-50'}`}>
                              <p className={`text-lg font-bold ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                                {isPos ? '+' : '-'}₹{Math.abs(friend.balance).toFixed(0)}
                              </p>
                              <div className="flex items-center gap-1 justify-end">
                                {isPos
                                  ? <ArrowUp size={10} className="text-emerald-400" weight="bold" />
                                  : <ArrowDown size={10} className="text-red-400" weight="bold" />
                                }
                                <p className="text-[10px] font-semibold text-gray-400">
                                  {isPos ? 'owes you' : 'you owe'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status message */}
                      {!isNeutral && (
                        <div className={`mb-3 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                          isPos ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          <Clock size={12} />
                          {isPos
                            ? `${friend.name} needs to pay you ₹${Math.abs(friend.balance).toFixed(0)}`
                            : `You need to pay ${friend.name} ₹${Math.abs(friend.balance).toFixed(0)}`
                          }
                        </div>
                      )}

                      {/* Action buttons */}
                      {/* Action buttons */}
                        <div className="flex gap-2">

                          {/* Pay button — only if YOU owe them */}
                          {isNeg && (
                            <button
                              onClick={() => handlePay(friend)}
                              className="flex-1 py-2.5 bg-purple-50 text-[#7c3aed] rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 hover:bg-purple-100"
                            >
                              <CurrencyCircleDollar size={16} weight="fill" /> Pay
                            </button>
                          )}

                          {/* Settle button */}
                          <button
                            onClick={() => handleSettle(friend.name)}
                            disabled={settling === friend.name}
                            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-60 ${
                              isNeutral
                                ? 'bg-gray-100 text-gray-400 cursor-default'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            {settling === friend.name ? (
                              <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                            ) : (
                              <>
                                <Handshake size={16} weight="fill" />
                                {isNeutral ? 'Settled ✓' : 'Mark Settled'}
                              </>
                            )}
                          </button>

                          {/* Request button — only if THEY owe you */}
                          {isPos && (
                            <button
                              onClick={() => handleRequest(friend)}
                              className="flex-1 py-2.5 bg-amber-50 text-amber-600 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 hover:bg-amber-100"
                            >
                              <Bell size={16} weight="fill" /> Request
                            </button>
                          )}

                        </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Info box */}
        {friends.length > 0 && (
          <div className="glass-card p-4 flex gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <div>
              <p className="text-xs font-bold text-gray-600">How to use</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Add expenses using a friend's name — their balance updates instantly.
                Tap <strong>Mark Settled</strong> when payment is done. Green = they owe you, Red = you owe them.
              </p>
            </div>
          </div>
        )}

      </div>

      {editFor && (
        <>
          <div
            className="modal-backdrop"
            onClick={() => setEditFor(null)}
          />

          <div className="bottom-sheet">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-5" />

            <h3 className="text-lg font-bold mb-4">Contact Details</h3>
            <p className="text-sm text-gray-500 mb-3">{editFor}</p>

            <label className="text-xs font-bold text-gray-500 block mb-1">
              UPI ID (for Pay)
            </label>
            <input
              type="text"
              value={upiInput}
              onChange={(e) => setUpiInput(e.target.value)}
              placeholder="friend@bank"
              className="w-full px-4 py-3 border rounded-2xl mb-3"
            />

            <label className="text-xs font-bold text-gray-500 block mb-1">
              Phone Number (for Request)
            </label>
            <input
              type="text"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="9876543210"
              className="w-full px-4 py-3 border rounded-2xl"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setEditFor(null)}
                className="flex-1 py-3 rounded-2xl bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={saveContact}
                className="flex-1 py-3 rounded-2xl bg-[#7c3aed] text-white"
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}

      {paymentFriend && (
        <>
          <div
            className="modal-backdrop"
            onClick={() => setPaymentFriend(null)}
          />

          <div className="bottom-sheet">
            <h3 className="text-lg font-bold mb-3">Payment Complete?</h3>
            <p className="text-gray-500 mb-5">Did you successfully pay {paymentFriend}?</p>

            <div className="flex gap-3">
              <button
                onClick={() => setPaymentFriend(null)}
                className="flex-1 py-3 rounded-2xl bg-gray-100"
              >
                Not Yet
              </button>

              <button
                onClick={confirmSettlement}
                className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white"
              >
                Yes, Paid
              </button>
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  )
}

export default Friends