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
      const paidBy = exp.paid_by

      if (paidBy === userName) {
        // I paid the bill → every OTHER participant owes me their share
        for (const p of exp.participants || []) {
          if (p.name === userName) continue
          friendSet.add(p.name)
          balances[p.name] = (balances[p.name] || 0) + Number(p.amount || 0)
        }
      } else {
        // Someone else paid the bill → if I'm a participant, I owe them my share
        friendSet.add(paidBy)
        const myShare = (exp.participants || []).find(p => p.name === userName)
        if (myShare) {
          balances[paidBy] = (balances[paidBy] || 0) - Number(myShare.amount || 0)
        }
      }
    }

    // Get registered users for profile info
    const registeredUsers = await User
      .find({ _id: { $ne: currentUser._id } })
      .select('name email profile_image')
      .lean()

    const userMap = {}
    registeredUsers.forEach(u => { userMap[u.name] = u })

    // Build friends list — include anyone with non-zero balance OR who is a registered user
    const friends = Array.from(friendSet)
      .map(friendName => {
        const registeredUser = userMap[friendName]
        return {
          id:            registeredUser?._id?.toString() || friendName,
          name:          friendName,
          email:         registeredUser?.email || `${friendName.toLowerCase()}@paysplit.app`,
          profile_image: registeredUser?.profile_image || null,
          balance:       Math.round((balances[friendName] || 0) * 100) / 100,
          is_registered: !!registeredUser,
        }
      })

    // Sort: people who owe you first (desc), then who you owe (desc), then settled
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

    // Mark ALL unsettled expenses between these two people as settled
    const result = await Expense.updateMany(
      {
        user_id:    currentUser._id,
        settled_at: null,
        split_mode: { $ne: 'no_split' },
        $or: [
          // I paid, friend is a participant
          {
            paid_by: userName,
            'participants.name': friendName
          },
          // Friend paid, I am a participant
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