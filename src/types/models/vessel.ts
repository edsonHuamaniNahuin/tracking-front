import { VesselStatus } from "./vesselStatus";
import { VesselType } from "./vesselType";


export interface Vessel {
  id: number;
  name: string;
  user_id: number;
  vessel_type: VesselType;
  vessel_status: VesselStatus;
  imo?: string;
  /** Oculto en listados generales; visible solo en /device/token */
  device_token?: string;
  /** Comando pendiente para el microcontrolador ('reboot' | null) */
  pending_command?: string | null;
  created_at: string
  updated_at: string
  deleted_at: string | null
}








