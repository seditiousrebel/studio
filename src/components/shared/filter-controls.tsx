
"use client";

import { useState, type ReactNode } from 'react';
import React from 'react'; // Ensured React is imported for JSX
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from '@/components/ui/label';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  placeholder?: string;
  type: 'select' | 'search' | 'custom_render';
  optionsKey?: string;
  renderComponentKey?: string;
}

interface FilterControlsProps {
  filters: FilterConfig[];
  onFilterChange: (filterId: string, value: any) => void;
  currentFilters?: Record<string, any>; 
  allOptions?: Record<string, FilterOption[]>;
  customRenderers?: Record<string, (
    currentValue: any,
    onChange: (value: any) => void,
    helpers?: Record<string, any>
  ) => ReactNode>;
  customRenderHelpers?: Record<string, any>;
  children?: ReactNode;
}

const ALL_ITEMS_VALUE_INTERNAL = "__ALL_ITEMS_PLACEHOLDER__";

export function FilterControls({
  filters,
  onFilterChange,
  currentFilters = {}, 
  allOptions = {},
  customRenderers = {},
  customRenderHelpers = {},
  children,
}: FilterControlsProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Always show the first 2 filters by default, if available.
  const DEFAULT_VISIBLE_FILTERS_COUNT = 2;

  const defaultDisplayFilters = filters.slice(0, DEFAULT_VISIBLE_FILTERS_COUNT);
  const advancedDisplayFilters = filters.slice(DEFAULT_VISIBLE_FILTERS_COUNT);
  const hasAdvancedOptions = advancedDisplayFilters.length > 0;

  const handleResetFilters = () => {
    if (!onFilterChange) return;
    filters.forEach(filter => {
      if (filter.type === 'custom_render' && filter.renderComponentKey === 'ageSlider' && customRenderHelpers) {
        const initialAge = [customRenderHelpers.sliderMinAge || 18, customRenderHelpers.sliderMaxAge || 100];
        onFilterChange('minAge', initialAge[0].toString());
        onFilterChange('maxAge', initialAge[1].toString());
      } else {
        onFilterChange(filter.id, '');
      }
    });
  };

  const renderFilterInput = (filter: FilterConfig) => {
    const isPrimarySearch = filter.type === 'search' && filters.indexOf(filter) === 0;

    if (filter.type === 'custom_render' && filter.renderComponentKey && customRenderers[filter.renderComponentKey]) {
      return (
        <div key={filter.id} className={cn("space-y-1.5 w-full sm:w-auto", isPrimarySearch && "flex-grow sm:max-w-xs md:max-w-sm")}>
          {customRenderers[filter.renderComponentKey]!(
            currentFilters[filter.id], // This might need adjustment if custom component handles multiple keys like ageSlider
            (value) => {
              if (onFilterChange) {
                if (filter.renderComponentKey === 'ageSlider' && Array.isArray(value)) {
                  onFilterChange('minAge', value[0].toString());
                  onFilterChange('maxAge', value[1].toString());
                } else {
                  onFilterChange(filter.id, value);
                }
              }
            },
            customRenderHelpers
          )}
        </div>
      );
    }

    const filterValue = currentFilters[filter.id] || "";

    return (
      <div key={filter.id} className={cn("space-y-1.5 w-full sm:w-auto", isPrimarySearch ? "flex-grow sm:max-w-xs md:max-w-sm" : "sm:min-w-[200px]")}>
        <Label htmlFor={filter.id} className="text-sm font-medium text-muted-foreground">
          {filter.label}
        </Label>
        {filter.type === 'search' && (
          <div className="relative">
            <Input
              id={filter.id}
              type="text"
              placeholder={filter.placeholder}
              value={filterValue as string}
              onChange={(e) => onFilterChange && onFilterChange(filter.id, e.target.value)}
              className="w-full pr-10 bg-background"
              aria-label={filter.label}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        )}
        {filter.type === 'select' && filter.optionsKey && (
          <Select
            value={filterValue as string}
            onValueChange={(value) => {
              if (onFilterChange) onFilterChange(filter.id, value === ALL_ITEMS_VALUE_INTERNAL ? "" : value);
            }}
          >
            <SelectTrigger id={filter.id} className="w-full bg-background" aria-label={`Filter by ${filter.label}`}>
              <SelectValue placeholder={filter.placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ITEMS_VALUE_INTERNAL}>{filter.placeholder || `All ${filter.label.replace("Filter by ", "")}`}</SelectItem>
              {(allOptions[filter.optionsKey] || []).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  };

  return (
    <div className="mb-8 p-4 md:p-6 bg-card rounded-lg shadow space-y-4">
      <div className="flex flex-wrap gap-x-4 gap-y-3 items-end">
        {defaultDisplayFilters.map(renderFilterInput)}
        
        {children}

        <div className="flex gap-2 items-end pt-1 sm:pt-0 ml-auto sm:ml-0 self-end">
          {hasAdvancedOptions && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              aria-expanded={showAdvancedFilters}
              className="h-9"
            >
              {showAdvancedFilters ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
              {showAdvancedFilters ? "Fewer" : "More"} Filters
            </Button>
          )}
          <Button
            onClick={handleResetFilters}
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive h-9 w-9"
            title="Reset Filters"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Reset Filters</span>
          </Button>
        </div>
      </div>

      {showAdvancedFilters && hasAdvancedOptions && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-start pt-4 border-t mt-4">
          {advancedDisplayFilters.map(renderFilterInput)}
        </div>
      )}
    </div>
  );
}
