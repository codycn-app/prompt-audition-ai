import React, { useEffect, useState } from 'react';
import { CheckIcon } from './icons/CheckIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { Toast as ToastType } from '../contexts/ToastContext';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const ICONS = {
  success: <CheckIcon className="w-6 h-6" />,
  error: <ExclamationTriangleIcon className="w-6 h-6" />,
  info: <InformationCircleIcon className="w-6 h-6" />,
};

const STYLES = {
  success: {
    gradient: 'from-cyber-cyan/80 to-green-500/80',
    color: 'text-white',
    shadow: 'shadow-cyber-glow'
  },
  error: {
    gradient: 'from-cyber-pink/80 to-red-600/80',
    color: 'text-white',
    shadow: 'shadow-cyber-glow'
  },
  info: {
    gradient: 'from-cyber-surface/90 to-cyber-black/90',
    color: 'text-cyber-on-surface',
    shadow: ''
  },
};

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      const removeTimer = setTimeout(() => onRemove(toast.id), 300); // Wait for animation
      return () => clearTimeout(removeTimer);
    }, 4000); // 4 seconds visible

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const style = STYLES[toast.type];

  return (
    <div 
      className={`
        flex items-center w-full max-w-xs p-4 space-x-4 rounded-lg shadow-lg backdrop-blur-sm 
        bg-gradient-to-br ${style.gradient} ${style.color} ${style.shadow}
        transition-all duration-300 ease-in-out
        ${isExiting ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}
      `}
      role="alert"
    >
      <div className="flex-shrink-0">{ICONS[toast.type]}</div>
      <div className="text-sm font-semibold">{toast.message}</div>
    </div>
  );
};

export default Toast;