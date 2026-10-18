import type { User } from './index';

export interface PanelUser extends User {
    first_name: string;
    last_name: string;
    mobile: string;
    is_active: boolean;
    date_joined: string;
}

export type CreatePanelUser = Pick<PanelUser, 'username' | 'display_name' | 'role'> & {
    password: string;
};

export type UpdatePanelUser = Pick<
    PanelUser,
    'username' | 'display_name' | 'first_name' | 'last_name' | 'mobile' | 'role'
>;

export interface ChangePasswordValues {
    current_password: string;
    new_password: string;
}
