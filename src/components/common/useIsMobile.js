import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mobile screen size.
 * Returns true if screen width < 768px.
 * Uses matchMedia for efficient detection with proper cleanup.
 */
const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < breakpoint;
        }
        return false;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

        const handleChange = (event) => {
            setIsMobile(event.matches);
        };

        // Set initial value
        setIsMobile(mediaQuery.matches);

        // Modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            // Fallback for older browsers
            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, [breakpoint]);

    return isMobile;
};

export default useIsMobile;
