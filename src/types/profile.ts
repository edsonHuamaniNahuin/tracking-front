import type { User } from './user';
import type { ApiResponse } from './api';

/**
 * Respuesta genérica estándar de nuestro backend:
 * { status, message, data: User }
 */
export type GenericResponse = ApiResponse<{ user: User }>

/**
 * Payload para actualizar datos personales (PUT /user).
 * Solo incluye los campos permitidos.
 */
export interface UpdateProfileRequest {
    name?: string;
    username?: string;
    email?: string;
    phone?: string;
    bio?: string;
    location?: string;
}

export interface UpdateProfileResponse {
    name?: string;
    username?: string;
    email?: string;
    phone?: string;
    bio?: string;
    location?: string;
}

/**
 * Payload para cambiar contraseña (PUT /user/password).
 */
export interface ChangePasswordRequest {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
}
