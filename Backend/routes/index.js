const express=require('express')
const router=express.Router();

const folderRouter=require('./notebook.routes');
const topicRouter=require('./topic.routes');
const uploadRouter=require('./upload.routes');
const resourceRouter=require('./resource.routes');
const chatRouter=require('./chat.routes')
const revisionNotesRouter=require('./revisionNote.routes')
const flashcardsRouter=require('./flashcard.routes')

router.use('/folder',folderRouter);
router.use('/topic',topicRouter);
router.use('/upload',uploadRouter);
router.use('/resource',resourceRouter);
router.use('/chat',chatRouter);

router.use('/revisionNotes',revisionNotesRouter);
router.use('/flashcards',flashcardsRouter);


module.exports=router;