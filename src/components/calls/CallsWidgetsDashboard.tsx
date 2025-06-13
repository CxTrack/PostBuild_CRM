import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, Headset, Phone, Timer } from "lucide-react";

interface CallsWidgetsDashboardProps {
    agentsCount: number;
    calls: { start_time?: string; duration?: number }[];
    totalCallGrowthThisMonth: number;
    totalCallGrowthLastMonth: number;
    totalCallsDuration: number;
    totalCallsDurationGrowthThisMonth: number,
    totalCallsDurationGrowthLastMonth: number,
}

export const CallsWidgetsDashboard = ({
    agentsCount,
    calls,
    totalCallGrowthThisMonth,
    totalCallGrowthLastMonth,
    totalCallsDuration,
    totalCallsDurationGrowthThisMonth,
    totalCallsDurationGrowthLastMonth,

}: CallsWidgetsDashboardProps) => {
    const totalCallsGrowthDiff = totalCallGrowthThisMonth - totalCallGrowthLastMonth;
    const isTotalCallsGrowthPositive = totalCallsGrowthDiff >= 0;

    const totalDurationGrowthDiff = totalCallsDurationGrowthThisMonth - totalCallsDurationGrowthLastMonth;
    const isTotalDurationGrowthPositive = totalDurationGrowthDiff >= 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {/* Agents Widget */}
            <Link
                to="/calls"
                className="card bg-dark-800 border border-dark-700 hover:bg-dark-700/50 transition-colors"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-gray-400 text-sm">Agents Amount</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{agentsCount}</h3>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-500/20 text-orange-500">
                        <Headset size={24} />
                    </div>
                </div>
            </Link>

            {/* Total Calls Widget */}
            <Link
                to="/calls"
                className="card bg-dark-800 border border-dark-700 hover:bg-dark-700/50 transition-colors"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-gray-400 text-sm">Total Calls</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{calls.length}</h3>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-500/20 text-orange-500">
                        <Phone size={24} />
                    </div>
                </div>
                <div className="flex items-center mt-2">
                    {isTotalCallsGrowthPositive ? (
                        <ArrowUpRight size={16} className="text-green-500" />
                    ) : (
                        <ArrowDownRight size={16} className="text-red-500" />
                    )}
                    <span className={`text-sm ml-1 ${isTotalCallsGrowthPositive ? "text-green-500" : "text-red-500"}`}>
                        {totalCallsGrowthDiff} calls
                    </span>
                    <span className="text-gray-500 text-sm ml-1">vs last month</span>
                </div>
            </Link>

            {/* Total Duration Widget */}
            <Link
                to="/calls"
                className="card bg-dark-800 border border-dark-700 hover:bg-dark-700/50 transition-colors"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-gray-400 text-sm">Total Calls Duration</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{totalCallsDuration.toFixed(2)} min</h3>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-500/20 text-orange-500">
                        <Timer size={24} />
                    </div>
                </div>
                <div className="flex items-center mt-2">
                    {isTotalDurationGrowthPositive ? (
                        <ArrowUpRight size={16} className="text-green-500" />
                    ) : (
                        <ArrowDownRight size={16} className="text-red-500" />
                    )}
                    <span className={`text-sm ml-1 ${isTotalDurationGrowthPositive ? "text-green-500" : "text-red-500"}`}>
                        {totalDurationGrowthDiff.toFixed(2)} min
                    </span>
                    <span className="text-gray-500 text-sm ml-1">vs last month</span>
                </div>
            </Link>
        </div>
    );
};
