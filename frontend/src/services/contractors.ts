import api from './api';
import type {
    Contractor, ContractorCreate,
    ProjectContractor, ProjectContractorCreate,
    Trade, TradeCreate, TradeWithContractors
} from '../types';

export const contractorsService = {
    // ==================== Trades ====================

    async listTrades(): Promise<Trade[]> {
        const response = await api.get<Trade[]>('/api/trades');
        return response.data;
    },

    async getTrade(id: number): Promise<TradeWithContractors> {
        const response = await api.get<TradeWithContractors>(`/api/trades/${id}`);
        return response.data;
    },

    async createTrade(data: TradeCreate): Promise<Trade> {
        const response = await api.post<Trade>('/api/trades', data);
        return response.data;
    },

    async updateTrade(id: number, data: Partial<TradeCreate>): Promise<Trade> {
        const response = await api.patch<Trade>(`/api/trades/${id}`, data);
        return response.data;
    },

    async deleteTrade(id: number): Promise<void> {
        await api.delete(`/api/trades/${id}`);
    },

    // ==================== Master Contractors ====================

    async list(params?: { search?: string; trade_id?: number }): Promise<Contractor[]> {
        const response = await api.get<Contractor[]>('/api/contractors', { params });
        return response.data;
    },

    async getTrades(): Promise<string[]> {
        // Backward compatibility - returns trade names as strings
        const response = await api.get<string[]>('/api/contractors/trades');
        return response.data;
    },

    async get(id: number): Promise<Contractor> {
        const response = await api.get<Contractor>(`/api/contractors/${id}`);
        return response.data;
    },

    async create(data: ContractorCreate): Promise<Contractor> {
        const response = await api.post<Contractor>('/api/contractors', data);
        return response.data;
    },

    async update(id: number, data: Partial<ContractorCreate>): Promise<Contractor> {
        const response = await api.patch<Contractor>(`/api/contractors/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/api/contractors/${id}`);
    },

    // ==================== Project Contractors ====================

    async listProjectContractors(projectId: number): Promise<ProjectContractor[]> {
        const response = await api.get<ProjectContractor[]>(`/api/projects/${projectId}/contractors`);
        return response.data;
    },

    async assignToProject(projectId: number, data: ProjectContractorCreate): Promise<ProjectContractor> {
        const response = await api.post<ProjectContractor>(`/api/projects/${projectId}/contractors`, data);
        return response.data;
    },

    async updateProjectAssignment(projectId: number, assignmentId: number, data: ProjectContractorCreate): Promise<ProjectContractor> {
        const response = await api.patch<ProjectContractor>(
            `/api/projects/${projectId}/contractors/${assignmentId}`,
            data
        );
        return response.data;
    },

    async removeFromProject(projectId: number, assignmentId: number): Promise<void> {
        await api.delete(`/api/projects/${projectId}/contractors/${assignmentId}`);
    },
};
