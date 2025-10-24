import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg animate-fade-in-scale"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-lg shadow-2xl bg-cyber-surface/90 backdrop-blur-2xl shadow-cyber-glow-lg border border-cyber-pink/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-lg font-medium leading-6 text-cyber-on-surface">{title}</h3>
          <div className="mt-2">
            <p className="text-sm text-cyber-on-surface-secondary">{message}</p>
          </div>
        </div>
        <div className="flex justify-end px-6 py-4 space-x-3 bg-cyber-surface/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-cyber-on-surface bg-cyber-surface/50 rounded-lg hover:bg-cyber-surface transition active:scale-95"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 text-sm font-medium text-white bg-cyber-pink rounded-lg hover:shadow-cyber-glow transition active:scale-95"
          >
            Xác nhận Xóa
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;