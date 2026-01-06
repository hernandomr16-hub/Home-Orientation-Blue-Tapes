import api from './api';
import type { Contractor, ContractorCreate, ProjectContractor, ProjectContractorCreate } from '../types';

export const contractorsService = {
    // Master contractors
    async list(params?: { search?: string; trade?: string }): Promise<Contractor[]> {
        const response = await api.get<Contractor[]>('/api/contractors', { params });
        return response.data;
    },

    async getTrades(): Promise<string[]> {
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

    // Project contractors
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
