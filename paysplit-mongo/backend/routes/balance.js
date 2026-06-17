import express from 'express'
import Expense from '../models/Expense.js'
import protect from '../middleware/auth.js'

const router = express.Router()
router.use(protect)

// ── GET /api/balance ────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    // Only count NON-settled expenses
    const expenses = await Expense.find({
      user_id: req.user._id,
      settled_at: null
    }).lean()

    const userName = req.user.name

    let you_owe  = 0
    let they_owe = 0

    for (const exp of expenses) {
      if (exp.split_mode === 'no_split') continue
      const paidBy = exp.paid_by

      if (paidBy === userName) {
        // I paid → sum up what every other participant owes me
        for (const p of exp.participants || []) {
          if (p.name === userName) continue
          they_owe += Number(p.amount || 0)
        }
      } else {
        // Someone else paid → my own share is what I owe
        const myShare = (exp.participants || []).find(p => p.name === userName)
        if (myShare) you_owe += Number(myShare.amount || 0)
      }
    }

    res.json({ you_owe, they_owe, net: they_owe - you_owe })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── GET /api/balance/stats ──────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    // Stats show ALL expenses including settled (for history)
    const expenses = await Expense.find({ user_id: req.user._id }).lean()

    const total = expenses.reduce((s, e) => s + Number(e.total_amount), 0)
    const categories = {}
    for (const e of expenses) {
      const c = e.category || 'Other'
      categories[c] = (categories[c] || 0) + Number(e.total_amount)
    }

    res.json({
      total_expenses: total,
      categories,
      expense_count: expenses.length
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router