const topicModels = require('../../models/topic/topicIndex');
const { StatusCodes } = require('http-status-codes');
const { NotFoundError, CustomAPIError } = require('../../errors/index');
const axios = require('axios');

const getRevisionNotes=async(req,res)=>{
    try {
        const {topicId}=req.body;
        const userId=req.user.userId;

        const revisionNotes=await topicModels.RevisionNotes.findOne({
            topicId,userId
        });
        if(!revisionNotes){
            throw new NotFoundError('No revision notes found for this topic and user.');    
        }
        return res.status(StatusCodes.OK).json({
            message:'Revision notes retrieved successfully',
            revisionNotes   
        })
        
    } catch (error) {
        if(error instanceof CustomAPIError){
            return res.status(error.statusCode).json({msg:error.message});  
    }else{
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                msg:'Error retrieving revision notes',
                error:error.message
            });
        }   
    }
}

const createRevisionNotes = async (req, res) => {
    try {
        const { topicId } = req.body;
        const userId = req.user.userId;

        // Retrieve top-level chats for this topic and user
        const chats = await topicModels.Chat.find({ 
            topicId, 
            userId, 
            parentChatId: null // exclude chats that are replies
        }).sort({ createdAt: -1 });

        if (!chats || chats.length === 0) {
            throw new NotFoundError('No chat history found for this topic and user.');
        }

        let messages = [];
        let summary = [];
        for (const chat of chats) {
            messages = [...messages, ...chat.messages];
            summary = [...summary, ...chat.summary];
        }

        // Call the Python API to generate revision notes from the chats data
        const apiResponse = await axios.post('http://127.0.0.1:8000/notes/', 
            { 
                topicId,
                userId,
                messages,
                summary
            },
            { timeout: 600000 }
        );

        const responseData = apiResponse.data.message;

        // Save the returned revision notes in your RevisionNotes model
        const revisionNotes = await topicModels.RevisionNotes.create({
            userId,
            topicId,
            title: responseData.title,
            introduction: responseData.introduction,
            core_concepts: responseData.core_concepts,
            example_or_use_case: responseData.example_or_use_case,
            common_confusions: responseData.common_confusions,
            memory_tips: responseData.memory_tips
        });

        return res.status(StatusCodes.CREATED).json({
            message: 'Revision notes created successfully',
            revisionNotes
        });
    } catch (error) {
        if (error instanceof CustomAPIError) {
            return res.status(error.statusCode).json({ msg: error.message });
        } else {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                msg: 'Error creating notes',
                error: error.message
            });
        }
    }
};

module.exports = {
    createRevisionNotes,
    getRevisionNotes
};