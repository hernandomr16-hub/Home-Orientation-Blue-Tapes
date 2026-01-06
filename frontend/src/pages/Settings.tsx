import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Switch,
    FormControlLabel,
    Divider,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Language as LanguageIcon,
    DarkMode as ThemeIcon,
    Notifications as NotificationsIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { useThemeMode } from '../contexts/ThemeContext';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const { mode, setMode } = useThemeMode();

    // Settings state (stored in localStorage for persistence)
    const [language, setLanguage] = useState(() =>
        localStorage.getItem('app_language') || 'es'
    );
    const [emailNotifications, setEmailNotifications] = useState(() =>
        localStorage.getItem('email_notifications') !== 'false'
    );
    const [pushNotifications, setPushNotifications] = useState(() =>
        localStorage.getItem('push_notifications') !== 'false'
    );

    const handleLanguageChange = (value: string) => {
        setLanguage(value);
        localStorage.setItem('app_language', value);
    };

    const handleThemeChange = (value: string) => {
        setMode(value as 'light' | 'dark' | 'system');
    };

    const handleEmailNotifications = (checked: boolean) => {
        setEmailNotifications(checked);
        localStorage.setItem('email_notifications', String(checked));
    };

    const handlePushNotifications = (checked: boolean) => {
        setPushNotifications(checked);
        localStorage.setItem('push_notifications', String(checked));
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => navigate(-1)}>
                    <BackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight={700}>
                    Settings
                </Typography>
            </Box>

            <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                {/* Language Settings */}
                <Card sx={{ mb: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <LanguageIcon color="primary" />
                            <Typography variant="h6" fontWeight={600}>
                                Language / Idioma
                            </Typography>
                        </Box>

                        <FormControl fullWidth>
                            <InputLabel>Language</InputLabel>
                            <Select
                                value={language}
                                label="Language"
                                onChange={(e) => handleLanguageChange(e.target.value)}
                            >
                                <MenuItem value="es">🇪🇸 Español</MenuItem>
                                <MenuItem value="en">🇺🇸 English</MenuItem>
                            </Select>
                        </FormControl>

                        <Alert severity="info" sx={{ mt: 2 }}>
                            Language changes will be applied in a future update.
                        </Alert>
                    </CardContent>
                </Card>

                {/* Theme Settings */}
                <Card sx={{ mb: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <ThemeIcon color="primary" />
                            <Typography variant="h6" fontWeight={600}>
                                Appearance
                            </Typography>
                        </Box>

                        <FormControl fullWidth>
                            <InputLabel>Theme</InputLabel>
                            <Select
                                value={mode}
                                label="Theme"
                                onChange={(e) => handleThemeChange(e.target.value)}
                            >
                                <MenuItem value="light">☀️ Light</MenuItem>
                                <MenuItem value="dark">🌙 Dark</MenuItem>
                                <MenuItem value="system">💻 System Default</MenuItem>
                            </Select>
                        </FormControl>
                    </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card sx={{ mb: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <NotificationsIcon color="primary" />
                            <Typography variant="h6" fontWeight={600}>
                                Notifications
                            </Typography>
                        </Box>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={emailNotifications}
                                    onChange={(e) => handleEmailNotifications(e.target.checked)}
                                />
                            }
                            label="Email Notifications"
                            sx={{ display: 'block', mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 6, mb: 2 }}>
                            Receive email updates about project changes and issue updates.
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={pushNotifications}
                                    onChange={(e) => handlePushNotifications(e.target.checked)}
                                />
                            }
                            label="Push Notifications"
                            sx={{ display: 'block', mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
                            Receive browser notifications for real-time updates.
                        </Typography>
                    </CardContent>
                </Card>

                {/* About Section */}
                <Card>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <InfoIcon color="primary" />
                            <Typography variant="h6" fontWeight={600}>
                                About
                            </Typography>
                        </Box>

                        <Box sx={{ pl: 1 }}>
                            <Typography variant="body1" fontWeight={500}>
                                Home Orientation Blue Tapes
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Punch List & Home Owner Manual Management
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Version</Typography>
                                <Typography variant="body2" fontWeight={500}>1.0.0</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Build</Typography>
                                <Typography variant="body2" fontWeight={500}>2026.01.06</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Environment</Typography>
                                <Typography variant="body2" fontWeight={500}>Development</Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default Settings;
