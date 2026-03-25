export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  photoUrl: string | null;
  avatar: string;
  notifications_count: number;
  newsletter_subscribed: boolean;
  public_profile: boolean;
  show_online_status: boolean;
  phone: string | null;
  bio: string | null;
  location: string | null;
  two_factor_enabled: boolean;
  email_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}