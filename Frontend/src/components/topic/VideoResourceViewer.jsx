import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { sendChatMessage } from "../../services/chatService";
import axios from "axios";
import { CHAT_MODES } from "../../constants/chatModes";
import {
  BsChatDots,
  BsCardText,
  BsPencilSquare,
  BsPlayBtn,
  BsChevronUp,
  BsChevronDown,
} from "react-icons/bs";
import { useAuth } from "../../context/AuthContext";
import { assets } from "../../assets/assets";
import PDFViewer from "../PDFViewer";

const VideoResourceViewer = ({ resource }) => {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selectedMode, setSelectedMode] = useState(CHAT_MODES.DEFAULT);
  const [activeTab, setActiveTab] = useState("chat");
  const [flashcards, setFlashcards] = useState([]);
  const [notes, setNotes] = useState("");
  const [showVideo, setShowVideo] = useState(true);
  const [pipVideo, setPipVideo] = useState(null);
  const { user } = useAuth();

  const videos = Array.isArray(resource?.source)
    ? resource.source
    : [resource?.source];

  const getVideoIdFromUrl = (url) => {
    if (!url) return null;
    try {
      const videoUrl = new URL(url);
      const videoId = videoUrl.searchParams.get("v");
      return videoId;
    } catch (error) {
      console.error("Error parsing URL:", error);
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

  useEffect(() => {
    const loadChatHistory = async () => {
      if (!resource?._id) return;

      try {
        setLoading(true);
        const response = await axios.get(`/chat/${resource._id}`);

        if (response.data?.chat?.messages) {
          setMessages(response.data.chat.messages);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
        if (error.response?.status !== 404) {
          toast.error("Failed to load chat history");
        }
      } finally {
        setLoading(false);
      }
    };

    loadChatHistory();
  }, [resource?._id]);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      setLoading(true);
      const chatData = {
        query: message.trim(),
        resourceId: resource._id,
        topicId: resource.topicId,
        mode: selectedMode.id,
      };

      console.log("Sending chat data:", chatData);

      const response = await sendChatMessage(chatData);
      console.log("Chat response:", response);

      if (response?.chat?.messages) {
        setMessages((prev) => [...prev, ...response.chat.messages]);
        setMessage("");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(
        error.response?.status === 404
          ? "Chat service not available"
          : "Failed to send message"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderChatModes = () => {
    if (!CHAT_MODES || Object.keys(CHAT_MODES).length === 0) {
      return null;
    }

    return Object.values(CHAT_MODES).map((mode) => (
      <button
        key={mode?.id || "default"}
        onClick={() => setSelectedMode(mode)}
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-all
          ${
            selectedMode?.id === mode?.id
              ? "bg-primary text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
      >
        <span className="text-sm">{mode?.icon}</span>
        <span>{mode?.label}</span>
      </button>
    ));
  };

  const sidebarItems = [
    { id: "chat", icon: <BsChatDots />, label: "Chat Assistant" },
    { id: "flashcards", icon: <BsCardText />, label: "Flashcards" },
    { id: "notes", icon: <BsPencilSquare />, label: "Notes" },
  ];

  const renderChatInterface = () => {
    return (
      <div className="h-[90%] rounded-xl flex flex-col">
        {/* Welcome Section */}
        <div className="flex-none px-4 py-8">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Hello{user?.name ? `, ${user.name}` : ""}! 👋
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              How can I help you with these videos?
            </p>

            {/* Video Selector */}
            <div className="flex gap-4 flex-wrap justify-center">
              {videos.map((video, idx) => (
                <button
                  key={idx}
                  onClick={() => setPipVideo(videos[idx])}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  <BsPlayBtn className="text-primary text-xl" />
                  <span className="font-medium">Video {idx + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="max-w-3xl mx-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } mb-4`}
              >
                <div
                  className={`
                    max-w-[80%] rounded-2xl p-4
                    ${
                      msg.role === "user"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-800"
                    }
                  `}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-none px-4 py-4 border-t bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Message in ${
                  selectedMode?.label || "Default"
                } mode...`}
                className="w-full px-4 py-3 pr-24 rounded-2xl border-2 border-gray-200 focus:border-primary focus:ring-0 focus:outline-none"
                onKeyPress={(e) =>
                  e.key === "Enter" && !loading && handleSendMessage()
                }
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </div>

            {/* Chat Modes */}
            <div className="flex flex-wrap gap-2 mt-3 px-1">
              {renderChatModes()}
            </div>
          </div>
        </div>

        {/* PiP Video */}
        {pipVideo && (
          <div className="fixed top-4 right-4 w-96 h-56 shadow-xl rounded-xl overflow-hidden z-50">
            <div className="relative w-full h-full">
              <iframe
                className="w-full h-full rounded-xl"
                src={`https://www.youtube.com/embed/${getVideoIdFromUrl(
                  pipVideo
                )}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <button
                onClick={() => setPipVideo(null)}
                className="absolute w-10 h-10 top-2 right-2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (resource.type === "pdf") {
      return (
        <div className="h-full flex flex-col">
          <PDFViewer pdfUrl={resource.source[0]} />
          {/* Chat interface below PDF viewer */}
          {renderChatInterface()}
        </div>
      );
    }

    // Existing video content rendering
    return (
      <div className="h-[90%] rounded-xl flex flex-col">
        {/* Welcome Section */}
        <div className="flex-none px-4 py-8">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Hello{user?.name ? `, ${user.name}` : ""}! 👋
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              How can I help you with these videos?
            </p>

            {/* Video Selector */}
            <div className="flex gap-4 flex-wrap justify-center">
              {videos.map((video, idx) => (
                <button
                  key={idx}
                  onClick={() => setPipVideo(videos[idx])}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  <BsPlayBtn className="text-primary text-xl" />
                  <span className="font-medium">Video {idx + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="max-w-3xl mx-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } mb-4`}
              >
                <div
                  className={`
                    max-w-[80%] rounded-2xl p-4
                    ${
                      msg.role === "user"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-800"
                    }
                  `}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-none px-4 py-4 border-t bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Message in ${
                  selectedMode?.label || "Default"
                } mode...`}
                className="w-full px-4 py-3 pr-24 rounded-2xl border-2 border-gray-200 focus:border-primary focus:ring-0 focus:outline-none"
                onKeyPress={(e) =>
                  e.key === "Enter" && !loading && handleSendMessage()
                }
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </div>

            {/* Chat Modes */}
            <div className="flex flex-wrap gap-2 mt-3 px-1">
              {renderChatModes()}
            </div>
          </div>
        </div>

        {/* PiP Video */}
        {pipVideo && (
          <div className="fixed top-4 right-4 w-96 h-56 shadow-xl rounded-xl overflow-hidden z-50">
            <div className="relative w-full h-full">
              <iframe
                className="w-full h-full rounded-xl"
                src={`https://www.youtube.com/embed/${getVideoIdFromUrl(
                  pipVideo
                )}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <button
                onClick={() => setPipVideo(null)}
                className="absolute w-10 h-10 top-2 right-2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      <div 
        className="w-full h-full bg-cover bg-center"
        style={{ backgroundImage: `url(${assets.dashboardbg})` }}
      >
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 backdrop-blur-sm">
            <div className="h-full flex flex-col p-6">
              {/* Header */}
              <div className="flex items-center gap-2 mb-8">
                <img className="w-6 h-6" src={assets.logo} alt="Logo" />
                <h1 className="text-3xl font-bold">Resource</h1>
              </div>

              {/* Navigation */}
              <nav className="flex-1">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 w-full p-4 text-left text-sm font-bold tracking-wide rounded-xl transition-colors mb-2
                      ${activeTab === item.id 
                        ? "bg-primary text-white" 
                        : "hover:bg-primary/20"}`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-5">
            <div className="backdrop-blur-sm bg-base-white p-7 h-full rounded-xl shadow-sm">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoResourceViewer;
