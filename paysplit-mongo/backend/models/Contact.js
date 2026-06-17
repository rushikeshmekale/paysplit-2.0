import mongoose from 'mongoose'

const contactSchema = new mongoose.Schema(
  {
    user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    friend_name: { type: String, required: true, trim: true },
    phone:       { type: String, default: '' },
  },
  { timestamps: true }
)

contactSchema.index({ user_id: 1, friend_name: 1 }, { unique: true })

const Contact = mongoose.model('Contact', contactSchema)
export default Contact