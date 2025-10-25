import React from 'react';
import { Rank, User } from '../types';

interface ExpBarProps {
    currentUser: User;
    ranks: Rank[];
}

const ExpBar: React.FC<ExpBarProps> = ({ currentUser, ranks }) => {
    // Logic to find current and next rank
    const sortedRanks = [...ranks]
        .filter(r => r.requiredExp >= 0)
        .sort((a, b) => a.requiredExp - b.requiredExp);

    let currentRank: Rank | undefined;
    let nextRank: Rank | undefined;

    // Find the user's current rank and the next one
    for (let i = 0; i < sortedRanks.length; i++) {
        if ((currentUser.exp || 0) >= sortedRanks[i].requiredExp) {
            currentRank = sortedRanks[i];
            if (i + 1 < sortedRanks.length) {
                nextRank = sortedRanks[i + 1];
            } else {
                nextRank = undefined; // Max rank
            }
        }
    }
    
    // Fallback if user has less exp than the lowest rank (which is 0)
    if (!currentRank) {
        currentRank = sortedRanks[0] || { name: 'Thành viên', requiredExp: 0, color: '#A0A0A0', icon: '' };
        nextRank = sortedRanks.length > 1 ? sortedRanks[1] : undefined;
    }
    
    const expForCurrentRank = currentRank?.requiredExp ?? 0;
    const expForNextRank = nextRank?.requiredExp ?? (currentUser.exp > expForCurrentRank ? currentUser.exp : expForCurrentRank + 1); // If no next rank, make it look full

    const expInCurrentLevel = (currentUser.exp || 0) - expForCurrentRank;
    const expNeededForNextLevel = expForNextRank - expForCurrentRank;

    const progressPercentage = expNeededForNextLevel > 0 
        ? Math.min((expInCurrentLevel / expNeededForNextLevel) * 100, 100) 
        : 100;

    return (
        // Main container with gradient border
        <div 
            className="w-full p-4 overflow-hidden rounded-lg shadow-lg bg-cyber-black/50 backdrop-blur-sm"
            style={{border: '1px solid transparent', background: 'linear-gradient(rgba(13, 13, 13, 0.8), rgba(13, 13, 13, 0.8)) padding-box, linear-gradient(120deg, rgba(255, 0, 230, 0.6), rgba(0, 255, 255, 0.6)) border-box'}}
        >
            <div className="flex flex-wrap items-baseline justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-cyber-on-surface">Cấp bậc: <span className="text-lg font-bold" style={{ color: currentRank.color, textShadow: `0 0 8px ${currentRank.color}` }}>{currentRank.name}</span></span>
                </div>
                <div className="text-sm font-semibold text-cyber-on-surface-secondary">
                    {nextRank ? `Cấp tiếp theo: ${nextRank.name}` : 'Cấp bậc tối đa'}
                </div>
            </div>
            
            <div className="relative w-full h-3 overflow-hidden rounded-full bg-cyber-surface/50">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-cyber-pink to-cyber-cyan transition-all duration-500 ease-out"
                    style={{ 
                        width: `${progressPercentage}%`,
                        boxShadow: '0 0 10px rgba(0, 255, 255, 0.7), 0 0 5px rgba(255, 0, 230, 0.7)'
                    }}
                ></div>
            </div>

            <div className="flex items-center justify-between mt-2 text-sm">
                <span className="font-semibold text-cyber-on-surface">
                    EXP: <span className="font-mono">{currentUser.exp.toLocaleString('vi-VN')}</span>
                </span>
                {nextRank && (
                    <span className="font-mono text-cyber-on-surface-secondary">
                        {expForNextRank.toLocaleString('vi-VN')}
                    </span>
                )}
            </div>
        </div>
    );
};

export default ExpBar;
