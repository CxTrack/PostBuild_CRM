import { Skeleton } from './Skeleton';

export function StatsCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div className="space-y-3 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
        </div>
    );
}

export function DashboardStatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <StatsCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
                <Skeleton className="w-full rounded-lg" style={{ height }} />
            </div>
        </div>
    );
}
