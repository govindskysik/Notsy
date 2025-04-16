const topicModels = require('../../models/topic/topicIndex');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError,CustomAPIError } = require('../../errors/index');
const axios = require('axios');
const flashcards = require('../../models/topic/flashcards');

const createFlashcards=async(req,res)=>{
    try {
        const { topicId } = req.body;
        const userId = req.user.userId; // Extract userId from the request object

        const chats=await topicModels.Chat.find({ topicId, userId ,parentChatId:null}).sort({ createdAt: -1 });
        if (!chats || chats.length === 0) {
            throw new NotFoundError('No chat history found for this topic and user.');
        }


        const apiResponse=await axios.post('http://127.0.0.1:8000/flashcards',
            {chats},
            {timeout:60000}
        );

        const flashcardsData=apiResponse.data;

        const flashcards=await topicModels.Flashcards.create({
            userId,
            topicId,
            flashcards: flashcardsData.flashcards
        });

        return res.status(StatusCodes.CREATED).json({
            message: 'Flashcards created successfully',
            flashcards
        });
    } catch (error) {
        console.error('Error creating flashcards:', error);
        if(error instanceof CustomAPIError){
            return res.status(error.statusCode).json({msg:error.message});
        }else{
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                msg: 'Error creating flashcards',
                error: error.message});
        }
    }

    
}

module.exports={
    createFlashcards
}