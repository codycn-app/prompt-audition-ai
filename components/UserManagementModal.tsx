import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, ImagePrompt } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import EditUserModal from './EditUserModal';
import { getRankInfo } from '../lib/ranking';
import { PencilIcon } from './icons/PencilIcon';
import Toast from './Toast';

interface UserManagementModalProps {
  onClose: () => void;
  images: ImagePrompt[];
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ onClose, images }) => {
  const { users, currentUser, ranks } = useAuth();
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };
  
  if (currentUser?.role !== 'admin') {
    return null; // Should not happen if button is hidden, but as a safeguard.
  }
  
  return (
    <>
      <div 
        className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/60 backdrop-blur-lg animate-fade-in-scale"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-xl shadow-2xl bg-cyber-surface/80 backdrop-blur-2xl shadow-cyber-glow-lg"
          onClick={(e) => e.stopPropagation()}
          style={{border: '1px solid transparent', background: 'linear-gradient(#1A1A1A, #1A1A1A) padding-box, linear-gradient(120deg, #FF00E6, #00FFFF) border-box'}}
        >
          <div className="flex items-center justify-between p-4 border-b shrink-0 border-cyber-pink/20">
            <h2 className="text-xl font-semibold">Quản lý người dùng</h2>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 transition-colors rounded-full hover:bg-cyber-surface active:scale-95"
              aria-label="Đóng"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-grow p-1 overflow-y-auto custom-scrollbar sm:p-3 md:p-6">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left text-cyber-on-surface-secondary">
                <thead className="text-xs uppercase bg-cyber-surface/30 text-cyber-on-surface">
                  <tr>
                    <th scope="col" className="px-6 py-3">Người dùng</th>
                    <th scope="col" className="px-6 py-3">Vai trò</th>
                    <th scope="col" className="px-6 py-3">Phân cấp</th>
                    <th scope="col" className="px-6 py-3 text-center">Bài đăng</th>
                    <th scope="col" className="px-6 py-3">Email</th>
                    <th scope="col" className="px-6 py-3"><span className="sr-only">Hành động</span></th>
                  </tr>
                </thead>
                <tbody>
                  {[...users].sort((a, b) => a.username.localeCompare(b.username)).map(user => {
                      const rankInfo = getRankInfo(user, images, ranks);
                      return (
                        <tr key={user.id} className="border-b bg-cyber-surface/50 border-cyber-pink/10 hover:bg-cyber-surface/80">
                            <th scope="row" className="flex items-center px-6 py-4 font-medium whitespace-nowrap text-cyber-on-surface">
                                {user.avatarUrl ? (
                                    <img className="w-10 h-10 rounded-full object-cover" src={user.avatarUrl} alt={user.username}/>
                                ) : (
                                    <span className="flex items-center justify-center w-10 h-10 text-lg font-bold rounded-full bg-gradient-to-br from-cyber-pink to-cyber-cyan text-cyber-black">
                                        {user.username.charAt(0).toUpperCase()}
                                    </span>
                                )}
                                <div className="pl-3">
                                    <div className="text-base font-semibold">{user.username}</div>
                                </div>  
                            </th>
                            <td className="px-6 py-4">
                                {user.role === 'admin' ? 
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-rank-admin/20 text-rank-admin">Admin</span> : 
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-cyber-cyan/10 text-cyber-cyan">User</span>
                                }
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5" style={{ color: rankInfo.finalColor }}>
                                    {rankInfo.icon && <img src={rankInfo.icon} alt={rankInfo.name} className="w-4 h-4" />}
                                    <span>{rankInfo.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">{rankInfo.postCount}</td>
                            <td className="px-6 py-4">{user.email}</td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => setUserToEdit(user)}
                                  className="p-2 text-gray-400 transition-colors rounded-full hover:bg-cyber-surface hover:text-cyber-cyan"
                                  aria-label={`Chỉnh sửa ${user.username}`}
                                >
                                  <PencilIcon className="w-5 h-5" />
                                </button>
                            </td>
                        </tr>
                      )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {userToEdit && (
        <EditUserModal user={userToEdit} onClose={() => setUserToEdit(null)} showToast={showToast} />
      )}
      {toastMessage && <div className="z-[80]"><Toast message={toastMessage} /></div>}
    </>
  );
};
export default UserManagementModal;