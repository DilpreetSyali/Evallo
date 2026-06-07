const mongoose = require('mongoose')

const employeeSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    position: { type: String, trim: true },
    department: { type: String, trim: true },
    status: { type: String, enum: ['active', 'inactive', 'on_leave', 'terminated'], default: 'active' },
    salary: { type: Number },
    hire_date: { type: String },
    date_of_birth: { type: String },
    organisation: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', required: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Employee', employeeSchema)
