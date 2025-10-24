import React from 'react';
import { CheckIcon } from './icons/CheckIcon';

interface ToastProps {
  message: string;
}

const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center px-4 py-3 text-black rounded-lg shadow-lg bg-gradient-to-r from-cyber-pink to-cyber-cyan animate-toast-in-out shadow-cyber-glow-lg backdrop-blur-sm">
        <CheckIcon className="w-5 h-5 mr-2" />
        <span className="text-sm font-bold">{message}</span>
      </div>
    </div>
  );
};

export default Toast;