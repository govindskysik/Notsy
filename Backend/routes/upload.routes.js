const express = require('express');
const router = express.Router();

const upload=require('../config/multer');
const {uploadUrls,uploadPdfs}=require('../controllers/upload.controller')


router.post('/uploadUrl', uploadUrls);
router.post('/uploadPdf', upload('./uploads/pdf'), uploadPdfs);


module.exports = router;