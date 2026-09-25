import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

const AddTopicModal = ({ isOpen, onClose, onAdd, loading }) => {
  const [title, setTitle] = useState('');


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter a topic name");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      

      await onAdd(formData);
      setTitle('');
    } catch (error) {
      console.error('Error adding topic:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="frost-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="frost-modal" role="dialog" aria-modal="true" aria-labelledby="new-topic-title" onMouseDown={(event) => event.stopPropagation()}>
        <button
          onClick={onClose}
          className="frost-modal-close"
          aria-label="Close add topic"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        
        <p className="frost-modal-eyebrow">New topic</p>
        <h2 id="new-topic-title" className="frost-modal-title">Start a topic</h2>
        <p className="frost-modal-copy">Name the question, subject, or idea you want to explore.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Topic Name Input */}
          <div>
            <label className="frost-modal-label">
              Topic Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter topic name"
              className="frost-modal-input"
              maxLength={50}
            />
          </div>
          
          {/* Action Buttons */}
          <div className="frost-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="frost-modal-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="frost-modal-submit"
            >
              {loading ? 'Adding...' : 'Add Topic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTopicModal;
