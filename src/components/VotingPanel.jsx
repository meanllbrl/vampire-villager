import React, { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { motion } from 'framer-motion';
import { Users, X, Plus, Skull, Check } from 'lucide-react';
import { cn } from '../utils/cn.js';

export const VotingPanel = () => {
    const { players, castVote, clearVotes, nextPhase, phase, votes, t, activeVoter, setActiveVoter } = useGame();

    const alivePlayers = players.filter(p => p.isAlive);

    // Calculate votes per player
    const voteCounts = {};
    alivePlayers.forEach(p => voteCounts[p.id] = 0);
    Object.values(votes).forEach(targetId => {
        if (voteCounts[targetId] !== undefined) {
            voteCounts[targetId]++;
        }
    });

    const maxVotes = Math.max(...Object.values(voteCounts), 0);
    const topVoted = alivePlayers.filter(p => voteCounts[p.id] === maxVotes && maxVotes > 0);

    // Helper to get who voted for a specific player
    const getVotersFor = (targetId) => {
        return Object.entries(votes)
            .filter(([_, tid]) => tid === targetId)
            .map(([vid]) => players.find(p => p.id === vid))
            .filter(Boolean);
    };

    const handleVoterSelect = (playerId) => {
        setActiveVoter(playerId);
    };

    const handleTargetSelect = (targetId) => {
        if (!activeVoter) return;
        if (activeVoter === targetId) {
            alert("You cannot vote for yourself!");
            return;
        }

        castVote(activeVoter, targetId);
        setActiveVoter(null);
    };

    const handleEliminate = (playerId) => {
        if (window.confirm(`Are you sure you want to eliminate ${players.find(p => p.id === playerId)?.name}?`)) {
            // Call nextPhase which will trigger resolveVotes -> eliminatePlayer -> setPhase(NIGHT)
            nextPhase();
        }
    };

    if (phase !== 'VOTING' && phase !== 'DEFENSE') {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface/50 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6 text-accent" />
                    {t('ballotBox')}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.open('/stream', '_blank', 'width=1920,height=1080')}
                        className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg flex items-center gap-2 text-sm transition-colors"
                    >
                        <Users className="w-4 h-4" />
                        {t('openStream')}
                    </button>
                    <button
                        onClick={clearVotes}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg flex items-center gap-2 text-sm transition-colors"
                    >
                        <X className="w-4 h-4" />
                        {t('resetVotes')}
                    </button>
                </div>
            </div>

            {/* Step 1: Select Voter */}
            <div className="mb-6">
                <h4 className="text-sm font-bold text-muted mb-3 uppercase tracking-wider">
                    {activeVoter ? `Step 2: Who is ${players.find(p => p.id === activeVoter)?.name} voting for?` : "Step 1: Select Voter"}
                </h4>

                {!activeVoter ? (
                    <div className="flex flex-wrap gap-2">
                        {alivePlayers.map(p => (
                            <button
                                key={p.id}
                                onClick={() => handleVoterSelect(p.id)}
                                className={cn(
                                    "px-4 py-2 rounded-xl font-medium transition-all border",
                                    votes[p.id]
                                        ? "bg-indigo-500/20 border-indigo-500 text-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                                        : "bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-200"
                                )}
                            >
                                {p.name}
                                {votes[p.id] && <Check className="w-3 h-3 inline-block ml-2" />}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-bold flex items-center gap-2">
                            {players.find(p => p.id === activeVoter)?.name}
                            <span className="text-indigo-200 font-normal">is voting...</span>
                        </div>
                        <button
                            onClick={() => setActiveVoter(null)}
                            className="text-sm text-muted hover:text-white underline"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Step 2: Select Target (Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alivePlayers.map((player) => {
                    const voters = getVotersFor(player.id);
                    const count = voteCounts[player.id] || 0;
                    const isTargetable = activeVoter && activeVoter !== player.id;

                    return (
                        <div
                            key={player.id}
                            onClick={() => isTargetable && handleTargetSelect(player.id)}
                            className={cn(
                                "flex flex-col p-4 rounded-xl border transition-all gap-3 relative overflow-hidden",
                                isTargetable ? "cursor-pointer hover:bg-indigo-500/10 hover:border-indigo-500/50 ring-2 ring-transparent hover:ring-indigo-500/30" : "",
                                count > 0 ? "bg-indigo-500/5 border-indigo-500/30" : "bg-white/5 border-white/10"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-300">
                                        {player.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold">{player.name}</p>
                                        <p className="text-xs text-muted">Votes: {count}</p>
                                    </div>
                                </div>

                                {isTargetable && (
                                    <div className="p-2 bg-indigo-500 rounded-lg text-white">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                )}
                            </div>

                            {/* Voters List */}
                            {voters.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/10">
                                    {voters.map(v => (
                                        <span key={v.id} className="text-xs px-2 py-1 bg-white/10 rounded-full text-slate-300 border border-white/5">
                                            {v.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Elimination Action */}
            <div className="mt-8 pt-6 border-t border-white/10">
                {/* Check if everyone has voted */}
                {Object.keys(votes).length < alivePlayers.length ? (
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-center">
                        <p className="text-blue-200 font-medium">
                            {t('waitingForAllVotes')} ({Object.keys(votes).length}/{alivePlayers.length})
                        </p>
                    </div>
                ) : topVoted.length === 1 && maxVotes > 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center"
                    >
                        <p className="text-red-200 mb-4">
                            <span className="font-bold text-white">{topVoted[0].name}</span> has the most votes ({maxVotes}).
                        </p>
                        <button
                            onClick={() => handleEliminate(topVoted[0].id)}
                            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <Skull className="w-5 h-5" />
                            {t('eliminate')}
                        </button>
                    </motion.div>
                ) : topVoted.length > 1 && maxVotes > 0 ? (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-center">
                        <p className="text-amber-200 font-medium">
                            {t('tie', { players: topVoted.map(p => p.name).join(', ') })}
                        </p>
                    </div>
                ) : (
                    <p className="text-center text-muted text-sm">
                        {t('waitingForVotes')}
                    </p>
                )}
            </div>
        </motion.div>
    );
};
