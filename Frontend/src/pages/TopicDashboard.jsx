import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import TopicContent from "../components/topic/TopicContent";
import axios from "../services/apiClient";
import { toast } from "react-hot-toast";
import { assets } from "../assets/assets";
import { goTo } from "../utils/navigation";

const TopicDashboard = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const handleBackToNotebook = () => {
    const notebookId = topic?.folderId?._id || topic?.folderId;
    goTo(notebookId ? `/dashboard/notebook/${notebookId}` : '/dashboard', { replace: true });
  };

  useEffect(() => {
    const fetchTopicData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/topic/${topicId}`);
        setTopic(response.data.topic);
        setResources(response.data.resources || []);
      } catch (error) {
        console.error('Error fetching topic data:', error);
        toast.error('Failed to load topic data');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (topicId) {
      fetchTopicData();
    }
  }, [topicId, navigate]);

  return (
    <div className="dashboard-shell dashboard-product-shell topic-page">
      <header className="dashboard-topbar"><button className="dashboard-topbar-brand" type="button" onClick={() => navigate('/dashboard')}><span className="dashboard-brand-mark"><img src={assets.logo} alt="" /></span><span>NOTSY</span></button><div className="dashboard-topbar-actions"><button type="button" className="dashboard-new-button" onClick={() => setIsResourceModalOpen(true)}><PlusIcon /> New resource</button><button type="button" className="dashboard-back-button" onClick={handleBackToNotebook}><ArrowLeftIcon /> Back</button></div></header>
      <main className="topic-page-content"><TopicContent topic={topic} resources={resources} loading={loading} isResourceModalOpen={isResourceModalOpen} onCloseResourceModal={() => setIsResourceModalOpen(false)} onResourcesUpdate={async () => { const response = await axios.get(`/topic/${topicId}`); setResources(response.data.resources || []); }} /></main>
    </div>
  );
};

export default TopicDashboard;
