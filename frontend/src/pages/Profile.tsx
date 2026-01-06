import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Avatar,
    Divider,
    Alert,
    Snackbar,
    IconButton,
    InputAdornment,
    CircularProgress,
    Chip,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Visibility,
    VisibilityOff,
    Save as SaveIcon,
    Lock as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Profile form state
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [isProfileSaving, setIsProfileSaving] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);
    const [profileError, setProfileError] = useState('');

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name);
            setPhone(user.phone || '');
        }
    }, [user]);

    const handleProfileSave = async () => {
        setProfileError('');
        setIsProfileSaving(true);

        try {
            await authService.updateProfile({ name, phone });
            setProfileSuccess(true);
        } catch (err: any) {
            setProfileError(err.response?.data?.detail || 'Failed to update profile');
        } finally {
            setIsProfileSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        setPasswordError('');

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        setIsPasswordSaving(true);

        try {
            await authService.changePassword(currentPassword, newPassword);
            setPasswordSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPasswordError(err.response?.data?.detail || 'Failed to change password');
        } finally {
            setIsPasswordSaving(false);
        }
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            admin: 'Administrador',
            project_manager: 'Project Manager',
            viewer: 'Viewer',
        };
        return labels[role] || role;
    };

    const getRoleColor = (role: string) => {
        const colors: Record<string, 'error' | 'primary' | 'default'> = {
            admin: 'error',
            project_manager: 'primary',
            viewer: 'default',
        };
        return colors[role] || 'default';
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => navigate(-1)}>
                    <BackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight={700}>
                    Profile
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                {/* Profile Info Card */}
                <Card sx={{ flex: 1 }}>
                    <CardContent sx={{ p: 4 }}>
                        {/* Avatar and Role */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                            <Avatar
                                sx={{
                                    width: 80,
                                    height: 80,
                                    bgcolor: 'primary.main',
                                    fontSize: '2rem',
                                    fontWeight: 700,
                                }}
                            >
                                {user?.name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                                <Typography variant="h5" fontWeight={600}>
                                    {user?.name}
                                </Typography>
                                <Typography color="text.secondary" sx={{ mb: 1 }}>
                                    {user?.email}
                                </Typography>
                                <Chip
                                    label={getRoleLabel(user?.role || '')}
                                    color={getRoleColor(user?.role || '')}
                                    size="small"
                                />
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        {/* Profile Form */}
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                            Personal Information
                        </Typography>

                        {profileError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {profileError}
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            label="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            label="Email"
                            value={user?.email || ''}
                            disabled
                            helperText="Email cannot be changed"
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            label="Phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            sx={{ mb: 3 }}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                startIcon={isProfileSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                onClick={handleProfileSave}
                                disabled={isProfileSaving}
                            >
                                Save Changes
                            </Button>
                        </Box>

                        {/* Account Info */}
                        <Divider sx={{ my: 3 }} />
                        <Typography variant="body2" color="text.secondary">
                            Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </Typography>
                    </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card sx={{ flex: 1 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                            <LockIcon color="primary" />
                            <Typography variant="h6" fontWeight={600}>
                                Change Password
                            </Typography>
                        </Box>

                        {passwordError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {passwordError}
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            label="Current Password"
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            sx={{ mb: 2 }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
                                            {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            fullWidth
                            label="New Password"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            sx={{ mb: 2 }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Confirm New Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={handlePasswordChange}
                            disabled={isPasswordSaving || !currentPassword || !newPassword || !confirmPassword}
                            startIcon={isPasswordSaving ? <CircularProgress size={20} /> : <LockIcon />}
                        >
                            Change Password
                        </Button>
                    </CardContent>
                </Card>
            </Box>

            {/* Success Snackbars */}
            <Snackbar
                open={profileSuccess}
                autoHideDuration={3000}
                onClose={() => setProfileSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setProfileSuccess(false)}>
                    Profile updated successfully!
                </Alert>
            </Snackbar>

            <Snackbar
                open={passwordSuccess}
                autoHideDuration={3000}
                onClose={() => setPasswordSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setPasswordSuccess(false)}>
                    Password changed successfully!
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Profile;
