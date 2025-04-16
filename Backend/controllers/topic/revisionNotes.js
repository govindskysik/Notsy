const topicModels = require('../../models/topic/topicIndex');
const { StatusCodes } = require('http-status-codes');
const { NotFoundError ,CustomAPIError} = require('../../errors/index');
const axios = require('axios');

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

        // Call the Python API to generate revision notes from the chats data
        const apiResponse = await axios.post('http://127.0.0.1:8000/revisionNotes', 
            { chats },
            { timeout: 60000 }
        );

        // Assume the API returns revision notes data in the response
        const revisionNotesData = apiResponse.data;

        // Save the returned revision notes in your RevisionNotes model
        const revisionNotes = await topicModels.RevisionNotes.create({
            userId,
            topicId,
            revisionNotes: revisionNotesData.revisionNotes // adjust field name as per your model
        });

        return res.status(StatusCodes.CREATED).json({
            message: 'Revision notes created successfully',
            revisionNotes
        });
    } catch (error) {
        console.error('Error creating revision notes:', error);
        if(error instanceof CustomAPIError){
            return res.status(error.statusCode).json({msg:error.message});
        }else{
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                msg: 'Error creating notes',
                error: error.message});
        }
    }
};

module.exports = {
    createRevisionNotes
};