import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
                className
            )}
        />
    );
}

// Pre-built skeleton variants
export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
    return (
        <div className={cn('space-y-2', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')}
                />
            ))}
        </div>
    );
}

export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
    };
    return <Skeleton className={cn('rounded-full', sizeClasses[size])} />;
}

export function SkeletonCard({ className }: SkeletonProps) {
    return (
        <div className={cn('rounded-lg border border-gray-200 dark:border-gray-700 p-4', className)}>
            <div className="flex items-center space-x-4">
                <SkeletonAvatar />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonButton({ className }: SkeletonProps) {
    return <Skeleton className={cn('h-10 w-24 rounded-lg', className)} />;
}
