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

    // All expenses for current user (exclude settled ones)
    const expenses = await Expense.find({ 
      user_id: currentUser._id,
      settled_at: null  // Only active expenses
    }).lean()

    // Calculate balance per friend name
    const balances = {}
    const friendSet = new Set()

    for (const exp of expenses) {
      if (exp.split_mode === 'no_split') continue
      const paid_by = exp.paid_by
      
      for (const p of exp.participants || []) {
        const friendName = p.name
        
        // Skip if participant is the current user
        if (friendName === userName) continue
        
        // Add to friend set
        friendSet.add(friendName)
        
        const amt = Number(p.amount || 0)
        
        if (paid_by === userName) {
          // Current user paid, friend owes them
          balances[friendName] = (balances[friendName] || 0) + amt
        } else if (paid_by === friendName && p.name === userName) {
          // Friend paid, current user owes them
          balances[friendName] = (balances[friendName] || 0) - amt
        }
      }
      
      // Also add the payer as a friend if they're not the current user
      if (paid_by !== userName) {
        friendSet.add(paid_by)
      }
    }

    // Get all registered users for additional info
    const registeredUsers = await User
      .find({ _id: { $ne: currentUser._id } })
      .select('name email profile_image')
      .lean()

    // Create a map for quick lookup
    const userMap = {}
    registeredUsers.forEach(u => {
      userMap[u.name] = u
    })

    // Build friends array from all participants in expenses
    const friends = Array.from(friendSet).map(friendName => {
      const registeredUser = userMap[friendName]
      return {
        id: registeredUser?._id || friendName,
        name: friendName,
        email: registeredUser?.email || `${friendName.toLowerCase()}@example.com`,
        profile_image: registeredUser?.profile_image || null,
        balance: balances[friendName] || 0,
        is_registered: !!registeredUser
      }
    })

    // Filter out friends with zero balance AND no registered account
    // (Keep all friends with non-zero balance, or registered users)
    const activeFriends = friends.filter(f => f.balance !== 0 || f.is_registered)

    res.json(activeFriends)
  } catch (err) {
    console.error('Friends API error:', err)
    res.status(500).json({ message: err.message })
  }
})

// ── POST /api/friends/:name/settle ─────────────────────────────
router.post('/:name/settle', async (req, res) => {
  try {
    const friendName = req.params.name
    const currentUser = req.user

    // Mark expenses as settled instead of deleting them
    const result = await Expense.updateMany(
      {
        user_id: currentUser._id,
        settled_at: null,
        $or: [
          { paid_by: friendName },
          { paid_by: currentUser.name, 'participants.name': friendName },
        ],
      },
      {
        $set: { settled_at: new Date() }
      }
    )

    res.json({ 
      message: `Settled with ${friendName}`,
      settled_count: result.modifiedCount
    })
  } catch (err) {
    console.error('Settle API error:', err)
    res.status(500).json({ message: err.message })
  }
})

export default router
