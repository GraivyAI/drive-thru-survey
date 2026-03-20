interface LogoutConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmDialog({ open, onClose, onConfirm }: LogoutConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      onClick={onClose}
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[300px] rounded-2xl border border-line p-6 text-center shadow-2xl"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <p className="font-semibold text-txt-primary text-[15px] tracking-tight mb-1">
          Log out?
        </p>
        <p className="text-[13px] text-txt-secondary mb-6">
          You'll need to re-enter your lane code to continue surveying.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium border border-line text-txt-secondary"
            style={{ backgroundColor: 'var(--bg-input)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-red-600 border border-red-200"
            style={{ backgroundColor: 'var(--bg-input)' }}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
