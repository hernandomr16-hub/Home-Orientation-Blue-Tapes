import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Stepper,
    Step,
    StepLabel,
    StepButton,
    Typography,
    Button,
    TextField,
    Card,
    CardContent,
    CardMedia,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    useTheme,
    useMediaQuery,
    MobileStepper,
    LinearProgress,
    Alert,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    ArrowForward as NextIcon,
    Check as CheckIcon,
    Home as HomeIcon,
    Roofing as RoofIcon,
    Garage as GarageIcon,
    Weekend as LivingIcon,
    Kitchen as KitchenIcon,
    Bed as BedroomIcon,
    Bathroom as BathroomIcon,
    Build as SystemsIcon,
    CheckCircle as DoneIcon,
    AddCircle as AddIcon,
    CameraAlt as CameraIcon,
    Delete as DeleteIcon,
    PhotoCamera as PhotoIcon,
} from '@mui/icons-material';
import { projectsService } from '../services/projects';
import { issuesService } from '../services/issues';
import { areasService } from '../services/areas';
import type { ProjectCreate, Area } from '../types';

// Define wizard steps with their areas
const WIZARD_STEPS = [
    {
        id: 'info',
        label: 'Info Básica',
        icon: <HomeIcon />,
        areas: [],
        description: 'Información del proyecto',
    },
    {
        id: 'exterior',
        label: 'Exterior',
        icon: <RoofIcon />,
        areas: ['Exterior', 'Roof'],
        description: 'Fachada, jardín, techo, entrada',
    },
    {
        id: 'garage',
        label: 'Garage',
        icon: <GarageIcon />,
        areas: ['Garage'],
        description: 'Garage y almacenamiento',
    },
    {
        id: 'common',
        label: 'Espacios Comunes',
        icon: <LivingIcon />,
        areas: ['Living Room', 'Dining Room', 'Hallway'],
        description: 'Sala, comedor, pasillos',
    },
    {
        id: 'kitchen',
        label: 'Cocina',
        icon: <KitchenIcon />,
        areas: ['Kitchen'],
        description: 'Cocina y electrodomésticos',
    },
    {
        id: 'bedrooms',
        label: 'Dormitorios',
        icon: <BedroomIcon />,
        areas: ['Master Bedroom', 'Bedroom 2', 'Bedroom 3'],
        description: 'Habitaciones principales',
    },
    {
        id: 'bathrooms',
        label: 'Baños',
        icon: <BathroomIcon />,
        areas: ['Master Bathroom', 'Bathroom 2', 'Powder Room'],
        description: 'Baños y powder room',
    },
    {
        id: 'systems',
        label: 'Sistemas',
        icon: <SystemsIcon />,
        areas: ['Laundry', 'Mechanical/HVAC', 'Electrical Panel', 'Plumbing', 'Attic/Crawlspace'],
        description: 'Lavandería, HVAC, eléctrico, plomería',
    },
    {
        id: 'summary',
        label: 'Resumen',
        icon: <DoneIcon />,
        areas: [],
        description: 'Revisar y crear proyecto',
    },
];

// Pending issue to be created after project creation
interface PendingIssue {
    id: string;
    areaName: string;
    title: string;
    description: string;
    photo: File | null;
    photoPreview: string | null;
    category: string;
    priority: 'low' | 'medium' | 'high';
}

interface AreaStatus {
    checked: boolean;
}

const ProjectWizard: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeStep, setActiveStep] = useState(0);
    const [projectData, setProjectData] = useState<ProjectCreate>({
        name: '',
        address: '',
        unit: '',
        notes: '',
    });
    const [areaStatus, setAreaStatus] = useState<Record<string, AreaStatus>>({});
    const [pendingIssues, setPendingIssues] = useState<PendingIssue[]>([]);
    const [creating, setCreating] = useState(false);
    const [creationProgress, setCreationProgress] = useState(0);
    const [creationStatus, setCreationStatus] = useState('');

    // Issue dialog state
    const [issueDialogOpen, setIssueDialogOpen] = useState(false);
    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [issueTitle, setIssueTitle] = useState('');
    const [issueDescription, setIssueDescription] = useState('');
    const [issuePhoto, setIssuePhoto] = useState<File | null>(null);
    const [issuePhotoPreview, setIssuePhotoPreview] = useState<string | null>(null);

    const currentStep = WIZARD_STEPS[activeStep];
    const isFirstStep = activeStep === 0;
    const isLastStep = activeStep === WIZARD_STEPS.length - 1;
    const canProceed = activeStep === 0
        ? (projectData.name.trim() !== '' && projectData.address.trim() !== '')
        : true;

    const handleNext = () => {
        if (activeStep < WIZARD_STEPS.length - 1) {
            setActiveStep(activeStep + 1);
        }
    };

    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep(activeStep - 1);
        }
    };

    const handleStepClick = (step: number) => {
        if (projectData.name && projectData.address) {
            setActiveStep(step);
        }
    };

    const toggleAreaChecked = (areaName: string) => {
        setAreaStatus(prev => ({
            ...prev,
            [areaName]: {
                checked: !prev[areaName]?.checked,
            }
        }));
    };

    const openIssueDialog = (areaName: string) => {
        setSelectedArea(areaName);
        setIssueTitle('');
        setIssueDescription('');
        setIssuePhoto(null);
        setIssuePhotoPreview(null);
        setIssueDialogOpen(true);
    };

    const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIssuePhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setIssuePhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const addIssue = () => {
        if (selectedArea && issueTitle.trim()) {
            const newIssue: PendingIssue = {
                id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                areaName: selectedArea,
                title: issueTitle,
                description: issueDescription,
                photo: issuePhoto,
                photoPreview: issuePhotoPreview,
                category: 'Finish/Cosmetic',
                priority: 'medium',
            };

            setPendingIssues(prev => [...prev, newIssue]);

            // Mark area as checked
            setAreaStatus(prev => ({
                ...prev,
                [selectedArea]: { checked: true }
            }));

            setIssueDialogOpen(false);
        }
    };

    const removeIssue = (issueId: string) => {
        setPendingIssues(prev => prev.filter(i => i.id !== issueId));
    };

    const getIssuesForArea = (areaName: string) => {
        return pendingIssues.filter(i => i.areaName === areaName);
    };

    const handleCreateProject = async () => {
        setCreating(true);
        setCreationProgress(0);

        try {
            // Step 1: Create project
            setCreationStatus('Creando proyecto...');
            setCreationProgress(10);

            const created = await projectsService.create(projectData, true);
            setCreationProgress(20);

            // Step 2: Get areas from project
            setCreationStatus('Obteniendo áreas...');
            const areasResponse = await areasService.list(created.id);
            const projectAreas: Area[] = areasResponse.items || areasResponse;
            setCreationProgress(30);

            // Step 3: Create issues
            if (pendingIssues.length > 0) {
                const progressPerIssue = 60 / pendingIssues.length;

                for (let i = 0; i < pendingIssues.length; i++) {
                    const pending = pendingIssues[i];
                    setCreationStatus(`Creando issue ${i + 1} de ${pendingIssues.length}...`);

                    // Find area ID
                    const area = projectAreas.find(a => a.name === pending.areaName);

                    // Create issue
                    const issue = await issuesService.create(created.id, {
                        title: pending.title,
                        description: pending.description || undefined,
                        area_id: area?.id,
                        category: pending.category,
                        priority: pending.priority,
                    });

                    // Upload photo if exists
                    if (pending.photo) {
                        setCreationStatus(`Subiendo foto ${i + 1}...`);
                        await issuesService.uploadPhoto(created.id, issue.id, pending.photo, 'before');
                    }

                    setCreationProgress(30 + (i + 1) * progressPerIssue);
                }
            }

            setCreationProgress(100);
            setCreationStatus('¡Proyecto creado!');

            // Navigate to project
            setTimeout(() => {
                navigate(`/projects/${created.id}`);
            }, 500);

        } catch (error) {
            console.error('Failed to create project:', error);
            alert('Error al crear el proyecto');
            setCreating(false);
        }
    };

    const getCheckedAreas = () => {
        return Object.values(areaStatus).filter(s => s.checked).length;
    };

    // Render info step
    const renderInfoStep = () => (
        <Box sx={{ maxWidth: 500, mx: 'auto' }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                📋 Información del Proyecto
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Ingresa los datos básicos antes de comenzar el recorrido
            </Typography>

            <TextField
                fullWidth
                label="Nombre del Proyecto"
                value={projectData.name}
                onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                sx={{ mb: 2 }}
                required
                placeholder="ej: Casa Smith - Blue Tape Final"
            />
            <TextField
                fullWidth
                label="Dirección"
                value={projectData.address}
                onChange={(e) => setProjectData({ ...projectData, address: e.target.value })}
                sx={{ mb: 2 }}
                required
                placeholder="ej: 123 Main St, Miami FL 33101"
            />
            <TextField
                fullWidth
                label="Unidad/Lote (opcional)"
                value={projectData.unit}
                onChange={(e) => setProjectData({ ...projectData, unit: e.target.value })}
                sx={{ mb: 2 }}
                placeholder="ej: Unit A, Lot 5"
            />
            <TextField
                fullWidth
                label="Notas Generales (opcional)"
                value={projectData.notes}
                onChange={(e) => setProjectData({ ...projectData, notes: e.target.value })}
                multiline
                rows={3}
                placeholder="Notas adicionales sobre el proyecto..."
            />
        </Box>
    );

    // Render area step
    const renderAreaStep = () => (
        <Box>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    {currentStep.icon} {currentStep.label}
                </Typography>
                <Typography color="text.secondary">
                    {currentStep.description}
                </Typography>
            </Box>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: 2,
                maxWidth: 900,
                mx: 'auto',
            }}>
                {currentStep.areas.map((area) => {
                    const status = areaStatus[area];
                    const issues = getIssuesForArea(area);
                    const hasIssues = issues.length > 0;

                    return (
                        <Card
                            key={area}
                            sx={{
                                border: 2,
                                borderColor: status?.checked
                                    ? (hasIssues ? 'warning.main' : 'success.main')
                                    : 'divider',
                                bgcolor: status?.checked
                                    ? (hasIssues ? 'warning.light' : 'success.light')
                                    : 'background.paper',
                                transition: 'all 0.2s',
                            }}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Typography variant="h6" fontWeight={600}>
                                        {area}
                                    </Typography>
                                    {status?.checked && (
                                        <Chip
                                            size="small"
                                            icon={hasIssues ? undefined : <CheckIcon />}
                                            label={hasIssues ? `${issues.length} issues` : 'OK'}
                                            color={hasIssues ? 'warning' : 'success'}
                                        />
                                    )}
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                    <Button
                                        size="small"
                                        variant={status?.checked && !hasIssues ? 'contained' : 'outlined'}
                                        color="success"
                                        onClick={() => toggleAreaChecked(area)}
                                        startIcon={<CheckIcon />}
                                    >
                                        OK
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="warning"
                                        onClick={() => openIssueDialog(area)}
                                        startIcon={<CameraIcon />}
                                    >
                                        + Issue
                                    </Button>
                                </Box>

                                {/* Show issues for this area */}
                                {issues.length > 0 && (
                                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {issues.map((issue) => (
                                            <Box
                                                key={issue.id}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    p: 1,
                                                    bgcolor: 'background.paper',
                                                    borderRadius: 1,
                                                    border: 1,
                                                    borderColor: 'divider',
                                                }}
                                            >
                                                {issue.photoPreview && (
                                                    <Box
                                                        component="img"
                                                        src={issue.photoPreview}
                                                        sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
                                                    />
                                                )}
                                                <Typography variant="body2" sx={{ flex: 1 }} noWrap>
                                                    {issue.title}
                                                </Typography>
                                                <IconButton size="small" onClick={() => removeIssue(issue.id)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>
        </Box>
    );

    // Render summary step
    const renderSummaryStep = () => (
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ textAlign: 'center' }}>
                ✅ Resumen del Proyecto
            </Typography>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" fontWeight={600}>{projectData.name}</Typography>
                    <Typography color="text.secondary">{projectData.address}</Typography>
                    {projectData.unit && (
                        <Typography variant="body2" color="text.secondary">{projectData.unit}</Typography>
                    )}
                </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Card sx={{ flex: 1, textAlign: 'center', bgcolor: 'success.light' }}>
                    <CardContent>
                        <Typography variant="h3" fontWeight={700} color="success.dark">
                            {getCheckedAreas()}
                        </Typography>
                        <Typography color="success.dark">Áreas Revisadas</Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: 1, textAlign: 'center', bgcolor: pendingIssues.length > 0 ? 'warning.light' : 'grey.100' }}>
                    <CardContent>
                        <Typography variant="h3" fontWeight={700} color={pendingIssues.length > 0 ? 'warning.dark' : 'text.secondary'}>
                            {pendingIssues.length}
                        </Typography>
                        <Typography color={pendingIssues.length > 0 ? 'warning.dark' : 'text.secondary'}>Issues a Crear</Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Issue preview list */}
            {pendingIssues.length > 0 && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Issues a crear:
                        </Typography>
                        {pendingIssues.map((issue) => (
                            <Box
                                key={issue.id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    py: 1,
                                    borderBottom: 1,
                                    borderColor: 'divider',
                                    '&:last-child': { borderBottom: 0 }
                                }}
                            >
                                {issue.photoPreview ? (
                                    <Box
                                        component="img"
                                        src={issue.photoPreview}
                                        sx={{ width: 60, height: 60, borderRadius: 1, objectFit: 'cover' }}
                                    />
                                ) : (
                                    <Box sx={{ width: 60, height: 60, borderRadius: 1, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <PhotoIcon color="disabled" />
                                    </Box>
                                )}
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" fontWeight={600}>{issue.title}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        📍 {issue.areaName}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </CardContent>
                </Card>
            )}

            {creating && (
                <Box sx={{ mb: 3 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        {creationStatus}
                    </Alert>
                    <LinearProgress variant="determinate" value={creationProgress} />
                </Box>
            )}

            <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleCreateProject}
                disabled={creating}
                startIcon={creating ? <CircularProgress size={20} /> : <CheckIcon />}
                sx={{ py: 1.5 }}
            >
                {creating ? 'Creando...' : `Crear Proyecto${pendingIssues.length > 0 ? ` con ${pendingIssues.length} Issues` : ''}`}
            </Button>
        </Box>
    );

    return (
        <Box sx={{ pb: 4 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton onClick={() => navigate('/projects')}>
                    <BackIcon />
                </IconButton>
                <Typography variant="h5" fontWeight={700}>
                    Nuevo Proyecto - Walkthrough
                </Typography>
            </Box>

            {/* Desktop Stepper */}
            {!isMobile && (
                <Stepper
                    activeStep={activeStep}
                    alternativeLabel
                    sx={{ mb: 4 }}
                    nonLinear={projectData.name !== '' && projectData.address !== ''}
                >
                    {WIZARD_STEPS.map((step, index) => (
                        <Step key={step.id} completed={index < activeStep}>
                            <StepButton onClick={() => handleStepClick(index)}>
                                <StepLabel>{step.label}</StepLabel>
                            </StepButton>
                        </Step>
                    ))}
                </Stepper>
            )}

            {/* Content */}
            <Box sx={{ minHeight: 400, mb: 4 }}>
                {activeStep === 0 && renderInfoStep()}
                {activeStep > 0 && activeStep < WIZARD_STEPS.length - 1 && renderAreaStep()}
                {activeStep === WIZARD_STEPS.length - 1 && renderSummaryStep()}
            </Box>

            {/* Navigation - Desktop */}
            {!isMobile && !isLastStep && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', maxWidth: 600, mx: 'auto' }}>
                    <Button
                        onClick={handleBack}
                        disabled={isFirstStep}
                        startIcon={<BackIcon />}
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={!canProceed}
                        endIcon={<NextIcon />}
                    >
                        {activeStep === WIZARD_STEPS.length - 2 ? 'Ver Resumen' : 'Siguiente'}
                    </Button>
                </Box>
            )}

            {/* Mobile Stepper */}
            {isMobile && (
                <MobileStepper
                    variant="dots"
                    steps={WIZARD_STEPS.length}
                    position="bottom"
                    activeStep={activeStep}
                    sx={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        bgcolor: 'background.paper',
                        borderTop: 1,
                        borderColor: 'divider',
                    }}
                    nextButton={
                        !isLastStep ? (
                            <Button size="small" onClick={handleNext} disabled={!canProceed}>
                                Siguiente <NextIcon />
                            </Button>
                        ) : <Box />
                    }
                    backButton={
                        <Button size="small" onClick={handleBack} disabled={isFirstStep}>
                            <BackIcon /> Anterior
                        </Button>
                    }
                />
            )}

            {/* Issue Dialog with Photo */}
            <Dialog
                open={issueDialogOpen}
                onClose={() => setIssueDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    📷 Agregar Issue - {selectedArea}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        {/* Photo capture */}
                        <Box sx={{ mb: 2 }}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handlePhotoSelect}
                                style={{ display: 'none' }}
                            />

                            {issuePhotoPreview ? (
                                <Box sx={{ position: 'relative' }}>
                                    <CardMedia
                                        component="img"
                                        image={issuePhotoPreview}
                                        sx={{ borderRadius: 2, maxHeight: 200, objectFit: 'cover' }}
                                    />
                                    <IconButton
                                        sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper' }}
                                        onClick={() => { setIssuePhoto(null); setIssuePhotoPreview(null); }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            ) : (
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    sx={{ py: 4, borderStyle: 'dashed' }}
                                    onClick={() => fileInputRef.current?.click()}
                                    startIcon={<CameraIcon />}
                                >
                                    Tomar Foto del Issue
                                </Button>
                            )}
                        </Box>

                        <TextField
                            fullWidth
                            label="Título del Issue"
                            value={issueTitle}
                            onChange={(e) => setIssueTitle(e.target.value)}
                            placeholder="ej: Rasguño en pared"
                            sx={{ mb: 2 }}
                            required
                            autoFocus={!issuePhotoPreview}
                        />

                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Descripción (opcional)"
                            value={issueDescription}
                            onChange={(e) => setIssueDescription(e.target.value)}
                            placeholder="Detalles adicionales..."
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIssueDialogOpen(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={addIssue}
                        disabled={!issueTitle.trim()}
                        startIcon={<AddIcon />}
                    >
                        Agregar Issue
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProjectWizard;
