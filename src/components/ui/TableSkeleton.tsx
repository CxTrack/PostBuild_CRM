import { Skeleton } from './Skeleton';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
    showHeader?: boolean;
}

export function TableSkeleton({ rows = 5, columns = 5, showHeader = true }: TableSkeletonProps) {
    return (
        <div className="w-full">
            {/* Header */}
            {showHeader && (
                <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={i} className="h-4 flex-1" />
                    ))}
                </div>
            )}

            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                    key={rowIndex}
                    className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-800"
                >
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton
                            key={colIndex}
                            className={`h-4 flex-1 ${colIndex === 0 ? 'max-w-[200px]' : ''}`}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function CustomerTableSkeleton() {
    return (
        <div className="w-full">
            {Array.from({ length: 5 }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-800"
                >
                    {/* Avatar */}
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    {/* Name & Email */}
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                    </div>
                    {/* Phone */}
                    <Skeleton className="h-4 w-24 hidden md:block" />
                    {/* Status */}
                    <Skeleton className="h-6 w-16 rounded-full" />
                    {/* Actions */}
                    <Skeleton className="h-8 w-8 rounded" />
                </div>
            ))}
        </div>
    );
}

export function DealTableSkeleton() {
    return (
        <div className="w-full">
            {Array.from({ length: 5 }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-800"
                >
                    {/* Deal Name */}
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                    {/* Value */}
                    <Skeleton className="h-4 w-20" />
                    {/* Stage */}
                    <Skeleton className="h-6 w-24 rounded-full" />
                    {/* Probability */}
                    <Skeleton className="h-4 w-12 hidden lg:block" />
                    {/* Actions */}
                    <Skeleton className="h-8 w-8 rounded" />
                </div>
            ))}
        </div>
    );
}

export function TaskTableSkeleton() {
    return (
        <div className="w-full">
            {Array.from({ length: 5 }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-800"
                >
                    {/* Checkbox */}
                    <Skeleton className="h-5 w-5 rounded shrink-0" />
                    {/* Title */}
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/4" />
                    </div>
                    {/* Due Date */}
                    <Skeleton className="h-4 w-24 hidden md:block" />
                    {/* Priority */}
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
            ))}
        </div>
    );
}
