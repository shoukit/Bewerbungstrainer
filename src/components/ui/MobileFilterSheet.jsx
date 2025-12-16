/**
 * MobileFilterSheet Component
 *
 * A responsive filter component that shows:
 * - Inline filters on desktop
 * - A filter icon button that opens a bottom sheet on mobile
 */

import React, { useState } from 'react';
import { Filter, X, Search, LayoutGrid, List, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS } from '@/config/colors';

/**
 * Mobile breakpoint (matches Tailwind's md)
 */
const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect mobile viewport
 */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

/**
 * Category chip for filter selection
 */
const CategoryChip = ({ label, icon: Icon, isSelected, onClick, color, bgColor, primaryAccent }) => {
  const chipColor = color || primaryAccent;
  const chipBgColor = bgColor || `${primaryAccent}15`;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: 600,
        border: `2px solid ${isSelected ? chipColor : COLORS.slate[200]}`,
        backgroundColor: isSelected ? chipBgColor : 'white',
        color: isSelected ? chipColor : COLORS.slate[600],
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {Icon && <Icon style={{ width: '14px', height: '14px' }} />}
      {label}
    </button>
  );
};

/**
 * Filter count badge
 */
const FilterBadge = ({ count }) => {
  if (count === 0) return null;

  return (
    <span
      style={{
        position: 'absolute',
        top: '-4px',
        right: '-4px',
        minWidth: '18px',
        height: '18px',
        padding: '0 5px',
        borderRadius: '9px',
        backgroundColor: '#ef4444',
        color: 'white',
        fontSize: '11px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {count}
    </span>
  );
};

/**
 * MobileFilterSheet - Main component
 */
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
  const isMobile = useIsMobile();
  const { branding } = usePartner();
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

  // Count active filters
  const activeFilterCount = [
    selectedCategory ? 1 : 0,
    selectedDifficulty && selectedDifficulty !== 'all' ? 1 : 0,
    searchQuery?.trim() ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // Desktop view - inline filters
  if (!isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Search and controls row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Search Input */}
          {showSearch && (
            <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
              <Search
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: COLORS.slate[400],
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 44px',
                  borderRadius: '12px',
                  border: `1px solid ${COLORS.slate[200]}`,
                  fontSize: '14px',
                  color: COLORS.slate[900],
                  backgroundColor: '#fff',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = primaryAccent;
                  e.target.style.boxShadow = `0 0 0 3px ${primaryAccent}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = COLORS.slate[200];
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          )}

          {/* Difficulty Filter */}
          {showDifficulty && difficultyOptions.length > 0 && (
            <div style={{ position: 'relative', minWidth: '180px' }}>
              <Filter
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: COLORS.slate[400],
                  pointerEvents: 'none',
                }}
              />
              <select
                value={selectedDifficulty}
                onChange={(e) => onDifficultyChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  borderRadius: '12px',
                  border: `1px solid ${COLORS.slate[200]}`,
                  fontSize: '14px',
                  color: COLORS.slate[900],
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '40px',
                }}
              >
                {difficultyOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Custom filters */}
          {renderCustomFilters && renderCustomFilters()}

          {/* Custom actions (e.g., Create Template button) */}
          {customActions}

          {/* View Toggle */}
          {showViewToggle && viewMode && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px',
                backgroundColor: COLORS.slate[100],
                borderRadius: '8px',
              }}
            >
              <button
                onClick={() => onViewModeChange('grid')}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'grid' ? '#ffffff' : 'transparent',
                  boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Kachelansicht"
              >
                <LayoutGrid style={{ width: '16px', height: '16px', color: viewMode === 'grid' ? primaryAccent : COLORS.slate[500] }} />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'list' ? '#ffffff' : 'transparent',
                  boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Listenansicht"
              >
                <List style={{ width: '16px', height: '16px', color: viewMode === 'list' ? primaryAccent : COLORS.slate[500] }} />
              </button>
            </div>
          )}
        </div>

        {/* Category chips row */}
        {showCategories && categories.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <CategoryChip
              label="Alle"
              icon={LayoutGrid}
              isSelected={!selectedCategory}
              onClick={() => onCategoryChange(null)}
              primaryAccent={primaryAccent}
            />
            {categories.map(cat => (
              <CategoryChip
                key={cat.key}
                label={cat.label}
                icon={cat.icon}
                isSelected={selectedCategory === cat.key}
                onClick={() => onCategoryChange(cat.key)}
                color={cat.color}
                bgColor={cat.bgColor}
                primaryAccent={primaryAccent}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Mobile search + filter button row */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Search Input */}
        {showSearch && (
          <div style={{ position: 'relative', flex: '1' }}>
            <Search
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: COLORS.slate[400],
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                borderRadius: '10px',
                border: `1px solid ${COLORS.slate[200]}`,
                fontSize: '14px',
                color: COLORS.slate[900],
                backgroundColor: '#fff',
                outline: 'none',
              }}
            />
          </div>
        )}

        {/* Filter Button */}
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            border: `1px solid ${activeFilterCount > 0 ? primaryAccent : COLORS.slate[200]}`,
            backgroundColor: activeFilterCount > 0 ? `${primaryAccent}10` : 'white',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Filter style={{ width: '18px', height: '18px', color: activeFilterCount > 0 ? primaryAccent : COLORS.slate[500] }} />
          <FilterBadge count={activeFilterCount} />
        </button>

        {/* View Toggle (compact on mobile) */}
        {showViewToggle && viewMode && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              padding: '3px',
              backgroundColor: COLORS.slate[100],
              borderRadius: '8px',
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => onViewModeChange('grid')}
              style={{
                padding: '6px',
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'grid' ? '#ffffff' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LayoutGrid style={{ width: '14px', height: '14px', color: viewMode === 'grid' ? primaryAccent : COLORS.slate[500] }} />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              style={{
                padding: '6px',
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'list' ? '#ffffff' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <List style={{ width: '14px', height: '14px', color: viewMode === 'list' ? primaryAccent : COLORS.slate[500] }} />
            </button>
          </div>
        )}
      </div>

      {/* Custom actions on mobile (separate row) */}
      {customActions && (
        <div style={{ marginTop: '8px' }}>
          {customActions}
        </div>
      )}

      {/* Filter Sheet Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            top: 'auto',
            transform: 'none',
            maxWidth: '100%',
            width: '100%',
            borderRadius: '20px 20px 0 0',
            maxHeight: '80vh',
            overflow: 'auto',
          }}
        >
          <DialogHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter style={{ width: '20px', height: '20px', color: primaryAccent }} />
                Filter
              </DialogTitle>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    onCategoryChange?.(null);
                    onDifficultyChange?.('all');
                    onSearchChange?.('');
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: COLORS.slate[100],
                    color: COLORS.slate[600],
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Zurücksetzen
                </button>
              )}
            </div>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px 0' }}>
            {/* Difficulty Filter */}
            {showDifficulty && difficultyOptions.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: COLORS.slate[700], marginBottom: '8px' }}>
                  Schwierigkeit
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => onDifficultyChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${COLORS.slate[200]}`,
                    fontSize: '14px',
                    color: COLORS.slate[900],
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: '40px',
                  }}
                >
                  {difficultyOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Categories */}
            {showCategories && categories.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: COLORS.slate[700], marginBottom: '8px' }}>
                  Kategorie
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <CategoryChip
                    label="Alle"
                    icon={LayoutGrid}
                    isSelected={!selectedCategory}
                    onClick={() => onCategoryChange(null)}
                    primaryAccent={primaryAccent}
                  />
                  {categories.map(cat => (
                    <CategoryChip
                      key={cat.key}
                      label={cat.label}
                      icon={cat.icon}
                      isSelected={selectedCategory === cat.key}
                      onClick={() => onCategoryChange(cat.key)}
                      color={cat.color}
                      bgColor={cat.bgColor}
                      primaryAccent={primaryAccent}
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
          <button
            onClick={() => setIsOpen(false)}
            style={{
              width: '100%',
              padding: '14px',
              marginTop: '12px',
              borderRadius: '12px',
              border: 'none',
              background: `linear-gradient(135deg, ${primaryAccent} 0%, ${primaryAccent}dd 100%)`,
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Filter anwenden
          </button>
        </DialogContent>
      </Dialog>

      {children}
    </div>
  );
};

export default MobileFilterSheet;
export { useIsMobile, CategoryChip };
