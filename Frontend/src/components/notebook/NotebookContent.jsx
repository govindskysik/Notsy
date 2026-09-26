import React, { useState } from "react";
import { BookOpenIcon, TrashIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import DeleteDialog from "../common/DeleteDialog";
import KnowledgeMap from "../graph/KnowledgeMap";
import { LuBookOpen, LuBrain, LuCode, LuFlaskConical, LuLightbulb, LuNotebookPen } from "react-icons/lu";
import { goTo } from "../../utils/navigation";

const icons = [LuBookOpen, LuBrain, LuCode, LuFlaskConical, LuLightbulb, LuNotebookPen];
const iconFor = (title = "") => icons[[...title].reduce((sum, char) => sum + char.charCodeAt(0), 0) % icons.length];

const NotebookContent = ({ notebook, topics = [], resources = [], loading, onAddTopic, onDeleteTopic }) => {
  const [deleting, setDeleting] = useState(null);
  const [pendingTopic, setPendingTopic] = useState(null);

  const removeTopic = async () => {
    if (deleting || !pendingTopic) return;
    setDeleting(pendingTopic._id);
    try {
      const deleted = await onDeleteTopic(pendingTopic._id);
      if (deleted !== false) setPendingTopic(null);
    } finally { setDeleting(null); }
  };

  return <div className="notebook-workspace">
    <section className="notebook-hero notebook-hero-with-map">
      <div className="notebook-hero-intro"><p className="dashboard-eyebrow">Notebook workspace</p><h1>{notebook?.name || "Notebook"}</h1><p>Ideas, topics and resources gathered in one place.</p><div className="notebook-hero-mark"><BookOpenIcon /><span>{topics.length} topics</span></div></div>
      <div className="notebook-hero-map"><KnowledgeMap compact notebooks={notebook ? [notebook] : []} topics={topics} resources={resources} /></div>
    </section>

    <section className="notebook-topic-section">
      <div className="notebook-section-heading"><div><p className="dashboard-eyebrow">Your thinking</p><h2>Topics</h2></div><span>{topics.length} spaces</span></div>
      {loading ? <div className="home-empty-state">Loading topics...</div> : topics.length ? <div className="notebook-topic-grid">{topics.map((topic) => { const Icon = iconFor(topic.title); return <article className="notebook-topic-tile" key={topic._id} onClick={() => goTo(`/dashboard/topic/${topic._id}`)}><div className="notebook-topic-icon"><Icon /></div><div className="notebook-topic-copy"><strong>{topic.title}</strong><small>Open topic</small></div><button type="button" aria-label={`Delete ${topic.title}`} onClick={(event) => { event.stopPropagation(); setPendingTopic(topic); }} disabled={deleting === topic._id}><TrashIcon /></button><ArrowRightIcon className="notebook-topic-arrow" /></article>; })}</div> : <div className="home-empty-state"><p>No topics yet.</p><button type="button" onClick={onAddTopic}>Create your first topic</button></div>}
    </section>

    <DeleteDialog open={!!pendingTopic} onClose={() => setPendingTopic(null)} onConfirm={removeTopic} busy={!!deleting} kind="topic" name={pendingTopic?.title} />
  </div>;
};

export default NotebookContent;
