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

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
    if (!project || !manual) return <Typography>Project not found</Typography>;

    return (
        <Box sx={{ pb: 8 }}>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/projects')}>Projects</Link>
                <Link component="button" underline="hover" color="inherit" onClick={() => navigate(`/projects/${id}`)}>{project.name}</Link>
                <Typography color="text.primary">Home Owner Manual</Typography>
            </Breadcrumbs>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700}>Home Owner Manual</Typography>
                    <Typography color="text.secondary">Build and export the final manual for the homeowner.</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<SaveIcon />} onClick={handleSave}>Save Draft</Button>
                    <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport}>Export PDF</Button>
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
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    {manual.fields[section.id]?.map((item: any, idx: number) => (
                                        <Grid item xs={12} key={idx}>
                                            <Card variant="outlined">
                                                <CardContent sx={{ pb: '16px !important', display: 'flex', gap: 2, alignItems: 'start' }}>
                                                    <Grid container spacing={2}>
                                                        {section.item_schema.map((field: any) => (
                                                            <Grid item xs={12} sm={field.name === 'item' ? 4 : 2} key={field.name}>
                                                                <TextField
                                                                    fullWidth
                                                                    size="small"
                                                                    label={field.label}
                                                                    placeholder={field.placeholder}
                                                                    value={item[field.name] || ''}
                                                                    onChange={(e) => updateField(section.id, field.name, e.target.value, idx)}
                                                                />
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                    <IconButton color="error" onClick={() => removeItem(section.id, idx)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                                <Button startIcon={<AddIcon />} onClick={() => addItem(section.id)}>Add Item</Button>
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
                    </AccordionDetails>
                </Accordion>
            ))}
        </Box>
    );
};

export default ProjectManual;
