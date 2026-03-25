/**
 * Utilidad centralizada de formateo de fechas con zona horaria del sistema.
 * Todas las fechas se muestran en la zona horaria configurada (por defecto America/Lima).
 */

let _timezone = 'America/Lima'
const LOCALE = 'es-PE'

/** Configura la zona horaria del sistema (llamado al inicio de la app) */
export function setSystemTimezone(tz: string) {
  _timezone = tz
}

/** Retorna la zona horaria del sistema actual */
export function getSystemTimezone(): string {
  return _timezone
}

/** Fecha + hora completa: "25/03/2025, 10:30:45" */
export function formatDateTime(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString(LOCALE, { timeZone: _timezone, ...options })
}

/** Solo fecha: "25/03/2025" */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(LOCALE, { timeZone: _timezone, ...options })
}

/** Solo hora: "10:30:45" */
export function formatTime(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString(LOCALE, { timeZone: _timezone, ...options })
}

/** Fecha corta: "25 mar 2025" */
export function formatDateShort(date: string | Date): string {
  return formatDate(date, { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Fecha + hora media: "25/03/2025 10:30" */
export function formatDateTimeMedium(date: string | Date): string {
  return formatDateTime(date, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/** Fecha + hora completa con estilo medio: "25 mar 2025, 10:30:45 a.m." */
export function formatDateTimeFull(date: string | Date): string {
  return formatDateTime(date, { dateStyle: 'medium', timeStyle: 'medium' })
}

/** Solo hora HH:mm:ss */
export function formatTimeMedium(date: string | Date): string {
  return formatTime(date, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/**
 * Convierte una fecha a un Date "ajustado" que representa el wall-clock time
 * en la zona horaria del sistema. Útil para date-fns format() que siempre
 * formatea en la zona local del navegador.
 */
export function toZonedDate(date: string | Date): Date {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return d
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: _timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(d)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(p => p.type === type)?.value ?? '0'
  const hour = +get('hour') === 24 ? 0 : +get('hour')
  return new Date(+get('year'), +get('month') - 1, +get('day'), hour, +get('minute'), +get('second'))
}
