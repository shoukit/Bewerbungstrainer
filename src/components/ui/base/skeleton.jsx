/**
 * Skeleton Component
 *
 * Animated placeholder components for loading states.
 * Provides a polished loading experience while content is being fetched.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Base Skeleton element with shimmer animation
 */
const Skeleton = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'animate-pulse rounded-lg bg-slate-200',
      className
    )}
    {...props}
  />
));
Skeleton.displayName = 'Skeleton';

/**
 * Skeleton for text lines
 */
const SkeletonText = React.forwardRef(({ lines = 3, className, ...props }, ref) => (
  <div ref={ref} className={cn('space-y-2', className)} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          'h-4',
          i === lines - 1 ? 'w-3/4' : 'w-full'
        )}
      />
    ))}
  </div>
));
SkeletonText.displayName = 'SkeletonText';

/**
 * Skeleton for cards (scenario cards, briefing cards, etc.)
 */
const SkeletonCard = React.forwardRef(({ className, showImage = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-white rounded-xl border border-slate-200 p-4 shadow-sm',
      className
    )}
    {...props}
  >
    {showImage && (
      <Skeleton className="w-full h-40 mb-4 rounded-lg" />
    )}
    <div className="flex items-start gap-3">
      <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
    <div className="mt-4 flex gap-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  </div>
));
SkeletonCard.displayName = 'SkeletonCard';

/**
 * Skeleton for dashboard grid (multiple cards)
 */
const SkeletonGrid = React.forwardRef(({ count = 6, columns = 3, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'grid gap-4',
      columns === 2 && 'grid-cols-1 md:grid-cols-2',
      columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      className
    )}
    {...props}
  >
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
));
SkeletonGrid.displayName = 'SkeletonGrid';

/**
 * Skeleton for list items (session history, etc.)
 */
const SkeletonListItem = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200',
      className
    )}
    {...props}
  >
    <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
    <div className="flex-1 min-w-0 space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="w-16 h-8 rounded-lg flex-shrink-0" />
  </div>
));
SkeletonListItem.displayName = 'SkeletonListItem';

/**
 * Skeleton for list (multiple items)
 */
const SkeletonList = React.forwardRef(({ count = 5, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('space-y-3', className)}
    {...props}
  >
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonListItem key={i} />
    ))}
  </div>
));
SkeletonList.displayName = 'SkeletonList';

/**
 * Skeleton for dashboard header
 */
const SkeletonHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-600 rounded-2xl p-6 text-white',
      className
    )}
    {...props}
  >
    <div className="flex items-start gap-4 mb-6">
      <div className="w-16 h-16 rounded-2xl bg-white/20 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-8 w-1/3 bg-white/20 rounded-lg animate-pulse" />
        <div className="h-4 w-1/2 bg-white/20 rounded-lg animate-pulse" />
      </div>
    </div>
    <div className="flex gap-2">
      <div className="h-8 w-24 bg-white/20 rounded-full animate-pulse" />
      <div className="h-8 w-24 bg-white/20 rounded-full animate-pulse" />
    </div>
  </div>
));
SkeletonHeader.displayName = 'SkeletonHeader';

/**
 * Skeleton for stats/metrics
 */
const SkeletonStats = React.forwardRef(({ count = 4, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}
    {...props}
  >
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
        <Skeleton className="h-3 w-1/2 mb-2" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    ))}
  </div>
));
SkeletonStats.displayName = 'SkeletonStats';

/**
 * Skeleton for audio player
 */
const SkeletonAudioPlayer = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-white rounded-xl border border-slate-200 p-4',
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-4 mb-4">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </div>
    <div className="flex justify-center gap-4">
      <Skeleton className="w-10 h-10 rounded-full" />
      <Skeleton className="w-10 h-10 rounded-full" />
      <Skeleton className="w-10 h-10 rounded-full" />
    </div>
  </div>
));
SkeletonAudioPlayer.displayName = 'SkeletonAudioPlayer';

/**
 * Full page skeleton with header and grid
 */
const SkeletonPage = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('space-y-6', className)}
    {...props}
  >
    <SkeletonHeader />
    <div className="flex gap-2 overflow-x-auto pb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
      ))}
    </div>
    <SkeletonGrid count={6} columns={3} />
  </div>
));
SkeletonPage.displayName = 'SkeletonPage';

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonGrid,
  SkeletonListItem,
  SkeletonList,
  SkeletonHeader,
  SkeletonStats,
  SkeletonAudioPlayer,
  SkeletonPage
};
