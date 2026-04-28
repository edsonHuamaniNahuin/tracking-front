export interface VesselType {
  id: number;
  name: string;
  slug: string;
  /** 'maritime' | 'terrestrial' */
  category: 'maritime' | 'terrestrial';
  created_at: string
  updated_at: string
}
