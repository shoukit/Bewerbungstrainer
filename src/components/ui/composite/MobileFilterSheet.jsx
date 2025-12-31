/**
 * MobileFilterSheet Component
 *
 * A responsive filter component that shows:
 * - Inline filters on desktop
 * - A filter icon button that opens a bottom sheet on mobile
 *
 * Migrated to Tailwind CSS for consistent styling.
 */

import React, { useState } from 'react';
import { Filter, Search, LayoutGrid, List } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/base/dialog';
import { useMobile } from '@/hooks/useMobile';
import { Button } from '@/components/ui';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Category chip for filter selection
 * Uses explicit indigo colors to avoid CSS variable conflicts
 */
const CategoryChip = ({ label, icon: Icon, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold
      border-2 cursor-pointer transition-all whitespace-nowrap
      ${isSelected
        ? 'border-indigo-500 bg-indigo-500 text-white shadow-lg shadow-indigo-500/40'
        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}
  >
    {Icon && <Icon className="w-3.5 h-3.5" />}
    {label}
  </button>
);

/**
 * Filter count badge
 */
const FilterBadge = ({ count }) => {
  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-md bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
      {count}
    </span>
  );
};

/**
 * Search Input Component
 * Uses explicit indigo colors for focus states
 */
const SearchInput = ({ value, onChange, placeholder, className = '' }) => (
  <div className={`relative ${className}`}>
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 pointer-events-none z-10" />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full py-3 pl-14 pr-4 rounded-lg border border-slate-200 text-base text-slate-900 bg-white outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400"
    />
  </div>
);

/**
 * Difficulty Select Component
 */
const DifficultySelect = ({ value, onChange, options, className = '' }) => (
  <div className={`relative ${className}`}>
    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full py-3 pl-10 pr-10 rounded-lg border border-slate-200 text-base text-slate-900 bg-white cursor-pointer outline-none appearance-none bg-no-repeat"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundPosition: 'right 12px center',
      }}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

/**
 * View Toggle Component
 * Uses explicit indigo colors to avoid CSS variable conflicts
 */
const ViewToggle = ({ viewMode, onViewModeChange, compact = false }) => (
  <div className={`flex items-center gap-1 ${compact ? 'p-[3px]' : 'p-1'} bg-slate-100 rounded-lg`}>
    <button
      onClick={() => onViewModeChange('grid')}
      className={`${compact ? 'p-1' : 'p-2'} rounded-md border-none cursor-pointer flex items-center justify-center transition-all
        ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'bg-transparent'}`}
      title="Kachelansicht"
    >
      <LayoutGrid className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${viewMode === 'grid' ? 'text-indigo-600' : 'text-slate-500'}`} />
    </button>
    <button
      onClick={() => onViewModeChange('list')}
      className={`${compact ? 'p-1' : 'p-2'} rounded-md border-none cursor-pointer flex items-center justify-center transition-all
        ${viewMode === 'list' ? 'bg-white shadow-sm' : 'bg-transparent'}`}
      title="Listenansicht"
    >
      <List className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${viewMode === 'list' ? 'text-indigo-600' : 'text-slate-500'}`} />
    </button>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const MobileFilterSheet = ({
  // Search
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Durchsuchen...',
  showSearch = true,

  // Categories
  categories = [],
  selectedCategory,
  onCategoryChange,
  showCategories = true,

  // Difficulty
  difficultyOptions = [],
  selectedDifficulty,
  onDifficultyChange,
  showDifficulty = false,

  // View toggle
  viewMode,
  onViewModeChange,
  showViewToggle = true,

  // Custom filters (render prop)
  renderCustomFilters,

  // Custom actions (e.g., "Create Template" button)
  customActions,

  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMobile();

  // Count active filters
  const activeFilterCount = [
    selectedCategory ? 1 : 0,
    selectedDifficulty && selectedDifficulty !== 'all' ? 1 : 0,
    searchQuery?.trim() ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // Desktop view - inline filters
  if (!isMobile) {
    return (
      <div className="flex flex-col gap-4">
        {/* Search and controls row */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search Input */}
          {showSearch && (
            <SearchInput
              value={searchQuery}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              className="flex-1 min-w-[200px]"
            />
          )}

          {/* Difficulty Filter */}
          {showDifficulty && difficultyOptions.length > 0 && (
            <DifficultySelect
              value={selectedDifficulty}
              onChange={onDifficultyChange}
              options={difficultyOptions}
              className="min-w-[180px]"
            />
          )}

          {/* Custom filters */}
          {renderCustomFilters && renderCustomFilters()}

          {/* Custom actions (e.g., Create Template button) */}
          {customActions}

          {/* View Toggle */}
          {showViewToggle && viewMode && (
            <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          )}
        </div>

        {/* Category chips row */}
        {showCategories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <CategoryChip
              label="Alle"
              icon={LayoutGrid}
              isSelected={!selectedCategory}
              onClick={() => onCategoryChange(null)}
            />
            {categories.map(cat => (
              <CategoryChip
                key={cat.key}
                label={cat.label}
                icon={cat.icon}
                isSelected={selectedCategory === cat.key}
                onClick={() => onCategoryChange(cat.key)}
              />
            ))}
          </div>
        )}

        {children}
      </div>
    );
  }

  // Mobile view - filter button + sheet
  return (
    <div className="flex flex-col gap-3">
      {/* Mobile search + filter button row */}
      <div className="flex gap-2 items-center">
        {/* Search Input - increased left padding to avoid icon overlap */}
        {showSearch && (
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full py-2 pl-11 pr-3 rounded-lg border border-slate-200 text-base text-slate-900 bg-white outline-none"
            />
          </div>
        )}

        {/* Filter Button - uses explicit indigo colors */}
        <button
          onClick={() => setIsOpen(true)}
          className={`relative flex items-center justify-center w-11 h-11 rounded-lg border flex-shrink-0 cursor-pointer
            ${activeFilterCount > 0
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-slate-200 bg-white'
            }`}
        >
          <Filter className={`w-[18px] h-[18px] ${activeFilterCount > 0 ? 'text-indigo-600' : 'text-slate-500'}`} />
          <FilterBadge count={activeFilterCount} />
        </button>

        {/* View Toggle (compact on mobile) */}
        {showViewToggle && viewMode && (
          <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} compact />
        )}
      </div>

      {/* Custom actions on mobile (separate row) */}
      {customActions && (
        <div className="mt-2">
          {customActions}
        </div>
      )}

      {/* Filter Sheet Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="fixed bottom-0 left-0 right-0 top-auto transform-none max-w-full w-full rounded-t-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-indigo-600" />
                Filter
              </DialogTitle>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    onCategoryChange?.(null);
                    onDifficultyChange?.('all');
                    onSearchChange?.('');
                  }}
                  className="px-3 py-1 rounded-md border-none bg-slate-100 text-slate-600 text-sm font-medium cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  Zurücksetzen
                </button>
              )}
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-5 py-2">
            {/* Difficulty Filter */}
            {showDifficulty && difficultyOptions.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Schwierigkeit
                </label>
                <DifficultySelect
                  value={selectedDifficulty}
                  onChange={onDifficultyChange}
                  options={difficultyOptions}
                />
              </div>
            )}

            {/* Categories */}
            {showCategories && categories.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Kategorie
                </label>
                <div className="flex flex-wrap gap-2">
                  <CategoryChip
                    label="Alle"
                    icon={LayoutGrid}
                    isSelected={!selectedCategory}
                    onClick={() => onCategoryChange(null)}
                  />
                  {categories.map(cat => (
                    <CategoryChip
                      key={cat.key}
                      label={cat.label}
                      icon={cat.icon}
                      isSelected={selectedCategory === cat.key}
                      onClick={() => onCategoryChange(cat.key)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Custom filters in sheet */}
            {renderCustomFilters && (
              <div>
                {renderCustomFilters()}
              </div>
            )}
          </div>

          {/* Apply button */}
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsOpen(false)}
            fullWidth
            className="mt-3"
          >
            Filter anwenden
          </Button>
        </DialogContent>
      </Dialog>

      {children}
    </div>
  );
};

export default MobileFilterSheet;
export { CategoryChip, ViewToggle };
