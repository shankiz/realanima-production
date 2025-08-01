import React from 'react';
import { Button } from './button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'default' | 'danger' | 'warning';
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
  type?: 'success' | 'error' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'default'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return 'border-red-500/30 bg-red-950/20 modal-danger';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-950/20 modal-warning';
      default:
        return 'border-gray-700/30 bg-gray-950/90 modal-default';
    }
  };

  const getConfirmButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 modal-overlay flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className={`rounded-xl border ${getTypeStyles()} backdrop-blur-md shadow-2xl w-full max-w-md`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white modal-title mb-3">{title}</h3>
          <div className="text-gray-300 modal-message mb-6 whitespace-pre-line leading-relaxed">{message}</div>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800/50 modal-cancel-btn"
            >
              {cancelText}
            </Button>
            <button
                onClick={onConfirm}
                disabled={confirmText.includes('...')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center ${
                  confirmText.includes('...') 
                    ? 'bg-gray-600 cursor-not-allowed opacity-75' 
                    : type === 'danger' 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : type === 'warning'
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {confirmText.includes('...') && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {confirmText}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  buttonText = 'OK',
  type = 'info'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'border-green-500/30 bg-green-950/20 modal-success';
      case 'error':
        return 'border-red-500/30 bg-red-950/20 modal-error';
      default:
        return 'border-gray-700/30 bg-gray-950/90 modal-info';
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'error':
        return 'bg-red-600 hover:bg-red-700 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 modal-overlay flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className={`rounded-xl border ${getTypeStyles()} backdrop-blur-md shadow-2xl w-full max-w-md`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white modal-title mb-3">{title}</h3>
          <div className="text-gray-300 modal-message mb-6 whitespace-pre-line leading-relaxed">{message}</div>
          <div className="flex justify-end">
            <Button
              onClick={onClose}
              className={getButtonStyles()}
            >
              {buttonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};