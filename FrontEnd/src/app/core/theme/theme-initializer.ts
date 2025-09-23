/**
 * Theme initializer function that applies the default theme immediately
 * This ensures that theme classes are applied before Angular fully loads
 */
export function initializeTheme(): void {
    // Apply theme class to body immediately
    if (typeof document !== 'undefined') {
        const body = document.body;
        
        // Remove any existing theme classes
        const existingThemeClasses = Array.from(body.classList).filter(className => 
            className.startsWith('theme-')
        );
        existingThemeClasses.forEach(className => {
            body.classList.remove(className);
        });
        
        // Apply default theme
        body.classList.add('theme-default');
        
        // Apply light scheme if no scheme is present
        if (!body.classList.contains('light') && !body.classList.contains('dark')) {
            body.classList.add('light');
        }
        

    }
}

// Call immediately when this module is loaded
initializeTheme();