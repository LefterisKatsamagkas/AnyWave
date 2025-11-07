const express = require('express')
const router = express.Router()
const weatherController = require('../controllers/weatherController')

// Main weather data endpoint
router.post('/weather', weatherController.getWeatherData)

module.exports = router