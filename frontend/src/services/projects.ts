import api from './api';
import type { Project, ProjectCreate, ProjectDashboard, ListResponse } from '../types';

export const projectsService = {
    async list(params?: { status?: string; search?: string }): Promise<ListResponse<Project>> {
        const response = await api.get<ListResponse<Project>>('/api/projects/', { params });
        return response.data;
    },

    async get(id: number): Promise<Project> {
        const response = await api.get<Project>(`/api/projects/${id}`);
        return response.data;
    },

    async getDashboard(id: number): Promise<ProjectDashboard> {
        const response = await api.get<ProjectDashboard>(`/api/projects/${id}/dashboard`);
        return response.data;
    },

    async create(data: ProjectCreate, createDefaultAreas = true): Promise<Project> {
        const response = await api.post<Project>('/api/projects/', data, {
            params: { create_default_areas: createDefaultAreas },
        });
        return response.data;
    },

    async update(id: number, data: Partial<ProjectCreate>): Promise<Project> {
        const response = await api.patch<Project>(`/api/projects/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/api/projects/${id}`);
    },
};
