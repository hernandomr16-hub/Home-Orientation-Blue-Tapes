import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    TextField,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    CircularProgress,
    IconButton,
    Breadcrumbs,
    Link,
    Alert,
    LinearProgress,
    Chip,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Download as DownloadIcon,
    Save as SaveIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    CloudUpload as UploadIcon,
    InsertDriveFile as FileIcon,
    PictureAsPdf as PdfIcon,
    Image as ImageIcon,
    CameraAlt as CameraIcon,
    CheckCircle as CheckCircleIcon,
    ViewQuilt as ViewQuiltIcon,
    Apps as AppsIcon,
} from '@mui/icons-material';
import { manualService } from '../services/manual';
import { projectsService } from '../services/projects';
import type { ManualInstance } from '../types';

const ProjectManual: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState<any>(null);
    const [manual, setManual] = useState<ManualInstance | null>(null);
    const [sections, setSections] = useState<any[]>([]);
    const [expanded, setExpanded] = useState<string | false>('contacts');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [photoUploading, setPhotoUploading] = useState<{ section: string; index: number } | null>(null);
    const [quickScanMode, setQuickScanMode] = useState(true); // Default to Quick Scan mode

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [proj, man, sec] = await Promise.all([
                projectsService.get(Number(id)),
                manualService.get(Number(id)),
                manualService.getTemplateSections(),
            ]);
            setProject(proj);
            setManual(man);

            // Merge actual data into sections default_items if needed
            // For now, we will rely on 'manual.fields' to store the state
            const initialFields = man.fields || {};

            // Initialize missing sections from template defaults
            const newFields = { ...initialFields };
            sec.forEach((s: any) => {
                if (!newFields[s.id]) {
                    newFields[s.id] = s.default_items || {}; // Handle list vs obj
                    if (s.type === 'list' && s.default_items) {
                        newFields[s.id] = [...s.default_items];
                    }
                }
            });

            setManual({ ...man, fields: newFields });
            setSections(sec);
        } catch (error) {
            console.error('Failed to load manual:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!manual || !id) return;
        try {
            await manualService.update(Number(id), { fields: manual.fields });
            alert('Manual saved successfully!');
        } catch (error) {
            console.error('Failed to save manual:', error);
            alert('Error saving manual.');
        }
    };

    const handleExport = async () => {
        if (!id) return;
        try {
            // Auto-save before export
            await handleSave();
            await manualService.exportPdf(Number(id));
        } catch (error) {
            console.error('Failed to export PDF:', error);
        }
    };

    const updateField = (sectionId: string, fieldName: string, value: any, index?: number) => {
        if (!manual) return;

        const newFields = { ...manual.fields };

        // Handle Lists (Appliances, Finishes)
        if (typeof index === 'number') {
            const list = [...(newFields[sectionId] || [])];
            list[index] = { ...list[index], [fieldName]: value };
            newFields[sectionId] = list;
        }
        // Handle Key-Value (Contacts, Systems)
        else {
            if (!newFields[sectionId]) newFields[sectionId] = {};
            newFields[sectionId] = {
                ...newFields[sectionId],
                [fieldName]: index === undefined ? value : { ...newFields[sectionId][fieldName], ...value } // simplified for text
            };

            // Special handling for nested objects like contacts if needed, 
            // but our model uses flatten fields per item mostly or specific schema
        }

        setManual({ ...manual, fields: newFields });
    };

    const addItem = (sectionId: string) => {
        if (!manual) return;
        const newFields = { ...manual.fields };
        const list = [...(newFields[sectionId] || [])];
        list.push({}); // Add empty item
        newFields[sectionId] = list;
        setManual({ ...manual, fields: newFields });
    };

    const removeItem = (sectionId: string, index: number) => {
        if (!manual) return;
        const newFields = { ...manual.fields };
        const list = [...(newFields[sectionId] || [])];
        list.splice(index, 1);
        newFields[sectionId] = list;
        setManual({ ...manual, fields: newFields });
    };

    const handleFileUpload = async (sectionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !id) return;

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setUploadError('Solo se permiten archivos PDF e imágenes (JPG, PNG, GIF, WEBP)');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('El archivo no puede superar 10MB');
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            const attachment = await manualService.uploadAttachment(Number(id), sectionId, file);

            // Update local state with new attachment
            setManual(prev => {
                if (!prev) return prev;
                const attachments = [...(prev.attachments || []), attachment];
                return { ...prev, attachments };
            });
        } catch (error) {
            console.error('Failed to upload file:', error);
            setUploadError('Error al subir el archivo. Intenta de nuevo.');
        } finally {
            setUploading(false);
            event.target.value = ''; // Reset input
        }
    };

    const handleItemPhotoUpload = async (
        sectionId: string,
        itemIndex: number,
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file || !id) return;

        // Validate image type
        if (!file.type.startsWith('image/')) {
            setUploadError('Solo se permiten imágenes');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('La imagen no puede superar 10MB');
            return;
        }

        setPhotoUploading({ section: sectionId, index: itemIndex });
        setUploadError(null);

        try {
            const result = await manualService.uploadItemPhoto(
                Number(id),
                sectionId,
                itemIndex,
                file
            );

            // Update local state with new photo URL
            setManual(prev => {
                if (!prev) return prev;
                const newFields = { ...prev.fields };
                const list = [...(newFields[sectionId] || [])];
                list[itemIndex] = { ...list[itemIndex], photo_url: result.url };
                newFields[sectionId] = list;
                return { ...prev, fields: newFields };
            });
        } catch (error) {
            console.error('Failed to upload photo:', error);
            setUploadError('Error al subir la foto. Intenta de nuevo.');
        } finally {
            setPhotoUploading(null);
            event.target.value = '';
        }
    };

    const getFileIcon = (type: string) => {
        if (type?.includes('pdf')) return <PdfIcon color="error" />;
        if (type?.includes('image')) return <ImageIcon color="primary" />;
        return <FileIcon color="action" />;
    };

    const removeAttachment = (index: number) => {
        setManual(prev => {
            if (!prev) return prev;
            const attachments = prev.attachments?.filter((_, i) => i !== index) || [];
            return { ...prev, attachments };
        });
    };

    const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:8000';

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
    if (!project || !manual) return <Typography>Project not found</Typography>;

    return (
        <Box sx={{ pb: 8 }}>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/projects')}>Projects</Link>
                <Link component="button" underline="hover" color="inherit" onClick={() => navigate(`/projects/${id}`)}>{project.name}</Link>
                <Typography color="text.primary">Home Owner Manual</Typography>
            </Breadcrumbs>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>Home Owner Manual</Typography>
                    <Typography color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>Build and export the final manual for the homeowner.</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <ToggleButtonGroup
                        value={quickScanMode ? 'quick' : 'full'}
                        exclusive
                        onChange={(_, val) => val && setQuickScanMode(val === 'quick')}
                        size="small"
                    >
                        <ToggleButton value="quick">
                            <Tooltip title="Vista Rápida (Solo Fotos)">
                                <AppsIcon fontSize="small" />
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value="full">
                            <Tooltip title="Vista Completa">
                                <ViewQuiltIcon fontSize="small" />
                            </Tooltip>
                        </ToggleButton>
                    </ToggleButtonGroup>
                    <Button variant="outlined" startIcon={<SaveIcon />} onClick={handleSave} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>Save Draft</Button>
                    <IconButton onClick={handleSave} sx={{ display: { xs: 'inline-flex', sm: 'none' }, border: 1, borderColor: 'divider' }}><SaveIcon /></IconButton>
                    <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>Export PDF</Button>
                    <IconButton onClick={handleExport} sx={{ display: { xs: 'inline-flex', sm: 'none' }, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}><DownloadIcon /></IconButton>
                </Box>
            </Box>

            {sections.map((section) => (
                <Accordion
                    key={section.id}
                    expanded={expanded === section.id}
                    onChange={(_, isExpanded) => setExpanded(isExpanded ? section.id : false)}
                    sx={{ mb: 1, '&:before': { display: 'none' } }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box>
                            <Typography variant="h6">{section.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{section.description}</Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        {/* LIST TYPE (Appliances, Finishes) */}
                        {section.type === 'list' && (
                            <Box>
                                {/* Quick Scan Mode: Photo Gallery */}
                                {quickScanMode ? (
                                    <Box>
                                        <Grid container spacing={2}>
                                            {manual.fields[section.id]?.map((item: any, idx: number) => (
                                                <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
                                                    <Card
                                                        variant="outlined"
                                                        sx={{
                                                            position: 'relative',
                                                            '&:hover .delete-btn': { opacity: 1 },
                                                        }}
                                                    >
                                                        {/* Large Photo Area */}
                                                        <Box
                                                            sx={{
                                                                width: '100%',
                                                                aspectRatio: '1',
                                                                border: '2px dashed',
                                                                borderColor: item.photo_url ? 'success.main' : 'divider',
                                                                borderRadius: 1,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                overflow: 'hidden',
                                                                cursor: 'pointer',
                                                                bgcolor: item.photo_url ? 'transparent' : 'action.hover',
                                                                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.selected' },
                                                            }}
                                                            component="label"
                                                        >
                                                            <input
                                                                type="file"
                                                                hidden
                                                                accept="image/*"
                                                                capture="environment"
                                                                onChange={(e) => handleItemPhotoUpload(section.id, idx, e)}
                                                                disabled={photoUploading !== null}
                                                            />
                                                            {photoUploading?.section === section.id && photoUploading?.index === idx ? (
                                                                <CircularProgress size={40} />
                                                            ) : item.photo_url ? (
                                                                <>
                                                                    <img
                                                                        src={`${getApiUrl()}${item.photo_url}`}
                                                                        alt="Item"
                                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                    />
                                                                    <CheckCircleIcon
                                                                        color="success"
                                                                        sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'white', borderRadius: '50%' }}
                                                                    />
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CameraIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 0.5 }} />
                                                                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', px: 1 }}>
                                                                        {item.example || 'Toca para subir'}
                                                                    </Typography>
                                                                </>
                                                            )}
                                                        </Box>
                                                        {/* Simple Description Field */}
                                                        <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                variant="standard"
                                                                placeholder={section.id === 'appliances' ? 'ej: Refrigerador Samsung' : 'ej: Paredes sala - SW7015'}
                                                                value={item.item || item.area || ''}
                                                                onChange={(e) => updateField(
                                                                    section.id,
                                                                    section.id === 'appliances' ? 'item' : 'area',
                                                                    e.target.value,
                                                                    idx
                                                                )}
                                                                InputProps={{ disableUnderline: true }}
                                                                sx={{ '& input': { textAlign: 'center', fontSize: '0.875rem' } }}
                                                            />
                                                        </CardContent>
                                                        {/* Delete Button (hover) */}
                                                        <IconButton
                                                            className="delete-btn"
                                                            size="small"
                                                            color="error"
                                                            onClick={() => removeItem(section.id, idx)}
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 4,
                                                                left: 4,
                                                                opacity: 0,
                                                                transition: 'opacity 0.2s',
                                                                bgcolor: 'background.paper',
                                                                '&:hover': { bgcolor: 'error.light', color: 'white' },
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Card>
                                                </Grid>
                                            ))}
                                            {/* Add New Photo Card */}
                                            <Grid item xs={6} sm={4} md={3}>
                                                <Card
                                                    variant="outlined"
                                                    sx={{
                                                        height: '100%',
                                                        minHeight: 160,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        borderStyle: 'dashed',
                                                        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                                                    }}
                                                    onClick={() => addItem(section.id)}
                                                >
                                                    <AddIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                                                    <Typography variant="body2" color="text.secondary">Agregar</Typography>
                                                </Card>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                ) : (
                                    /* Full Mode: All Fields */
                                    <Box>
                                        <Grid container spacing={2} sx={{ mb: 2 }}>
                                            {manual.fields[section.id]?.map((item: any, idx: number) => (
                                                <Grid item xs={12} key={idx}>
                                                    <Card variant="outlined" sx={{ overflow: 'visible' }}>
                                                        <CardContent sx={{ pb: '16px !important' }}>
                                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                                                {/* Photo thumbnail/upload */}
                                                                <Box
                                                                    sx={{
                                                                        width: 80,
                                                                        height: 80,
                                                                        flexShrink: 0,
                                                                        border: '2px dashed',
                                                                        borderColor: item.photo_url ? 'success.main' : 'divider',
                                                                        borderRadius: 1,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        overflow: 'hidden',
                                                                        position: 'relative',
                                                                        cursor: 'pointer',
                                                                        bgcolor: item.photo_url ? 'transparent' : 'action.hover',
                                                                        '&:hover': { borderColor: 'primary.main' },
                                                                    }}
                                                                    component="label"
                                                                >
                                                                    <input
                                                                        type="file"
                                                                        hidden
                                                                        accept="image/*"
                                                                        capture="environment"
                                                                        onChange={(e) => handleItemPhotoUpload(section.id, idx, e)}
                                                                        disabled={photoUploading !== null}
                                                                    />
                                                                    {photoUploading?.section === section.id && photoUploading?.index === idx ? (
                                                                        <CircularProgress size={24} />
                                                                    ) : item.photo_url ? (
                                                                        <>
                                                                            <img
                                                                                src={`${getApiUrl()}${item.photo_url}`}
                                                                                alt="Item"
                                                                                style={{
                                                                                    width: '100%',
                                                                                    height: '100%',
                                                                                    objectFit: 'cover',
                                                                                }}
                                                                            />
                                                                            <CheckCircleIcon
                                                                                color="success"
                                                                                sx={{
                                                                                    position: 'absolute',
                                                                                    top: -8,
                                                                                    right: -8,
                                                                                    bgcolor: 'white',
                                                                                    borderRadius: '50%',
                                                                                }}
                                                                            />
                                                                        </>
                                                                    ) : (
                                                                        <CameraIcon color="action" />
                                                                    )}
                                                                </Box>

                                                                {/* Fields */}
                                                                <Grid container spacing={1.5} sx={{ flex: 1 }}>
                                                                    {(section.item_schema || [])
                                                                        .filter((field: any) => field.type !== 'photo')
                                                                        .map((field: any) => (
                                                                            <Grid
                                                                                item
                                                                                xs={12}
                                                                                sm={
                                                                                    field.name === 'item' || field.name === 'area'
                                                                                        ? 6
                                                                                        : field.type === 'date'
                                                                                            ? 4
                                                                                            : 3
                                                                                }
                                                                                key={field.name}
                                                                            >
                                                                                <TextField
                                                                                    fullWidth
                                                                                    size="small"
                                                                                    type={field.type === 'date' ? 'date' : 'text'}
                                                                                    label={field.label}
                                                                                    placeholder={field.placeholder}
                                                                                    value={item[field.name] || ''}
                                                                                    onChange={(e) =>
                                                                                        updateField(section.id, field.name, e.target.value, idx)
                                                                                    }
                                                                                    InputLabelProps={
                                                                                        field.type === 'date' ? { shrink: true } : undefined
                                                                                    }
                                                                                />
                                                                            </Grid>
                                                                        ))}
                                                                </Grid>

                                                                {/* Delete button */}
                                                                <IconButton
                                                                    color="error"
                                                                    onClick={() => removeItem(section.id, idx)}
                                                                    sx={{ mt: 0.5 }}
                                                                >
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </Box>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            ))}
                                        </Grid>
                                        <Button startIcon={<AddIcon />} onClick={() => addItem(section.id)}>
                                            Add Item
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* CONTACTS / SYSTEMS TYPE */}
                        {(section.type === 'contacts' || section.type === 'key_value' || section.type === 'locations') && (
                            <Grid container spacing={2}>
                                {section.fields?.map((field: any) => (
                                    <Grid item xs={12} sm={6} key={field.name}>
                                        {/* Simple text field for now, can be expanded to Contact object */}
                                        <Typography variant="caption" color="text.secondary">{field.label}</Typography>
                                        {section.type === 'contacts' ? (
                                            // For contacts, we might want Name/Phone/Email. For simplicity, let's use a single text field or assume generic structure first
                                            // Ideally: separate inputs. Let's stick to simple generic objects for now stored in state
                                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                                <TextField
                                                    fullWidth size="small" placeholder="Name / Company"
                                                    value={manual.fields[section.id]?.[field.name]?.name || manual.fields[section.id]?.[field.name] || ''}
                                                    onChange={(e) => {
                                                        const cur = manual.fields[section.id]?.[field.name] || {};
                                                        const val = typeof cur === 'string' ? { name: e.target.value } : { ...cur, name: e.target.value };
                                                        updateField(section.id, field.name, val, undefined as any);
                                                    }}
                                                />
                                                <TextField
                                                    fullWidth size="small" placeholder="Phone"
                                                    value={manual.fields[section.id]?.[field.name]?.phone || ''}
                                                    onChange={(e) => {
                                                        const cur = manual.fields[section.id]?.[field.name] || {};
                                                        const val = typeof cur === 'string' ? { phone: e.target.value } : { ...cur, phone: e.target.value };
                                                        updateField(section.id, field.name, val, undefined as any);
                                                    }}
                                                />
                                            </Box>
                                        ) : (
                                            <TextField
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                value={manual.fields[section.id]?.[field.name] || ''}
                                                onChange={(e) => {
                                                    const cur = manual.fields[section.id] || {};
                                                    const updatedSection = { ...cur, [field.name]: e.target.value };
                                                    setManual({ ...manual, fields: { ...manual.fields, [section.id]: updatedSection } });
                                                }}
                                            />
                                        )}
                                    </Grid>
                                ))}
                            </Grid>
                        )}

                        {/* NOTES TYPE */}
                        {section.type === 'text' && (
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                value={manual.fields[section.id] || ''}
                                onChange={(e) => setManual({
                                    ...manual,
                                    fields: { ...manual.fields, [section.id]: e.target.value }
                                })}
                            />
                        )}

                        {/* CHECKLIST TYPE */}
                        {section.type === 'checklist' && (
                            <Box>
                                {section.items?.map((item: any, idx: number) => (
                                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                                        <Typography>{item.task}</Typography>
                                        <Typography color="text.secondary" variant="body2">{item.frequency}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* DOCUMENTS TYPE (File Upload) */}
                        {section.type === 'documents' && (
                            <Box>
                                {uploadError && (
                                    <Alert severity="error" onClose={() => setUploadError(null)} sx={{ mb: 2 }}>
                                        {uploadError}
                                    </Alert>
                                )}

                                {/* Physical Location Field */}
                                {section.location_field && (
                                    <Box sx={{ mb: 3 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label={section.location_field.label}
                                            placeholder={section.location_field.placeholder}
                                            value={manual.fields[section.id]?.[section.location_field.name] || ''}
                                            onChange={(e) => {
                                                const sectionData = manual.fields[section.id] || {};
                                                setManual({
                                                    ...manual,
                                                    fields: {
                                                        ...manual.fields,
                                                        [section.id]: {
                                                            ...sectionData,
                                                            [section.location_field.name]: e.target.value,
                                                        },
                                                    },
                                                });
                                            }}
                                            InputProps={{
                                                startAdornment: (
                                                    <Box component="span" sx={{ mr: 1, color: 'text.secondary' }}>
                                                        📍
                                                    </Box>
                                                ),
                                            }}
                                        />
                                    </Box>
                                )}

                                {/* Upload Button */}
                                <Box
                                    sx={{
                                        border: '2px dashed',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        p: 4,
                                        textAlign: 'center',
                                        mb: 3,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: 'action.hover',
                                        },
                                    }}
                                    component="label"
                                >
                                    <input
                                        type="file"
                                        hidden
                                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                                        onChange={(e) => handleFileUpload(section.id, e)}
                                        disabled={uploading}
                                    />
                                    <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                                    <Typography variant="body1" fontWeight={600}>
                                        {uploading ? 'Subiendo...' : 'Click para subir documento'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        PDF, JPG, PNG (máx. 10MB)
                                    </Typography>
                                    {uploading && <LinearProgress sx={{ mt: 2 }} />}
                                </Box>

                                {/* Attachments List */}
                                {manual.attachments && manual.attachments.filter(a => a.section === section.id).length > 0 && (
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Documentos adjuntos:</Typography>
                                        <Grid container spacing={2}>
                                            {manual.attachments
                                                .map((att, originalIndex) => ({ ...att, originalIndex }))
                                                .filter(att => att.section === section.id)
                                                .map((attachment) => (
                                                    <Grid item xs={12} sm={6} md={4} key={attachment.originalIndex}>
                                                        <Card variant="outlined">
                                                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                                {getFileIcon(attachment.type)}
                                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                    <Typography variant="body2" noWrap fontWeight={500}>
                                                                        {attachment.name}
                                                                    </Typography>
                                                                    <Chip
                                                                        label={attachment.type?.split('/')[1]?.toUpperCase() || 'FILE'}
                                                                        size="small"
                                                                        sx={{ height: 20, fontSize: '0.65rem' }}
                                                                    />
                                                                </Box>
                                                                <IconButton
                                                                    size="small"
                                                                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${attachment.url}`}
                                                                    target="_blank"
                                                                >
                                                                    <DownloadIcon fontSize="small" />
                                                                </IconButton>
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => removeAttachment(attachment.originalIndex)}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </CardContent>
                                                        </Card>
                                                    </Grid>
                                                ))}
                                        </Grid>
                                    </Box>
                                )}

                                {(!manual.attachments || manual.attachments.filter(a => a.section === section.id).length === 0) && (
                                    <Typography color="text.secondary" textAlign="center">
                                        No hay documentos adjuntos aún. Sube tu primera garantía o documento.
                                    </Typography>
                                )}
                            </Box>
                        )}

                        {/* COLOR PALETTE TYPE */}
                        {section.type === 'color_palette' && (
                            <Box>
                                {/* Photo Upload Area */}
                                <Box
                                    sx={{
                                        width: '100%',
                                        height: 300,
                                        border: '2px dashed',
                                        borderColor: manual.fields?.finishes_photo ? 'success.main' : 'divider',
                                        borderRadius: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        bgcolor: manual.fields?.finishes_photo ? 'transparent' : 'action.hover',
                                        mb: 3,
                                        '&:hover': { borderColor: 'primary.main' },
                                    }}
                                    component="label"
                                >
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        capture="environment"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file || !id) return;
                                            try {
                                                const result = await manualService.uploadAttachment(Number(id), 'finishes', file);
                                                setManual(prev => {
                                                    if (!prev) return prev;
                                                    return {
                                                        ...prev,
                                                        fields: { ...prev.fields, finishes_photo: result.url }
                                                    };
                                                });
                                            } catch (error) {
                                                console.error('Failed to upload palette photo:', error);
                                            }
                                        }}
                                    />
                                    {manual.fields?.finishes_photo ? (
                                        <img
                                            src={`${getApiUrl()}${manual.fields.finishes_photo}`}
                                            alt="Color Palette"
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        />
                                    ) : (
                                        <>
                                            <CameraIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 1 }} />
                                            <Typography variant="h6" color="text.secondary">
                                                Sube la foto de tu paleta de colores
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Toca para tomar o seleccionar foto
                                            </Typography>
                                        </>
                                    )}
                                </Box>

                                {/* Color Table */}
                                <Typography variant="subtitle2" sx={{ mb: 2 }}>Colores utilizados:</Typography>
                                <Grid container spacing={2}>
                                    {(section.colors || []).map((colorItem: any, colorIdx: number) => (
                                        <Grid item xs={12} sm={6} key={colorIdx}>
                                            <Card variant="outlined" sx={{ p: 2 }}>
                                                <Typography variant="caption" color="text.secondary">{colorItem.area}</Typography>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    placeholder="Nombre del color (ej: Agreeable Gray)"
                                                    value={manual.fields?.[`color_${colorIdx}_name`] || ''}
                                                    onChange={(e) => {
                                                        setManual(prev => ({
                                                            ...prev!,
                                                            fields: { ...prev!.fields, [`color_${colorIdx}_name`]: e.target.value }
                                                        }));
                                                    }}
                                                    sx={{ mt: 0.5 }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    placeholder="Código (ej: SW-7029)"
                                                    value={manual.fields?.[`color_${colorIdx}_code`] || ''}
                                                    onChange={(e) => {
                                                        setManual(prev => ({
                                                            ...prev!,
                                                            fields: { ...prev!.fields, [`color_${colorIdx}_code`]: e.target.value }
                                                        }));
                                                    }}
                                                    sx={{ mt: 1 }}
                                                />
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}
                    </AccordionDetails>
                </Accordion>
            ))}
        </Box>
    );
};

export default ProjectManual;
