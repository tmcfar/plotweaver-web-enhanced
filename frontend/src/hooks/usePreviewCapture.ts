import { useCallback } from 'react';
import html2canvas from 'html2canvas';

export const usePreviewCapture = () => {
  const capturePreview = useCallback(async (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return null;

    try {
      const canvas = await html2canvas(element);
      const screenshot = canvas.toDataURL('image/png');
      const html = element.innerHTML;

      // Send to backend
      const response = await fetch('http://localhost:8000/api/preview/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html,
          screenshot,
          metadata: {
            width: element.offsetWidth,
            height: element.offsetHeight,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to capture preview:', error);
      return false;
    }
  }, []);

  return { capturePreview };
};