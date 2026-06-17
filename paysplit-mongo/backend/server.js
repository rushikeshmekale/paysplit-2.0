import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRoutes    from './routes/auth.js'
import expenseRoutes from './routes/expenses.js'
import friendRoutes  from './routes/friends.js'
import balanceRoutes from './routes/balance.js'
import contactRoutes from './routes/contacts.js'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 5000

// ── CORS — allow Vercel preview URLs + production ───────────────
app.use(cors({
  origin: function (origin, callback) {
    // Allow no-origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true)

    // Allow localhost dev
    if (origin.includes('localhost')) return callback(null, true)

    // Allow ALL vercel.app URLs (covers preview + production deployments)
    if (origin.endsWith('.vercel.app')) return callback(null, true)

    // Allow onrender.com (in case of internal calls)
    if (origin.endsWith('.onrender.com')) return callback(null, true)

    // Allow custom domain if set
    const allowed = process.env.FRONTEND_URL
    if (allowed && origin === allowed) return callback(null, true)

    console.log('CORS blocked origin:', origin)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Handle preflight OPTIONS requests
app.options('*', cors())

app.use(express.json())

// ── Routes ──────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/friends',  friendRoutes)
app.use('/api/balance',  balanceRoutes)
app.use('/api/contacts', contactRoutes)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'PaySplit API running' })
})

// ── MongoDB + Start Server ──────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Atlas connected')
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  })