import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import protect from '../middleware/auth.js'

const router = express.Router()

// Generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

// ── POST /api/auth/register ─────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' })

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' })

    const exists = await User.findOne({ email })
    if (exists)
      return res.status(400).json({ message: 'Email already registered' })

    const user = await User.create({ name, email, password })
    const token = generateToken(user._id)

    res.status(201).json({
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        profile_image: user.profile_image,
        social_credit_score: user.social_credit_score,
      },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── POST /api/auth/login ────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' })

    const match = await user.matchPassword(password)
    if (!match)
      return res.status(401).json({ message: 'Invalid email or password' })

    const token = generateToken(user._id)

    res.json({
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        profile_image: user.profile_image,
        social_credit_score: user.social_credit_score,
      },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── GET /api/auth/me ────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json({
    id:    req.user._id,
    name:  req.user.name,
    email: req.user.email,
    profile_image: req.user.profile_image,
    social_credit_score: req.user.social_credit_score,
  })
})

// ── POST /api/auth/logout ───────────────────────────────────────
// JWT is stateless — client just deletes the token
router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out' })
})

export default router
