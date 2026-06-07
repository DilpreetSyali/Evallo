const mongoose = require('mongoose')

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    department: { type: String, trim: true },
    description: { type: String, trim: true },
    employeeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
    organisation: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', required: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Team', teamSchema)
