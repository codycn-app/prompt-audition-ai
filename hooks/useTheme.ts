import { useCallback } from 'react';

type Theme = 'light' | 'dark';

// This function directly manipulates the DOM. It is self-contained.
const applyThemeToDom = (theme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
};

// --- DEFINITIVE FIX FOR BLACK SCREEN ---
// This script runs immediately when the file is loaded, BEFORE React even starts rendering.
// It sets the theme based on localStorage, preventing any "flash of incorrect theme"
// and completely avoiding React's lifecycle for the initial setup.
// This makes an infinite loop impossible during app initialization.
try {
    const storedTheme = window.localStorage.getItem('theme') as Theme | null;
    if (storedTheme === 'light' || storedTheme === 'dark') {
        applyThemeToDom(storedTheme);
    } else {
        // Default to 'dark' if nothing is stored or value is invalid.
        applyThemeToDom('dark');
        window.localStorage.setItem('theme', 'dark');
    }
} catch (e) {
    console.error("Failed to apply initial theme from outside React", e);
    // Fallback in case of any error (e.g., localStorage access denied).
    applyThemeToDom('dark');
}

// The custom hook is now extremely simple. It does NOT use useState.
// It only provides a stable function to CHANGE the theme. This function
// does not trigger any React re-renders, breaking the infinite loop chain.
export function useTheme(): [(theme: Theme) => void] {
    const setTheme = useCallback((newTheme: Theme) => {
        try {
            // Persist to localStorage first.
            window.localStorage.setItem('theme', newTheme);
            // Apply class to the DOM.
            applyThemeToDom(newTheme);
        } catch (error) {
            console.error('Failed to save theme', error);
        }
    }, []);

    // We no longer return the theme state from this hook. No component currently needs it.
    // The styling is handled entirely by the class on the <html> tag.
    return [setTheme];
}
