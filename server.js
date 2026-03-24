const express = require('express')
const cors = require('cors')
const questions = require('./data/questions')


const app = express()

const PORT = 3000

// GET /api/questions — returns all questions
app.get('/api/questions', (req, res) => {
  res.json(questions)
})

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