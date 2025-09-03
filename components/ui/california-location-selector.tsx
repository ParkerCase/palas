'use client'

import { useState} from 'react'
import { Check, ChevronsUpDown, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { 
  CALIFORNIA_COUNTIES, 
  getCaliforniaCounties, 
  getCitiesByCounty,
  CaliforniaLocation} from '@/lib/data/california-locations'

interface CaliforniaLocationSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  showCountiesOnly?: boolean
  showCitiesOnly?: boolean
  selectedCounty?: string
  onCountyChange?: (countyId: string) => void
}

export function CaliforniaLocationSelector({
  value,
  onValueChange,
  placeholder = "Select a California location...",
  className,
  showCountiesOnly = false,
  showCitiesOnly = false,
  selectedCounty,
  onCountyChange
}: CaliforniaLocationSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const getDisplayValue = () => {
    if (!value) return placeholder
    
    const location = CALIFORNIA_COUNTIES.flatMap(county => [
      { ...county, type: 'county' as const },
      ...county.cities
    ]).find(loc => loc.id === value)
    
    return location ? location.name : placeholder
  }

  const getLocationType = (locationId: string) => {
    const county = CALIFORNIA_COUNTIES.find(c => c.id === locationId)
    if (county) return 'county'
    
    const city = CALIFORNIA_COUNTIES.flatMap(c => c.cities).find(c => c.id === locationId)
    return city ? 'city' : null
  }

  const renderLocationItem = (location: CaliforniaLocation) => {
    const isSelected = value === location.id
    const isCounty = location.type === 'county'
    
    return (
      <CommandItem
        key={location.id}
        value={location.id}
        onSelect={() => {
          onValueChange(location.id)
          if (isCounty && onCountyChange) {
            onCountyChange(location.id)
          }
          setOpen(false)
        }}
        className="flex items-center gap-2"
      >
        <Check
          className={cn(
            "mr-2 h-4 w-4",
            isSelected ? "opacity-100" : "opacity-0"
          )}
        />
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1">{location.name}</span>
        <Badge variant={isCounty ? "default" : "secondary"} className="text-xs">
          {isCounty ? "County" : "City"}
        </Badge>
        {location.population && (
          <span className="text-xs text-muted-foreground">
            {location.population.toLocaleString()}
          </span>
        )}
      </CommandItem>
    )
  }

  const getFilteredLocations = () => {
    if (showCountiesOnly) {
      return getCaliforniaCounties()
    }
    
    if (showCitiesOnly && selectedCounty) {
      return getCitiesByCounty(selectedCounty)
    }
    
    if (showCitiesOnly) {
      return CALIFORNIA_COUNTIES.flatMap(county => county.cities)
    }
    
    // Return all locations (counties + cities)
    return CALIFORNIA_COUNTIES.flatMap(county => [
      { ...county, type: 'county' as const },
      ...county.cities
    ])
  }

  const locations = getFilteredLocations()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {getDisplayValue()}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search California locations..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No California location found.</CommandEmpty>
            <CommandGroup heading="California Locations">
              {locations
                .filter(location => 
                  location.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(renderLocationItem)}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// County-only selector
export function CaliforniaCountySelector({
  value,
  onValueChange,
  placeholder = "Select a California county...",
  className
}: Omit<CaliforniaLocationSelectorProps, 'showCountiesOnly' | 'showCitiesOnly' | 'selectedCounty' | 'onCountyChange'>) {
  return (
    <CaliforniaLocationSelector
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      className={className}
      showCountiesOnly={true}
    />
  )
}

// City-only selector (requires county selection)
export function CaliforniaCitySelector({
  value,
  onValueChange,
  selectedCounty,
  placeholder = "Select a city...",
  className
}: Omit<CaliforniaLocationSelectorProps, 'showCountiesOnly' | 'showCitiesOnly'> & {
  selectedCounty: string
}) {
  return (
    <CaliforniaLocationSelector
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      className={className}
      showCitiesOnly={true}
      selectedCounty={selectedCounty}
    />
  )
}
