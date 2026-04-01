require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const questions = require('./data/questions')
const Score = require('./models/Score')
const User = require('./models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')


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
  


// POST /api/scores — submit a new score
app.post('/api/scores', async (req, res) => {
  const { playerName, score, totalQuestions } = req.body

  if (!playerName || score === undefined || !totalQuestions) {
    return res.status(400).json({ error: 'playerName, score, and totalQuestions are required' })
  }

  try {
    const newScore = await Score.create({
      playerName,
      score,
      totalQuestions
      // date is set automatically by the schema default
    })
    console.log('Score saved:', newScore)
    res.status(201).json(newScore)
  } catch (error) {
    console.error('Error saving score:', error.message)
    res.status(500).json({ error: 'Failed to save score' })
  }
})

// GET /api/scores — return all scores, highest first
app.get('/api/scores', async (req, res) => {
  try {
    const scores = await Score.find()
      .sort({ score: -1 })
      .limit(10)
    res.json(scores)
  } catch (error) {
    console.error('Error fetching scores:', error.message)
    res.status(500).json({ error: 'Failed to fetch scores' })
  }
})

// POST /api/auth/register — create a new account
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  try {
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await User.create({ email, passwordHash })

    res.status(201).json({
      message: 'Account created successfully',
      userId: user._id,
      email: user.email
    })

  } catch (error) {
    console.error('Register error:', error.message)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// POST /api/auth/login — log in and receive a token
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    res.json({
      token,
      userId: user._id,
      email: user.email
    })

  } catch (error) {
    console.error('Login error:', error.message)
    res.status(500).json({ error: 'Login failed' })
  }
})


// Connect to MongoDB, then start the server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB')
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server running at http://localhost:${process.env.PORT || 3000}`)
    })
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  })


