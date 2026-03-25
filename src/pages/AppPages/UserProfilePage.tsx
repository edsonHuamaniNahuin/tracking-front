// src/pages/UserProfilePage.tsx
import { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  Camera,
  User as UserIcon,
  Mail as MailIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  Loader2Icon, // <--- Icono para animar el “loading”
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

import type { User } from '@/types/user';
import type {
  UpdateProfileRequest,
  ChangePasswordRequest,
  GenericResponse,
  UpdateProfileResponse,
} from '@/types/profile';
import { profileService } from '@/services/profile.service';

export default function UserProfilePage() {
  // ----------------------------
  // Estados generales
  // ----------------------------
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Control para “editar información personal”
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Formulario de datos personales
  const [formProfile, setFormProfile] = useState<UpdateProfileRequest>({
    name: '',
    username: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
  });

  // Estados de envío / alerta para “Actualizar perfil”
  const [profileUpdating, setProfileUpdating] = useState<boolean>(false);
  const [profileStatus, setProfileStatus] = useState<
    { type: 'success' | 'error'; message: string } | null
  >(null);

  // Formulario de cambiar contraseña
  const [passwordForm, setPasswordForm] = useState<ChangePasswordRequest>({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  // Estados de envío / alerta para “Cambiar contraseña”
  const [passwordUpdating, setPasswordUpdating] = useState<boolean>(false);
  const [passwordStatus, setPasswordStatus] = useState<
    { type: 'success' | 'error'; message: string } | null
  >(null);


  const didFetch = useRef(false)
  // ----------------------------
  // Carga inicial del usuario
  // ----------------------------
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    const fetchUser = async () => {
      try {
        const resp: GenericResponse = await profileService.show();
        setUser(resp.data.user);
        setFormProfile({
          name: resp.data.user.name,
          username: resp.data.user.username,
          email: resp.data.user.email,
          phone: resp.data.user.phone ?? '',
          bio: resp.data.user.bio ?? '',
          location: resp.data.user.location ?? '',
        });
      } catch (e: any) {
        console.error(e);
        // Si falla la petición inicial, mostramos un Alert en pantalla:
        setError('No se pudo cargar el perfil. Intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // ----------------------------
  // Estado “loading” global
  // ----------------------------
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Loader2Icon className="h-8 w-8 animate-spin text-gray-500" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // ----------------------------
  // Estado “error” global
  // ----------------------------
  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center h-full px-4">
        <Alert variant="destructive">
          <AlertCircleIcon className="h-5 w-5" />
          <AlertTitle>Error al cargar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center h-full px-4">
        <Alert variant="destructive">
          <AlertCircleIcon className="h-5 w-5" />
          <AlertTitle>Usuario no encontrado</AlertTitle>
          <AlertDescription>
            No se recibió información de usuario. Intenta recargar la página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ----------------------------
  // Handlers de formulario
  // ----------------------------
  const handleChangeProfileField = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormProfile((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const submitProfileUpdate = async () => {
    setProfileUpdating(true);
    setProfileStatus(null);
    try {
      const payload: UpdateProfileRequest = {
        name: formProfile.name,
        username: formProfile.username,
        email: formProfile.email,
        phone: formProfile.phone,
        bio: formProfile.bio,
        location: formProfile.location,
      };
      const response = await profileService.updateProfile(payload);
      const userResponse = response.data.user as UpdateProfileResponse;

      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          name: userResponse.name ?? prev.name,
          username: userResponse.username ?? prev.username,
          email: userResponse.email ?? prev.email,
          phone: userResponse.phone ?? prev.phone,
          bio: userResponse.bio ?? prev.bio,
          location: userResponse.location ?? prev.location,
        };
      });

      setIsEditing(false);
      setProfileStatus({ type: 'success', message: 'Perfil actualizado correctamente' });
    } catch (e: any) {
      console.error(e);
      setProfileStatus({
        type: 'error',
        message: e.response?.data?.message || 'Error actualizando perfil',
      });
    } finally {
      setProfileUpdating(false);
    }
  };

  // Cambiar contraseña
  const handlePasswordField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const submitChangePassword = async () => {
    // Validación mínima
    if (
      !passwordForm.current_password ||
      !passwordForm.new_password ||
      !passwordForm.new_password_confirmation
    ) {
      setPasswordStatus({ type: 'error', message: 'Faltan campos en el formulario' });
      return;
    }
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setPasswordStatus({ type: 'error', message: 'La confirmación no coincide con la nueva contraseña.' });
      return;
    }

    setPasswordUpdating(true);
    setPasswordStatus(null);
    try {
      const payload: ChangePasswordRequest = {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        new_password_confirmation: passwordForm.new_password_confirmation,
      };
      const resp = await profileService.changePassword(payload);
      setPasswordStatus({ type: 'success', message: resp.message });
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (e: any) {
      console.error(e);
      setPasswordStatus({
        type: 'error',
        message: e.response?.data?.message || 'Error al cambiar contraseña',
      });
    } finally {
      setPasswordUpdating(false);
    }
  };

  // Toggle: Notificaciones por Email
  const handleToggleEmailNotifications = async (checked: boolean) => {
    try {
      let resp: GenericResponse;
      if (checked) {
        resp = await profileService.enableEmailNotifications();
      } else {
        resp = await profileService.disableEmailNotifications();
      }
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          email_notifications_enabled: resp.data.user.email_notifications_enabled,
        };
      });
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Error actualizando Notificaciones por Email');
    }
  };

  // Toggle: Notificaciones Push
  const handleTogglePushNotifications = async (checked: boolean) => {
    try {
      let resp: GenericResponse;
      if (checked) {
        resp = await profileService.enablePushNotifications();
      } else {
        resp = await profileService.disablePushNotifications();
      }
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          push_notifications_enabled: resp.data.user.push_notifications_enabled,
        };
      });
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Error actualizando Notificaciones Push');
    }
  };

  // Toggle: Newsletter
  const handleToggleNewsletter = async (checked: boolean) => {
    try {
      let resp: GenericResponse;
      if (checked) {
        resp = await profileService.enableNewsletter();
      } else {
        resp = await profileService.disableNewsletter();
      }
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          newsletter_subscribed: resp.data.user.newsletter_subscribed,
        };
      });
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Error actualizando Newsletter');
    }
  };

  // Toggle: Two Factor Authentication
  const handleToggle2FA = async (checked: boolean) => {
    try {
      let resp: GenericResponse;
      if (checked) {
        resp = await profileService.enableTwoFactor();
      } else {
        resp = await profileService.disableTwoFactor();
      }
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          two_factor_enabled: resp.data.user.two_factor_enabled,
        };
      });
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Error actualizando 2FA');
    }
  };

  // Toggle: Perfil público
  const handleTogglePublicProfile = async (checked: boolean) => {
    try {
      let resp: GenericResponse;
      if (checked) {
        resp = await profileService.enablePublicProfile();
      } else {
        resp = await profileService.disablePublicProfile();
      }
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          public_profile: resp.data.user.public_profile,
        };
      });
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Error actualizando perfil público');
    }
  };

  // Toggle: Mostrar/Ocultar estado online
  const handleToggleOnlineStatus = async (checked: boolean) => {
    try {
      let resp: GenericResponse;
      if (checked) {
        resp = await profileService.showOnlineStatus();
      } else {
        resp = await profileService.hideOnlineStatus();
      }
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          show_online_status: resp.data.user.show_online_status,
        };
      });
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Error actualizando estado online');
    }
  };

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="container mx-auto py-6 space-y-6">
            {/* Header del perfil */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
                <p className="text-muted-foreground">
                  Gestiona tu información personal y configuraciones de cuenta
                </p>
              </div>
              <Button
                variant={isEditing ? 'outline' : 'default'}
                onClick={() => setIsEditing((prev) => !prev)}
              >
                {isEditing ? 'Cancelar' : 'Editar Perfil'}
              </Button>
            </div>

            {/* Información principal del usuario */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>
                        {user.name
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold">{user.name}</h2>
                    <p className="text-muted-foreground">{user.email}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Usuario Premium</Badge>
                      <Badge variant="outline">Verificado</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Tabs de contenido */}
            <Tabs defaultValue="personal" className="space-y-4">
              <TabsList>
                <TabsTrigger value="personal">Información Personal</TabsTrigger>
                <TabsTrigger value="security">Seguridad</TabsTrigger>
                <TabsTrigger value="preferences">Preferencias</TabsTrigger>
                <TabsTrigger value="activity">Actividad</TabsTrigger>
              </TabsList>

              {/* Tab de Información Personal */}
              <TabsContent value="personal" className="space-y-4">
                {/* Alert de éxito / error al actualizar perfil */}
                {profileStatus && (
                  <Alert
                    variant={profileStatus.type === 'success' ? 'success' : 'destructive'}
                  >
                    {profileStatus.type === 'success' ? (
                      <CheckCircle2Icon className="h-5 w-5" />
                    ) : (
                      <AlertCircleIcon className="h-5 w-5" />
                    )}
                    <AlertTitle>
                      {profileStatus.type === 'success' ? 'Éxito' : 'Error'}
                    </AlertTitle>
                    <AlertDescription>{profileStatus.message}</AlertDescription>
                  </Alert>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Información Personal</CardTitle>
                    <CardDescription>
                      Actualiza tu información personal y de contacto
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                          id="name"
                          value={formProfile.name}
                          onChange={handleChangeProfileField}
                          disabled={!isEditing || profileUpdating}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Usuario</Label>
                        <Input
                          id="username"
                          value={formProfile.username}
                          onChange={handleChangeProfileField}
                          disabled={!isEditing || profileUpdating}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formProfile.email}
                          onChange={handleChangeProfileField}
                          disabled={!isEditing || profileUpdating}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                          id="phone"
                          value={formProfile.phone}
                          onChange={handleChangeProfileField}
                          disabled={!isEditing || profileUpdating}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Biografía</Label>
                      <Textarea
                        id="bio"
                        placeholder="Cuéntanos sobre ti..."
                        value={formProfile.bio}
                        onChange={handleChangeProfileField}
                        disabled={!isEditing || profileUpdating}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Ubicación</Label>
                      <Input
                        id="location"
                        value={formProfile.location}
                        onChange={handleChangeProfileField}
                        disabled={!isEditing || profileUpdating}
                      />
                    </div>

                    {isEditing && (
                      <div className="flex justify-end espacio-y-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setFormProfile({
                              name: user.name,
                              username: user.username,
                              email: user.email,
                              phone: user.phone ?? '',
                              bio: user.bio ?? '',
                              location: user.location ?? '',
                            });
                            setIsEditing(false);
                          }}
                          disabled={profileUpdating}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={submitProfileUpdate}
                          disabled={profileUpdating}
                        >
                          {profileUpdating ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab de Seguridad */}
              <TabsContent value="security" className="space-y-4">
                {/* Alert de éxito / error al cambiar contraseña */}
                {passwordStatus && (
                  <Alert
                    variant={passwordStatus.type === 'success' ? 'success' : 'destructive'}
                  >
                    {passwordStatus.type === 'success' ? (
                      <CheckCircle2Icon className="h-5 w-5" />
                    ) : (
                      <AlertCircleIcon className="h-5 w-5" />
                    )}
                    <AlertTitle>
                      {passwordStatus.type === 'success' ? 'Éxito' : 'Error'}
                    </AlertTitle>
                    <AlertDescription>{passwordStatus.message}</AlertDescription>
                  </Alert>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Seguridad de la Cuenta</CardTitle>
                    <CardDescription>
                      Gestiona la seguridad de tu cuenta y contraseña
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">Contraseña Actual</Label>
                      <Input
                        id="current_password"
                        type="password"
                        value={passwordForm.current_password}
                        onChange={handlePasswordField}
                        disabled={passwordUpdating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new_password">Nueva Contraseña</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={passwordForm.new_password}
                        onChange={handlePasswordField}
                        disabled={passwordUpdating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new_password_confirmation">
                        Confirmar Nueva Contraseña
                      </Label>
                      <Input
                        id="new_password_confirmation"
                        type="password"
                        value={passwordForm.new_password_confirmation}
                        onChange={handlePasswordField}
                        disabled={passwordUpdating}
                      />
                    </div>
                    <Button onClick={submitChangePassword} disabled={passwordUpdating}>
                      {passwordUpdating ? 'Cambiando...' : 'Cambiar Contraseña'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Autenticación de Dos Factores</CardTitle>
                    <CardDescription>
                      Añade una capa extra de seguridad a tu cuenta
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Autenticación de Dos Factores</Label>
                        <p className="text-sm text-muted-foreground">
                          Protege tu cuenta con 2FA
                        </p>
                      </div>
                      <Switch
                        checked={user.two_factor_enabled}
                        onCheckedChange={handleToggle2FA}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab de Preferencias */}
              <TabsContent value="preferences" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Preferencias de Notificaciones</CardTitle>
                    <CardDescription>
                      Configura cómo y cuándo quieres recibir notificaciones
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Notificaciones por Email</Label>
                        <p className="text-sm text-muted-foreground">
                          Recibe actualizaciones por correo electrónico
                        </p>
                      </div>
                      <Switch
                        checked={user.email_notifications_enabled}
                        onCheckedChange={(checked) =>
                          handleToggleEmailNotifications(checked)
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Notificaciones Push</Label>
                        <p className="text-sm text-muted-foreground">
                          Recibe notificaciones en tiempo real
                        </p>
                      </div>
                      <Switch
                        checked={user.push_notifications_enabled}
                        onCheckedChange={(checked) =>
                          handleTogglePushNotifications(checked)
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Newsletter</Label>
                        <p className="text-sm text-muted-foreground">
                          Recibe nuestro boletín semanal
                        </p>
                      </div>
                      <Switch
                        checked={user.newsletter_subscribed}
                        onCheckedChange={(checked) => handleToggleNewsletter(checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Preferencias de Privacidad</CardTitle>
                    <CardDescription>
                      Controla la visibilidad de tu información
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Perfil Público</Label>
                        <p className="text-sm text-muted-foreground">
                          Permite que otros usuarios vean tu perfil
                        </p>
                      </div>
                      <Switch
                        checked={user.public_profile}
                        onCheckedChange={(checked) =>
                          handleTogglePublicProfile(checked)
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Mostrar Estado Online</Label>
                        <p className="text-sm text-muted-foreground">
                          Muestra cuando estás conectado
                        </p>
                      </div>
                      <Switch
                        checked={user.show_online_status}
                        onCheckedChange={(checked) =>
                          handleToggleOnlineStatus(checked)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab de Actividad */}
              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                    <CardDescription>
                      Tu actividad más reciente en la plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <UserIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">Perfil actualizado</p>
                          <p className="text-xs text-muted-foreground">
                            Hace 2 horas
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                          <MailIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">Email verificado</p>
                          <p className="text-xs text-muted-foreground">
                            Hace 1 día
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                          <CalendarDays className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">Cuenta creada</p>
                          <p className="text-xs text-muted-foreground">
                            Hace 30 días
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Estadísticas</CardTitle>
                    <CardDescription>
                      Resumen de tu actividad en la plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center space-y-2">
                        <p className="text-2xl font-bold">127</p>
                        <p className="text-sm text-muted-foreground">Días activo</p>
                      </div>
                      <div className="text-center espacio-y-2">
                        <p className="text-2xl font-bold">45</p>
                        <p className="text-sm text-muted-foreground">Proyectos</p>
                      </div>
                      <div className="text-center espacio-y-2">
                        <p className="text-2xl font-bold">892</p>
                        <p className="text-sm text-muted-foreground">Acciones</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
