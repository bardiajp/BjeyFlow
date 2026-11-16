import type { User } from './index';

export interface PanelUser extends Pick<
    User,
    'id' | 'username' | 'display_name' | 'role' | 'email'
> {
    first_name: string;
    last_name: string;
    mobile: string;
    is_active: boolean;
    date_joined: string;
    last_login: string | null;
    level: number;
}

export type CreatePanelUser = Pick<PanelUser, 'username' | 'display_name' | 'role' | 'email'> & {
    password: string;
};

export type UpdatePanelUser = Pick<
    PanelUser,
    'username' | 'display_name' | 'first_name' | 'last_name' | 'mobile' | 'role' | 'email'
>;

export interface ChangePasswordValues {
    current_password: string;
    new_password: string;
}
