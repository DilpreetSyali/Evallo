const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')

const { initDatabase } = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const employeeRoutes = require('./routes/employeeRoutes')
const teamRoutes = require('./routes/teamRoutes')
const auditRoutes = require('./routes/auditRoutes')

dotenv.config()

const app = express()

const allowedOrigins = new Set([
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
].filter(Boolean))

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true)
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: true,
  })
)
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'HRMS API is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/audit-logs', auditRoutes)

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

app.use((error, req, res, next) => {
  if (error?.code === '23505') {
    return res.status(409).json({ success: false, message: 'Duplicate record already exists' })
  }

  console.error(error)
  return res.status(500).json({ success: false, message: 'Internal server error' })
})

const port = process.env.PORT || 5000

const start = async () => {
  try {
    await initDatabase()
    app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  } catch (error) {
    console.error('Failed to initialize database:', error.message)
    process.exit(1)
  }
}

start()
