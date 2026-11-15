import { axiosInstance } from '@/lib/api';
import type { Pagination } from '@/lib/type';

export interface PublicSettings {
    app_name: string;
    support_email: string;
    signup_enabled: boolean;
    announcement: string;
    maintenance_notice: string;
}

export interface SiteSettings extends PublicSettings {
    trash_retention_days: number;
    updated_at: string;
}

export interface Overview {
    counts: Record<
        | 'users'
        | 'active_accounts'
        | 'signed_in_last_week'
        | 'projects'
        | 'tasks'
        | 'completed_tasks'
        | 'trashed_tasks'
        | 'failed_logins_last_week'
        | 'email_failures_last_week'
        | 'errors_last_week',
        number
    >;
    registrations: { day: string; count: number }[];
    task_statuses: { status: string; count: number }[];
}

export interface ServiceStatus {
    database: string;
    cache: string;
    email: string;
    disk: { total_bytes: number; used_bytes: number; free_bytes: number };
    last_backup: { created_at: string; size_bytes: number } | null;
}

export interface AdminEvent {
    id: number;
    created_at: string;
    actor_name?: string;
    action?: string;
    target?: string;
    ip_address?: string | null;
    metadata?: Record<string, unknown>;
    recipient?: string;
    kind?: string;
    status?: string;
    backend?: string;
    source?: string;
    error_type?: string;
}

export async function getPublicSettings() {
    return (await axiosInstance.get<PublicSettings>('api/admin/public-settings/')).data;
}

export async function getOverview() {
    return (await axiosInstance.get<Overview>('api/admin/overview/')).data;
}

export async function getServiceStatus() {
    return (await axiosInstance.get<ServiceStatus>('api/admin/health/')).data;
}

export async function getSiteSettings() {
    return (await axiosInstance.get<SiteSettings>('api/admin/settings/')).data;
}

export async function saveSiteSettings(body: Omit<SiteSettings, 'updated_at'>) {
    return (await axiosInstance.patch<SiteSettings>('api/admin/settings/', body)).data;
}

export async function getAdminEvents(
    kind: 'activity' | 'emails' | 'errors',
    page: number,
    search: string
) {
    return (
        await axiosInstance.get<Pagination<AdminEvent[]>>(`api/admin/${kind}/`, {
            params: { page, search },
        })
    ).data;
}

export async function sendResetLink(id: string) {
    return (await axiosInstance.post<{ detail: string }>(`users/${id}/send-reset-link/`)).data;
}

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    description: string;
    html: string;
    text: string;
}

export async function getEmailTemplates() {
    return (await axiosInstance.get<EmailTemplate[]>('api/admin/email-templates/')).data;
}
