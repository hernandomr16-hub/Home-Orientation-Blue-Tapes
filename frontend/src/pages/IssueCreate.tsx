import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    MenuItem,
    Stepper,
    Step,
    StepLabel,
    Breadcrumbs,
    Link,
    CircularProgress,
} from '@mui/material';

import { useDropzone } from 'react-dropzone';
import { CloudUpload as UploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { Area, IssueCreate, IssuePriority, ProjectContractor } from '../types';
import { areasService } from '../services/areas';
import { contractorsService } from '../services/contractors';
import { issuesService } from '../services/issues';
import { projectsService } from '../services/projects';

const steps = ['Select Area', 'Add Photos', 'Issue Details', 'Assign'];

const categories = [
    'Finish/Cosmetic', 'Functional', 'Safety', 'Incomplete',
    'Damage', 'Cleaning', 'Touch-up', 'Adjustment', 'Missing Item', 'Other',
];

const priorities: IssuePriority[] = ['low', 'medium', 'high'];

const IssueCreate: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [projectName, setProjectName] = useState('');
    const [areas, setAreas] = useState<Area[]>([]);
    const [contractors, setContractors] = useState<ProjectContractor[]>([]);
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreview, setPhotoPreview] = useState<string[]>([]);

    const [formData, setFormData] = useState<IssueCreate>({
        area_id: 0,
        category: '',
        subcategory: '',
        description: '',
        priority: 'medium',
        trade: '',
        contractor_id: undefined,
    });

    useEffect(() => {
        loadData();
    }, [projectId]);

    const loadData = async () => {
        try {
            const [project, areasData, contractorsData] = await Promise.all([
                projectsService.get(Number(projectId)),
                areasService.list(Number(projectId)),
                contractorsService.listProjectContractors(Number(projectId)),
            ]);
            setProjectName(project.name);
            setAreas(areasData);
            setContractors(contractorsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newPhotos = [...photos, ...acceptedFiles].slice(0, 10);
        setPhotos(newPhotos);

        // Create previews
        const newPreviews = newPhotos.map(file => URL.createObjectURL(file));
        setPhotoPreview(newPreviews);
    }, [photos]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
        maxFiles: 10,
    });

    const removePhoto = (index: number) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        const newPreviews = photoPreview.filter((_, i) => i !== index);
        setPhotos(newPhotos);
        setPhotoPreview(newPreviews);
    };

    const handleNext = () => {
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleSubmit = async () => {
        if (!formData.area_id || !formData.category) return;

        setSaving(true);
        try {
            // Create issue
            const issue = await issuesService.create(Number(projectId), formData);

            // Upload photos
            for (const photo of photos) {
                await issuesService.uploadPhoto(Number(projectId), issue.id, photo, 'before');
            }

            navigate(`/projects/${projectId}/issues/${issue.id}`);
        } catch (error) {
            console.error('Failed to create issue:', error);
        } finally {
            setSaving(false);
        }
    };

    const canProceed = () => {
        switch (activeStep) {
            case 0: return formData.area_id > 0;
            case 1: return photos.length > 0;
            case 2: return !!formData.category;
            case 3: return true;
            default: return false;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/projects')}>
                    Projects
                </Link>
                <Link component="button" underline="hover" color="inherit" onClick={() => navigate(`/projects/${projectId}`)}>
                    {projectName}
                </Link>
                <Typography color="text.primary">New Issue</Typography>
            </Breadcrumbs>

            <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
                Create Issue
            </Typography>

            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Card sx={{ maxWidth: 600, mx: 'auto' }}>
                <CardContent sx={{ p: 4 }}>
                    {/* Step 0: Select Area */}
                    {activeStep === 0 && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>Select Area</Typography>
                            <Grid container spacing={1}>
                                {areas.map((area) => (
                                    <Grid item xs={6} sm={4} key={area.id}>
                                        <Button
                                            fullWidth
                                            variant={formData.area_id === area.id ? 'contained' : 'outlined'}
                                            onClick={() => setFormData({ ...formData, area_id: area.id })}
                                            sx={{ py: 1.5 }}
                                        >
                                            {area.name}
                                        </Button>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {/* Step 1: Add Photos */}
                    {activeStep === 1 && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>Add Photos</Typography>
                            <Box
                                {...getRootProps()}
                                sx={{
                                    border: '2px dashed',
                                    borderColor: isDragActive ? 'primary.main' : 'grey.300',
                                    borderRadius: 2,
                                    p: 4,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    backgroundColor: isDragActive ? 'primary.light' : 'grey.50',
                                    mb: 2,
                                }}
                            >
                                <input {...getInputProps()} />
                                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                                <Typography>
                                    {isDragActive ? 'Drop photos here...' : 'Drag photos here or click to select'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Max 10 photos
                                </Typography>
                            </Box>

                            {photoPreview.length > 0 && (
                                <Grid container spacing={1}>
                                    {photoPreview.map((src, index) => (
                                        <Grid item xs={4} key={index}>
                                            <Box sx={{ position: 'relative' }}>
                                                <img
                                                    src={src}
                                                    alt={`Photo ${index + 1}`}
                                                    style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8 }}
                                                />
                                                <Button
                                                    size="small"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 2,
                                                        right: 2,
                                                        minWidth: 24,
                                                        p: 0.5,
                                                        backgroundColor: 'error.main',
                                                        color: 'white',
                                                        '&:hover': { backgroundColor: 'error.dark' },
                                                    }}
                                                    onClick={() => removePhoto(index)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </Button>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Box>
                    )}

                    {/* Step 2: Issue Details */}
                    {activeStep === 2 && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>Issue Details</Typography>
                            <TextField
                                select
                                fullWidth
                                label="Category"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                sx={{ mb: 2 }}
                                required
                            >
                                {categories.map((cat) => (
                                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                fullWidth
                                label="Priority"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as IssuePriority })}
                                sx={{ mb: 2 }}
                            >
                                {priorities.map((p) => (
                                    <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                fullWidth
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                multiline
                                rows={3}
                            />
                        </Box>
                    )}

                    {/* Step 3: Assign */}
                    {activeStep === 3 && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>Assign to Contractor</Typography>
                            <TextField
                                select
                                fullWidth
                                label="Contractor (optional)"
                                value={formData.contractor_id || ''}
                                onChange={(e) => setFormData({ ...formData, contractor_id: Number(e.target.value) || undefined })}
                                sx={{ mb: 2 }}
                            >
                                <MenuItem value="">No assignment</MenuItem>
                                {contractors.map((pc) => (
                                    <MenuItem key={pc.id} value={pc.contractor.id}>
                                        {pc.contractor.company}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <Typography variant="caption" color="text.secondary">
                                Leave empty to assign later
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                        <Button onClick={handleBack} disabled={activeStep === 0}>
                            Back
                        </Button>
                        {activeStep < steps.length - 1 ? (
                            <Button variant="contained" onClick={handleNext} disabled={!canProceed()}>
                                Next
                            </Button>
                        ) : (
                            <Button variant="contained" onClick={handleSubmit} disabled={saving || !canProceed()}>
                                {saving ? 'Creating...' : 'Create Issue'}
                            </Button>
                        )}
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default IssueCreate;





