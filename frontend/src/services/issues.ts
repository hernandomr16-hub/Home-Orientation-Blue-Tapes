import api from './api';
import type { Issue, IssueCreate, IssueUpdate, IssueStatusUpdate, IssuePhoto, ListResponse } from '../types';

export const issuesService = {
    async list(projectId: number, params?: {
        status?: string;
        priority?: string;
        area_id?: number;
        contractor_id?: number;
        trade?: string;
    }): Promise<ListResponse<Issue>> {
        const response = await api.get<ListResponse<Issue>>(
            `/api/projects/${projectId}/issues`,
            { params }
        );
        return response.data;
    },

    async get(projectId: number, issueId: number): Promise<Issue> {
        const response = await api.get<Issue>(`/api/projects/${projectId}/issues/${issueId}`);
        return response.data;
    },

    async getCategories(): Promise<string[]> {
        const response = await api.get<string[]>('/api/projects/0/issues/categories');
        return response.data;
    },

    async create(projectId: number, data: IssueCreate): Promise<Issue> {
        const response = await api.post<Issue>(`/api/projects/${projectId}/issues`, data);
        return response.data;
    },

    async update(projectId: number, issueId: number, data: IssueUpdate): Promise<Issue> {
        const response = await api.patch<Issue>(
            `/api/projects/${projectId}/issues/${issueId}`,
            data
        );
        return response.data;
    },

    async updateStatus(projectId: number, issueId: number, data: IssueStatusUpdate): Promise<Issue> {
        const response = await api.patch<Issue>(
            `/api/projects/${projectId}/issues/${issueId}/status`,
            data
        );
        return response.data;
    },

    async uploadPhoto(projectId: number, issueId: number, file: File, photoType: 'before' | 'after' = 'before'): Promise<IssuePhoto> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<IssuePhoto>(
            `/api/projects/${projectId}/issues/${issueId}/photos`,
            formData,
            {
                params: { photo_type: photoType },
                headers: { 'Content-Type': 'multipart/form-data' },
            }
        );
        return response.data;
    },

    async deletePhoto(projectId: number, issueId: number, photoId: number): Promise<void> {
        await api.delete(`/api/projects/${projectId}/issues/${issueId}/photos/${photoId}`);
    },

    async delete(projectId: number, issueId: number): Promise<void> {
        await api.delete(`/api/projects/${projectId}/issues/${issueId}`);
    },

    async sendNotification(projectId: number, issueId: number): Promise<any> {
        const response = await api.post(`/api/projects/${projectId}/issues/${issueId}/notify/`);
        return response.data;
    },
};
