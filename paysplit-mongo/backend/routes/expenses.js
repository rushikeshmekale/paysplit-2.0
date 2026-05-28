import express from 'express'
import Expense from '../models/Expense.js'
import protect from '../middleware/auth.js'

const router = express.Router()

// All routes are protected
router.use(protect)

// ── GET /api/expenses ───────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense
      .find({ user_id: req.user._id })
      .sort({ createdAt: -1 })
      .lean()

    res.json(
      expenses.map((e) => ({
        id:           e._id,
        title:        e.title,
        paid_by:      e.paid_by,
        total_amount: e.total_amount,
        category:     e.category,
        split_mode:   e.split_mode,
        participants: e.participants,
        created_at:   e.createdAt,
      }))
    )
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── POST /api/expenses ──────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { title, paid_by, participants, total_amount, category, split_mode } = req.body

    if (!title || !paid_by)
      return res.status(400).json({ message: 'Title and paid_by are required' })

    const expense = await Expense.create({
      user_id: req.user._id,
      title,
      paid_by,
      participants: participants || [],
      total_amount: total_amount || 0,
      category:   category   || 'Other',
      split_mode: split_mode || 'equal',
    })

    res.status(201).json({
      id:           expense._id,
      title:        expense.title,
      paid_by:      expense.paid_by,
      total_amount: expense.total_amount,
      category:     expense.category,
      split_mode:   expense.split_mode,
      participants: expense.participants,
      created_at:   expense.createdAt,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── DELETE /api/expenses/:id ────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id,
    })

    if (!expense)
      return res.status(404).json({ message: 'Expense not found' })

    res.json({ message: 'Expense deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
