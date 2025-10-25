import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CloseIcon } from './icons/CloseIcon';
import { useToast } from '../contexts/ToastContext';

interface LoginModalProps {
  onClose: () => void;
  onSwitchToSignup: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      showToast('Đăng nhập thành công!', 'success');
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formInputStyle = "w-full p-2.5 bg-cyber-surface border border-cyber-pink/20 placeholder-cyber-on-surface-secondary text-cyber-on-surface rounded-lg focus:ring-cyber-pink focus:border-cyber-pink transition";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg animate-fade-in-scale"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md max-h-full overflow-hidden rounded-xl shadow-2xl bg-cyber-surface/80 backdrop-blur-2xl shadow-cyber-glow-lg"
        onClick={(e) => e.stopPropagation()}
        style={{border: '1px solid transparent', background: 'linear-gradient(#1A1A1A, #1A1A1A) padding-box, linear-gradient(120deg, #FF00E6, #00FFFF) border-box'}}
      >
        <div className="flex items-center justify-between p-4 border-b border-cyber-pink/20">
          <h2 className="text-xl font-semibold">Đăng nhập</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-full hover:bg-cyber-surface active:scale-95"
            aria-label="Đóng"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="email-login" className="block mb-2 text-sm font-medium text-cyber-on-surface">Email</label>
            <input id="email-login" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={formInputStyle} placeholder="ban@email.com" required />
          </div>
          <div>
            <label htmlFor="password-login" className="block mb-2 text-sm font-medium text-cyber-on-surface">Mật khẩu</label>
            <input id="password-login" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={formInputStyle} placeholder="••••••••" required />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex flex-col pt-2 space-y-3">
            <button type="submit" className="w-full px-5 py-3 text-sm font-medium text-white transition-all duration-300 rounded-lg shadow-lg bg-gradient-to-r from-cyber-pink to-cyber-cyan hover:shadow-cyber-glow active:scale-95">
              Đăng nhập
            </button>
            <p className="text-sm text-center text-cyber-on-surface-secondary">
              Chưa có tài khoản?{' '}
              <button type="button" onClick={onSwitchToSignup} className="font-medium text-cyber-cyan hover:underline">
                Đăng ký
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;