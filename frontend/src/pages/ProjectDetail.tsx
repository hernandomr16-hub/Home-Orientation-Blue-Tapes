import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    IconButton,
    Tabs,
    Tab,
    Chip,
    CircularProgress,
    Breadcrumbs,
    Link,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';

import {
    Add as AddIcon,
    Assignment as IssuesIcon,
    Room as AreasIcon,
    People as ContractorsIcon,
    Description as ManualIcon,
    Download as DownloadIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import type { ProjectDashboard, Issue, Area, ProjectContractor } from '../types';
import { projectsService } from '../services/projects';
import { issuesService } from '../services/issues';
import { areasService } from '../services/areas';
import { contractorsService } from '../services/contractors';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
    <div hidden={value !== index}>
        {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
);

// Status colors with both background and text for dark mode compatibility
const statusColors: Record<string, { bg: string; text: string }> = {
    open: { bg: '#fef3c7', text: '#92400e' },
    assigned: { bg: '#dbeafe', text: '#1e40af' },
    in_progress: { bg: '#e0e7ff', text: '#3730a3' },
    ready_for_reinspect: { bg: '#fce7f3', text: '#9d174d' },
    closed: { bg: '#d1fae5', text: '#065f46' },
};

const priorityColors = {
    high: 'error',
    medium: 'warning',
    low: 'success',
} as const;

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);
    const [dashboard, setDashboard] = useState<ProjectDashboard | null>(null);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [contractors, setContractors] = useState<ProjectContractor[]>([]);
    const [closeDialogOpen, setCloseDialogOpen] = useState(false);
    const [cannotCloseDialogOpen, setCannotCloseDialogOpen] = useState(false);

    // ... (rest of code)

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [dashboardData, issuesData, areasData, contractorsData] = await Promise.all([
                projectsService.getDashboard(Number(id)),
                issuesService.list(Number(id)),
                areasService.list(Number(id)),
                contractorsService.listProjectContractors(Number(id)),
            ]);
            setDashboard(dashboardData);
            setIssues(issuesData.items);
            setAreas(areasData);
            setContractors(contractorsData);
        } catch (error) {
            console.error('Failed to load project:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPunchList = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/projects/${id}/reports/punch-list?group_by=area`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to generate report');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `punch-list-${dashboard?.project.name || 'project'}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download punch list:', error);
            alert('Error al descargar el reporte. Por favor intente de nuevo.');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!dashboard) {
        return <Typography>Project not found</Typography>;
    }

    const { project } = dashboard;

    return (
        <Box>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link
                    component="button"
                    underline="hover"
                    color="inherit"
                    onClick={() => navigate('/projects')}
                >
                    Projects
                </Link>
                <Typography color="text.primary">{project.name}</Typography>
            </Breadcrumbs>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700}>
                        {project.name}
                    </Typography>
                    <Typography color="text.secondary">
                        {project.address}
                        {project.unit && ` • ${project.unit}`}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownloadPunchList}
                        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                    >
                        Export Punch List
                    </Button>
                    <IconButton
                        color="primary"
                        onClick={handleDownloadPunchList}
                        sx={{ display: { xs: 'inline-flex', sm: 'none' }, border: 1, borderColor: 'divider' }}
                    >
                        <DownloadIcon />
                    </IconButton>

                    {project.status !== 'delivered' && (
                        <>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircleIcon />}
                                onClick={() => {
                                    if (
                                        dashboard.open_issues > 0 ||
                                        dashboard.assigned_issues > 0 ||
                                        dashboard.in_progress_issues > 0 ||
                                        dashboard.ready_for_reinspect > 0
                                    ) {
                                        setCannotCloseDialogOpen(true);
                                    } else {
                                        setCloseDialogOpen(true);
                                    }
                                }}
                                sx={{ display: { xs: 'none', md: 'inline-flex' } }}
                            >
                                Close Project
                            </Button>
                        </>
                    )}

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        disabled={project.status === 'delivered'}
                        onClick={() => navigate(`/projects/${id}/issues/new`)}
                        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                    >
                        New Issue
                    </Button>
                    <IconButton
                        color="primary"
                        onClick={() => navigate(`/projects/${id}/issues/new`)}
                        disabled={project.status === 'delivered'}
                        sx={{ display: { xs: 'inline-flex', sm: 'none' }, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                    >
                        <AddIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* Dashboard Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={4} md={2}>
                    <Card sx={{ backgroundColor: statusColors.open.bg }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" fontWeight={700} sx={{ color: statusColors.open.text }}>{dashboard.open_issues}</Typography>
                            <Typography variant="body2" sx={{ color: '#475569' }}>Open</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Card sx={{ backgroundColor: statusColors.assigned.bg }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" fontWeight={700} sx={{ color: statusColors.assigned.text }}>{dashboard.assigned_issues}</Typography>
                            <Typography variant="body2" sx={{ color: '#475569' }}>Assigned</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Card sx={{ backgroundColor: statusColors.in_progress.bg }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" fontWeight={700} sx={{ color: statusColors.in_progress.text }}>{dashboard.in_progress_issues}</Typography>
                            <Typography variant="body2" sx={{ color: '#475569' }}>In Progress</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Card sx={{ backgroundColor: statusColors.ready_for_reinspect.bg }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" fontWeight={700} sx={{ color: statusColors.ready_for_reinspect.text }}>{dashboard.ready_for_reinspect}</Typography>
                            <Typography variant="body2" sx={{ color: '#475569' }}>Reinspect</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Card sx={{ backgroundColor: statusColors.closed.bg }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" fontWeight={700} sx={{ color: statusColors.closed.text }}>{dashboard.closed_issues}</Typography>
                            <Typography variant="body2" sx={{ color: '#475569' }}>Closed</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Card sx={{ backgroundColor: '#fef2f2' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" fontWeight={700} sx={{ color: '#dc2626' }}>{dashboard.high_priority_open}</Typography>
                            <Typography variant="body2" sx={{ color: '#475569' }}>High Priority</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Dialogs */}
            <Dialog open={closeDialogOpen} onClose={() => setCloseDialogOpen(false)}>
                <DialogTitle>Close Project?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to close <strong>{project.name}</strong>?<br />
                        This will mark the project as <strong>Delivered</strong>.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCloseDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="success"
                        autoFocus
                        onClick={async () => {
                            try {
                                await projectsService.update(Number(id), { status: 'delivered' as any });
                                setCloseDialogOpen(false);
                                if (window.confirm('Project closed successfully! Generate Home Owner Manual now?')) {
                                    navigate(`/projects/${id}/manual`);
                                } else {
                                    loadData();
                                }
                            } catch (error) {
                                console.error('Failed to close project:', error);
                                alert('Failed to close project');
                            }
                        }}
                    >
                        Confirm Close
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={cannotCloseDialogOpen} onClose={() => setCannotCloseDialogOpen(false)}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}>
                    <WarningIcon color="warning" /> Cannot Close Project
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This project still has active issues that must be resolved first:
                        <ul>
                            {dashboard.open_issues > 0 && <li><strong>{dashboard.open_issues}</strong> Open issues</li>}
                            {dashboard.assigned_issues > 0 && <li><strong>{dashboard.assigned_issues}</strong> Assigned issues</li>}
                            {dashboard.in_progress_issues > 0 && <li><strong>{dashboard.in_progress_issues}</strong> In Progress issues</li>}
                            {dashboard.ready_for_reinspect > 0 && <li><strong>{dashboard.ready_for_reinspect}</strong> Reinspect issues</li>}
                        </ul>
                        Please close all issues before delivering the project.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCannotCloseDialogOpen(false)} autoFocus>
                        Understood
                    </Button>
                </DialogActions>
            </Dialog>

            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
                <Tab icon={<IssuesIcon />} iconPosition="start" label={`Issues (${issues.length})`} />
                <Tab icon={<AreasIcon />} iconPosition="start" label={`Areas (${areas.length})`} />
                <Tab icon={<ContractorsIcon />} iconPosition="start" label={`Contractors (${contractors.length})`} />
                <Tab icon={<ManualIcon />} iconPosition="start" label="Manual" />
            </Tabs>

            <TabPanel value={tab} index={0}>
                <Grid container spacing={2}>
                    {issues.map((issue) => (
                        <Grid item xs={12} sm={6} lg={4} key={issue.id}>
                            <Card
                                sx={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/projects/${id}/issues/${issue.id}`)}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Chip
                                            label={issue.status.replace('_', ' ')}
                                            size="small"
                                            sx={{
                                                backgroundColor: statusColors[issue.status]?.bg,
                                                color: statusColors[issue.status]?.text
                                            }}
                                        />
                                        <Chip
                                            label={issue.priority}
                                            size="small"
                                            color={priorityColors[issue.priority]}
                                        />
                                    </Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        #{issue.id} • {issue.area_name}
                                    </Typography>
                                    <Typography fontWeight={600}>{issue.category}</Typography>
                                    {issue.description && (
                                        <Typography variant="body2" color="text.secondary" noWrap>
                                            {issue.description}
                                        </Typography>
                                    )}
                                    {issue.contractor_name && (
                                        <Typography variant="caption" color="primary">
                                            → {issue.contractor_name}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                    {issues.length === 0 && (
                        <Grid item xs={12}>
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <IssuesIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                <Typography color="text.secondary">No issues yet</Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    sx={{ mt: 2 }}
                                    onClick={() => navigate(`/projects/${id}/issues/new`)}
                                >
                                    Create First Issue
                                </Button>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </TabPanel>

            <TabPanel value={tab} index={1}>
                <Grid container spacing={2}>
                    {areas.map((area) => (
                        <Grid item xs={12} sm={6} md={4} key={area.id}>
                            <Card>
                                <CardContent>
                                    <Typography fontWeight={600}>{area.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {area.is_custom ? 'Custom' : 'Default'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </TabPanel>

            <TabPanel value={tab} index={2}>
                <Grid container spacing={2}>
                    {contractors.map((pc) => (
                        <Grid item xs={12} sm={6} md={4} key={pc.id}>
                            <Card>
                                <CardContent>
                                    <Typography fontWeight={600}>{pc.contractor.company}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {pc.contractor.contact_name}
                                    </Typography>
                                    <Box sx={{ mt: 1 }}>
                                        {pc.trades.map((t) => (
                                            <Chip key={t} label={t} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                    {contractors.length === 0 && (
                        <Grid item xs={12}>
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <ContractorsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                <Typography color="text.secondary">No contractors assigned</Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </TabPanel>

            <TabPanel value={tab} index={3}>
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <ManualIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Home Owner Manual builder
                    </Typography>
                    <Button variant="outlined" onClick={() => navigate(`/projects/${id}/manual`)}>
                        Build Manual
                    </Button>
                </Box>
            </TabPanel>
        </Box>
    );
};

export default ProjectDetail;
