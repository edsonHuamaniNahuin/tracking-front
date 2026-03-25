export interface TrackingVesselType {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface TrackingVesselStatus {
  id: number;
  name: string;
}

export interface TrackingVesselUser {
  id: number;
  name: string;
  email: string;
  username: string;
  photo_url: string | null;
  notifications_count: number;
  newsletter_subscribed: boolean;
  email_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  public_profile: boolean;
  show_online_status: boolean;
  phone: string;
  bio: string;
  location: string;
  email_verified_at: string | null;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
  photoUrl: string | null;
  avatar: string;
}

export interface TrackingVessel {
  id: number;
  user_id: number;
  name: string;
  imo: string;
  created_at: string;
  updated_at: string;
  vessel_type: TrackingVesselType;
  vessel_status: TrackingVesselStatus;
  user: TrackingVesselUser;
}

export interface Tracking {
  id: number;
  vessel_id: number;
  latitude: string;
  longitude: string;
  tracked_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  vessel: TrackingVessel;
}

export interface CreateTrackingRequest {
  vessel_id: number
  latitude: number
  longitude: number
}

