import React, { useEffect, useMemo, useState } from "react";
import { ArrowRightIcon, BookOpenIcon, DocumentTextIcon, PlusIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import NotebookCard from "./NotebookCard";
import axios from "../../services/apiClient";
import KnowledgeMap from "../graph/KnowledgeMap";

const DashboardContent = ({ notebooks = [], loading, onDeleteNotebook, onAddNotebook, searchTerm = "" }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [resources, setResources] = useState([]);

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      if (!notebooks.length) {
        setTopics([]);
        setResources([]);
        return;
      }
      try {
        const topicResponses = await Promise.all(notebooks.map((notebook) => axios.get(`/folder/${notebook._id}`)));
        const nextTopics = topicResponses.flatMap((response) => response.data.topics || []);
        const resourceResponses = await Promise.all(nextTopics.map((topic) => axios.get(`/topic/${topic._id}`)));
        setTopics(nextTopics);
        setResources(resourceResponses.flatMap((response) => response.data.resources || []));
      } catch (error) {
        console.error("Error fetching workspace data:", error);
      }
    };
    fetchWorkspaceData();
  }, [notebooks]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleNotebooks = useMemo(() => notebooks.filter((notebook) => !normalizedSearch || notebook.name?.toLowerCase().includes(normalizedSearch)), [notebooks, normalizedSearch]);
  const visibleTopics = useMemo(() => topics.filter((topic) => !normalizedSearch || topic.title?.toLowerCase().includes(normalizedSearch)), [topics, normalizedSearch]);
  const visibleResources = useMemo(() => resources.filter((resource) => !normalizedSearch || resource.title?.toLowerCase().includes(normalizedSearch) || resource.type?.toLowerCase().includes(normalizedSearch)), [resources, normalizedSearch]);

  const openNotebook = (notebookId) => navigate(`/dashboard/notebook/${notebookId}`);
  const firstNotebook = visibleNotebooks[0] || notebooks[0];
  const recentResources = visibleResources.slice(0, 4);

  return (
    <div className="home-workspace">
      <section className="home-hero-section home-hero-with-map">
        <div className="home-hero-intro">
          <p className="dashboard-eyebrow">Welcome back</p>
          <h1>Good to see you,<br /><em>{user?.name || "there"}.</em></h1>
          <p className="home-hero-copy">Continue where you left off.</p>
          <div className="home-quick-actions">
            <button type="button" className="home-primary-action" onClick={onAddNotebook}><PlusIcon /> New notebook</button>
            <span className="home-action-note"><SparklesIcon /> One calm place for your thinking.</span>
          </div>
        </div>
        <div className="home-hero-map"><KnowledgeMap compact notebooks={notebooks} topics={topics} resources={resources} /></div>
      </section>

      <section className="home-continue-section">
        <div className="home-section-label"><span>Continue where you left off</span><span>{firstNotebook ? "Ready to open" : "A fresh start"}</span></div>
        <button type="button" className="home-continue-row" onClick={() => firstNotebook ? openNotebook(firstNotebook._id) : onAddNotebook()}>
          <span className="home-continue-icon"><BookOpenIcon /></span>
          <span className="home-continue-copy"><strong>{firstNotebook?.name || "Create your first notebook"}</strong><small>{firstNotebook ? "Open your latest workspace" : "Start organizing your ideas"}</small></span>
          <ArrowRightIcon />
        </button>
      </section>

      <section id="home-notebooks" className="home-section home-notebook-section">
        <div className="home-section-heading"><div><p className="dashboard-eyebrow">Your workspace</p><h2>Your notebooks</h2><p>Notes, ideas and resources in one place.</p></div><span>{visibleNotebooks.length} spaces</span></div>
        {loading ? <div className="home-empty-state">Loading your workspace...</div> : visibleNotebooks.length ? <div className="home-notebook-grid">{visibleNotebooks.map((notebook) => <article className="home-notebook-item" key={notebook._id} onClick={() => openNotebook(notebook._id)}><NotebookCard notebook={notebook} onDelete={() => onDeleteNotebook(notebook._id)} /></article>)}</div> : <div className="home-empty-state"><p>{normalizedSearch ? "No matching notebooks." : "Create your first notebook to start organizing your ideas."}</p>{!normalizedSearch && <button type="button" onClick={onAddNotebook}><PlusIcon /> New notebook</button>}</div>}
      </section>

      <section id="home-notes" className="home-section home-notes-section">
        <div className="home-section-heading"><div><p className="dashboard-eyebrow">Recent work</p><h2>Recent notes</h2><p>Resources and topics you have added to your workspace.</p></div><span>{recentResources.length + visibleTopics.length} items</span></div>
        {recentResources.length || visibleTopics.length ? <div className="home-activity-list">{recentResources.map((resource) => <button type="button" className="home-activity-row" key={resource._id} onClick={() => navigate(`/dashboard/resource/${resource._id}`)}><DocumentTextIcon /><span><strong>{resource.title || `${resource.type || "Resource"} resource`}</strong><small>{resource.type || "Resource"}</small></span><ArrowRightIcon /></button>)}{visibleTopics.slice(0, Math.max(0, 4 - recentResources.length)).map((topic) => <button type="button" className="home-activity-row" key={topic._id} onClick={() => navigate(`/dashboard/topic/${topic._id}`)}><BookOpenIcon /><span><strong>{topic.title}</strong><small>Topic</small></span><ArrowRightIcon /></button>)}</div> : <div className="home-empty-state"><p>No recent notes yet.</p><span>Upload a resource or open a topic to begin.</span></div>}
      </section>

      <section className="home-section home-all-section">
        <div className="home-section-heading"><div><p className="dashboard-eyebrow">Everything in one place</p><h2>All notebooks</h2></div><span>{notebooks.length} total</span></div>
        <div className="home-all-list">{visibleNotebooks.map((notebook, index) => <button type="button" key={notebook._id} onClick={() => openNotebook(notebook._id)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{notebook.name}</strong><small>Open workspace</small><ArrowRightIcon /></button>)}</div>
      </section>
    </div>
  );
};

export default DashboardContent;
