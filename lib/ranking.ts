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
    const defaultRank = ranks.find(r => r.requiredExp === 0) || {
        name: 'Thành viên',
        icon: '',
        color: '#A0A0A0',
        requiredExp: 0
    };
    
    const postCount = user ? allImages.filter(img => img.user_id === user.id).length : 0;

    if (!user) {
        return { 
            name: defaultRank.name,
            icon: defaultRank.icon,
            finalColor: defaultRank.color,
            className: 'text-cyber-on-surface-secondary',
            postCount: 0,
        };
    }

    if (user.role === 'admin') {
        const adminRank = ranks.find(r => r.requiredExp === -1) || { ...defaultRank, name: 'Quản trị viên', color: '#FF4141' };
        return {
            name: user.customTitle || adminRank.name,
            icon: adminRank.icon,
            finalColor: user.customTitleColor || adminRank.color,
            className: 'font-bold animate-text-glow',
            postCount,
        };
    }

    // Sort ranks by requiredExp descending to find the correct tier
    const sortedRanks = [...ranks]
      .filter(r => r.requiredExp >= 0)
      .sort((a, b) => b.requiredExp - a.requiredExp);

    const currentRank = sortedRanks.find(r => (user.exp || 0) >= r.requiredExp) || defaultRank;

    let className = 'text-cyber-on-surface';
    if (currentRank.requiredExp >= 3000) className = 'text-rank-master animate-text-glow';
    else if (currentRank.requiredExp >= 1500) className = 'text-rank-expert animate-text-glow';
    else if (currentRank.requiredExp >= 500) className = 'text-rank-advanced';
    
    return { 
        name: user.customTitle || currentRank.name,
        icon: currentRank.icon,
        finalColor: user.customTitleColor || currentRank.color,
        className,
        postCount
    };
};