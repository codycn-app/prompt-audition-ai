import { useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

// This function directly manipulates the DOM.
// It's self-contained and free from React's lifecycle.
const applyThemeToDom = (theme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
};

// --- CRITICAL FIX ---
// Initialize the theme immediately when the script is loaded, even before React renders.
// This prevents any "flash of incorrect theme" and decouples the initial setup
// from the React component lifecycle, which was the source of the infinite loop.
try {
    const storedTheme = window.localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
        applyThemeToDom(storedTheme);
    } else {
        // If no theme is stored, default to dark and save it.
        applyThemeToDom('dark');
        window.localStorage.setItem('theme', 'dark');
    }
} catch (e) {
    console.error("Failed to apply initial theme from outside React", e);
    // Fallback in case of any error (e.g., localStorage access denied).
    applyThemeToDom('dark');
}


// The custom hook now serves to sync a React state with the theme and provide a safe way to update it.
export function useTheme(): [Theme, (theme: Theme) => void] {
    // The state is initialized from localStorage, ensuring it's consistent with the initial DOM state.
    const [theme, setThemeState] = useState<Theme>(() => {
        try {
            const storedTheme = window.localStorage.getItem('theme');
            return (storedTheme === 'light' || storedTheme === 'dark') ? storedTheme : 'dark';
        } catch {
            return 'dark';
        }
    });

    // The function to change the theme is memoized with useCallback.
    // It updates localStorage, applies the theme to the DOM, and updates the React state.
    const setTheme = useCallback((newTheme: Theme) => {
        try {
            // Persist to localStorage first.
            window.localStorage.setItem('theme', newTheme);
            // Apply class to the DOM.
            applyThemeToDom(newTheme);
            // Finally, update React state to trigger re-renders in components that depend on it.
            setThemeState(newTheme);
        } catch (error) {
            console.error('Failed to save theme', error);
        }
    }, []);

    // No useEffect is needed anymore, which was the primary source of the render loop.
    // The initial theme is set synchronously above, and subsequent changes are handled atomically
    // by the stable `setTheme` function.

    return [theme, setTheme];
}
