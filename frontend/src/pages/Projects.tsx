import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,

    Card,
    CardContent,
    CardActionArea,
    Typography,
    Button,
    TextField,
    InputAdornment,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    IconButton,
    Menu,
    MenuItem,
} from '@mui/material';

import {
    Add as AddIcon,
    Search as SearchIcon,
    Business as ProjectIcon,
    MoreVert as MoreIcon,
    LocationOn as LocationIcon,
} from '@mui/icons-material';
import type { Project, ProjectCreate, ProjectStatus } from '../types';
import { projectsService } from '../services/projects';

const statusColors: Record<ProjectStatus, 'success' | 'warning' | 'default'> = {
    active: 'success',
    delivered: 'warning',
    archived: 'default',
};

const Projects: React.FC = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newProject, setNewProject] = useState<ProjectCreate>({
        name: '',
        address: '',
        unit: '',
        notes: '',
    });
    const [creating, setCreating] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editProject, setEditProject] = useState<ProjectCreate>({
        name: '',
        address: '',
        unit: '',
        notes: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const response = await projectsService.list();
            setProjects(response.items);
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!newProject.name || !newProject.address) return;

        setCreating(true);
        try {
            const created = await projectsService.create(newProject, true);
            setProjects([created, ...projects]);
            setCreateDialogOpen(false);
            setNewProject({ name: '', address: '', unit: '', notes: '' });
            navigate(`/projects/${created.id}`);
        } catch (error) {
            console.error('Failed to create project:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, project: Project) => {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
        setSelectedProject(project);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        // Don't reset selectedProject here - it's needed for edit dialog
    };

    const handleDeleteProject = async () => {
        if (!selectedProject) return;
        try {
            await projectsService.delete(selectedProject.id);
            setProjects(projects.filter(p => p.id !== selectedProject.id));
        } catch (error) {
            console.error('Failed to delete project:', error);
        }
        handleMenuClose();
    };

    const handleOpenEditDialog = () => {
        if (!selectedProject) return;
        setEditProject({
            name: selectedProject.name,
            address: selectedProject.address,
            unit: selectedProject.unit || '',
            notes: selectedProject.notes || '',
        });
        setEditDialogOpen(true);
        handleMenuClose();
    };

    const handleUpdateProject = async () => {
        if (!selectedProject || !editProject.name || !editProject.address) return;
        setSaving(true);
        try {
            const updated = await projectsService.update(selectedProject.id, editProject);
            setProjects(projects.map(p => p.id === updated.id ? updated : p));
            setEditDialogOpen(false);
            setSelectedProject(null);
        } catch (error) {
            console.error('Failed to update project:', error);
            alert('Error al actualizar el proyecto');
        } finally {
            setSaving(false);
        }
    };

    const filteredProjects = projects.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.address.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={700}>
                    Projects
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialogOpen(true)}
                >
                    New Project
                </Button>
            </Box>

            <TextField
                fullWidth
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon color="action" />
                        </InputAdornment>
                    ),
                }}
            />

            <Grid container spacing={3}>
                {filteredProjects.map((project) => (
                    <Grid item xs={12} sm={6} lg={4} key={project.id}>
                        <Card sx={{ height: '100%' }}>
                            <CardActionArea onClick={() => navigate(`/projects/${project.id}`)}>
                                <CardContent sx={{ pb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 2,
                                                backgroundColor: 'primary.light',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <ProjectIcon sx={{ color: 'white' }} />
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip
                                                label={project.status}
                                                size="small"
                                                color={statusColors[project.status]}
                                            />
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleMenuOpen(e, project)}
                                            >
                                                <MoreIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                    <Typography variant="h6" fontWeight={600} gutterBottom noWrap>
                                        {project.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                        <LocationIcon fontSize="small" />
                                        <Typography variant="body2" noWrap>
                                            {project.address}
                                            {project.unit && ` • ${project.unit}`}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}

                {filteredProjects.length === 0 && (
                    <Grid item xs={12}>
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <ProjectIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                            <Typography color="text.secondary">
                                {search ? 'No projects found' : 'No projects yet. Create your first one!'}
                            </Typography>
                        </Box>
                    </Grid>
                )}
            </Grid>

            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
                <MenuItem onClick={handleOpenEditDialog}>
                    Edit
                </MenuItem>
                <MenuItem onClick={handleDeleteProject} sx={{ color: 'error.main' }}>
                    Delete
                </MenuItem>
            </Menu>

            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>New Project</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="Project Name"
                            value={newProject.name}
                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                            sx={{ mb: 2 }}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Address"
                            value={newProject.address}
                            onChange={(e) => setNewProject({ ...newProject, address: e.target.value })}
                            sx={{ mb: 2 }}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Unit/Lot (optional)"
                            value={newProject.unit}
                            onChange={(e) => setNewProject({ ...newProject, unit: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Notes (optional)"
                            value={newProject.notes}
                            onChange={(e) => setNewProject({ ...newProject, notes: e.target.value })}
                            multiline
                            rows={3}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateProject}
                        disabled={creating || !newProject.name || !newProject.address}
                    >
                        {creating ? 'Creating...' : 'Create Project'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Project Dialog */}
            <Dialog open={editDialogOpen} onClose={() => { setEditDialogOpen(false); setSelectedProject(null); }} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Project</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="Project Name"
                            value={editProject.name}
                            onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                            sx={{ mb: 2 }}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Address"
                            value={editProject.address}
                            onChange={(e) => setEditProject({ ...editProject, address: e.target.value })}
                            sx={{ mb: 2 }}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Unit/Lot (optional)"
                            value={editProject.unit}
                            onChange={(e) => setEditProject({ ...editProject, unit: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Notes (optional)"
                            value={editProject.notes}
                            onChange={(e) => setEditProject({ ...editProject, notes: e.target.value })}
                            multiline
                            rows={3}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => { setEditDialogOpen(false); setSelectedProject(null); }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleUpdateProject}
                        disabled={saving || !editProject.name || !editProject.address}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Projects;





