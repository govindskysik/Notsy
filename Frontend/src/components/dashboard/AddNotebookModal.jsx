import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

const AddNotebookModal = ({ isOpen, onClose, onAdd, loading }) => {
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter a notebook name");
      return;
    }

    if (name.trim().length > 20) {
      toast.error("Notebook name should be less than 20 characters");
      return;
    }

    try {
      await onAdd(name.trim());
      setName('');
      onClose();
    } catch (error) {
      console.error('Error adding notebook:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="frost-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="frost-modal" role="dialog" aria-modal="true" aria-labelledby="new-notebook-title" onMouseDown={(event) => event.stopPropagation()}>
        <button
          onClick={onClose}
          className="frost-modal-close"
          aria-label="Close create notebook"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        
        <p className="frost-modal-eyebrow">New workspace</p>
        <h2 id="new-notebook-title" className="frost-modal-title">Create a notebook</h2>
        <p className="frost-modal-copy">Give this space a name, then begin collecting your ideas.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Notebook Name Input */}
          <div>
            <label className="frost-modal-label">
              Notebook Name <span className="text-sm">(max 20 characters)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter notebook name"
              className="frost-modal-input"
              maxLength={20}
            />
            {name.length > 0 && (
              <p className="frost-modal-helper">
                {20 - name.length} characters remaining
              </p>
            )}
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
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNotebookModal;
