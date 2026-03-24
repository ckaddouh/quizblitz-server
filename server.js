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

// GET /api/questions/random — returns 10 shuffled questions
app.get('/api/questions/random', (req, res) => {
    const shuffled = [...questions]  // copy — never mutate the original
  
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
  
    res.json(shuffled.slice(0, 10))
  })
  
// In-memory scores store (replaced by MongoDB in Week 10)
let scores = []

// POST /api/scores — submit a new score
app.post('/api/scores', (req, res) => {
  const { playerName, score, totalQuestions } = req.body

  if (!playerName || score === undefined || !totalQuestions) {
    return res.status(400).json({ error: 'playerName, score, and totalQuestions are required' })
  }

  const newScore = {
    id: Date.now(),
    playerName,
    score,
    totalQuestions,
    date: new Date().toISOString()
  }

  scores.push(newScore)
  console.log('Score received:', newScore)

  res.status(201).json(newScore)
})

// GET /api/scores — return all scores, highest first
app.get('/api/scores', (req, res) => {
  const sorted = [...scores].sort((a, b) => b.score - a.score)
  res.json(sorted)
})


// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})


