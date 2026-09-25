import React, { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  PlayIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import ResourceUploadSection from "./ResourceUploadSection";

const choices = [
  {
    id: "video",
    title: "YouTube video",
    description: "Save a video lesson with a YouTube link.",
    Icon: PlayIcon,
  },
  {
    id: "pdf",
    title: "PDF document",
    description: "Upload a document for this topic.",
    Icon: DocumentTextIcon,
  },
];

const AddResourceModal = ({ isOpen, onClose, onVideoSubmit, onPDFSubmit, topicId }) => {
  const [mode, setMode] = useState(null);

  useEffect(() => {
    if (!isOpen) setMode(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selected = choices.find((choice) => choice.id === mode);
  const SelectedIcon = selected?.Icon;

  return (
    <div className="resource-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="resource-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-resource-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="resource-modal-header">
          {mode ? (
            <button type="button" className="resource-modal-back" onClick={() => setMode(null)}>
              <ArrowLeftIcon /> Choose another type
            </button>
          ) : <span className="resource-modal-kicker">Add to this topic</span>}
          <button type="button" className="resource-modal-close" onClick={onClose} aria-label="Close add resource">
            <XMarkIcon />
          </button>
        </div>

        {!mode ? (
          <div className="resource-modal-choice-content">
            <h2 id="add-resource-title">What would you like to add?</h2>
            <p>Choose a resource type to continue.</p>
            <div className="resource-modal-choices">
              {choices.map(({ id, title, description, Icon }) => (
                <button key={id} type="button" className="resource-modal-choice" onClick={() => setMode(id)}>
                  <span>{React.createElement(Icon)}</span><strong>{title}</strong><small>{description}</small>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="resource-modal-upload-content">
            <div className="resource-modal-upload-title">
              <span>{SelectedIcon && <SelectedIcon />}</span>
              <div><p className="resource-modal-kicker">Add {selected?.title}</p><h2 id="add-resource-title">{selected?.title}</h2></div>
            </div>
            <ResourceUploadSection
              mode={mode}
              topicId={topicId}
              onVideoSubmit={onVideoSubmit}
              onPDFSubmit={onPDFSubmit}
              onComplete={onClose}
            />
          </div>
        )}
      </section>
    </div>
  );
};

export default AddResourceModal;
