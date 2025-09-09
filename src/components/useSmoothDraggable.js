import { useState, useRef, useCallback, useEffect } from "react";

export function useSmoothDraggable(initialX = 100, initialY = 100, width = 350, height = 400) {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const elementRef = useRef(null);
  const animationFrameRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    // prevent dragging when clicking inside content
    if (e.target.closest(".panel-content")) return;

    setIsDragging(true);
    const rect = elementRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const newX = Math.max(0, Math.min(window.innerWidth - width, e.clientX - dragOffset.x));
        const newY = Math.max(0, Math.min(window.innerHeight - height, e.clientY - dragOffset.y));

        setPosition({ x: newX, y: newY });
      });
    },
    [isDragging, dragOffset, width, height]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return { position, isDragging, elementRef, handleMouseDown };
}
