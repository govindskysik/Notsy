import { Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function DeleteDialog({ open, onClose, onConfirm, busy, kind, name }) {
  return (
    <Dialog open={open} onClose={() => !busy && onClose()} className="delete-dialog" onClick={(event) => event.stopPropagation()}>
      <div className="delete-dialog-backdrop" aria-hidden="true" />
      <div className="delete-dialog-positioner">
        <DialogPanel className="frost-modal delete-dialog-panel" aria-busy={busy}>
          <button type="button" className="frost-modal-close" aria-label="Close delete confirmation" disabled={busy} onClick={onClose}>
            <XMarkIcon />
          </button>
          <span className="delete-dialog-icon"><TrashIcon aria-hidden="true" /></span>
          <p className="frost-modal-eyebrow">Manage your workspace</p>
          <DialogTitle className="frost-modal-title">Delete {kind}?</DialogTitle>
          <Description className="frost-modal-copy delete-dialog-copy">
            You’re about to delete <strong>“{name}”</strong>. This action cannot be undone.
          </Description>
          <div className="frost-modal-actions">
            <button type="button" data-autofocus className="frost-modal-cancel" disabled={busy} onClick={onClose}>Keep {kind}</button>
            <button type="button" className="frost-modal-submit delete-dialog-confirm" disabled={busy} onClick={onConfirm}>
              <TrashIcon aria-hidden="true" />{busy ? 'Deleting…' : `Delete ${kind}`}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
