import React, { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Trash2, Play, Scale, Info, UserPlus } from 'lucide-react';
import { cn } from '../utils/cn.js';
import { calculateGameBalance, ROLE_DESCRIPTIONS } from '../data/roles.js';

export const Setup = () => {
    const { players, addPlayer, removePlayer, startGame, gameConfig, updateGameConfig, language, setLanguage, t } = useGame();
    const [nameInput, setNameInput] = useState('');
    const [showRoleInfo, setShowRoleInfo] = useState(false);

    const balanceScore = calculateGameBalance(players.length, gameConfig);
    const isValidConfig = players.length >= 4;

    const handleAddPlayer = (e) => {
        e.preventDefault();
        if (nameInput.trim()) {
            addPlayer(nameInput.trim());
            setNameInput('');
        }
    };

    const getBalanceColor = (score) => {
        if (score === 0) return 'text-green-400';
        if (Math.abs(score) <= 2) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getBalanceText = (score) => {
        if (score === 0) return t('perfectlyBalanced');
        if (score > 0) return t('villagerFavored');
        return t('vampireFavored');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 text-center">
                    <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        {t('gameSetup')}
                    </h1>
                    <p className="text-slate-400 text-lg">{t('addPlayersDesc')}</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Player Input & List */}
                    <div className="lg:col-span-2 space-y-6">
                        <form onSubmit={handleAddPlayer} className="flex gap-4">
                            <input
                                type="text"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                placeholder={t('enterPlayerName')}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-6 py-4 text-lg focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={!nameInput.trim()}
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-xl font-bold transition-colors flex items-center gap-2"
                            >
                                <UserPlus className="w-5 h-5" />
                                {t('add')}
                            </button>
                        </form>

                        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                                <h3 className="font-bold text-slate-300">{t('playersList', { count: players.length })}</h3>
                                {players.length < 4 && (
                                    <span className="text-red-400 text-sm">{t('minPlayers')}</span>
                                )}
                            </div>
                            <div className="max-h-[400px] overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                <AnimatePresence>
                                    {players.map((player) => (
                                        <motion.div
                                            key={player.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl group hover:bg-slate-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                                                    {player.name.charAt(0)}
                                                </div>
                                                <span className="font-medium">{player.name}</span>
                                            </div>
                                            <button
                                                onClick={() => removePlayer(player.id)}
                                                className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {players.length === 0 && (
                                    <div className="text-center py-8 text-slate-500 italic">
                                        No players added yet
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Game Info & Start */}
                    <div className="space-y-6">
                        {/* Configuration Panel */}
                        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-300 flex items-center gap-2">
                                    <Scale className="w-5 h-5" />
                                    {t('gameConfig')}
                                </h3>
                                {/* Language Toggle */}
                                <div className="flex bg-slate-800 rounded-lg p-1">
                                    <button
                                        onClick={() => setLanguage('TR')}
                                        className={`px-2 py-1 rounded text-xs font-bold transition-colors ${language === 'TR' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        TR
                                    </button>
                                    <button
                                        onClick={() => setLanguage('EN')}
                                        className={`px-2 py-1 rounded text-xs font-bold transition-colors ${language === 'EN' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        EN
                                    </button>
                                </div>
                            </div>

                            {/* Vampire Count */}
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400">{t('vampires')}</span>
                                <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-1">
                                    <button
                                        onClick={() => updateGameConfig({ vampireCount: Math.max(1, gameConfig.vampireCount - 1) })}
                                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded text-slate-300"
                                    >
                                        -
                                    </button>
                                    <span className="font-bold w-4 text-center">{gameConfig.vampireCount}</span>
                                    <button
                                        onClick={() => updateGameConfig({ vampireCount: Math.min(Math.floor(players.length / 2), gameConfig.vampireCount + 1) })}
                                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded text-slate-300"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Role Toggles */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between group">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-slate-400 group-hover:text-slate-300 transition-colors">{t('DOCTOR')}</span>
                                        <div
                                            onClick={() => updateGameConfig({ hasDoctor: !gameConfig.hasDoctor })}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${gameConfig.hasDoctor ? 'bg-green-500' : 'bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${gameConfig.hasDoctor ? 'left-7' : 'left-1'}`} />
                                        </div>
                                    </label>

                                    {gameConfig.hasDoctor && (
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">{t('actionLimit')}</span>
                                            <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                                                <button
                                                    onClick={() => updateGameConfig({ doctorLimit: Math.max(1, (gameConfig.doctorLimit || 1) - 1) })}
                                                    className="w-6 h-6 flex items-center justify-center hover:bg-slate-700 rounded text-slate-300 text-xs"
                                                >
                                                    -
                                                </button>
                                                <span className="font-bold w-3 text-center text-xs">{gameConfig.doctorLimit || 1}</span>
                                                <button
                                                    onClick={() => updateGameConfig({ doctorLimit: Math.min(10, (gameConfig.doctorLimit || 1) + 1) })}
                                                    className="w-6 h-6 flex items-center justify-center hover:bg-slate-700 rounded text-slate-300 text-xs"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between group">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-slate-400 group-hover:text-slate-300 transition-colors">{t('SHERIFF')}</span>
                                        <div
                                            onClick={() => updateGameConfig({ hasSheriff: !gameConfig.hasSheriff })}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${gameConfig.hasSheriff ? 'bg-amber-500' : 'bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${gameConfig.hasSheriff ? 'left-7' : 'left-1'}`} />
                                        </div>
                                    </label>

                                    {gameConfig.hasSheriff && (
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">{t('actionLimit')}</span>
                                            <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                                                <button
                                                    onClick={() => updateGameConfig({ sheriffLimit: Math.max(1, (gameConfig.sheriffLimit || 1) - 1) })}
                                                    className="w-6 h-6 flex items-center justify-center hover:bg-slate-700 rounded text-slate-300 text-xs"
                                                >
                                                    -
                                                </button>
                                                <span className="font-bold w-3 text-center text-xs">{gameConfig.sheriffLimit || 1}</span>
                                                <button
                                                    onClick={() => updateGameConfig({ sheriffLimit: Math.min(10, (gameConfig.sheriffLimit || 1) + 1) })}
                                                    className="w-6 h-6 flex items-center justify-center hover:bg-slate-700 rounded text-slate-300 text-xs"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <label className="flex items-center justify-between cursor-pointer group">
                                    <span className="text-slate-400 group-hover:text-slate-300 transition-colors">{t('JESTER')}</span>
                                    <div
                                        onClick={() => updateGameConfig({ hasJester: !gameConfig.hasJester })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${gameConfig.hasJester ? 'bg-purple-500' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${gameConfig.hasJester ? 'left-7' : 'left-1'}`} />
                                    </div>
                                </label>
                            </div>

                            {/* Balance Indicator */}
                            <div className="pt-4 border-t border-slate-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">{t('balanceScore')}</span>
                                    <span className={`text-sm font-bold ${getBalanceColor(balanceScore)}`}>
                                        {balanceScore > 0 ? `+${balanceScore}` : balanceScore}
                                    </span>
                                </div>
                                <div className="relative h-2 bg-slate-800 rounded-full mb-2 overflow-hidden">
                                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/20 -translate-x-1/2 z-10" />
                                    <motion.div
                                        className={`absolute top-0 bottom-0 transition-all duration-500 ${balanceScore >= 0 ? 'left-1/2 bg-blue-500' : 'right-1/2 bg-red-500'}`}
                                        style={{
                                            width: `${Math.min(Math.abs(balanceScore) * 10, 50)}%`,
                                            [balanceScore >= 0 ? 'left' : 'right']: '50%'
                                        }}
                                    />
                                </div>
                                <p className={`text-xs text-center ${getBalanceColor(balanceScore)}`}>
                                    {getBalanceText(balanceScore)}
                                </p>
                            </div>
                        </div>

                        {/* Discussion Duration */}
                        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-slate-300">{t('discussionDuration')}</div>
                                    <div className="text-sm text-slate-400">{t('discussionDurationDesc')}</div>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-1">
                                    <button
                                        onClick={() => updateGameConfig({ discussionDuration: Math.max(1, (gameConfig.discussionDuration || 3) - 1) })}
                                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded text-slate-300"
                                    >
                                        -
                                    </button>
                                    <span className="font-bold w-8 text-center">{gameConfig.discussionDuration || 3}m</span>
                                    <button
                                        onClick={() => updateGameConfig({ discussionDuration: Math.min(10, (gameConfig.discussionDuration || 3) + 1) })}
                                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded text-slate-300"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Role Info Toggle */}
                        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
                            <button
                                onClick={() => setShowRoleInfo(!showRoleInfo)}
                                className="w-full flex items-center justify-between text-slate-300 hover:text-white transition-colors"
                            >
                                <span className="font-bold flex items-center gap-2">
                                    <Info className="w-5 h-5" />
                                    Role Guide
                                </span>
                                <span className="text-xs bg-slate-800 px-2 py-1 rounded">
                                    {showRoleInfo ? 'Hide' : 'Show'}
                                </span>
                            </button>

                            <AnimatePresence>
                                {showRoleInfo && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-4 space-y-3 text-sm text-slate-400 overflow-hidden"
                                    >
                                        {Object.keys(ROLE_DESCRIPTIONS).map((role) => (
                                            <div key={role} className="border-b border-slate-800/50 pb-2 last:border-0">
                                                <span className="text-indigo-400 font-bold block mb-1">{t(role)}</span>
                                                {t(`desc${role.charAt(0) + role.slice(1).toLowerCase()}`)}
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            onClick={startGame}
                            disabled={!isValidConfig}
                            className={cn(
                                "w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3",
                                isValidConfig
                                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-900/20 hover:scale-[1.02]"
                                    : "bg-slate-800 cursor-not-allowed opacity-50"
                            )}
                        >
                            <Play className="w-6 h-6 fill-current" />
                            START BROADCAST
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
