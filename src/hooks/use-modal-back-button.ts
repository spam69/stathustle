import { useEffect } from 'react';

export function useModalBackButton(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    // Add a new history entry when modal opens
    window.history.pushState({ modal: true }, '');

    const handlePopState = (event: PopStateEvent) => {
      // If the modal is open and we're going back, close the modal
      if (isOpen) {
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);
} 