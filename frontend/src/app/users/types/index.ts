export type UserRole = 'user' | 'staff' | 'superuser';

export interface User {
    id: string;
    username: string;
    display_name: string;
    role: UserRole;
    email: string;
    first_name: string;
    last_name: string;
    flow_name: string;
    focus_style: 'morning_tide' | 'night_current' | 'steady_tide';
    north_star: string;
}

export interface AuthResponse {
    user: User;
}

export type { PanelUser, CreatePanelUser, UpdatePanelUser, ChangePasswordValues } from './user';
