const mongoose = require('mongoose')

const organisationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    industry: { type: String, trim: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Organisation', organisationSchema)
