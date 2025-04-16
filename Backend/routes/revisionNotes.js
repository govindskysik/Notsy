const express = require('express');
const router = express.Router();
const { createRevisionNotes } = require('../controllers/topic/revisionNotes');

router.post('/',  createRevisionNotes);

module.exports = router;