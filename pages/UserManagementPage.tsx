import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, ImagePrompt } from '../types';
import EditUserModal from '../components/EditUserModal';
import { getRankInfo } from '../lib/ranking';
import { PencilIcon } from '../components/icons/PencilIcon';

interface UserManagementPageProps {
  users: User[];
  images: ImagePrompt[];
  showToast: (message: string) => void;
}

const UserManagementPage: React.FC<UserManagementPageProps> = ({ users, images, showToast }) => {
  const { currentUser, ranks } = useAuth();
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full py-20 text-center">
        <div>
          <h2 className="text-2xl font-bold font-oxanium text-rank-admin">Truy cập bị từ chối</h2>
          <p className="mt-2 text-cyber-on-surface-secondary">Bạn không có quyền truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in-scale">
        <h1 className="text-3xl font-bold font-oxanium text-cyber-on-surface mb-6">Quản lý người dùng</h1>
        <div 
          className="w-full flex flex-col overflow-hidden rounded-xl shadow-2xl bg-cyber-surface/80 backdrop-blur-2xl shadow-cyber-glow"
          style={{border: '1px solid transparent', background: 'linear-gradient(#1A1A1A, #1A1A1A) padding-box, linear-gradient(120deg, rgba(255, 0, 230, 0.4), rgba(0, 255, 255, 0.4)) border-box'}}
        >
          <div className="flex-grow p-1 overflow-y-auto custom-scrollbar sm:p-3 md:p-6">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left text-cyber-on-surface-secondary">
                <thead className="text-xs uppercase bg-cyber-surface/30 text-cyber-on-surface">
                  <tr>
                    <th scope="col" className="px-6 py-3">Người dùng</th>
                    <th scope="col" className="px-6 py-3">Vai trò</th>
                    <th scope="col" className="px-6 py-3">Phân cấp</th>
                    <th scope="col" className="px-6 py-3 text-center">Bài đăng</th>
                    <th scope="col" className="px-6 py-3">Ngày tham gia</th>
                    <th scope="col" className="px-6 py-3"><span className="sr-only">Hành động</span></th>
                  </tr>
                </thead>
                <tbody>
                  {[...users].sort((a,b) => a.id - b.id).map(user => {
                      const rankInfo = getRankInfo(user, images, ranks);
                      return (
                        <tr key={user.id} className="border-b bg-cyber-surface/50 border-cyber-pink/10 hover:bg-cyber-surface/80">
                            <th scope="row" className="flex items-center px-6 py-4 font-medium whitespace-nowrap text-cyber-on-surface">
                                {user.avatarUrl ? (
                                    <img className="object-cover w-10 h-10 rounded-full" src={user.avatarUrl} alt={user.username}/>
                                ) : (
                                    <span className="flex items-center justify-center w-10 h-10 text-lg font-bold rounded-full bg-gradient-to-br from-cyber-pink to-cyber-cyan text-cyber-black">
                                        {user.username.charAt(0).toUpperCase()}
                                    </span>
                                )}
                                <div className="pl-3">
                                    <div className="text-base font-semibold">{user.username}</div>
                                    <div className="font-normal text-cyber-on-surface-secondary">{user.email}</div>
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
                            <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
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
    </>
  );
};
export default UserManagementPage;
