import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import NotebookContent from "../components/notebook/NotebookContent";
import axios from "../services/apiClient";
import { toast } from "react-hot-toast";
import AddTopicModal from "../components/notebook/AddTopicModal";
import { assets } from "../assets/assets";
import { goTo } from "../utils/navigation";

const NotebookDashboard = () => {
  const { notebookId } = useParams();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [notebook, setNotebook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addingTopic, setAddingTopic] = useState(false);
  const [resources, setResources] = useState([]);

  useEffect(() => {
    const fetchNotebookData = async () => {
      try {
        setLoading(true);
        // Fetch notebook and topics
        const response = await axios.get(`/folder/${notebookId}`);
        setNotebook(response.data.folder);

        // Get topics
        const topicsData = response.data.topics || [];
        setTopics(topicsData);

        // Fetch resources for all topics
        const resourcePromises = topicsData.map(topic =>
          axios.get(`/topic/${topic._id}`)
        );

        const resourceResponses = await Promise.all(resourcePromises);
        const allResources = resourceResponses.reduce((acc, response) => {
          return [...acc, ...(response.data.resources || [])];
        }, []);

        setResources(allResources);
      } catch (error) {
        console.error('Error fetching notebook data:', error);
        toast.error('Failed to load notebook data');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (notebookId) {
      fetchNotebookData();
    }
  }, [notebookId, navigate]);

  const handleAddTopic = async (formData) => {
    try {
      setAddingTopic(true);
      
      // Create proper FormData object
      const topicFormData = new FormData();
      topicFormData.append('topic', formData.get('title')); // Topic name
      topicFormData.append('folderId', notebookId); // Parent notebook ID

      // Log FormData contents for debugging
      for (let pair of topicFormData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await axios.post("/topic", topicFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.newTopic) {
        setTopics(prev => [...prev, response.data.newTopic]);
        toast.success("Topic created successfully");
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error creating topic:", error.response?.data || error);
      toast.error(error.response?.data?.msg || "Failed to create topic");
    } finally {
      setAddingTopic(false);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    try {
      await axios.delete(`/topic/${topicId}`);
      setTopics(prev => prev.filter(topic => topic._id !== topicId));
      toast.success("Topic deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting topic:", error);
      toast.error("Failed to delete topic");
      return false;
    }
  };

  return (
    <div className="dashboard-shell dashboard-product-shell notebook-page">
          <header className="dashboard-topbar">
            <button className="dashboard-topbar-brand" type="button" onClick={() => navigate('/dashboard')}><span className="dashboard-brand-mark"><img src={assets.logo} alt="" /></span><span>NOTSY</span></button>
            <div className="dashboard-topbar-actions"><button type="button" className="dashboard-new-button" onClick={() => setIsModalOpen(true)}><PlusIcon /> New topic</button><button type="button" className="dashboard-back-button" onClick={() => goTo('/dashboard', { replace: true })}><ArrowLeftIcon /> Back</button></div>
          </header>
          <main className="notebook-page-content">
            <NotebookContent notebook={notebook} topics={topics} resources={resources} loading={loading} onAddTopic={() => setIsModalOpen(true)} onDeleteTopic={handleDeleteTopic} />
          </main>

      {/* Add Topic Modal */}
      <AddTopicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddTopic}
        loading={addingTopic}
      />
    </div>
  );
};

export default NotebookDashboard;
