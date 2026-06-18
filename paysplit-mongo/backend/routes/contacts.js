import express from 'express'
import Contact from '../models/Contact.js'
import protect from '../middleware/auth.js'

const router = express.Router()
router.use(protect)

router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find({ user_id: req.user._id }).lean()
    res.json(contacts.map(c => ({ friend_name: c.friend_name, phone: c.phone, upi_id: c.upi_id })))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/:name', async (req, res) => {
  try {
    const friend_name = decodeURIComponent(req.params.name)
    const { phone, upi_id } = req.body
    const contact = await Contact.findOneAndUpdate(
      { user_id: req.user._id, friend_name },
      { $set: { phone: phone || '', upi_id: upi_id || '' } },
      { upsert: true, new: true }
    )
    res.json({ friend_name: contact.friend_name, phone: contact.phone, upi_id: contact.upi_id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router