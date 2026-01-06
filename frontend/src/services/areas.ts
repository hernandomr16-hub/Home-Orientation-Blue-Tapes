import api from './api';
import type { Area, AreaCreate } from '../types';

export const areasService = {
    async list(projectId: number): Promise<Area[]> {
        const response = await api.get<Area[]>(`/api/projects/${projectId}/areas`);
        return response.data;
    },

    async create(projectId: number, data: AreaCreate): Promise<Area> {
        const response = await api.post<Area>(`/api/projects/${projectId}/areas`, data);
        return response.data;
    },

    async update(projectId: number, areaId: number, data: Partial<AreaCreate>): Promise<Area> {
        const response = await api.patch<Area>(`/api/projects/${projectId}/areas/${areaId}`, data);
        return response.data;
    },

    async delete(projectId: number, areaId: number): Promise<void> {
        await api.delete(`/api/projects/${projectId}/areas/${areaId}`);
    },

    async reorder(projectId: number, areaIds: number[]): Promise<Area[]> {
        const response = await api.post<Area[]>(`/api/projects/${projectId}/areas/reorder`, areaIds);
        return response.data;
    },
};
