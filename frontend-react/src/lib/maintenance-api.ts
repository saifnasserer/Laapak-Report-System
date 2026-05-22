import api from './api';

export interface MaintenancePartRequest {
    id: number;
    tenant_id: number;
    job_id: number;
    spare_part_id: number;
    quantity: number;
    status: 'pending' | 'fulfilled' | 'rejected';
    cost_at_request: number;
    created_at: string;
    updated_at: string;
    sparePart?: {
        id: number;
        name: string;
        part_number: string;
    };
    job?: {
        id: number;
        device: {
            id: string;
            device_model: string;
            client_name: string;
            order_number: string;
        };
        technician: {
            id: number;
            name: string;
        };
    };
}

export interface MaintenanceJob {
    id: number;
    report_id: string;
    technician_id: number | null;
    status: 'pending' | 'in_progress' | 'completed' | 'qc_verification' | 'cancelled';
    issue_description: string;
    repair_notes: string;
    parts_log: Array<{ part_name: string; cost: number; date: string }> | null;
    total_cost: number;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
    device?: {
        id: string;
        name: string;
        serial_number: string;
        brand: string;
        model: string;
        deviceLocation?: {
            name: string;
            name_ar: string;
        };
    };
    technician?: {
        id: number;
        name: string;
        username: string;
    };
    partRequests?: MaintenancePartRequest[];
}

export interface MaintenanceSummary {
    status_counts: Array<{ status: string; count: number }>;
    total_completed_cost: number;
}

export const maintenanceApi = {
    getJobs: async (filters: { status?: string; technician_id?: number } = {}) => {
        const response = await api.get<MaintenanceJob[]>('/maintenance/jobs', { params: filters });
        return response.data;
    },

    getJobDetails: async (id: number | string) => {
        const response = await api.get<MaintenanceJob>(`/maintenance/jobs/${id}`);
        return response.data;
    },

    createJob: async (data: { report_id: string; technician_id?: number; issue_description: string; cost_estimate?: number }) => {
        const response = await api.post<MaintenanceJob>('/maintenance/jobs', data);
        return response.data;
    },

    updateJob: async (id: number | string, data: Partial<MaintenanceJob>) => {
        const response = await api.put<MaintenanceJob>(`/maintenance/jobs/${id}`, data);
        return response.data;
    },

    completeJob: async (id: number | string) => {
        const response = await api.post<{ message: string; job: MaintenanceJob }>(`/maintenance/jobs/${id}/complete`);
        return response.data;
    },

    approveJob: async (id: number | string, data?: { target_location_id?: number }) => {
        const response = await api.post<{ message: string; job: MaintenanceJob }>(`/maintenance/jobs/${id}/approve`, data);
        return response.data;
    },

    getSummary: async () => {
        const response = await api.get<MaintenanceSummary>('/maintenance/summary');
        return response.data;
    }
};
