import { Trash, Trash2 } from "lucide-react";

interface TooltipButtonProps {
  tooltip: string;
  onClick?: () => void;
  icon: React.ReactNode; // pass an icon or any JSX
}

export const TooltipButton: React.FC<TooltipButtonProps> = ({ tooltip, onClick, icon }) => {
  const handleClick = () => {
    onClick?.(); // call external function if provided
  };

  return (
    <div className="relative group inline-block">
      <button
        onClick={handleClick}
        className={`text-gray-400 hover:${
          ((icon as any)?.type === Trash || (icon as any)?.type === Trash2 ) ? 'text-red-500' : 'text-green-500'
        }`}
      >
        {icon}
      </button>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
        {tooltip}
      </span>
    </div>
  );
};
