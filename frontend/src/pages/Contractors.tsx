import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    IconButton,
    InputAdornment,
    CircularProgress,
} from '@mui/material';

import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import type { Contractor, ContractorCreate } from '../types';
import { contractorsService } from '../services/contractors';

const Contractors: React.FC = () => {
    const navigate = useNavigate();
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [trades, setTrades] = useState<string[]>([]);
    const [formData, setFormData] = useState<ContractorCreate>({
        company: '',
        contact_name: '',
        email: '',
        phone: '',
        trades: [],
        notes: '',
    });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [contractorsList, tradesList] = await Promise.all([
                contractorsService.list(),
                contractorsService.getTrades(),
            ]);
            setContractors(contractorsList);
            setTrades(tradesList);
        } catch (error) {
            console.error('Failed to load contractors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (contractor?: Contractor) => {
        if (contractor) {
            setEditingId(contractor.id);
            setFormData({
                company: contractor.company,
                contact_name: contractor.contact_name || '',
                email: contractor.email || '',
                phone: contractor.phone || '',
                trades: contractor.trades,
                notes: contractor.notes || '',
            });
        } else {
            setEditingId(null);
            setFormData({ company: '', contact_name: '', email: '', phone: '', trades: [], notes: '' });
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.company) return;
        setSaving(true);

        // Convert empty strings to undefined for optional fields
        const dataToSend = {
            ...formData,
            contact_name: formData.contact_name || undefined,
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            notes: formData.notes || undefined,
        };

        try {
            if (editingId) {
                const updated = await contractorsService.update(editingId, dataToSend);
                setContractors(contractors.map(c => c.id === editingId ? updated : c));
            } else {
                const created = await contractorsService.create(dataToSend);
                setContractors([created, ...contractors]);
            }
            setDialogOpen(false);
        } catch (error) {
            console.error('Failed to save contractor:', error);
            alert('Error al guardar el contratista. Por favor intente de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    const openDeleteConfirm = (id: number) => {
        setDeletingId(id);
        setDeleteConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await contractorsService.delete(deletingId);
            setContractors(contractors.filter(c => c.id !== deletingId));
            setDeleteConfirmOpen(false);
            setDeletingId(null);
        } catch (error) {
            console.error('Failed to delete contractor:', error);
            alert('Error al eliminar el contratista. Puede que tenga issues asignados.');
        }
    };

    const toggleTrade = (trade: string) => {
        const current = formData.trades || [];
        if (current.includes(trade)) {
            setFormData({ ...formData, trades: current.filter(t => t !== trade) });
        } else {
            setFormData({ ...formData, trades: [...current, trade] });
        }
    };

    const filteredContractors = contractors.filter(
        c => c.company.toLowerCase().includes(search.toLowerCase()) ||
            c.contact_name?.toLowerCase().includes(search.toLowerCase())
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
                <Typography variant="h4" fontWeight={700}>Contractors</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                    Add Contractor
                </Button>
            </Box>

            <TextField
                fullWidth
                placeholder="Search contractors..."
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
                {filteredContractors.map((contractor) => (
                    <Grid item xs={12} sm={6} lg={4} key={contractor.id}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="h6" fontWeight={600}>{contractor.company}</Typography>
                                    <Box>
                                        <IconButton size="small" onClick={() => handleOpenDialog(contractor)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => openDeleteConfirm(contractor.id)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                                {contractor.contact_name && (
                                    <Typography variant="body2" color="text.secondary">{contractor.contact_name}</Typography>
                                )}
                                {contractor.phone && (
                                    <Typography variant="body2">📞 {contractor.phone}</Typography>
                                )}
                                {contractor.email && (
                                    <Typography variant="body2">✉️ {contractor.email}</Typography>
                                )}
                                <Box sx={{ mt: 2 }}>
                                    {contractor.trades.map((trade) => (
                                        <Chip key={trade} label={trade} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? 'Edit Contractor' : 'New Contractor'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="Company Name"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            sx={{ mb: 2 }}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Contact Name"
                            value={formData.contact_name}
                            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Trades</Typography>
                        <Box sx={{ mb: 2 }}>
                            {trades.map((trade) => (
                                <Chip
                                    key={trade}
                                    label={trade}
                                    size="small"
                                    onClick={() => toggleTrade(trade)}
                                    color={formData.trades?.includes(trade) ? 'primary' : 'default'}
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                />
                            ))}
                        </Box>
                        <TextField
                            fullWidth
                            label="Notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            multiline
                            rows={2}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving || !formData.company}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Eliminar Contratista</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro de que quieres eliminar este contratista? Esta acción no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
                    <Button variant="contained" color="error" onClick={handleDelete}>
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Contractors;
