const express = require('express');
const router = express.Router();
const { createFlashcards } = require('../controllers/topic/flashcards');

// Route to create flashcards
router.post('/',  createFlashcards);

module.exports = router;