import React from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { X } from 'lucide-react';

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}> = ({ children, className = '', onClick, hover = false }) => {
  const { theme } = useThemeStore();

  if (theme === 'midnight') {
    return (
      <div
        onClick={onClick}
        className={`
          rounded-2xl p-6
          bg-white/[0.03] backdrop-blur-sm
          border border-white/[0.08]
          ${hover ? 'hover:border-white/[0.15] hover:shadow-[0_0_20px_rgba(255,215,0,0.08)] transition-all duration-300' : ''}
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
      >
        {children}
      </div>
    );
  }

  if (theme === 'soft-modern') {
    return (
      <div
        onClick={onClick}
        className={`
          rounded-2xl p-6
          shadow-[8px_8px_16px_rgba(0,0,0,0.08),-8px_-8px_16px_rgba(255,255,255,0.9)]
          ${hover ? 'hover:shadow-[4px_4px_12px_rgba(0,0,0,0.12),-4px_-4px_12px_rgba(255,255,255,1)] transition-all duration-300' : ''}
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
        style={{
          background: '#F8F6F2'
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800
        rounded-xl p-6
        border border-gray-200 dark:border-gray-700
        shadow-sm
        ${hover ? 'hover:border-primary-500 hover:shadow-md transition-all duration-300' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export const NestedCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => {
  const { theme } = useThemeStore();

  if (theme === 'midnight') {
    return (
      <div
        onClick={onClick}
        className={`
          bg-white/[0.02] rounded-xl p-4
          border border-white/[0.06]
          hover:bg-white/[0.04] hover:border-white/[0.1]
          transition-all duration-200
          ${onClick ? 'cursor-pointer group' : ''}
          ${className}
        `}
      >
        {children}
      </div>
    );
  }

  if (theme === 'soft-modern') {
    return (
      <div
        onClick={onClick}
        className={`
          bg-white rounded-xl p-4
          shadow-[4px_4px_8px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9)]
          hover:shadow-[2px_2px_6px_rgba(0,0,0,0.08),-1px_-1px_4px_rgba(255,255,255,1)]
          transition-all duration-200
          ${onClick ? 'cursor-pointer group' : ''}
          ${className}
        `}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        bg-gray-50 dark:bg-gray-700
        rounded-xl p-4
        hover:bg-gray-100 dark:hover:bg-gray-600
        transition-colors
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'action' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}> = ({ children, onClick, variant = 'primary', size = 'md', className = '', type = 'button', disabled = false }) => {
  const { theme } = useThemeStore();

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  if (theme === 'midnight') {
    const variants = {
      primary: `
        bg-gradient-to-r from-[#FFD700] via-[#FFED4A] to-[#FFA500] text-black font-semibold
        shadow-[0_0_20px_rgba(255,215,0,0.2)]
        hover:shadow-[0_0_30px_rgba(255,215,0,0.4)]
        active:brightness-90
      `,
      secondary: `
        bg-white/[0.05] text-[#FFF8E1] border border-white/[0.1]
        hover:bg-white/[0.1] hover:border-white/[0.2]
        active:bg-white/[0.03]
      `,
      action: `
        bg-white/[0.05] text-[#FFF8E1] border border-white/[0.08]
        hover:bg-white/[0.08] hover:border-white/[0.15]
        active:bg-white/[0.03]
      `,
      danger: `
        bg-gradient-to-r from-[#FF4444] to-[#CC0000] text-white
        shadow-[0_0_15px_rgba(255,68,68,0.2)]
        hover:shadow-[0_0_25px_rgba(255,68,68,0.4)]
        active:brightness-90
      `,
    };

    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`
          rounded-xl font-medium
          transition-all duration-200
          ${sizeClasses[size]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${variants[variant]}
          ${className}
        `}
      >
        {children}
      </button>
    );
  }

  if (theme === 'soft-modern') {
    const variants = {
      primary: `
        bg-gradient-to-br from-blue-500 to-blue-600 text-white
        shadow-[6px_6px_12px_rgba(0,0,0,0.15)]
        hover:shadow-[3px_3px_8px_rgba(0,0,0,0.2)]
        active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2)]
      `,
      secondary: `
        bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700
        shadow-[6px_6px_12px_rgba(0,0,0,0.08),-6px_-6px_12px_rgba(255,255,255,0.9)]
        hover:shadow-[3px_3px_8px_rgba(0,0,0,0.12)]
        active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1)]
      `,
      action: `
        bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700
        shadow-[6px_6px_12px_rgba(0,0,0,0.08),-6px_-6px_12px_rgba(255,255,255,0.9)]
        hover:shadow-[3px_3px_8px_rgba(0,0,0,0.12)]
        active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1)]
      `,
      danger: `
        bg-gradient-to-br from-red-500 to-red-600 text-white
        shadow-[6px_6px_12px_rgba(0,0,0,0.15)]
        hover:shadow-[3px_3px_8px_rgba(0,0,0,0.2)]
        active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2)]
      `,
    };

    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`
          rounded-xl font-medium
          transition-all duration-200
          ${sizeClasses[size]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${variants[variant]}
          ${className}
        `}
      >
        {children}
      </button>
    );
  }

  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600',
    secondary: 'bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
    action: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
    danger: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-xl font-medium
        transition-colors
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export const Input: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  label?: string;
  required?: boolean;
}> = ({ value, onChange, placeholder, type = 'text', className = '', label, required }) => {
  const { theme } = useThemeStore();

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {theme === 'midnight' ? (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="
            w-full px-4 py-2.5
            bg-white/[0.04] rounded-xl
            border-2 border-white/[0.08]
            focus:border-[#FFD700] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.15)]
            transition-all
            text-[#FFF8E1] placeholder:text-white/30
          "
        />
      ) : theme === 'soft-modern' ? (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="
            w-full px-4 py-2.5
            bg-white rounded-xl
            shadow-[4px_4px_8px_rgba(0,0,0,0.06),-2px_-2px_6px_rgba(255,255,255,0.9)]
            border-2 border-transparent
            focus:border-blue-500 focus:shadow-[2px_2px_6px_rgba(0,0,0,0.08)]
            transition-all
            text-gray-700 placeholder:text-gray-400
          "
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="
            w-full px-4 py-2.5
            bg-white dark:bg-gray-700
            border-2 border-gray-200 dark:border-gray-600
            rounded-xl
            focus:border-primary-500 focus:ring-2 focus:ring-primary-500
            transition-all
            text-gray-900 dark:text-white
          "
        />
      )}
    </div>
  );
};

export const Select: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  label?: string;
  required?: boolean;
  className?: string;
}> = ({ value, onChange, options, label, required, className = '' }) => {
  const { theme } = useThemeStore();

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {theme === 'midnight' ? (
        <select
          value={value}
          onChange={onChange}
          required={required}
          className="
            w-full px-4 py-2.5
            bg-white/[0.04] rounded-xl
            border-2 border-white/[0.08]
            focus:border-[#FFD700] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.15)]
            transition-all
            text-[#FFF8E1]
          "
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-gray-900 text-white">
              {option.label}
            </option>
          ))}
        </select>
      ) : theme === 'soft-modern' ? (
        <select
          value={value}
          onChange={onChange}
          required={required}
          className="
            w-full px-4 py-2.5
            bg-white rounded-xl
            shadow-[4px_4px_8px_rgba(0,0,0,0.06),-2px_-2px_6px_rgba(255,255,255,0.9)]
            border-2 border-transparent
            focus:border-blue-500 focus:shadow-[2px_2px_6px_rgba(0,0,0,0.08)]
            transition-all
            text-gray-700
          "
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <select
          value={value}
          onChange={onChange}
          required={required}
          className="
            w-full px-4 py-2.5
            bg-white dark:bg-gray-700
            border-2 border-gray-200 dark:border-gray-600
            rounded-xl
            focus:border-primary-500 focus:ring-2 focus:ring-primary-500
            transition-all
            text-gray-900 dark:text-white
          "
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export const IconBadge: React.FC<{
  icon: React.ReactNode;
  gradient: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ icon, gradient, size = 'md', className = '' }) => {
  const { theme } = useThemeStore();

  const sizes = {
    sm: 'w-8 h-8 p-2',
    md: 'w-12 h-12 p-3',
    lg: 'w-16 h-16 p-4',
  };

  if (theme === 'midnight') {
    return (
      <div
        className={`
          ${sizes[size]} rounded-xl ${gradient}
          shadow-[0_0_12px_rgba(255,215,0,0.1)]
          flex items-center justify-center
          transition-all duration-200 hover:scale-110 hover:shadow-[0_0_20px_rgba(255,215,0,0.2)]
          ${className}
        `}
      >
        {icon}
      </div>
    );
  }

  if (theme === 'soft-modern') {
    return (
      <div
        className={`
          ${sizes[size]} rounded-xl ${gradient}
          shadow-[4px_4px_8px_rgba(0,0,0,0.15),inset_2px_2px_4px_rgba(255,255,255,0.3)]
          flex items-center justify-center
          transition-transform hover:scale-110
          ${className}
        `}
      >
        {icon}
      </div>
    );
  }

  return (
    <div className={`${sizes[size]} rounded-xl ${gradient} flex items-center justify-center ${className}`}>
      {icon}
    </div>
  );
};

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}> = ({ children, variant = 'default', className = '' }) => {
  const { theme } = useThemeStore();

  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <span
      className={`
        px-3 py-1 rounded-lg text-xs font-medium
        ${theme === 'soft-modern' ? 'shadow-inner' : ''}
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}> = ({ isOpen, onClose, title, children, maxWidth = '2xl' }) => {
  const { theme } = useThemeStore();

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  if (theme === 'midnight') {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div
          className={`bg-[#0a0a0a] rounded-2xl border border-white/[0.1] shadow-[0_0_40px_rgba(0,0,0,0.8)] ${maxWidths[maxWidth]} w-full max-h-[90vh] overflow-hidden flex flex-col`}
        >
          <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between sticky top-0 bg-[#0a0a0a]">
            <h2 className="text-xl font-semibold text-[#FFF8E1]">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/[0.08] rounded-xl transition-colors">
              <X size={20} className="text-white/60" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">{children}</div>
        </div>
      </div>
    );
  }

  if (theme === 'soft-modern') {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div
          className={`rounded-2xl shadow-[16px_16px_32px_rgba(0,0,0,0.15),-8px_-8px_24px_rgba(255,255,255,0.9)] ${maxWidths[maxWidth]} w-full max-h-[90vh] overflow-hidden flex flex-col`}
          style={{ background: '#F8F6F2' }}
        >
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0" style={{ background: '#F8F6F2' }}>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
              <X size={20} className="text-gray-600" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 ${maxWidths[maxWidth]} w-full max-h-[90vh] overflow-hidden flex flex-col`}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

export const PageContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const { theme } = useThemeStore();

  if (theme === 'midnight') {
    return (
      <div className={`h-full flex flex-col p-6 bg-black ${className}`}>
        {children}
      </div>
    );
  }

  if (theme === 'soft-modern') {
    return (
      <div
        className={`h-full flex flex-col p-6 ${className}`}
        style={{
          background: 'linear-gradient(135deg, #F0EDE7 0%, #F8F6F2 50%, #E8E4DC 100%)'
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col p-6 bg-gray-50 dark:bg-gray-900 ${className}`}>
      {children}
    </div>
  );
};
