import express from 'express'
import User from '../models/User.js'
import Expense from '../models/Expense.js'
import protect from '../middleware/auth.js'

const router = express.Router()
router.use(protect)

// ── GET /api/friends ────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const currentUser = req.user
    const userName    = currentUser.name

    // Only NON-settled expenses for balance calculation
    const expenses = await Expense.find({
      user_id: currentUser._id,
      settled_at: null
    }).lean()

    const balances  = {}
    const friendSet = new Set()

    for (const exp of expenses) {
      if (exp.split_mode === 'no_split') continue
      const paid_by = exp.paid_by

      for (const p of exp.participants || []) {
        const friendName = p.name
        if (friendName === userName) continue

        friendSet.add(friendName)
        const amt = Number(p.amount || 0)

        if (paid_by === userName) {
          // I paid → friend owes me → positive
          balances[friendName] = (balances[friendName] || 0) + amt
        } else if (paid_by === friendName) {
          // Friend paid → I owe friend → negative
          if (p.name === userName) {
            balances[friendName] = (balances[friendName] || 0) - amt
          }
        }
      }

      if (paid_by !== userName) {
        friendSet.add(paid_by)
      }
    }

    // Get registered users for profile info
    const registeredUsers = await User
      .find({ _id: { $ne: currentUser._id } })
      .select('name email profile_image')
      .lean()

    const userMap = {}
    registeredUsers.forEach(u => { userMap[u.name] = u })

    // Build friends list — include anyone with non-zero balance
    const friends = Array.from(friendSet)
      .filter(name => balances[name] !== 0 || userMap[name]) // only show if balance or registered
      .map(friendName => {
        const registeredUser = userMap[friendName]
        return {
          id:            registeredUser?._id || friendName,
          name:          friendName,
          email:         registeredUser?.email || `${friendName.toLowerCase()}@paysplit.app`,
          profile_image: registeredUser?.profile_image || null,
          balance:       Math.round((balances[friendName] || 0) * 100) / 100,
          is_registered: !!registeredUser,
        }
      })

    // Sort: people who owe you first, then who you owe, then settled
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
    const friendName  = req.params.name
    const currentUser = req.user
    const userName    = currentUser.name

    // Mark ALL unsettled expenses between these two people as settled
    const result = await Expense.updateMany(
      {
        user_id:    currentUser._id,
        settled_at: null,
        split_mode: { $ne: 'no_split' },
        $or: [
          // I paid, friend is participant
          {
            paid_by: userName,
            'participants.name': friendName
          },
          // Friend paid, I am participant
          {
            paid_by: friendName,
            'participants.name': userName
          },
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