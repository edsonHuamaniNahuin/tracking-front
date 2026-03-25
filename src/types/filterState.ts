export interface DateRange {
  from: string
  to: string
}
export interface FilterState {
  vesselId: number | null
  dateRange: DateRange
}
export interface FilterChangeHandler {

  onFilterChange: (newFilters: FilterState) => void
}