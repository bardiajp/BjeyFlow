export type UserRole = 'user' | 'staff' | 'superuser';

export interface User {
    id: string;
    username: string;
    display_name: string;
    role: UserRole;
}

export interface AuthResponse {
    user: User;
}

export type { PanelUser, CreatePanelUser, UpdatePanelUser, ChangePasswordValues } from './user';
