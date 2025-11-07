const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { authenticateToken } = require('../middleware/auth')

// Public routes
router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/logout', authController.logout)

// Protected route (requires authentication)
router.get('/me', authController.getCurrentUser)

module.exports = router