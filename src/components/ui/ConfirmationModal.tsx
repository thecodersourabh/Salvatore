import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

/**
 * ConfirmationModal - A reusable confirmation dialog component
 * 
 * Features:
 * - Standard confirmation with optional text input verification
 * - Customizable colors (red, blue, green) and icons (warning, delete)
 * - Text confirmation mode requires users to type exact text to enable confirm button
 * - Dark mode support and accessibility features
 * 
 * Usage Examples:
 * 
 * // Simple confirmation
 * <ConfirmationModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onConfirm={handleConfirm}
 *   title="Confirm Action"
 *   message="Are you sure you want to proceed?"
 * />
 * 
 * // Delete confirmation with text verification
 * <ConfirmationModal
 *   isOpen={showDeleteModal}
 *   onClose={() => setShowDeleteModal(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Item"
 *   message="This action cannot be undone."
 *   requireTextConfirmation={true}
 *   confirmationText="item name"
 *   icon="delete"
 *   confirmButtonColor="red"
 * />
 */

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: 'red' | 'blue' | 'green';
  icon?: 'warning' | 'delete';
  requireTextConfirmation?: boolean;
  confirmationText?: string;
  confirmationPlaceholder?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonColor = 'red',
  icon = 'warning',
  requireTextConfirmation = false,
  confirmationText = '',
  confirmationPlaceholder = 'Type to confirm'
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isConfirmEnabled, setIsConfirmEnabled] = useState(!requireTextConfirmation);

  useEffect(() => {
    if (requireTextConfirmation && confirmationText) {
      setIsConfirmEnabled(inputValue.trim().toLowerCase() === confirmationText.toLowerCase());
    } else {
      setIsConfirmEnabled(true);
    }
  }, [inputValue, requireTextConfirmation, confirmationText]);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setIsConfirmEnabled(!requireTextConfirmation);
    }
  }, [isOpen, requireTextConfirmation]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getConfirmButtonClasses = () => {
    switch (confirmButtonColor) {
      case 'blue':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      case 'green':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      case 'red':
      default:
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
    }
  };

  const getIconClasses = () => {
    switch (confirmButtonColor) {
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      case 'green':
        return 'bg-green-100 text-green-600';
      case 'red':
      default:
        return 'bg-red-100 text-red-600';
    }
  };

  const IconComponent = icon === 'delete' ? Trash2 : AlertTriangle;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 transition-opacity" 
          aria-hidden="true"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        />
        
        {/* Center modal on desktop */}
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <div 
          className="relative inline-block transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${getIconClasses()}`}>
                <IconComponent className="h-6 w-6" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    {message}
                  </p>
                  {requireTextConfirmation && confirmationText && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Type "{confirmationText}" to confirm:
                      </label>
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={confirmationPlaceholder}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 dark:bg-gray-700 dark:text-white text-sm"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleConfirm();
              }}
              disabled={!isConfirmEnabled}
              className={`inline-flex w-full justify-center rounded-lg px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200 ${
                isConfirmEnabled 
                  ? getConfirmButtonClasses()
                  : 'bg-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              {confirmText}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="mt-3 inline-flex w-full justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-base font-medium text-gray-700 dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};