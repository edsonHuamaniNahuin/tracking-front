import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { COUNTRIES, type Country } from "@/constants/countries"

interface CountrySelectorProps {
  value: string
  onChange: (country: Country) => void
  disabled?: boolean
}

export function CountrySelector({ value, onChange, disabled }: CountrySelectorProps) {
  const [open, setOpen] = React.useState(false)
  const selected = COUNTRIES.find(c => c.code === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-[200px] justify-between font-normal"
        >
          {selected ? (
            <span className="truncate">
              {selected.name} <span className="text-muted-foreground">({selected.callingCode})</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Seleccionar país...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar país..." />
          <CommandList>
            <CommandEmpty>No se encontró el país.</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.code}
                  keywords={[country.name, country.callingCode]}
                  onSelect={() => {
                    onChange(country)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1 truncate">{country.name}</span>
                  <span className="text-muted-foreground tabular-nums">{country.callingCode}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
