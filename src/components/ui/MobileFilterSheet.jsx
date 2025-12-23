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
import { useBranding } from '@/hooks/useBranding';
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
const CategoryChip = ({ label, icon: Icon, isSelected, onClick, color, bgColor }) => {
  const b = useBranding();
  const chipColor = color || b.colors.primary;
  const chipBgColor = bgColor || `${b.colors.primary}15`;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: b.space[2],
        padding: `${b.space[2]} ${b.space[3]}`,
        borderRadius: b.radius.full,
        fontSize: b.fontSize.sm,
        fontWeight: 600,
        border: `2px solid ${isSelected ? chipColor : COLORS.slate[200]}`,
        backgroundColor: isSelected ? chipBgColor : 'white',
        color: isSelected ? chipColor : COLORS.slate[600],
        cursor: 'pointer',
        transition: b.transition.normal,
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
  const b = useBranding();
  if (count === 0) return null;

  return (
    <span
      style={{
        position: 'absolute',
        top: '-4px',
        right: '-4px',
        minWidth: '18px',
        height: '18px',
        padding: `0 ${b.space[1]}`,
        borderRadius: b.radius.md,
        backgroundColor: '#ef4444',
        color: 'white',
        fontSize: b.fontSize.xs,
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
  const b = useBranding();

  // Count active filters
  const activeFilterCount = [
    selectedCategory ? 1 : 0,
    selectedDifficulty && selectedDifficulty !== 'all' ? 1 : 0,
    searchQuery?.trim() ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // Desktop view - inline filters
  if (!isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: b.space[4] }}>
        {/* Search and controls row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: b.space[3], alignItems: 'center' }}>
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
                  padding: `${b.space[3]} 14px ${b.space[3]} 44px`,
                  borderRadius: b.radius.lg,
                  border: `1px solid ${COLORS.slate[200]}`,
                  fontSize: b.fontSize.base,
                  color: COLORS.slate[900],
                  backgroundColor: '#fff',
                  outline: 'none',
                  transition: b.transition.normal,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = b.colors.primary;
                  e.target.style.boxShadow = `0 0 0 3px ${b.colors.primary}20`;
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
                  padding: `${b.space[3]} 14px ${b.space[3]} 40px`,
                  borderRadius: b.radius.lg,
                  border: `1px solid ${COLORS.slate[200]}`,
                  fontSize: b.fontSize.base,
                  color: COLORS.slate[900],
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: `right ${b.space[3]} center`,
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
                gap: b.space[1],
                padding: b.space[1],
                backgroundColor: COLORS.slate[100],
                borderRadius: b.radius.md,
              }}
            >
              <button
                onClick={() => onViewModeChange('grid')}
                style={{
                  padding: b.space[2],
                  borderRadius: b.radius.sm,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'grid' ? '#ffffff' : 'transparent',
                  boxShadow: viewMode === 'grid' ? b.shadow.sm : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Kachelansicht"
              >
                <LayoutGrid style={{ width: '16px', height: '16px', color: viewMode === 'grid' ? b.colors.primary : COLORS.slate[500] }} />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                style={{
                  padding: b.space[2],
                  borderRadius: b.radius.sm,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'list' ? '#ffffff' : 'transparent',
                  boxShadow: viewMode === 'list' ? b.shadow.sm : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Listenansicht"
              >
                <List style={{ width: '16px', height: '16px', color: viewMode === 'list' ? b.colors.primary : COLORS.slate[500] }} />
              </button>
            </div>
          )}
        </div>

        {/* Category chips row */}
        {showCategories && categories.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: b.space[2] }}>
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
                color={cat.color}
                bgColor={cat.bgColor}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: b.space[3] }}>
      {/* Mobile search + filter button row */}
      <div style={{ display: 'flex', gap: b.space[2], alignItems: 'center' }}>
        {/* Search Input */}
        {showSearch && (
          <div style={{ position: 'relative', flex: '1' }}>
            <Search
              style={{
                position: 'absolute',
                left: b.space[3],
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
                padding: `${b.space[2]} ${b.space[3]} ${b.space[2]} 38px`,
                borderRadius: b.radius.md,
                border: `1px solid ${COLORS.slate[200]}`,
                fontSize: b.fontSize.base,
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
            borderRadius: b.radius.md,
            border: `1px solid ${activeFilterCount > 0 ? b.colors.primary : COLORS.slate[200]}`,
            backgroundColor: activeFilterCount > 0 ? `${b.colors.primary}10` : 'white',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Filter style={{ width: '18px', height: '18px', color: activeFilterCount > 0 ? b.colors.primary : COLORS.slate[500] }} />
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
              borderRadius: b.radius.md,
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => onViewModeChange('grid')}
              style={{
                padding: b.space[1],
                borderRadius: b.radius.sm,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'grid' ? '#ffffff' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LayoutGrid style={{ width: '14px', height: '14px', color: viewMode === 'grid' ? b.colors.primary : COLORS.slate[500] }} />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              style={{
                padding: b.space[1],
                borderRadius: b.radius.sm,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'list' ? '#ffffff' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <List style={{ width: '14px', height: '14px', color: viewMode === 'list' ? b.colors.primary : COLORS.slate[500] }} />
            </button>
          </div>
        )}
      </div>

      {/* Custom actions on mobile (separate row) */}
      {customActions && (
        <div style={{ marginTop: b.space[2] }}>
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
            borderRadius: `${b.radius.xl} ${b.radius.xl} 0 0`,
            maxHeight: '80vh',
            overflow: 'auto',
          }}
        >
          <DialogHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: b.space[2] }}>
                <Filter style={{ width: '20px', height: '20px', color: b.colors.primary }} />
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
                    padding: `${b.space[1]} ${b.space[3]}`,
                    borderRadius: b.radius.sm,
                    border: 'none',
                    backgroundColor: COLORS.slate[100],
                    color: COLORS.slate[600],
                    fontSize: b.fontSize.sm,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Zurücksetzen
                </button>
              )}
            </div>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: b.space[5], padding: `${b.space[2]} 0` }}>
            {/* Difficulty Filter */}
            {showDifficulty && difficultyOptions.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: b.fontSize.sm, fontWeight: 600, color: COLORS.slate[700], marginBottom: b.space[2] }}>
                  Schwierigkeit
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => onDifficultyChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: `${b.space[3]} 14px`,
                    borderRadius: b.radius.md,
                    border: `1px solid ${COLORS.slate[200]}`,
                    fontSize: b.fontSize.base,
                    color: COLORS.slate[900],
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: `right ${b.space[3]} center`,
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
                <label style={{ display: 'block', fontSize: b.fontSize.sm, fontWeight: 600, color: COLORS.slate[700], marginBottom: b.space[2] }}>
                  Kategorie
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: b.space[2] }}>
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
                      color={cat.color}
                      bgColor={cat.bgColor}
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
              padding: b.space[3],
              marginTop: b.space[3],
              borderRadius: b.radius.lg,
              border: 'none',
              background: `linear-gradient(135deg, ${b.colors.primary} 0%, ${b.colors.primary}dd 100%)`,
              color: 'white',
              fontSize: b.fontSize.md,
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
