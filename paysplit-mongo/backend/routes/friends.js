// backend/routes/friends.js
import express from 'express'
import User from '../models/User.js'
import Expense from '../models/Expense.js'
import protect from '../middleware/auth.js'
import Contact from '../models/Contact.js'

const router = express.Router()
router.use(protect)

const norm = (s) => (s || '').trim().toLowerCase()
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// ── GET /api/friends ────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const currentUser = req.user
    const userKey      = norm(currentUser.name)

    const expenses = await Expense.find({
      user_id: currentUser._id,
      settled_at: null
    }).lean()

    const balances     = {}
    const friendSet     = new Set()
    const displayNames  = {}

    for (const exp of expenses) {
      if (exp.split_mode === 'no_split') continue
      const paidByKey = norm(exp.paid_by)

      if (paidByKey === userKey) {
        for (const p of exp.participants || []) {
          const pKey = norm(p.name)
          if (pKey === userKey) continue
          friendSet.add(pKey)
          if (!displayNames[pKey]) displayNames[pKey] = p.name
          balances[pKey] = (balances[pKey] || 0) + Number(p.amount || 0)
        }
      } else {
        friendSet.add(paidByKey)
        if (!displayNames[paidByKey]) displayNames[paidByKey] = exp.paid_by
        const myShare = (exp.participants || []).find(p => norm(p.name) === userKey)
        if (myShare) {
          balances[paidByKey] = (balances[paidByKey] || 0) - Number(myShare.amount || 0)
        }
      }
    }

    const registeredUsers = await User
      .find({ _id: { $ne: currentUser._id } })
      .select('name email profile_image')
      .lean()

    const userMap = {}
    registeredUsers.forEach(u => { userMap[norm(u.name)] = u })

    const contacts = await Contact.find({ user_id: currentUser._id }).lean()
    const contactMap = {}
    contacts.forEach(c => { contactMap[norm(c.friend_name)] = { phone: c.phone, upi_id: c.upi_id } })

    const friends = Array.from(friendSet).map(key => {
      const registeredUser = userMap[key]
      const name = displayNames[key] || key
      return {
        id:            registeredUser?._id?.toString() || key,
        name,
        email:         registeredUser?.email || `${name.toLowerCase()}@paysplit.app`,
        profile_image: registeredUser?.profile_image || null,
        phone: contactMap[key]?.phone || registeredUser?.phone || '',
        upi_id: contactMap[key]?.upi_id || '',
        balance:       Math.round((balances[key] || 0) * 100) / 100,
        is_registered: !!registeredUser,
      }
    })

    friends.sort((a, b) => {
      if (a.balance > 0 && b.balance <= 0) return -1
      if (b.balance > 0 && a.balance <= 0) return 1
      if (a.balance < 0 && b.balance === 0) return -1
      if (b.balance < 0 && a.balance === 0) return 1
      return Math.abs(b.balance) - Math.abs(a.balance)
    })

    res.json(friends)
  } catch (err) {
    console.error('Friends API error:', err)
    res.status(500).json({ message: err.message })
  }
})

// ── POST /api/friends/:name/settle ─────────────────────────────
router.post('/:name/settle', async (req, res) => {
  try {
    const friendName  = decodeURIComponent(req.params.name)
    const currentUser = req.user
    const userName    = currentUser.name

    const friendRegex = new RegExp(`^${escapeRegex(friendName.trim())}$`, 'i')
    const userRegex   = new RegExp(`^${escapeRegex(userName.trim())}$`, 'i')

    const result = await Expense.updateMany(
      {
        user_id:    currentUser._id,
        settled_at: null,
        split_mode: { $ne: 'no_split' },
        $or: [
          { paid_by: userRegex, 'participants.name': friendRegex },
          { paid_by: friendRegex, 'participants.name': userRegex },
        ],
      },
      { $set: { settled_at: new Date() } }
    )

    console.log(`Settled ${result.modifiedCount} expenses between ${userName} and ${friendName}`)

    res.json({
      message:       `Settled all expenses with ${friendName}`,
      settled_count: result.modifiedCount
    })
  } catch (err) {
    console.error('Settle API error:', err)
    res.status(500).json({ message: err.message })
  }
})

export default router