import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { sendChatMessage } from "../../services/chatService";
import { getFlashcards, createFlashcards } from "../../services/flashcardService";
import { BsChatDots, BsCardText, BsPencilSquare, BsPlayBtn, BsFileEarmarkPdf, BsChevronUp, BsChevronDown } from "react-icons/bs";
import { useAuth } from "../../context/AuthContext";
import { assets } from "../../assets/assets";
import { CHAT_MODES } from "../../constants/chatModes"; // Add this import
import axios from "../../utils/axios"; // Add this if missing
import FlashcardViewer from '../resource/FlashcardViewer';
import NotesViewer from '../resource/NotesViewer';
import { getRevisionNotes } from '../../services/notesService';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { BsCursor, BsStopCircle } from 'react-icons/bs';

const VideoResourceViewer = ({ resource }) => {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selectedMode, setSelectedMode] = useState(CHAT_MODES.DEFAULT);
  const [activeTab, setActiveTab] = useState("chat");
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [fetchingNotes, setFetchingNotes] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [pipVideo, setPipVideo] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true); // Add this line
  const [isTyping, setIsTyping] = useState(false);  // Add this if not already present
  const { user } = useAuth();

  const videos = Array.isArray(resource?.source)
    ? resource.source
    : [resource?.source];
  const pdfUrl = resource?.type === "pdf" && videos[0]
    ? (videos[0].startsWith("http") ? videos[0] : `http://localhost:3000${videos[0].startsWith("/") ? "" : "/"}${videos[0]}`)
    : "";

  const getVideoIdFromUrl = (url) => {
    if (!url) return null;
    // Skip URL parsing for PDF files
    if (resource.type === "pdf") return null;
    
    try {
      const videoUrl = new URL(url);
      const videoId = videoUrl.searchParams.get("v");
      return videoId;
    } catch (error) {
      console.error("Error parsing URL:", error);
      return null;
    }
  };

  // Only check for video ID if it's a video resource
  const currentVideoId = resource.type === "video" 
    ? getVideoIdFromUrl(videos[selectedVideoIndex])
    : null;

  // Update validation check
  if (resource.type === "video" && !currentVideoId) {
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
      setIsTyping(true);
      setShowWelcome(false); // Hide welcome message when chat starts

      const chatData = {
        query: message.trim(),
        resourceId: resource._id,
        topicId: resource.topicId,
        mode: selectedMode.id,
      };

      console.log("Sending chat data:", chatData);

      setMessages(prev => [...prev, { role: 'user', content: message.trim() }]);
      setMessage("");

      const response = await sendChatMessage(chatData);
      console.log("Chat response:", response);

      if (response?.chat?.messages) {
        const newMessages = response.chat.messages;
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          setMessages(prev => [...prev, lastMessage]);
        }
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
      setIsTyping(false);
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
    {
      id: "flashcards", 
      icon: <BsCardText />, 
      label: "Create flashcards",
      loading: flashcardsLoading 
    },
    { 
      id: "notes", 
      icon: <BsPencilSquare />, 
      label: "Generate notes",
      loading: fetchingNotes // Update this line
    }
  ];

  const renderChatInterface = () => {
    return (
      <div className="resource-chat h-full flex flex-col">
        {/* Welcome Section - Only show name greeting */}
        <AnimatePresence>
          {showWelcome && messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="resource-chat-welcome flex-none px-4 py-8"
            >
              <div className="flex flex-col items-center">
                <h2>What would you like to understand?</h2>
                <p>Ask about this resource, get a summary, or explore a concept.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resource Quick Access - Always visible */}
        <div className="resource-chat-sources flex-none px-4 mb-5">
          <div className="flex gap-3 flex-wrap justify-center">
            {resource.type === "pdf" ? (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowPdfPreview(true)} className="resource-source-chip flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all">
                <BsFileEarmarkPdf className="text-primary text-xl" /><span className="font-medium">Open PDF</span>
              </motion.button>
            ) : videos.map((video, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPipVideo(videos[idx])}
                className="resource-source-chip flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all"
              >
                <BsPlayBtn className="text-primary text-xl" />
                <span className="font-medium">Video {idx + 1}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Messages Area with Enhanced Markdown */}
        <div className="resource-chat-messages flex-1 overflow-y-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "user" ? (
                  <div className="bg-primary text-white rounded-2xl px-4 py-2 max-w-[80%] shadow-sm">
                    <p>{msg.content}</p>
                  </div>
                ) : (
                  <div className="prose max-w-[80%] prose-pre:bg-[#7D4FFF10] prose-pre:shadow-sm">
                    <ReactMarkdown
                      components={{
                        // Code blocks with syntax highlighting
                        code: ({ node, inline, className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <div className="relative group">
                              <pre className="!bg-[#1e1e1e] !p-4 !rounded-xl border-2 border-primary/20">
                                <code {...props} className={`language-${match[1]} text-sm`}>
                                  {children}
                                </code>
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                  <button 
                                    onClick={() => navigator.clipboard.writeText(String(children))}
                                    className="px-2 py-1 text-xs rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </pre>
                            </div>
                          ) : (
                            <code {...props} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-sm">
                              {children}
                            </code>
                          );
                        },
                        // Enhanced blockquotes with primary color
                        blockquote: ({ children }) => (
                          <div className="border-l-4 border-primary pl-4 bg-primary/5 py-3 rounded-r-xl my-4">
                            <div className="flex gap-2 items-start">
                              <div className="text-primary">💡</div>
                              <div className="text-gray-600">{children}</div>
                            </div>
                          </div>
                        ),
                        // Enhanced table styling
                        table: ({ children }) => (
                          <div className="my-4 overflow-x-auto rounded-xl border-2 border-primary/10">
                            <table className="min-w-full divide-y divide-primary/10">
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="bg-primary/5 px-4 py-3 text-left text-sm font-semibold text-primary">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="px-4 py-3 text-sm border-t border-primary/10">
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </motion.div>
            ))}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 text-primary/80 pl-2 bg-primary/5 py-3 px-4 rounded-xl w-fit"
              >
                <div className="w-5 h-5 relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                  <div className="absolute inset-0 bg-primary rounded-full animate-pulse"></div>
                </div>
                <span className="font-medium">Notsy is thinking...</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* iOS Dock-style Input Area */}
        <div className="resource-chat-composer flex-none px-4 py-5">
          <div className="max-w-3xl mx-auto">
            <div className="resource-composer-box relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Message in ${selectedMode?.label || "Default"} mode...`}
                className="w-full px-4 py-4 rounded-2xl bg-transparent border-none focus:ring-0 focus:outline-none placeholder-gray-500"
                onKeyPress={(e) => e.key === "Enter" && !loading && handleSendMessage()}
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading}
                className="resource-send-button absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover disabled:opacity-50 transition-all duration-200"
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </div>

            {/* Animated Chat Modes */}
            <div className="flex flex-wrap gap-2 mt-4">
              {Object.values(CHAT_MODES).map((mode) => (
                <button
                  key={mode?.id || "default"}
                  onClick={() => setSelectedMode(mode)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors
                    ${selectedMode?.id === mode?.id
                      ? "bg-primary text-white shadow-sm"
                      : "bg-primary/10 hover:bg-primary/20 text-primary"
                    }`}
                >
                  <span className="text-lg">{mode?.icon}</span>
                  <span className="font-medium text-sm">{mode?.label}</span>
                </button>
              ))}
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
    switch (activeTab) {
      case 'flashcards':
        return (
          <div className="h-full">
            {flashcardsLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-gray-500">Loading flashcards...</p>
              </div>
            ) : (
              <FlashcardViewer 
                flashcards={flashcards} 
                topicId={resource.topicId}
                onFlashcardsUpdate={setFlashcards}
              />
            )}
          </div>
        );
      case 'notes':
        return (
          <div className="h-full">
            {fetchingNotes ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-gray-500">Loading notes...</p>
              </div>
            ) : (
              <NotesViewer 
                notes={notes} 
                topicId={resource.topicId}
                onNotesUpdate={setNotes}
              />
            )}
          </div>
        );
      case 'chat':
      default:
        return renderChatInterface();
    }
  };

  useEffect(() => {
    const fetchFlashcards = async () => {
        if (!resource?.topicId) return;
        
        try {
            setFlashcardsLoading(true);
            const response = await getFlashcards(resource.topicId);
            // Only set flashcards if we got a response
            if (response?.flashcards) {
                setFlashcards(response.flashcards);
            } else {
                setFlashcards([]); // Empty array for no flashcards
            }
        } catch (error) {
            console.error('Error fetching flashcards:', error);
            toast.error('Failed to load flashcards');
            setFlashcards([]); // Reset on error
        } finally {
            setFlashcardsLoading(false);
        }
    };

    fetchFlashcards();
}, [resource?.topicId]);

  // Add this useEffect after your existing useEffects
  useEffect(() => {
    const fetchNotes = async () => {
      if (!resource?.topicId) return;
      
      try {
        setFetchingNotes(true);
        console.log('Fetching notes for topicId:', resource.topicId); // Debug log
        
        const response = await getRevisionNotes(resource.topicId);
        console.log('Notes response:', response); // Debug log
        
        if (response?.revisionNotes) {
          setNotes(response.revisionNotes);
          console.log('Notes set successfully:', response.revisionNotes); // Debug log
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
        // A topic without generated notes returns 404; that is an expected empty state.
        if (error.response?.status !== 404) {
          toast.error('Failed to load notes');
        }
      } finally {
        setFetchingNotes(false);
      }
    };

    fetchNotes();
  }, [resource?.topicId]);

  return (
    <div className="resource-workspace">
      <aside className="resource-tool-sidebar">
        <div className="resource-sidebar-resource"><span className="resource-tool-eyebrow">{resource.type === 'pdf' ? 'PDF resource' : 'Video resource'}</span><h1>{resource.title || 'Untitled resource'}</h1><span className="resource-tool-meta">{videos.length} source{videos.length === 1 ? '' : 's'}</span></div>
        <nav className="resource-tool-tabs" aria-label="Resource tools">
          {sidebarItems.map((item) => <button key={item.id} type="button" onClick={() => setActiveTab(item.id)} className={activeTab === item.id ? 'is-active' : ''}><span>{item.icon}</span><span>{item.label}</span>{item.loading && <i className="resource-tab-loader" />}</button>)}
        </nav>
        {resource.type === "pdf" && <button type="button" className="resource-open-pdf" onClick={() => setShowPdfPreview(true)}><BsFileEarmarkPdf /> Open PDF</button>}
      </aside>
      <main className="resource-tool-main">
        <div className="resource-tool-main-header"><span>Study assistant</span><span>Grounded in this resource</span></div>
        <div className="resource-tool-content">{renderContent()}</div>
      </main>
      {showPdfPreview && resource.type === "pdf" && <div className="resource-pdf-preview" role="presentation" onMouseDown={() => setShowPdfPreview(false)}><section role="dialog" aria-modal="true" aria-label="PDF preview" onMouseDown={(event) => event.stopPropagation()}><div><span>PDF preview</span><button type="button" onClick={() => setShowPdfPreview(false)}>Close</button></div><iframe title="PDF resource" src={pdfUrl} /></section></div>}
    </div>
  );
};

export default VideoResourceViewer;
