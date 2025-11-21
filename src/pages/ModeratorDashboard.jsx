import React, { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { ROLES, ROLE_DETAILS } from '../data/roles.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Eye,
    EyeOff,
    Copy,
    Check,
    Moon,
    Sun,
    Shield,
    Search,
    Skull,
    Play,
    RotateCcw,
    Users,
    ArrowRight,
    Skull as SkullIcon
} from 'lucide-react';
import { cn } from '../utils/cn.js';
import { VotingPanel } from '../components/VotingPanel.jsx';
import { PhaseScript } from '../components/PhaseScript.jsx';
import { PlayerGrid } from '../components/PlayerGrid.jsx';

export const ModeratorDashboard = () => {
    const {
        players,
        phase,
        turn,
        nightAction,
        setVampireTarget,
        setDoctorTarget,
        setSheriffTarget,
        resolveNight,
        nextPhase,
        resetGame,
        startGame,
        restartGame,
        winner,
        t,
        roleActions,
        useRoleAction
    } = useGame();

    if (phase === 'GAME_OVER') {
        return (
            <div className="min-h-screen bg-slate-950 text-white p-8 flex items-center justify-center">
                <div className="max-w-2xl w-full bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-white">GAME OVER</h1>
                        <h2 className={`text-2xl font-bold ${winner === 'VILLAGERS' ? 'text-green-400' :
                            winner === 'VAMPIRES' ? 'text-red-400' :
                                'text-purple-400'
                            }`}>
                            {winner} WIN!
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={restartGame}
                            className="p-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <Play className="w-5 h-5" />
                            Start Next Round
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="p-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-300 transition-colors flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="w-5 h-5" />
                            Full Reset
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const [showRoles, setShowRoles] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    const copyRoleToClipboard = (playerId) => {
        const player = players.find(p => p.id === playerId);
        if (!player || !player.role) {
            alert('Role not assigned yet! Start the game first.');
            return;
        }

        const role = ROLE_DETAILS[player.role];
        const message = `🎭 ${player.name}, your role is: ${role.nameTR} (${role.name})\n\n${role.descriptionTR}\n\nAlignment: ${role.alignment === 'good' ? 'İyi (Good)' : 'Kötü (Evil)'}\nNight Action: ${role.nightAction ? 'Yes' : 'No'}`;

        navigator.clipboard.writeText(message);
        setCopiedId(playerId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const copyAllRoles = () => {
        console.log('Copying roles...', players);
        const messages = players
            .map(player => {
                if (!player.role) {
                    console.warn('Player has no role:', player);
                    return '';
                }
                const role = ROLE_DETAILS[player.role];
                if (!role) {
                    console.error('Role details not found for:', player.role);
                    return '';
                }
                return `🎭 ${player.name}: ${role.nameTR} (${role.name})`;
            })
            .filter(msg => msg !== '') // Filter out empty strings
            .join('\n');

        console.log('Messages to copy:', messages);

        if (messages) {
            navigator.clipboard.writeText(messages);
            setCopiedId('all');
            setTimeout(() => setCopiedId(null), 2000);
        } else {
            alert('No roles to copy! Make sure the game has started.');
        }
    };

    const alivePlayers = players.filter(p => p.isAlive);
    const isNightPhase = phase.includes('NIGHT');

    // --- Render Helpers ---

    const canRoleAct = (roleName) => {
        const rolePlayer = players.find(p => p.role === roleName);
        // If role doesn't exist in game, allow moderator to skip
        if (!rolePlayer) return true;
        // Must be alive AND have actions left
        return rolePlayer.isAlive && roleActions[roleName] > 0;
    };

    const renderNightAction = () => {
        if (phase === 'NIGHT_VAMPIRE') {
            const selectedPlayer = players.find(p => p.id === nightAction.vampireTarget);
            return (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                        <SkullIcon className="w-5 h-5" />
                        {t('selectVictim')}
                    </h3>

                    {/* Skip / No Kill Button */}
                    <button
                        onClick={() => setVampireTarget(null)}
                        className={cn(
                            "w-full p-4 rounded-xl border-2 border-dashed text-center transition-all flex items-center justify-center gap-2 font-bold",
                            nightAction.vampireTarget === null
                                ? "bg-indigo-500/20 border-indigo-500 text-indigo-200"
                                : "bg-white/5 border-white/20 text-white/50 hover:text-white hover:border-white/50"
                        )}
                    >
                        <span className="uppercase tracking-widest text-sm">{t('skipNoKill')}</span>
                    </button>

                    <PlayerGrid
                        players={alivePlayers}
                        filter={p => p.role !== 'vampire'}
                        selectedId={nightAction.vampireTarget}
                        onSelect={setVampireTarget}
                        variant="vampire"
                    />
                    {nightAction.vampireTarget && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                        >
                            <p className="text-red-200 mb-4 text-center">
                                {t('confirmVictim')}: <span className="font-bold text-white">{selectedPlayer?.name}</span>?
                            </p>
                            <button
                                onClick={nextPhase}
                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {t('confirmNextPhase')}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}
                    {nightAction.vampireTarget === null && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl"
                        >
                            <p className="text-indigo-200 mb-4 text-center">
                                {t('noVictimSelected')}
                            </p>
                            <button
                                onClick={nextPhase}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {t('confirmNextPhase')}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}
                </div>
            );
        }
        if (phase === 'NIGHT_DOCTOR') {
            const selectedPlayer = players.find(p => p.id === nightAction.doctorTarget);
            const canAct = canRoleAct('DOCTOR');

            return (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-green-400 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            {t('selectProtected')}
                        </h3>
                        <span className="text-sm font-mono text-green-400/70 bg-green-900/30 px-2 py-1 rounded">
                            {t('actionsLeft', { count: roleActions['DOCTOR'] || 0 })}
                        </span>
                    </div>

                    {/* Skip / No Action Button */}
                    {canAct && (
                        <button
                            onClick={() => {
                                setDoctorTarget(null);
                                nextPhase();
                            }}
                            className={cn(
                                "w-full p-4 rounded-xl border-2 border-dashed text-center transition-all flex items-center justify-center gap-2 font-bold",
                                nightAction.doctorTarget === null
                                    ? "bg-green-500/20 border-green-500 text-green-200"
                                    : "bg-white/5 border-white/20 text-white/50 hover:text-white hover:border-white/50"
                            )}
                        >
                            <span className="uppercase tracking-widest text-sm">{t('skipAction')}</span>
                        </button>
                    )}

                    {!canAct && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                            <p className="text-red-300 font-bold">{t('roleCannotAct')}</p>
                        </div>
                    )}

                    {canAct && (
                        <PlayerGrid
                            players={alivePlayers}
                            selectedId={nightAction.doctorTarget}
                            onSelect={setDoctorTarget}
                            variant="doctor"
                        />
                    )}

                    {(nightAction.doctorTarget || !canAct) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
                        >
                            {canAct && (
                                <p className="text-green-200 mb-4 text-center">
                                    {t('confirmProtection')}: <span className="font-bold text-white">{selectedPlayer?.name}</span>?
                                </p>
                            )}
                            <button
                                onClick={() => {
                                    if (canAct) useRoleAction('DOCTOR');
                                    nextPhase();
                                }}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {t('confirmNextPhase')}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}
                </div>
            );
        }
        if (phase === 'NIGHT_SHERIFF') {
            const canAct = canRoleAct('SHERIFF');

            return (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                            <Eye className="w-5 h-5" />
                            {t('selectSuspect')}
                        </h3>
                        <span className="text-sm font-mono text-amber-400/70 bg-amber-900/30 px-2 py-1 rounded">
                            {t('actionsLeft', { count: roleActions['SHERIFF'] || 0 })}
                        </span>
                    </div>

                    {/* Skip / No Action Button */}
                    {canAct && (
                        <button
                            onClick={() => {
                                setSheriffTarget(null);
                                nextPhase();
                            }}
                            className={cn(
                                "w-full p-4 rounded-xl border-2 border-dashed text-center transition-all flex items-center justify-center gap-2 font-bold",
                                nightAction.sheriffTarget === null
                                    ? "bg-amber-500/20 border-amber-500 text-amber-200"
                                    : "bg-white/5 border-white/20 text-white/50 hover:text-white hover:border-white/50"
                            )}
                        >
                            <span className="uppercase tracking-widest text-sm">{t('skipAction')}</span>
                        </button>
                    )}

                    {!canAct && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                            <p className="text-red-300 font-bold">{t('roleCannotAct')}</p>
                        </div>
                    )}

                    {canAct && (
                        <PlayerGrid
                            players={alivePlayers}
                            filter={p => p.role !== 'sheriff'}
                            selectedId={nightAction.sheriffTarget}
                            onSelect={setSheriffTarget}
                            variant="sheriff"
                        />
                    )}

                    {nightAction.sheriffResult && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={cn(
                                "p-4 rounded-xl border-2 text-center font-bold text-lg",
                                nightAction.sheriffResult === 'vampire'
                                    ? "bg-red-500/20 border-red-500 text-red-300"
                                    : "bg-green-500/20 border-green-500 text-green-300"
                            )}
                        >
                            {t('investigationResult')}: {nightAction.sheriffResult === 'vampire' ? '🧛 VAMPIRE' : '✓ NOT VAMPIRE'}
                        </motion.div>
                    )}

                    {(nightAction.sheriffResult || !canAct) && (
                        <button
                            onClick={() => {
                                if (canAct) useRoleAction('SHERIFF');
                                nextPhase();
                            }}
                            className="w-full py-4 bg-primary hover:bg-primary/90 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {t('confirmNextPhase')}
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    )}
                </div>
            );
        }
        return null;
    };

    const handleReset = () => {
        if (window.confirm("Are you sure you want to reset the game? This cannot be undone.")) {
            resetGame();
        }
    };

    // Dynamic Theme Colors based on Phase
    const getThemeColors = () => {
        if (phase === 'NIGHT_DOCTOR') return 'border-green-500/30 bg-green-900/10';
        if (phase === 'NIGHT_SHERIFF') return 'border-amber-500/30 bg-gradient-to-br from-slate-900/90 via-blue-900/20 to-amber-900/20 shadow-[inset_0_0_100px_rgba(251,191,36,0.1)]'; // Police Theme: Amber + Blue
        if (phase === 'NIGHT_VAMPIRE') return 'border-red-500/30 bg-red-900/10';
        return 'border-white/5 bg-surface/30';
    };

    return (
        <div className="min-h-screen p-4 lg:p-6 flex flex-col gap-6 max-w-[1600px] mx-auto">
            {/* Top Bar: Status & Global Controls */}
            <header className="bg-surface/50 backdrop-blur-xl rounded-2xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                        phase === 'NIGHT_DOCTOR' ? "bg-green-500/20 text-green-300" :
                            phase === 'NIGHT_SHERIFF' ? "bg-amber-500/20 text-amber-300 border border-amber-500/50" :
                                isNightPhase ? "bg-indigo-500/20 text-indigo-300" : "bg-amber-500/20 text-amber-300"
                    )}>
                        {isNightPhase ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Turn {turn}</h1>
                        <p className="text-sm text-muted font-medium tracking-wide">{phase.replace(/_/g, ' ')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowRoles(!showRoles)}
                        className="px-4 py-2 bg-background/50 hover:bg-background rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                        {showRoles ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span className="hidden sm:inline">{showRoles ? 'Hide Roles' : 'Show Roles'}</span>
                    </button>
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span className="hidden sm:inline">Reset</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
                {/* Left Column: The Director's Stage (Script & Actions) */}
                <main className="lg:col-span-8 flex flex-col gap-6">
                    {/* 1. The Script */}
                    <PhaseScript phase={phase} turn={turn} />

                    {/* 2. The Action Stage */}
                    <div className={cn(
                        "flex-1 backdrop-blur-xl rounded-3xl border p-6 relative transition-colors duration-500",
                        getThemeColors()
                    )}>
                        {/* Phase Progress Indicator */}
                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/5 text-xs font-mono text-muted">
                            PHASE: {phase}
                        </div>

                        {/* Dynamic Content Based on Phase */}
                        <div className="mt-4">
                            {isNightPhase ? (
                                <div className="max-w-2xl mx-auto">
                                    {renderNightAction()}
                                    {phase === 'NIGHT' && (
                                        <div className="text-center py-12">
                                            <Moon className="w-16 h-16 mx-auto text-indigo-300/50 mb-4" />
                                            <p className="text-xl text-muted">{t('waitingNightActions')}</p>
                                            <button
                                                onClick={nextPhase}
                                                className="mt-8 px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all"
                                            >
                                                {t('startNightActions')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full">
                                    {phase === 'VOTING' || phase === 'DEFENSE' ? (
                                        <VotingPanel />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-64 text-center">
                                            <Sun className="w-16 h-16 text-amber-300/50 mb-4" />
                                            <h3 className="text-2xl font-bold text-white mb-2">{phase === 'MORNING_ANNOUNCEMENT' ? t('MORNING_ANNOUNCEMENT') : t('dayPhase')}</h3>
                                            <p className="text-muted max-w-md mx-auto mb-8">
                                                {t('allowDiscussion')}
                                            </p>
                                            <button
                                                onClick={nextPhase}
                                                className="px-8 py-4 bg-white text-black hover:bg-gray-200 rounded-xl font-bold text-lg flex items-center gap-2 transition-all"
                                            >
                                                {phase === 'DAY_DISCUSSION' && turn === 1 ? t('startNight') : phase === 'MORNING_ANNOUNCEMENT' ? t('startDiscussion') : phase === 'DAY_DISCUSSION' ? t('startVoting') : 'Next Phase'}
                                                <ArrowRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Right Column: The Cast (Player List) */}
                <aside className="lg:col-span-4 flex flex-col gap-4 h-full overflow-hidden">
                    <div className="bg-surface/50 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col h-full overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                            <h2 className="font-bold flex items-center gap-2">
                                <Users className="w-5 h-5 text-muted" />
                                Players
                            </h2>
                            <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded">
                                {alivePlayers.length}/{players.length} Alive
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {players.map((player) => {
                                const role = player.role ? ROLE_DETAILS[player.role] : null;
                                return (
                                    <div
                                        key={player.id}
                                        className={cn(
                                            "p-3 rounded-xl border transition-all group",
                                            player.isAlive
                                                ? "bg-white/5 border-white/5 hover:bg-white/10"
                                                : "bg-red-900/10 border-red-900/20 opacity-60"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm",
                                                    player.isAlive ? "bg-white/10" : "bg-red-500/20 text-red-400"
                                                )}>
                                                    {player.isAlive ? player.name.charAt(0) : <SkullIcon className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{player.name}</p>
                                                    {showRoles && (
                                                        role ? (
                                                            <p className="text-xs" style={{ color: role.color }}>
                                                                {role.name}
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-slate-500 italic">
                                                                Role not assigned
                                                            </p>
                                                        )
                                                    )}
                                                </div>
                                            </div>

                                            {/* Quick Actions */}
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => copyRoleToClipboard(player.id)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-muted hover:text-white transition-colors"
                                                    title="Copy Role"
                                                >
                                                    {copiedId === player.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Bulk Actions Footer */}
                        <div className="p-4 border-t border-white/10 bg-black/20">
                            <button
                                onClick={copyAllRoles}
                                className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                            >
                                {copiedId === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                Copy All Roles
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};
