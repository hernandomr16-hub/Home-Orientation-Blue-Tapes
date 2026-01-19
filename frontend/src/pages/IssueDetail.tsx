import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,

    Breadcrumbs,
    Link,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    ImageList,
    ImageListItem,
    Alert,
} from '@mui/material';

import {
    Send as SendIcon,
    CloudUpload as UploadIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import type { Issue, IssueStatus } from '../types';
import { issuesService } from '../services/issues';
import { projectsService } from '../services/projects';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Status colors with both background and text for dark mode compatibility
const statusColors: Record<IssueStatus, { bg: string; text: string }> = {
    open: { bg: '#fef3c7', text: '#92400e' },
    assigned: { bg: '#dbeafe', text: '#1e40af' },
    in_progress: { bg: '#e0e7ff', text: '#3730a3' },
    ready_for_reinspect: { bg: '#fce7f3', text: '#9d174d' },
    closed: { bg: '#d1fae5', text: '#065f46' },
};

const statusOptions: { value: IssueStatus; label: string }[] = [
    { value: 'open', label: 'Open' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'ready_for_reinspect', label: 'Ready for Reinspect' },
    { value: 'closed', label: 'Closed' },
];

const priorityColors = {
    high: 'error',
    medium: 'warning',
    low: 'success',
} as const;

const IssueDetail: React.FC = () => {
    const { id: projectId, issueId } = useParams<{ id: string; issueId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [issue, setIssue] = useState<Issue | null>(null);
    const [projectName, setProjectName] = useState('');
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [newStatus, setNewStatus] = useState<IssueStatus>('open');
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [closingPhoto, setClosingPhoto] = useState<File | null>(null);
    const [uploadingClosing, setUploadingClosing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadData();
    }, [projectId, issueId]);

    const loadData = async () => {
        try {
            const [project, issueData] = await Promise.all([
                projectsService.get(Number(projectId)),
                issuesService.get(Number(projectId), Number(issueId)),
            ]);
            setProjectName(project.name);
            setIssue(issueData);
            setNewStatus(issueData.status);
        } catch (error) {
            console.error('Failed to load issue:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async () => {
        if (!issue) return;

        // Logic for closing issue
        if (newStatus === 'closed') {
            if (!closingPhoto && afterPhotos.length === 0) {
                alert('⚠️ Para cerrar, debes subir una foto "After" o tener una cargada previamente.');
                return;
            }

            setUploadingClosing(true);
            try {
                // 1. Upload photo if a new one is selected
                if (closingPhoto) {
                    await issuesService.uploadPhoto(Number(projectId), issue.id, closingPhoto, 'after');
                }

                // 2. Update status and notes
                const updated = await issuesService.updateStatus(Number(projectId), issue.id, {
                    status: newStatus,
                    notes: resolutionNotes
                });

                setIssue(updated);
                setStatusDialogOpen(false);
                // Reset form
                setClosingPhoto(null);
                setResolutionNotes('');
            } catch (error: any) {
                console.error('Failed to close issue:', error);
                const detail = error.response?.data?.detail;
                alert(detail || 'Error al cerrar el issue.');
            } finally {
                setUploadingClosing(false);
            }
            return;
        }

        // Logic for other status changes
        try {
            const updated = await issuesService.updateStatus(Number(projectId), issue.id, { status: newStatus });
            setIssue(updated);
            setStatusDialogOpen(false);
        } catch (error: any) {
            console.error('Update status failed:', error);
            alert(error.response?.data?.detail || 'Failed to update status');
        }
    };

    const handleSendNotification = async () => {
        if (!issue) return;
        setSending(true);
        try {
            await issuesService.sendNotification(Number(projectId), issue.id);
            await loadData();
            alert('Notification sent!');
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    const onDrop = async (files: File[]) => {
        if (!issue || files.length === 0) return;
        setUploading(true);
        try {
            const photoType = issue.status === 'ready_for_reinspect' || issue.status === 'closed' ? 'after' : 'before';
            for (const file of files) {
                await issuesService.uploadPhoto(Number(projectId), issue.id, file, photoType);
            }
            await loadData();
        } catch (error) {
            console.error('Failed to upload photo:', error);
        } finally {
            setUploading(false);
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
        maxFiles: 5,
    });

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!issue) {
        return <Typography>Issue not found</Typography>;
    }

    const beforePhotos = issue.photos.filter(p => p.photo_type === 'before');
    const afterPhotos = issue.photos.filter(p => p.photo_type === 'after');

    return (
        <Box>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/projects')}>
                    Projects
                </Link>
                <Link component="button" underline="hover" color="inherit" onClick={() => navigate(`/projects/${projectId}`)}>
                    {projectName}
                </Link>
                <Typography color="text.primary">Issue #{issue.id}</Typography>
            </Breadcrumbs>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                            label={issue.status.replace('_', ' ')}
                            sx={{
                                backgroundColor: statusColors[issue.status].bg,
                                color: statusColors[issue.status].text,
                                fontWeight: 600
                            }}
                        />
                        <Chip label={issue.priority} size="small" color={priorityColors[issue.priority]} />
                    </Box>
                    <Typography variant="h4" fontWeight={700}>
                        {issue.category}
                    </Typography>
                    <Typography color="text.secondary">
                        {issue.area_name} • #{issue.id}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setStatusDialogOpen(true)}>
                        Change Status
                    </Button>
                    {issue.contractor_id && (
                        <Button
                            variant="contained"
                            startIcon={<SendIcon />}
                            onClick={handleSendNotification}
                            disabled={sending}
                        >
                            {sending ? 'Sending...' : 'Notify Contractor'}
                        </Button>
                    )}
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    {/* Photos */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>Before Photos ({beforePhotos.length})</Typography>
                            {beforePhotos.length > 0 ? (
                                <ImageList cols={3} gap={8}>
                                    {beforePhotos.map((photo) => (
                                        <ImageListItem key={photo.id}>
                                            <img
                                                src={`${API_URL}${photo.url}`}
                                                alt="Before"
                                                loading="lazy"
                                                style={{ borderRadius: 8, height: 150, objectFit: 'cover' }}
                                            />
                                        </ImageListItem>
                                    ))}
                                </ImageList>
                            ) : (
                                <Typography color="text.secondary">No photos</Typography>
                            )}

                            {afterPhotos.length > 0 && (
                                <>
                                    <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>After Photos ({afterPhotos.length})</Typography>
                                    <ImageList cols={3} gap={8}>
                                        {afterPhotos.map((photo) => (
                                            <ImageListItem key={photo.id}>
                                                <img
                                                    src={`${API_URL}${photo.url}`}
                                                    alt="After"
                                                    loading="lazy"
                                                    style={{ borderRadius: 8, height: 150, objectFit: 'cover' }}
                                                />
                                            </ImageListItem>
                                        ))}
                                    </ImageList>
                                </>
                            )}

                            <Box
                                {...getRootProps()}
                                sx={{
                                    mt: 2,
                                    border: '2px dashed',
                                    borderColor: 'grey.300',
                                    borderRadius: 2,
                                    p: 2,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                }}
                            >
                                <input {...getInputProps()} />
                                <UploadIcon color="action" />
                                <Typography variant="body2" color="text.secondary">
                                    {uploading ? 'Uploading...' : 'Add more photos'}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Description */}
                    {issue.description && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 1 }}>Description</Typography>
                                <Typography>{issue.description}</Typography>
                            </CardContent>
                        </Card>
                    )}
                </Grid>

                <Grid item xs={12} md={4}>
                    {/* Details */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>Details</Typography>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="text.secondary">Contractor</Typography>
                                <Typography fontWeight={600}>
                                    {issue.contractor_name || 'Not assigned'}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="text.secondary">Trade</Typography>
                                <Typography>{issue.trade || '-'}</Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="text.secondary">Created</Typography>
                                <Typography>
                                    {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : '-'}
                                </Typography>
                            </Box>

                            {issue.notification_sent_at && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Last Notification</Typography>
                                    <Typography>
                                        {new Date(issue.notification_sent_at).toLocaleString()}
                                    </Typography>
                                </Box>
                            )}

                            {issue.closed_at && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Closed</Typography>
                                    <Typography>
                                        {new Date(issue.closed_at).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Status Dialog */}
            <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Change Status</DialogTitle>
                <DialogContent>
                    <TextField
                        select
                        fullWidth
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as IssueStatus)}
                        sx={{ mt: 1 }}
                    >
                        {statusOptions.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                        ))}
                    </TextField>

                    {newStatus === 'closed' && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                Evidencia de Cierre (Required)
                            </Typography>

                            {afterPhotos.length > 0 && (
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    Ya hay {afterPhotos.length} foto(s) "After" cargadas.
                                </Alert>
                            )}

                            {!closingPhoto ? (
                                <Button
                                    variant="outlined"
                                    component="label"
                                    fullWidth
                                    startIcon={<UploadIcon />}
                                    sx={{ mb: 2, height: 50 }}
                                >
                                    Subir Foto Final
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setClosingPhoto(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </Button>
                            ) : (
                                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #ddd', p: 1, borderRadius: 1 }}>
                                    <Typography variant="body2" noWrap sx={{ maxWidth: '80%' }}>
                                        📸 {closingPhoto.name}
                                    </Typography>
                                    <Button size="small" color="error" onClick={() => setClosingPhoto(null)}>
                                        Quitar
                                    </Button>
                                </Box>
                            )}

                            <TextField
                                fullWidth
                                label="Mensaje del Contratista / Notas"
                                placeholder="Ej: Trabajo terminado, limpio y seguro."
                                multiline
                                rows={3}
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleStatusChange}
                        disabled={uploadingClosing}
                    >
                        {uploadingClosing ? 'Updating...' : 'Update'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default IssueDetail;





