import React from 'react';
import { User, ImagePrompt, Rank } from '../types';

export interface RankInfo {
    name: string; // The final display title (custom title or rank name)
    finalColor: string; // The final color for the title (custom or rank color)
    icon: string; // URL or data URI
    className: string; // For styling the username
    postCount: number;
}

export const getRankInfo = (user: User | null | undefined, allImages: ImagePrompt[], ranks: Rank[]): RankInfo => {
    const defaultRank = ranks.find(r => r.requiredPosts === 0) || {
        name: 'Thành viên',
        icon: '',
        color: '#A0A0A0',
        requiredPosts: 0
    };
    
    if (!user) {
        return { 
            name: defaultRank.name,
            icon: defaultRank.icon,
            finalColor: defaultRank.color,
            className: 'text-cyber-on-surface-secondary',
            postCount: 0,
        };
    }

    const postCount = allImages.filter(img => img.userId === user.id).length;

    if (user.role === 'admin') {
        const adminRank = ranks.find(r => r.requiredPosts === -1) || { ...defaultRank, name: 'Quản trị viên', color: '#FF4141' };
        return {
            name: user.customTitle || adminRank.name,
            icon: adminRank.icon,
            finalColor: user.customTitleColor || adminRank.color,
            className: 'font-bold animate-text-glow',
            postCount,
        };
    }

    // Sort ranks by requiredPosts descending to find the correct tier
    const sortedRanks = [...ranks]
      .filter(r => r.requiredPosts >= 0)
      .sort((a, b) => b.requiredPosts - a.requiredPosts);

    const currentRank = sortedRanks.find(r => postCount >= r.requiredPosts) || defaultRank;

    let className = 'text-cyber-on-surface';
    if (postCount >= 50) className = 'text-rank-master animate-text-glow';
    else if (postCount >= 30) className = 'text-rank-expert animate-text-glow';
    else if (postCount >= 15) className = 'text-rank-advanced';
    
    return { 
        name: user.customTitle || currentRank.name,
        icon: currentRank.icon,
        finalColor: user.customTitleColor || currentRank.color,
        className,
        postCount
    };
};
