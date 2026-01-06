import api from './api';
import type { ManualInstance } from '../types';

export interface ManualTemplate {
    id: number;
    name: string;
    sections: any[];
}

export const manualService = {
    async get(projectId: number): Promise<ManualInstance> {
        const response = await api.get<ManualInstance>(`/api/projects/${projectId}/manual`);
        return response.data;
    },

    async update(projectId: number, data: Partial<ManualInstance>): Promise<ManualInstance> {
        const response = await api.put<ManualInstance>(`/api/projects/${projectId}/manual`, data);
        return response.data;
    },

    async getTemplateSections(): Promise<any[]> {
        const response = await api.get('/api/manual-templates/default-sections');
        return response.data;
    },

    async uploadAttachment(projectId: number, section: string, file: File): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(
            `/api/projects/${projectId}/manual/attachments`,
            formData,
            {
                params: { section },
                headers: { 'Content-Type': 'multipart/form-data' },
            }
        );
        return response.data;
    },

    async exportPdf(projectId: number): Promise<void> {
        const response = await api.get(`/api/projects/${projectId}/manual/export`, {
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Home_Owner_Manual.pdf');
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
    },
};
