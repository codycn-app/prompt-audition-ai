import React from 'react';
import { User, ImagePrompt } from '../types';
import { getRankInfo } from '../lib/ranking';
import { CrownIcon } from '../components/icons/CrownIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { HeartIcon } from '../components/icons/HeartIcon';
import { ChatBubbleIcon } from '../components/icons/ChatBubbleIcon';
import { DocumentDuplicateIcon } from '../components/icons/DocumentDuplicateIcon';
import { useAuth } from '../contexts/AuthContext';

interface LeaderboardPageProps {
    users: User[];
    images: ImagePrompt[];
    currentUser: User | null;
}

interface UserStats {
    user: User;
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalViews: number;
    score: number;
}

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ users, images, currentUser }) => {
    const { ranks } = useAuth();

    const userStats: UserStats[] = users.map(user => {
        const userImages = images.filter(img => img.user_id === user.id);
        const totalPosts = userImages.length;
        const totalLikes = userImages.reduce((sum, img) => sum + img.likes.length, 0);
        // FIX: Use optional chaining since comments can be undefined.
        const totalComments = userImages.reduce((sum, img) => sum + (img.comments?.[0]?.count ?? 0), 0);
        const totalViews = userImages.reduce((sum, img) => sum + (img.views || 0), 0);
        
        // Scoring formula: likes are most valuable, then comments, then posts, then views.
        const score = (totalLikes * 5) + (totalComments * 3) + (totalPosts * 10) + (totalViews * 1);
        
        return { user, totalPosts, totalLikes, totalComments, totalViews, score };
    });

    const sortedUsers = userStats.sort((a, b) => b.score - a.score);

    const getRankClass = (rank: number) => {
        if (rank === 0) return 'text-rank-master'; // Gold
        if (rank === 1) return 'text-rank-silver'; // Silver
        if (rank === 2) return 'text-rank-bronze'; // Bronze
        return 'text-cyber-on-surface-secondary';
    };

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in-scale">
            <div className="flex flex-col items-center text-center mb-8">
                <CrownIcon className="w-16 h-16 text-rank-master animate-icon-glow" />
                <h1 className="text-4xl font-bold font-oxanium text-cyber-on-surface mt-4">Bảng Xếp Hạng</h1>
                <p className="mt-2 text-cyber-on-surface-secondary">Vinh danh những người đóng góp hàng đầu cho cộng đồng.</p>
            </div>

            <div 
                className="w-full flex flex-col overflow-hidden rounded-xl shadow-2xl bg-cyber-surface/80 backdrop-blur-2xl shadow-cyber-glow"
                style={{border: '1px solid transparent', background: 'linear-gradient(#1A1A1A, #1A1A1A) padding-box, linear-gradient(120deg, rgba(255, 0, 230, 0.4), rgba(0, 255, 255, 0.4)) border-box'}}
            >
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[700px] text-sm text-left text-cyber-on-surface-secondary">
                        <thead className="text-xs uppercase bg-cyber-surface/30 text-cyber-on-surface">
                            <tr>
                                <th scope="col" className="w-16 px-6 py-3 text-center">Hạng</th>
                                <th scope="col" className="px-6 py-3">Người dùng</th>
                                <th scope="col" className="px-6 py-3 text-center">Điểm</th>
                                <th scope="col" className="px-6 py-3 text-center">Bài đăng</th>
                                <th scope="col" className="px-6 py-3 text-center">Lượt xem</th>
                                <th scope="col" className="px-6 py-3 text-center">Yêu thích</th>
                                <th scope="col" className="px-6 py-3 text-center">Bình luận</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedUsers.map((stat, index) => {
                                const rankInfo = getRankInfo(stat.user, images, ranks);
                                const isCurrentUser = currentUser?.id === stat.user.id;
                                const rankClass = getRankClass(index);
                                return (
                                    <tr key={stat.user.id} className={`border-b border-cyber-pink/10 transition-colors ${isCurrentUser ? 'bg-cyber-cyan/10' : 'bg-cyber-surface/50 hover:bg-cyber-surface/80'}`}>
                                        <td className={`px-6 py-4 text-center font-bold text-lg ${rankClass}`}>
                                            {index + 1}
                                        </td>
                                        <th scope="row" className="flex items-center px-6 py-4 font-medium whitespace-nowrap text-cyber-on-surface">
                                            {stat.user.avatar_url ? (
                                                <img className="object-cover w-10 h-10 rounded-full" src={stat.user.avatar_url} alt={stat.user.username}/>
                                            ) : (
                                                <span className="flex items-center justify-center w-10 h-10 text-lg font-bold rounded-full bg-gradient-to-br from-cyber-pink to-cyber-cyan text-cyber-black">
                                                    {stat.user.username.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                            <div className="pl-3">
                                                <div className={`text-base font-semibold ${rankInfo.className}`} style={{ color: rankInfo.finalColor }}>{stat.user.username}</div>
                                                <div className="flex items-center gap-1.5 text-xs" style={{ color: rankInfo.finalColor }}>
                                                    {rankInfo.icon && <img src={rankInfo.icon} alt={rankInfo.name} className="w-3 h-3" />}
                                                    <span>{rankInfo.name}</span>
                                                </div>
                                            </div>  
                                        </th>
                                        <td className="px-6 py-4 text-center font-semibold text-cyber-cyan">{stat.score.toLocaleString('vi-VN')}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5"><DocumentDuplicateIcon className="w-4 h-4"/>{stat.totalPosts.toLocaleString('vi-VN')}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5"><EyeIcon className="w-4 h-4"/>{stat.totalViews.toLocaleString('vi-VN')}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5"><HeartIcon className="w-4 h-4"/>{stat.totalLikes.toLocaleString('vi-VN')}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5"><ChatBubbleIcon className="w-4 h-4"/>{stat.totalComments.toLocaleString('vi-VN')}</div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardPage;