class ThemeStore {
    isDark = $state(false);

    constructor() {
        // Initialize from localStorage or system preference
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('theme');
            if (stored) {
                this.isDark = stored === 'dark';
            } else {
                this.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
        }
    }

    toggle() {
        this.isDark = !this.isDark;
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
        }
    }

    set(dark: boolean) {
        this.isDark = dark;
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', dark ? 'dark' : 'light');
        }
    }
}

export const themeStore = new ThemeStore();
