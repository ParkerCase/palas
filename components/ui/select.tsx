'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  disabled?: boolean
}

export interface SelectTriggerProps {
  children: React.ReactNode
  className?: string
}

export interface SelectContentProps {
  children: React.ReactNode
}

export interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

export interface SelectValueProps {
  placeholder?: string
}

export const Select = ({ value, defaultValue, onValueChange, children, disabled = false }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(value || defaultValue || '')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Update internal value when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value)
    }
  }, [value])

  // Extract trigger and content from children
  let triggerContent: React.ReactNode = "Select an option"
  const selectItems: React.ReactNode[] = []

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === SelectTrigger) {
        const triggerProps = child.props as SelectTriggerProps
        triggerContent = triggerProps.children
      } else if (child.type === SelectContent) {
        const contentProps = child.props as SelectContentProps
        React.Children.forEach(contentProps.children, (item) => {
          if (React.isValidElement(item) && item.type === SelectItem) {
            selectItems.push(item)
          }
        })
      }
    }
  })

  // Find the selected item's display text
  const selectedItem = selectItems.find((item) => {
    if (React.isValidElement(item) && item.type === SelectItem) {
      return (item.props as SelectItemProps).value === internalValue
    }
    return false
  })

  const displayText = React.isValidElement(selectedItem) 
    ? (selectedItem.props as SelectItemProps).children 
    : triggerContent

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (selectedValue: string) => {
    setInternalValue(selectedValue)
    onValueChange?.(selectedValue)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-2 ring-blue-500 border-transparent"
        )}
      >
        <span className={internalValue ? "text-gray-900" : "text-gray-400"}>
          {displayText}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div
          ref={contentRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {selectItems.map((item) => {
            if (React.isValidElement(item) && item.type === SelectItem) {
              const itemProps = item.props as SelectItemProps
              return (
                <button
                  key={itemProps.value}
                  type="button"
                  onClick={() => handleSelect(itemProps.value)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center justify-between",
                    itemProps.value === internalValue && "bg-blue-50 text-blue-900",
                    itemProps.className
                  )}
                >
                  <span>{itemProps.children}</span>
                  {itemProps.value === internalValue && <Check className="h-4 w-4" />}
                </button>
              )
            }
            return item
          })}
        </div>
      )}
    </div>
  )
}

export const SelectTrigger = ({ children, className = '' }: SelectTriggerProps) => {
  return <div className={className}>{children}</div>
}

export const SelectContent = ({ children }: SelectContentProps) => {
  return <>{children}</>
}

export const SelectItem = ({ value, children, className }: SelectItemProps) => {
  return <div className={className} data-value={value}>{children}</div>
}

export const SelectValue = ({ placeholder }: SelectValueProps) => {
  return <span className="text-gray-400">{placeholder}</span>
}
