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
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true)
    
    // Allow localhost for development
    if (origin.includes('localhost')) return callback(null, true)
    
    // Allow all vercel.app URLs for this project
    if (origin.includes('paysplit-2-0') && origin.includes('vercel.app')) {
      return callback(null, true)
    }
    
    // Allow the specific production URL from env
    if (origin === process.env.FRONTEND_URL) {
      return callback(null, true)
    }
    
    callback(new Error('Not allowed by CORS'))
  },
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
