export interface ApiUser {
    id: string;
    email: string;
    balance: number;
    created_at: string;
    updated_at: string;
    first_name?: string;
    last_name?: string;
    dob?: string;
    phone_number?: string;
    is_active?: boolean;
    is_verified?: boolean;
    is_email_verified?: boolean;
    last_login?: string;
    role?: string;
    is_2fa_enabled?: boolean;
    profile_image_url?: string;
}

export interface UserApiResponse {
    message: string;
    user?: ApiUser;
    balanceUpdated?: boolean;
    data?: ApiUser; // For backward compatibility
    error?: string;
}