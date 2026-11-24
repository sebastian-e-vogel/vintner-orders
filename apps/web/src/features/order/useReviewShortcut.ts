import { useEffect } from 'react';

// Cmd or Ctrl + Enter from anywhere on the page. A document listener is a browser subscription.
export function useReviewShortcut(onReview: () => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return;
      if (event.repeat) return;
      event.preventDefault();
      onReview();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onReview]);
}
