import mongoose from 'mongoose'

const participantSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true },
    amount:     { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
  },
  { _id: false }
)

const expenseSchema = new mongoose.Schema(
  {
    user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title:        { type: String, required: true, trim: true },
    paid_by:      { type: String, required: true },
    total_amount: { type: Number, required: true, default: 0 },
    category:     { type: String, default: 'Other', enum: ['Food','Transport','Entertainment','Shopping','Bills','Other'] },
    split_mode:   { type: String, default: 'equal', enum: ['no_split','equal','percentage','custom'] },
    participants: { type: [participantSchema], default: [] },
  },
  { timestamps: true }
)

// Index for fast user queries
expenseSchema.index({ user_id: 1, createdAt: -1 })

const Expense = mongoose.model('Expense', expenseSchema)
export default Expense
