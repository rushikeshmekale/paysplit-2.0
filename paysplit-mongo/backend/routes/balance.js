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

    let you_owe = 0
    let they_owe = 0

    for (const exp of expenses) {
      if (exp.split_mode === 'no_split') continue
      const paid_by = exp.paid_by

      for (const p of exp.participants || []) {
        if (p.name === paid_by) continue
        const amt = Number(p.amount || 0)
        if (paid_by === userName)      they_owe += amt
        else if (p.name === userName)  you_owe  += amt
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