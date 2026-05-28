import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRoutes     from './routes/auth.js'
import expenseRoutes  from './routes/expenses.js'
import friendRoutes   from './routes/friends.js'
import balanceRoutes  from './routes/balance.js'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 5000

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/friends',  friendRoutes)
app.use('/api/balance',  balanceRoutes)

app.get('/api/health', (_req, res) => res.json({ status: 'ok', message: 'PaySplit API running' }))

// ── MongoDB Connection ──────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Atlas connected')
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  })
