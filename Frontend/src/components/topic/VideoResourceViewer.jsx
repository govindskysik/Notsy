import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { sendChatMessage } from '../../services/chatService';

const VideoResourceViewer = ({ resource }) => {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  // Handle both array and single string cases
  const videos = Array.isArray(resource?.source) ? resource.source : [resource?.source];

  const getVideoIdFromUrl = (url) => {
    if (!url) return null;
    try {
      const videoUrl = new URL(url);
      const videoId = videoUrl.searchParams.get('v');
      return videoId;
    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
    }
  };

  const currentVideoId = getVideoIdFromUrl(videos[selectedVideoIndex]);

  if (!currentVideoId) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Invalid video source</p>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setLoading(true);
      const chatData = {
        query: message.trim(),
        resourceId: resource._id,
        topicId: resource.topicId
      };

      console.log('Sending chat data:', chatData); // Debug log

      const response = await sendChatMessage(chatData);
      console.log('Chat response:', response); // Debug log

      if (response?.chat?.messages) {
        setMessages(prev => [
          ...prev,
          ...response.chat.messages
        ]);
        setMessage('');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(
        error.response?.status === 404 
          ? 'Chat service not available' 
          : 'Failed to send message'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex gap-6">
      {/* Left Section: Video Player and Transcript */}
      <div className="w-3/5 flex flex-col gap-4">
        {/* Video Player Container */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <Tab.Group defaultIndex={0} onChange={setSelectedVideoIndex}>
            <Tab.List className="flex space-x-1 rounded-xl bg-primary/10 p-1 mb-4">
              {videos.map((_, idx) => (
                <Tab
                  key={idx}
                  className={({ selected }) => `
                    w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                    ${selected ? 'bg-white text-primary shadow' : 'text-primary/60'}
                  `}
                >
                  Video {idx + 1}
                </Tab>
              ))}
            </Tab.List>

            <Tab.Panels>
              {videos.map((video, idx) => (
                <Tab.Panel key={idx}>
                  <div className="flex flex-col">
                    <div className="relative w-full pt-[56.25%]">
                      <iframe
                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                        src={`https://www.youtube.com/embed/${getVideoIdFromUrl(video)}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 truncate">{video}</p>
                    </div>
                  </div>
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>

        {/* Transcript Container */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex-1 overflow-hidden">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 sticky top-0 bg-white">
            Video Transcript
          </h2>
          <div className="overflow-y-auto h-[calc(100%-3rem)] pr-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {resource?.content?.map((text, index) => (
              <p key={index} className="mb-4 text-gray-600 text-sm leading-relaxed">
                {text}
              </p>
            ))}
            {(!resource?.content || resource.content.length === 0) && (
              <p className="text-gray-500 italic text-sm">
                No transcript available for this video.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Section: Chat Interface */}
      <div className="w-2/5 bg-white rounded-xl shadow-sm p-6">
        <div className="h-full flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                  max-w-[80%] rounded-lg p-3
                  ${msg.role === 'user' 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-800'}
                `}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoResourceViewer;