import React, { useEffect, useState } from 'react';
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
    Autocomplete,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
} from '@mui/icons-material';
import type { Contractor, Trade } from '../types';
import { contractorsService } from '../services/contractors';

interface ContractorFormData {
    company: string;
    contact_name: string;
    email: string;
    phone: string;
    trade_ids: number[];
    notes: string;
}

const Contractors: React.FC = () => {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterTrades, setFilterTrades] = useState<number[]>([]);

    // Contractor dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<ContractorFormData>({
        company: '',
        contact_name: '',
        email: '',
        phone: '',
        trade_ids: [],
        notes: '',
    });

    // Delete confirmation
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Add error state
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setError(null);
        try {
            console.log('Loading trades and contractors...');
            const [tradesList, contractorsList] = await Promise.all([
                contractorsService.listTrades(),
                contractorsService.list(),
            ]);
            console.log('Trades loaded:', tradesList?.length || 0);
            console.log('Contractors loaded:', contractorsList?.length || 0);
            setTrades(tradesList || []);
            setContractors(contractorsList || []);
        } catch (error: any) {
            console.error('Failed to load data:', error);
            setError(`Error cargando datos: ${error?.message || 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const openDialog = (contractor?: Contractor) => {
        if (contractor) {
            setEditingId(contractor.id);
            // Get trade IDs from trade_ids array or from trades names
            const tradeIds = contractor.trade_ids ||
                trades.filter(t => contractor.trades?.includes(t.name)).map(t => t.id);
            setFormData({
                company: contractor.company,
                contact_name: contractor.contact_name || '',
                email: contractor.email || '',
                phone: contractor.phone || '',
                trade_ids: tradeIds,
                notes: contractor.notes || '',
            });
        } else {
            setEditingId(null);
            setFormData({
                company: '',
                contact_name: '',
                email: '',
                phone: '',
                trade_ids: [],
                notes: '',
            });
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.company || formData.trade_ids.length === 0) return;
        setSaving(true);

        // Convert trade_ids to trades names for the API
        const selectedTradeNames = trades
            .filter(t => formData.trade_ids.includes(t.id))
            .map(t => t.name);

        const dataToSend = {
            company: formData.company,
            contact_name: formData.contact_name || undefined,
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            trade_ids: formData.trade_ids,
            trades: selectedTradeNames, // For backward compatibility
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
            loadData();
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
        } catch (error) {
            console.error('Failed to delete contractor:', error);
            alert('Error al eliminar el contratista.');
        } finally {
            setDeleteConfirmOpen(false);
            setDeletingId(null);
        }
    };

    // Get trade info by name
    const getTradeByName = (name: string) => trades.find(t => t.name === name);

    // Filter contractors
    const filteredContractors = contractors.filter(c => {
        const matchesSearch = search === '' ||
            c.company.toLowerCase().includes(search.toLowerCase()) ||
            c.contact_name?.toLowerCase().includes(search.toLowerCase());

        const matchesTrades = filterTrades.length === 0 ||
            (c.trade_ids && c.trade_ids.some(tid => filterTrades.includes(tid))) ||
            (c.trades && c.trades.some(tname => filterTrades.includes(trades.find(t => t.name === tname)?.id || 0)));

        return matchesSearch && matchesTrades;
    });

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Error display */}
            {error && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                    <Typography color="error.dark">{error}</Typography>
                </Box>
            )}

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" fontWeight={700}>Contratistas</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => openDialog()}
                >
                    Nuevo Contratista
                </Button>
            </Box>

            {/* Search and Filter */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <TextField
                    placeholder="Buscar contratistas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ flexGrow: 1, minWidth: 200 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                />
                <Autocomplete
                    multiple
                    options={trades}
                    getOptionLabel={(option) => `${option.icon} ${option.name}`}
                    value={trades.filter(t => filterTrades.includes(t.id))}
                    onChange={(_, newValue) => setFilterTrades(newValue.map(t => t.id))}
                    renderInput={(params) => (
                        <TextField {...params} placeholder="Filtrar por categoría..." />
                    )}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                            <Chip
                                {...getTagProps({ index })}
                                key={option.id}
                                label={`${option.icon} ${option.name}`}
                                size="small"
                            />
                        ))
                    }
                    sx={{ minWidth: 300 }}
                />
            </Box>

            {/* Contractors Grid */}
            {filteredContractors.length === 0 ? (
                <Card sx={{ textAlign: 'center', py: 6 }}>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        {contractors.length === 0
                            ? 'No hay contratistas registrados'
                            : 'No se encontraron contratistas con esos filtros'}
                    </Typography>
                    <Button variant="outlined" onClick={() => openDialog()}>
                        Agregar Contratista
                    </Button>
                </Card>
            ) : (
                <Grid container spacing={2}>
                    {filteredContractors.map((contractor) => (
                        <Grid item xs={12} sm={6} lg={4} key={contractor.id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
                                            {contractor.company}
                                        </Typography>
                                        <Box>
                                            <Tooltip title="Editar">
                                                <IconButton size="small" onClick={() => openDialog(contractor)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Eliminar">
                                                <IconButton size="small" onClick={() => openDeleteConfirm(contractor.id)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>

                                    {contractor.contact_name && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            {contractor.contact_name}
                                        </Typography>
                                    )}

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                                        {contractor.phone && (
                                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <PhoneIcon fontSize="small" color="action" /> {contractor.phone}
                                            </Typography>
                                        )}
                                        {contractor.email && (
                                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <EmailIcon fontSize="small" color="action" /> {contractor.email}
                                            </Typography>
                                        )}
                                    </Box>

                                    {/* Trade Chips */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {contractor.trades?.map((tradeName) => {
                                            const trade = getTradeByName(tradeName);
                                            return (
                                                <Chip
                                                    key={tradeName}
                                                    label={trade ? `${trade.icon} ${tradeName}` : tradeName}
                                                    size="small"
                                                    variant="outlined"
                                                    color="primary"
                                                />
                                            );
                                        })}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Contractor Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? 'Editar Contratista' : 'Nuevo Contratista'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Nombre de la Empresa"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            required
                        />

                        <Autocomplete
                            multiple
                            options={trades}
                            getOptionLabel={(option) => `${option.icon} ${option.name}`}
                            value={trades.filter(t => formData.trade_ids.includes(t.id))}
                            onChange={(_, newValue) => setFormData({
                                ...formData,
                                trade_ids: newValue.map(t => t.id)
                            })}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Categorías de Trabajo"
                                    required
                                    error={formData.trade_ids.length === 0}
                                    helperText="Selecciona una o más categorías"
                                />
                            )}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip
                                        {...getTagProps({ index })}
                                        key={option.id}
                                        label={`${option.icon} ${option.name}`}
                                        size="small"
                                        color="primary"
                                    />
                                ))
                            }
                            renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography sx={{ fontSize: '1.2rem' }}>{option.icon}</Typography>
                                        <Box>
                                            <Typography variant="body1">{option.name}</Typography>
                                            {option.description && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {option.description}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </li>
                            )}
                        />

                        <TextField
                            fullWidth
                            label="Nombre de Contacto"
                            value={formData.contact_name}
                            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Teléfono"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </Box>

                        <TextField
                            fullWidth
                            label="Notas"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            multiline
                            rows={2}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving || !formData.company || formData.trade_ids.length === 0}
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Eliminar Contratista</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro de que quieres eliminar este contratista?
                        Esta acción no se puede deshacer.
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
