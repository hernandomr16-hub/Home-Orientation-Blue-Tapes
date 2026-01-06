// API Types matching backend schemas

// Enums
export type UserRole = 'admin' | 'project_manager' | 'viewer';
export type ProjectStatus = 'active' | 'delivered' | 'archived';
export type IssuePriority = 'low' | 'medium' | 'high';
export type IssueStatus = 'open' | 'assigned' | 'in_progress' | 'ready_for_reinspect' | 'closed';
export type PhotoType = 'before' | 'after';

// User
export interface User {
    id: number;
    email: string;
    name: string;
    phone?: string;
    role: UserRole;
    is_active: number;
    created_at?: string;
}

export interface UserCreate {
    email: string;
    name: string;
    phone?: string;
    password: string;
    role?: UserRole;
}

export interface Token {
    access_token: string;
    token_type: string;
    user: User;
}

// Project
export interface Project {
    id: number;
    name: string;
    address: string;
    unit?: string;
    status: ProjectStatus;
    close_date?: string;
    notes?: string;
    owner_id?: number;
    created_at?: string;
    updated_at?: string;
}

export interface ProjectCreate {
    name: string;
    address: string;
    unit?: string;
    status?: ProjectStatus;
    close_date?: string;
    notes?: string;
}

export interface ProjectDashboard {
    project: Project;
    total_issues: number;
    open_issues: number;
    assigned_issues: number;
    in_progress_issues: number;
    ready_for_reinspect: number;
    closed_issues: number;
    high_priority_open: number;
}

// Area
export interface Area {
    id: number;
    project_id: number;
    name: string;
    order: number;
    is_custom: number;
    created_at?: string;
}

export interface AreaCreate {
    name: string;
    order?: number;
}

// Contractor
export interface Contractor {
    id: number;
    company: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    trades: string[];
    notes?: string;
    is_active: number;
    created_at?: string;
    updated_at?: string;
}

export interface ContractorCreate {
    company: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    trades?: string[];
    notes?: string;
}

export interface ProjectContractor {
    id: number;
    project_id: number;
    contractor_id: number;
    contractor: Contractor;
    trades: string[];
    notes?: string;
    created_at?: string;
}

export interface ProjectContractorCreate {
    contractor_id: number;
    trades?: string[];
    notes?: string;
}

// Issue
export interface IssuePhoto {
    id: number;
    issue_id: number;
    url: string;
    filename?: string;
    photo_type: PhotoType;
    created_at?: string;
}

export interface Issue {
    id: number;
    project_id: number;
    area_id: number;
    category: string;
    subcategory?: string;
    description?: string;
    priority: IssuePriority;
    status: IssueStatus;
    trade?: string;
    contractor_id?: number;
    due_date?: string;
    created_by?: number;
    created_at?: string;
    closed_by?: number;
    closed_at?: string;
    updated_at?: string;
    notification_sent_at?: string;
    photos: IssuePhoto[];
    area_name?: string;
    contractor_name?: string;
    creator_name?: string;
}

export interface IssueCreate {
    area_id: number;
    category: string;
    subcategory?: string;
    description?: string;
    priority?: IssuePriority;
    trade?: string;
    contractor_id?: number;
    due_date?: string;
}

export interface IssueUpdate {
    area_id?: number;
    category?: string;
    subcategory?: string;
    description?: string;
    priority?: IssuePriority;
    trade?: string;
    contractor_id?: number;
    due_date?: string;
}

export interface IssueStatusUpdate {
    status: IssueStatus;
    notes?: string;
}

// Manual
export interface ManualInstance {
    id: number;
    project_id: number;
    template_id?: number;
    fields: Record<string, any>;
    attachments: ManualAttachment[];
    created_at?: string;
    updated_at?: string;
}

export interface ManualAttachment {
    section: string;
    name: string;
    url: string;
    type: string;
}

// List responses
export interface ListResponse<T> {
    items: T[];
    total: number;
}
