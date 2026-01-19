import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Base theme options shared between light and dark
const getThemeOptions = (mode: 'light' | 'dark') => ({
    palette: {
        mode,
        primary: {
            main: '#1e40af',
            light: '#3b82f6',
            dark: '#1e3a8a',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#0891b2',
            light: '#22d3ee',
            dark: '#0e7490',
            contrastText: '#ffffff',
        },
        error: {
            main: '#dc2626',
            light: '#f87171',
            dark: '#b91c1c',
        },
        warning: {
            main: '#d97706',
            light: '#fbbf24',
            dark: '#b45309',
        },
        success: {
            main: '#16a34a',
            light: '#4ade80',
            dark: '#15803d',
        },
        background: mode === 'light'
            ? { default: '#f8fafc', paper: '#ffffff' }
            : { default: '#0f172a', paper: '#1e293b' },
        text: mode === 'light'
            ? { primary: '#1e293b', secondary: '#64748b' }
            : { primary: '#f1f5f9', secondary: '#94a3b8' },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700, fontSize: '2.5rem' },
        h2: { fontWeight: 600, fontSize: '2rem' },
        h3: { fontWeight: 600, fontSize: '1.5rem' },
        h4: { fontWeight: 600, fontSize: '1.25rem' },
        h5: { fontWeight: 600, fontSize: '1.125rem' },
        h6: { fontWeight: 600, fontSize: '1rem' },
        button: { textTransform: 'none' as const, fontWeight: 500 },
    },
    shape: { borderRadius: 12 },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    padding: '10px 20px',
                    transition: 'all 0.2s ease-in-out',
                    fontWeight: 600,
                },
                contained: {
                    boxShadow: '0 2px 8px rgba(30, 64, 175, 0.25)',
                    '&:hover': {
                        boxShadow: '0 4px 16px rgba(30, 64, 175, 0.35)',
                        transform: 'translateY(-1px)',
                    },
                },
                outlined: mode === 'dark' ? {
                    borderColor: '#60a5fa', // Lighter blue for dark mode
                    color: '#93c5fd', // Even lighter for text
                    '&:hover': {
                        borderColor: '#93c5fd',
                        backgroundColor: 'rgba(147, 197, 253, 0.08)',
                    },
                } : {},
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: mode === 'light'
                        ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        : '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
                    border: mode === 'light'
                        ? '1px solid rgba(0, 0, 0, 0.05)'
                        : '1px solid rgba(255, 255, 255, 0.05)',
                    '&:hover': {
                        transform: 'translateY(-4px) scale(1.01)',
                        boxShadow: mode === 'light'
                            ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                            : '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    borderRadius: 8,
                    transition: 'all 0.2s ease',
                },
                colorSuccess: {
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: '#ffffff',
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.35)',
                },
                colorWarning: {
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)',
                },
                colorError: {
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)',
                },
                colorInfo: {
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                    color: '#ffffff',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.35)',
                },
                colorPrimary: {
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                    boxShadow: '0 2px 8px rgba(30, 64, 175, 0.35)',
                },
                colorSecondary: {
                    background: 'linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)',
                    boxShadow: '0 2px 8px rgba(8, 145, 178, 0.35)',
                },
            },
        },
        MuiTextField: {
            defaultProps: { variant: 'outlined' as const, size: 'small' as const },
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 10,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            boxShadow: mode === 'light'
                                ? '0 2px 8px rgba(0, 0, 0, 0.08)'
                                : '0 2px 8px rgba(0, 0, 0, 0.25)',
                        },
                        '&.Mui-focused': {
                            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2)',
                        },
                    },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: mode === 'light'
                        ? '0 1px 3px rgba(0,0,0,0.08)'
                        : '0 1px 3px rgba(0,0,0,0.3)',
                    backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
                    backdropFilter: 'blur(10px)',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
                    borderRight: mode === 'light'
                        ? '1px solid rgba(0, 0, 0, 0.08)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        transform: 'scale(1.1)',
                    },
                },
            },
        },
        MuiFab: {
            styleOverrides: {
                root: {
                    boxShadow: '0 4px 14px rgba(30, 64, 175, 0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: '0 6px 20px rgba(30, 64, 175, 0.5)',
                    },
                },
            },
        },
    },
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem('app_theme');
        return (saved as ThemeMode) || 'light';
    });

    // Determine if we should use dark mode
    const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
        window.matchMedia('(prefers-color-scheme: dark)').matches
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const isDark = mode === 'dark' || (mode === 'system' && systemPrefersDark);

    const handleSetMode = (newMode: ThemeMode) => {
        setMode(newMode);
        localStorage.setItem('app_theme', newMode);
    };

    const theme = useMemo(
        () => createTheme(getThemeOptions(isDark ? 'dark' : 'light')),
        [isDark]
    );

    return (
        <ThemeContext.Provider value={{ mode, setMode: handleSetMode, isDark }}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};

export const useThemeMode = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useThemeMode must be used within a ThemeProvider');
    }
    return context;
};
