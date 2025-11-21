import React from 'react';
import { useGame } from '../context/GameContext.jsx';
import { motion } from 'framer-motion';
import { Trophy, Skull, RotateCcw } from 'lucide-react';

export const GameOver = () => {
    const { winner, players, resetGame } = useGame();

    if (!winner) return null;

    const isVillageWin = winner === 'good';
    const winningPlayers = players.filter(p =>
        isVillageWin ? p.role !== 'vampire' : p.role === 'vampire'
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg"
        >
            <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 15 }}
                className="max-w-2xl w-full mx-4"
            >
                <div className="bg-surface border border-white/10 rounded-3xl p-12 text-center">
                    {/* Confetti/Particles Effect */}
                    <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                        {[...Array(30)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    x: '50%',
                                    y: '50%',
                                    scale: 0,
                                }}
                                animate={{
                                    x: `${Math.random() * 100}%`,
                                    y: `${Math.random() * 100}%`,
                                    scale: [0, 1, 0],
                                    rotate: Math.random() * 360,
                                }}
                                transition={{
                                    duration: 2 + Math.random() * 2,
                                    delay: Math.random() * 0.5,
                                    repeat: Infinity,
                                    repeatDelay: 2,
                                }}
                                className={cn(
                                    "absolute w-3 h-3 rounded-full",
                                    isVillageWin ? "bg-green-400" : "bg-red-400"
                                )}
                                style={{
                                    opacity: 0.6,
                                }}
                            />
                        ))}
                    </div>

                    {/* Winner Icon */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                        className="mb-6"
                    >
                        {isVillageWin ? (
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-2xl shadow-green-500/50">
                                <Trophy className="w-12 h-12 text-white" />
                            </div>
                        ) : (
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-400 to-rose-600 shadow-2xl shadow-red-500/50">
                                <Skull className="w-12 h-12 text-white" />
                            </div>
                        )}
                    </motion.div>

                    {/* Winner Text */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className={cn(
                            "text-5xl font-bold mb-4",
                            isVillageWin ? "text-green-400" : "text-red-400"
                        )}
                    >
                        {isVillageWin ? '🎉 Villagers Win!' : '🧛 Vampires Win!'}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-xl text-muted mb-8"
                    >
                        {isVillageWin
                            ? 'The village is safe! All vampires have been eliminated.'
                            : 'The vampires have taken over the village!'}
                    </motion.p>

                    {/* Winners List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="mb-8"
                    >
                        <p className="text-sm text-muted mb-3">Winning Team:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {winningPlayers.map((player, i) => (
                                <motion.div
                                    key={player.id}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1 + i * 0.1 }}
                                    className={cn(
                                        "px-4 py-2 rounded-full font-medium",
                                        isVillageWin
                                            ? "bg-green-500/20 border border-green-500/30 text-green-300"
                                            : "bg-red-500/20 border border-red-500/30 text-red-300"
                                    )}
                                >
                                    {player.name}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Play Again Button */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={resetGame}
                        className="px-8 py-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-xl font-bold text-lg transition-all flex items-center gap-3 mx-auto shadow-lg shadow-primary/25"
                    >
                        <RotateCcw className="w-5 h-5" />
                        Play Again
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};

function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}
