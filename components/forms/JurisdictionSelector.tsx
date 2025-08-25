'use client'

import { useState, useEffect } from 'react'
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
  Flag
} from 'lucide-react'
import statesAndCountiesData from '@/states-and-counties.json'

interface Jurisdiction {
  type: 'federal' | 'state' | 'county'
  name: string
  code?: string
  parent?: string
}

interface JurisdictionSelectorProps {
  selectedJurisdictions: Jurisdiction[]
  onJurisdictionsChange: (jurisdictions: Jurisdiction[]) => void
  maxSelections?: number
}

// Generate US_STATES from the JSON data
const US_STATES = Object.entries(statesAndCountiesData).map(([abbreviation, stateData]) => ({
  name: stateData.name,
  abbreviation,
  countyCount: stateData.counties.length
}))

// Function to get counties from the JSON data
const getCountiesFromData = (stateAbbr: string): string[] => {
  const stateData = statesAndCountiesData[stateAbbr as keyof typeof statesAndCountiesData]
  if (stateData && stateData.counties) {
    return stateData.counties.map(county => `${county} County`)
  }
  return []
}

export default function JurisdictionSelector({
  selectedJurisdictions,
  onJurisdictionsChange,
  maxSelections = 50
}: JurisdictionSelectorProps) {
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedState, setSelectedState] = useState<string>('')
  const [countySearchQuery, setCountySearchQuery] = useState('')
  const [loadedCounties, setLoadedCounties] = useState<Record<string, string[]>>({})
  const [loadingCounties, setLoadingCounties] = useState<Set<string>>(new Set())

  const toggleStateExpansion = (stateAbbr: string) => {
    const newExpanded = new Set(expandedStates)
    if (newExpanded.has(stateAbbr)) {
      newExpanded.delete(stateAbbr)
    } else {
      newExpanded.add(stateAbbr)
      // Load counties when expanding if not already loaded
      if (!loadedCounties[stateAbbr] && !loadingCounties.has(stateAbbr)) {
        setLoadingCounties(prev => new Set(prev).add(stateAbbr))
        
        // Simulate loading delay for better UX
        setTimeout(() => {
          const counties = getCountiesForState(stateAbbr)
          setLoadedCounties(prev => ({
            ...prev,
            [stateAbbr]: counties
          }))
          setLoadingCounties(prev => {
            const newSet = new Set(prev)
            newSet.delete(stateAbbr)
            return newSet
          })
        }, 100)
      }
    }
    setExpandedStates(newExpanded)
  }

  const isJurisdictionSelected = (jurisdiction: Jurisdiction) => {
    return selectedJurisdictions.some(j => 
      j.type === jurisdiction.type && 
      j.name === jurisdiction.name &&
      j.code === jurisdiction.code
    )
  }

  const toggleJurisdiction = (jurisdiction: Jurisdiction) => {
    const isSelected = isJurisdictionSelected(jurisdiction)
    
    if (isSelected) {
      // Remove jurisdiction
      const newJurisdictions = selectedJurisdictions.filter(j => 
        !(j.type === jurisdiction.type && 
          j.name === jurisdiction.name &&
          j.code === jurisdiction.code)
      )
      onJurisdictionsChange(newJurisdictions)
    } else {
      // Add jurisdiction (check max limit)
      if (selectedJurisdictions.length >= maxSelections) {
        return // Could show a toast notification here
      }
      onJurisdictionsChange([...selectedJurisdictions, jurisdiction])
    }
  }

  const removeJurisdiction = (jurisdiction: Jurisdiction) => {
    const newJurisdictions = selectedJurisdictions.filter(j => 
      !(j.type === jurisdiction.type && 
        j.name === jurisdiction.name &&
        j.code === jurisdiction.code)
    )
    onJurisdictionsChange(newJurisdictions)
  }

  const getCountiesForState = (stateAbbr: string): string[] => {
    // Get counties from the JSON data
    const counties = getCountiesFromData(stateAbbr)
    
    // If no counties found, show a message
    if (counties.length === 0) {
      const state = US_STATES.find(s => s.abbreviation === stateAbbr)
      if (state) {
        return [`Loading ${state.countyCount} counties for ${state.name}...`]
      }
    }
    
    return counties
  }

  const getCountiesForDisplay = (stateAbbr: string): string[] => {
    // Use loaded counties if available, otherwise load them
    if (loadedCounties[stateAbbr]) {
      return loadedCounties[stateAbbr]
    }
    
    // If not loaded but state is expanded, load them
    if (expandedStates.has(stateAbbr)) {
      const counties = getCountiesForState(stateAbbr)
      setLoadedCounties(prev => ({
        ...prev,
        [stateAbbr]: counties
      }))
      return counties
    }
    
    return []
  }

  const filteredStates = US_STATES.filter(state =>
    state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    state.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCounties = selectedState ? 
    getCountiesForState(selectedState).filter(county =>
      county.toLowerCase().includes(countySearchQuery.toLowerCase())
    ) : []

  return (
    <div className="space-y-6">
      {/* Selected Jurisdictions */}
      {selectedJurisdictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Selected Jurisdictions ({selectedJurisdictions.length}/{maxSelections})
            </CardTitle>
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
                  {jurisdiction.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
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

      {/* Federal Option */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Federal Government
          </CardTitle>
          <CardDescription>
            Select Federal opportunities across all agencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="federal"
              checked={isJurisdictionSelected({ type: 'federal', name: 'Federal Government' })}
              onCheckedChange={() => toggleJurisdiction({ type: 'federal', name: 'Federal Government' })}
            />
            <label htmlFor="federal" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Federal Government - All Agencies
            </label>
          </div>
        </CardContent>
      </Card>

      {/* State Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            State Governments
          </CardTitle>
          <CardDescription>
            Select states and their counties for targeted opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search states..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* States Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredStates.map((state) => (
              <div key={state.abbreviation} className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`state-${state.abbreviation}`}
                      checked={isJurisdictionSelected({ 
                        type: 'state', 
                        name: state.name,
                        code: state.abbreviation 
                      })}
                      onCheckedChange={() => toggleJurisdiction({ 
                        type: 'state', 
                        name: state.name,
                        code: state.abbreviation 
                      })}
                    />
                    <label 
                      htmlFor={`state-${state.abbreviation}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {state.name}
                    </label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStateExpansion(state.abbreviation)}
                    className="h-6 w-6 p-0"
                  >
                    {expandedStates.has(state.abbreviation) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Counties for this state */}
                {expandedStates.has(state.abbreviation) && (
                  <div className="ml-6 space-y-2">
                    <div className="text-xs text-gray-500 font-medium">
                      Counties ({state.countyCount})
                    </div>
                    
                    {/* County search for this state */}
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                      <Input
                        placeholder="Search counties..."
                        value={selectedState === state.abbreviation ? countySearchQuery : ''}
                        onChange={(e) => {
                          setSelectedState(state.abbreviation)
                          setCountySearchQuery(e.target.value)
                        }}
                        className="pl-6 h-8 text-xs"
                      />
                    </div>

                                         {/* County list */}
                     <ScrollArea className="h-32">
                       <div className="space-y-1">
                         {loadingCounties.has(state.abbreviation) ? (
                           <div className="text-xs text-gray-500 italic">
                             Loading counties...
                           </div>
                         ) : getCountiesForDisplay(state.abbreviation)
                           .filter(county => 
                             selectedState === state.abbreviation ? 
                               county.toLowerCase().includes(countySearchQuery.toLowerCase()) : 
                               true
                           )
                           .slice(0, 20) // Limit display for performance
                           .map((county) => 
                             county.startsWith('Loading') ? (
                               <div key={county} className="text-xs text-gray-500 italic">
                                 {county}
                               </div>
                             ) : (
                               <div key={county} className="flex items-center space-x-2">
                                 <Checkbox
                                   id={`county-${state.abbreviation}-${county}`}
                                   checked={isJurisdictionSelected({ 
                                     type: 'county', 
                                     name: county,
                                     code: state.abbreviation,
                                     parent: state.name
                                   })}
                                   onCheckedChange={() => toggleJurisdiction({ 
                                     type: 'county', 
                                     name: county,
                                     code: state.abbreviation,
                                     parent: state.name
                                   })}
                                 />
                                 <label 
                                   htmlFor={`county-${state.abbreviation}-${county}`}
                                   className="text-xs cursor-pointer"
                                 >
                                   {county}
                                 </label>
                               </div>
                             )
                           )}
                         {!loadingCounties.has(state.abbreviation) && getCountiesForDisplay(state.abbreviation).length > 20 && (
                           <div className="text-xs text-gray-500 italic">
                             ... and {getCountiesForDisplay(state.abbreviation).length - 20} more counties
                           </div>
                         )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 