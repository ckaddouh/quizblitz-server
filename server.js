const express = require('express')
const cors = require('cors')

const app = express()
const PORT = 3000

// Middleware
app.use(cors())
app.use(express.json())

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'QuizBlitz server is running' })
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})