import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRightOnRectangleIcon, PlusIcon } from '@heroicons/react/24/outline';
import KnowledgeMap from '../components/graph/KnowledgeMap';
import { assets } from '../assets/assets';
import axios from '../services/apiClient';
import { useAuth } from '../hooks/useAuth';
import { goTo } from '../utils/navigation';

const GraphViewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const routeState = location.state || {};
  const [notebooks, setNotebooks] = useState(routeState.notebooks || []);
  const [topics, setTopics] = useState(routeState.topics || []);
  const [resources, setResources] = useState(routeState.resources || []);
  const handleLogout = () => { logout(); goTo('/'); };

  useEffect(() => {
    if (routeState.notebooks?.length) return;

    const loadExploreData = async () => {
      try {
        const folderResponse = await axios.get('/folder');
        const nextNotebooks = folderResponse.data.folders || [];
        const topicResponses = await Promise.all(nextNotebooks.map((notebook) => axios.get(`/folder/${notebook._id}`)));
        const nextTopics = topicResponses.flatMap((response) => response.data.topics || []);
        const resourceResponses = await Promise.all(nextTopics.map((topic) => axios.get(`/topic/${topic._id}`)));
        const nextResources = resourceResponses.flatMap((response) => response.data.resources || []);
        setNotebooks(nextNotebooks);
        setTopics(nextTopics);
        setResources(nextResources);
      } catch (error) {
        console.error('Failed to load Explore data:', error);
      }
    };

    loadExploreData();
  }, [routeState.notebooks]);

  return (
    <div className="dashboard-shell dashboard-product-shell graph-view-page">
      <header className="dashboard-topbar">
        <button className="dashboard-topbar-brand" type="button" onClick={() => navigate('/dashboard')}>
          <span className="dashboard-brand-mark"><img src={assets.logo} alt="" /></span>
          <span>NOTSY</span>
        </button>
        <nav className="dashboard-topbar-nav" aria-label="Primary navigation">
          <button type="button" onClick={() => navigate('/dashboard')}>Home</button>
          <button type="button" onClick={() => navigate('/dashboard')}>Notebooks</button>
          <button className="is-active" type="button">Map</button>
        </nav>
        <div className="dashboard-topbar-actions">
          <button className="dashboard-new-button" type="button" onClick={() => navigate('/dashboard')}><PlusIcon /> New</button>
          <button className="dashboard-logout-button" type="button" onClick={handleLogout}><ArrowRightOnRectangleIcon /> Logout</button>
        </div>
      </header>
      <main className="graph-view-main">
        <KnowledgeMap fullPage notebooks={notebooks || []} topics={topics || []} resources={resources || []} />
      </main>
    </div>
  );
};

export default GraphViewPage;
