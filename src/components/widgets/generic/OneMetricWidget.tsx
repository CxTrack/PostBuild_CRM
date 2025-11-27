import React from 'react';
import { LucideIcon } from "lucide-react";

interface OneMetricWidgetProps {
  name: string;
  top_value: string;
  bottom_value?: number | null; // optional
  icon: LucideIcon;
  color: "blue" | "yellow" | "red" | "orange"; // restrict to supported colors
}

const OneMetricWidget: React.FC<OneMetricWidgetProps> = ({
  name,
  top_value,
  bottom_value,
  icon: Icon,
  color
}) => {

  // Tailwind-safe gradient groups
  const colorClasses: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    yellow: "from-yellow-500 to-yellow-600",
    orange: "from-orange-500 to-orange-600",
    red: "from-red-500 to-red-600",
  };

  // Tailwind-safe hover styling
  const hoverColorClasses: Record<string, string> = {
    blue: "hover:shadow-blue-500/10 hover:border-blue-500/30",
    yellow: "hover:shadow-yellow-500/10 hover:border-yellow-500/30",
    orange: "from-orange-500 to-orange-600",
    red: "hover:shadow-red-500/10 hover:border-red-500/30",
  };

  const gradient = colorClasses[color];
  const hoverEffects = hoverColorClasses[color];

  return (
    <div
      className={`
        bg-gradient-to-br 
        from-slate-800/80 
        to-slate-700/80 
        backdrop-blur-sm 
        rounded-2xl 
        p-8 
        border 
        border-slate-600/50 
        shadow-2xl
        transition-all duration-300 
        hover:scale-105
        ${hoverEffects}
        animate-fadeIn
      `}
    >
      <div className="flex items-center gap-3 mb-2">

        {/* Icon container */}
        <div className={`p-4 rounded-xl bg-gradient-to-r ${gradient} shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Main metric text */}
        <div className="flex-1">
          <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wide">
            {name}
          </h3>

          <div
            className={`
              text-3xl font-bold 
              bg-gradient-to-r 
              ${gradient}
              bg-clip-text 
              text-transparent
            `}
          >
            {top_value}
          </div>
        </div>

        {/* Optional bottom metric */}
        {bottom_value != null && (
          <div
            className={`
              text-sm font-semibold
              ${bottom_value > 0 ? "text-green-400" : "text-red-400"}
            `}
          >
            {bottom_value}
          </div>
        )}

      </div>
    </div>
  );
};

export default OneMetricWidget;
