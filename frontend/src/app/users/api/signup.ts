import { axiosInstance } from '@/lib/api';
import type { SignupFormValues } from '../schema';
import type { AuthResponse } from '../types';

export interface SignupChallenge {
    challenge_id: string;
    email: string;
    expires_at: string;
    resend_available_at: string;
    delivery: 'email' | 'development_console';
}

export async function startSignup(body: SignupFormValues) {
    const { data } = await axiosInstance.post<SignupChallenge>('users/auth/signup/', body);
    return data;
}

export async function resendSignupCode(challengeId: string) {
    const { data } = await axiosInstance.post<SignupChallenge>('users/auth/signup/resend/', {
        challenge_id: challengeId,
    });
    return data;
}

export async function verifySignupCode(body: { challenge_id: string; code: string }) {
    const { data } = await axiosInstance.post<AuthResponse>('users/auth/signup/verify/', body);
    return data;
}
