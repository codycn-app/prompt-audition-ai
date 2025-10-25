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
    
    if (!currentRank) {
        currentRank = sortedRanks[0] || { name: 'Thành viên', requiredExp: 0, color: '#A0A0A0', icon: '' };
        nextRank = sortedRanks.length > 1 ? sortedRanks[1] : undefined;
    }
    
    const expForCurrentRank = currentRank?.requiredExp ?? 0;
    const expForNextRank = nextRank?.requiredExp ?? expForCurrentRank;

    const expInCurrentLevel = (currentUser.exp || 0) - expForCurrentRank;
    const expNeededForNextLevel = expForNextRank - expForCurrentRank;

    const progressPercentage = expNeededForNextLevel > 0 
        ? Math.min((expInCurrentLevel / expNeededForNextLevel) * 100, 100) 
        : 100;

    return (
        <div className="w-full p-4 rounded-lg bg-cyber-black/30">
            <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-semibold text-cyber-on-surface">Cấp bậc: {currentRank.name}</span>
                <span className="font-semibold text-cyber-on-surface-secondary">
                    {nextRank ? `Cấp tiếp theo: ${nextRank.name}` : 'Cấp bậc tối đa'}
                </span>
            </div>
            <div className="w-full bg-cyber-surface rounded-full h-2.5">
                <div
                    className="bg-gradient-to-r from-cyber-pink to-cyber-cyan h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>
            <div className="flex justify-between items-center mt-1 text-xs text-cyber-on-surface-secondary">
                <span>EXP: {currentUser.exp.toLocaleString('vi-VN')}</span>
                {nextRank && <span>{expForNextRank.toLocaleString('vi-VN')}</span>}
            </div>
        </div>
    );
};

export default ExpBar;
