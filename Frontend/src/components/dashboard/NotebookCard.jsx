import React, { useState } from 'react';
import { format } from 'date-fns';
import { TrashIcon } from '@heroicons/react/24/outline';
import DeleteDialog from '../common/DeleteDialog';
import { LuBookOpen, LuBrain, LuCode, LuFlaskConical, LuGraduationCap, LuLayers3, LuLightbulb, LuNotebookPen } from 'react-icons/lu';

const notebookIcons = [LuBookOpen, LuBrain, LuCode, LuFlaskConical, LuGraduationCap, LuLayers3, LuLightbulb, LuNotebookPen];

const getNotebookIcon = (name = '') => {
  const index = [...name].reduce((total, character) => total + character.charCodeAt(0), 0) % notebookIcons.length;
  return notebookIcons[index];
};

const NotebookCard = ({ notebook, onDelete }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const createdDate = notebook.createdAt ? 
    format(new Date(notebook.createdAt), 'MMM d, yyyy') : 
    'Recent';

  const NotebookIcon = getNotebookIcon(notebook.name);

  const handleDelete = async () => {
    if (deleting) return;

    try {
      setDeleting(true);
      const deleted = await onDelete(notebook._id);
      if (deleted !== false) setShowConfirm(false);
    } catch (error) {
      console.error('Error in delete handler:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Stop event from bubbling up
    setShowConfirm(true);
  };

  return (
    <div className="dashboard-notebook-card group relative h-[200px] rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <div className="notebook-icon-cover aspect-[4/3] overflow-hidden">
        <NotebookIcon aria-hidden="true" />
        <span>{String(notebook.name || 'N').slice(0, 1).toUpperCase()}</span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-0 p-4 w-full">
        <h3 className="text-lg font-semibold text-white truncate">{notebook.name}</h3>
        <p className="text-sm text-white/80">
          Created {createdDate}
        </p>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          aria-label={`Delete ${notebook.name}`}
          onClick={handleDeleteClick}
          disabled={deleting}
          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>

      <DeleteDialog open={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} busy={deleting} kind="notebook" name={notebook.name} />
    </div>
  );
};

export default NotebookCard;
