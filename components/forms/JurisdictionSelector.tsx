'use client'

import { useState} from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MapPin, 
  Search, 
  ChevronDown, 
  ChevronRight,
  X,
  Building,
  Flag,
  Star
} from 'lucide-react'
import { 
  CALIFORNIA_COUNTIES,
  CaliforniaCounty
} from '@/lib/data/california-locations'

interface Jurisdiction {
  type: 'federal' | 'state' | 'county' | 'city'
  name: string
  code?: string
  parent?: string
  locationId?: string
}

interface JurisdictionSelectorProps {
  selectedJurisdictions: Jurisdiction[]
  onJurisdictionsChange: (jurisdictions: Jurisdiction[]) => void
  maxSelections?: number
  showFederal?: boolean
  showState?: boolean
  showCounties?: boolean
  showCities?: boolean
}

export default function JurisdictionSelector({
  selectedJurisdictions,
  onJurisdictionsChange,
  maxSelections = 50,
  showFederal = true,
  showState = true,
  showCounties = true,
  showCities = true
}: JurisdictionSelectorProps) {
  const [expandedCounties, setExpandedCounties] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [countySearchQuery, setCountySearchQuery] = useState('')

  const toggleCountyExpansion = (countyId: string) => {
    const newExpanded = new Set(expandedCounties)
    if (newExpanded.has(countyId)) {
      newExpanded.delete(countyId)
    } else {
      newExpanded.add(countyId)
    }
    setExpandedCounties(newExpanded)
  }

  const isJurisdictionSelected = (jurisdiction: Jurisdiction) => {
    return selectedJurisdictions.some(j => 
      j.type === jurisdiction.type && 
      j.name === jurisdiction.name &&
      j.code === jurisdiction.code &&
      j.locationId === jurisdiction.locationId
    )
  }

  const toggleJurisdiction = (jurisdiction: Jurisdiction) => {
    const isSelected = isJurisdictionSelected(jurisdiction)
    
    if (isSelected) {
      onJurisdictionsChange(selectedJurisdictions.filter(j => 
        !(j.type === jurisdiction.type && 
          j.name === jurisdiction.name &&
          j.code === jurisdiction.code &&
          j.locationId === jurisdiction.locationId)
      ))
    } else {
      if (selectedJurisdictions.length >= maxSelections) {
        return
      }
      onJurisdictionsChange([...selectedJurisdictions, jurisdiction])
    }
  }

  const removeJurisdiction = (jurisdiction: Jurisdiction) => {
    onJurisdictionsChange(selectedJurisdictions.filter(j => 
      !(j.type === jurisdiction.type && 
        j.name === jurisdiction.name &&
        j.code === jurisdiction.code &&
        j.locationId === jurisdiction.locationId)
    ))
  }

  const clearAll = () => {
    onJurisdictionsChange([])
  }

  const getFilteredCounties = () => {
    if (!countySearchQuery) return CALIFORNIA_COUNTIES
    
    return CALIFORNIA_COUNTIES.filter(county =>
      county.name.toLowerCase().includes(countySearchQuery.toLowerCase()) ||
      county.cities.some(city => 
        city.name.toLowerCase().includes(countySearchQuery.toLowerCase())
      )
    )
  }

  const getFilteredCities = (county: CaliforniaCounty) => {
    if (!countySearchQuery) return county.cities
    
    return county.cities.filter(city =>
      city.name.toLowerCase().includes(countySearchQuery.toLowerCase())
    )
  }

  const filteredCounties = getFilteredCounties()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            California Jurisdictions
          </h3>
          <p className="text-sm text-muted-foreground">
            Select the California counties and cities where you want to bid on government contracts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {selectedJurisdictions.length}/{maxSelections}
          </Badge>
          {selectedJurisdictions.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Selected Jurisdictions */}
      {selectedJurisdictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Jurisdictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedJurisdictions.map((jurisdiction, index) => (
                <Badge
                  key={`${jurisdiction.type}-${jurisdiction.name}-${index}`}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {jurisdiction.type === 'federal' && <Flag className="h-3 w-3" />}
                  {jurisdiction.type === 'state' && <Building className="h-3 w-3" />}
                  {jurisdiction.type === 'county' && <MapPin className="h-3 w-3" />}
                  {jurisdiction.type === 'city' && <MapPin className="h-3 w-3" />}
                  {jurisdiction.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1 hover:bg-transparent"
                    onClick={() => removeJurisdiction(jurisdiction)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search California counties and cities..."
          value={countySearchQuery}
          onChange={(e) => setCountySearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* California Counties and Cities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">California Counties & Cities</CardTitle>
          <CardDescription>
            Expand counties to see their cities. Select jurisdictions to include in your bidding opportunities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {/* Federal Option */}
              {showFederal && (
                <div className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-gray-50">
                  <Checkbox
                    id="federal"
                    checked={isJurisdictionSelected({
                      type: 'federal',
                      name: 'Federal Government',
                      code: 'US'
                    })}
                    onCheckedChange={() => toggleJurisdiction({
                      type: 'federal',
                      name: 'Federal Government',
                      code: 'US'
                    })}
                  />
                  <label htmlFor="federal" className="flex items-center gap-2 cursor-pointer">
                    <Flag className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Federal Government</span>
                    <Badge variant="outline" className="text-xs">All US</Badge>
                  </label>
                </div>
              )}

              {/* California State Option */}
              {showState && (
                <div className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-gray-50">
                  <Checkbox
                    id="california-state"
                    checked={isJurisdictionSelected({
                      type: 'state',
                      name: 'California State',
                      code: 'CA'
                    })}
                    onCheckedChange={() => toggleJurisdiction({
                      type: 'state',
                      name: 'California State',
                      code: 'CA'
                    })}
                  />
                  <label htmlFor="california-state" className="flex items-center gap-2 cursor-pointer">
                    <Building className="h-4 w-4 text-green-600" />
                    <span className="font-medium">California State</span>
                    <Badge variant="outline" className="text-xs">All CA</Badge>
                  </label>
                </div>
              )}

              {/* Counties */}
              {showCounties && filteredCounties.map((county) => (
                <div key={county.id} className="space-y-1">
                  {/* County Row */}
                  <div className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-gray-50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleCountyExpansion(county.id)}
                    >
                      {expandedCounties.has(county.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <Checkbox
                      id={`county-${county.id}`}
                      checked={isJurisdictionSelected({
                        type: 'county',
                        name: county.name,
                        code: county.id,
                        locationId: county.id
                      })}
                      onCheckedChange={() => toggleJurisdiction({
                        type: 'county',
                        name: county.name,
                        code: county.id,
                        locationId: county.id
                      })}
                    />
                    <label htmlFor={`county-${county.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                      <MapPin className="h-4 w-4 text-orange-600" />
                      <span className="font-medium">{county.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {county.cities.length} cities
                      </Badge>
                      {county.population && (
                        <span className="text-xs text-muted-foreground">
                          {county.population.toLocaleString()} people
                        </span>
                      )}
                    </label>
                  </div>

                  {/* Cities */}
                  {expandedCounties.has(county.id) && showCities && (
                    <div className="ml-8 space-y-1">
                      {getFilteredCities(county).map((city) => (
                        <div key={city.id} className="flex items-center space-x-2 p-2 rounded-lg border-l-2 border-l-gray-200 hover:bg-gray-50">
                          <Checkbox
                            id={`city-${city.id}`}
                            checked={isJurisdictionSelected({
                              type: 'city',
                              name: city.name,
                              code: city.id,
                              parent: county.name,
                              locationId: city.id
                            })}
                            onCheckedChange={() => toggleJurisdiction({
                              type: 'city',
                              name: city.name,
                              code: city.id,
                              parent: county.name,
                              locationId: city.id
                            })}
                          />
                          <label htmlFor={`city-${city.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span>{city.name}</span>
                            {city.population && (
                              <span className="text-xs text-muted-foreground">
                                {city.population.toLocaleString()} people
                              </span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
} 