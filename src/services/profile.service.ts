import api from './api';
import type {
    GenericResponse,
    UpdateProfileRequest,
    ChangePasswordRequest,
} from '@/types/profile';

export const profileService = {

    /**
     * PUT /user — Muestra datos del perfil
     */
    show: async (): Promise<GenericResponse> => {
        const resp = await api.get<GenericResponse>('/user');
        return resp.data;
    },


    /**
     * PUT /user — actualiza datos del perfil
     */
    updateProfile: async (data: UpdateProfileRequest): Promise<GenericResponse> => {
        const resp = await api.put<GenericResponse>('/user', data);
        return resp.data;
    },

    /**
     * PUT /user/password — cambia contraseña
     * backend devuelve status, message y data: User
     */
    changePassword: async (
        data: ChangePasswordRequest
    ): Promise<GenericResponse> => {
        const resp = await api.put<GenericResponse>('/user/password', data);
        return resp.data;
    },


    /**
   * POST /user/email-notifications/enable — habilita notificaciones por email
   */
    enableEmailNotifications: async (): Promise<GenericResponse> => {
        const resp = await api.post<GenericResponse>(
            '/user/notifications/email/enable'
        );
        return resp.data;
    },

    /**
     * POST /user/email-notifications/disable — deshabilita notificaciones por email
     */
    disableEmailNotifications: async (): Promise<GenericResponse> => {
        const resp = await api.post<GenericResponse>(
            '/user/notifications/email/disable'
        );
        return resp.data;
    },

    /**
     * POST /user/push-notifications/enable — habilita notificaciones push
     */
    enablePushNotifications: async (): Promise<GenericResponse> => {
        const resp = await api.post<GenericResponse>(
            '/user/notifications/push/enable'
        );
        return resp.data;
    },

    /**
     * POST /user/push-notifications/disable — deshabilita notificaciones push
     */
    disablePushNotifications: async (): Promise<GenericResponse> => {
        const resp = await api.post<GenericResponse>(
            '/user/notifications/push/disable'
        );
        return resp.data;
    },

    /**
     * POST /user/newsletter/enable — habilita newsletter
     */
    enableNewsletter: async (): Promise<GenericResponse> => {
        const resp = await api.post<GenericResponse>('/user/newsletter/enable');
        return resp.data;
    },

    /**
     * POST /user/newsletter/disable — deshabilita newsletter
     */
    disableNewsletter: async (): Promise<GenericResponse> => {
        const resp = await api.post<GenericResponse>('/user/newsletter/disable');
        return resp.data;
    },

    /**
     * POST /user/2fa/enable — habilita 2FA
     */
    enableTwoFactor: async (): Promise<GenericResponse> => {
        const resp = await api.post<GenericResponse>('/user/2fa/enable');
        return resp.data;
    },

    /**
     * POST /user/2fa/disable — deshabilita 2FA
     */
    disableTwoFactor: async (): Promise<GenericResponse> => {
        const resp = await api.post<GenericResponse>('/user/2fa/disable');
        return resp.data;
    },

    /**
     * POST /user/profile/public — habilita perfil público
     */
    enablePublicProfile: async (): Promise<GenericResponse> => {
        const resp = await api.post<GenericResponse>('/user/profile/public');
        return resp.data;
    },

    /**
     * POST /user/profile/private — deshabilita perfil público
     */
    disablePublicProfile: async (): Promise<GenericResponse> => {
        const resp = await api.post<GenericResponse>('/user/profile/private');
        return resp.data;
    },

    /**
     * POST /user/online-status/show — muestra estado online
     */
    showOnlineStatus: async (): Promise<GenericResponse> => {
        const resp = await api.post<GenericResponse>('/user/online-status/show');
        return resp.data;
    },

    /**
     * POST /user/online-status/hide — oculta estado online
     */
    hideOnlineStatus: async (): Promise<GenericResponse> => {
        const resp = await api.post<GenericResponse>('/user/online-status/hide');
        return resp.data;
    },
};
