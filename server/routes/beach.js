const express = require('express');
const router = express.Router();
const beachController = require('../controllers/beachController');

router.post('/liked-beaches', beachController.get_liked_beaches);

module.exports = router;