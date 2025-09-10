import { Trash, Trash2 } from "lucide-react";

interface TooltipButtonProps {
  tooltip?: string;
  isDisabled?: boolean;
  isHidden?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
  text?: string;
}

export const TooltipButton: React.FC<TooltipButtonProps> = ({
  tooltip,
  onClick,
  icon,
  isDisabled = false,
  isHidden = false,
  className = "",
  text,
}) => {
  const isTrashIcon =
    (icon as any)?.type === Trash || (icon as any)?.type === Trash2;

  const buttonClasses = `
    flex items-center gap-1
    ${isDisabled ? "text-gray-500 cursor-not-allowed" : "text-gray-400"}
    ${!isDisabled ? `hover:${isTrashIcon ? "text-red-500" : "text-green-500"}` : ""}
    ${className}
  `;

  const textClasses = isDisabled ? "text-gray-500" : "text-white";

  return (
    <div className="relative group inline-block">
      <button
        onClick={onClick}
        disabled={isDisabled}
        hidden={isHidden}
        className={buttonClasses}
      >
        {icon}
        {text && <span className={textClasses}>{text}</span>}
      </button>

      {tooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
          {tooltip}
        </span>
      )}
    </div>
  );
};
