import React from 'react';
import { motion } from 'framer-motion';
import { ROLES } from '../data/roles.js';
import { cn } from '../utils/cn.js';
import { Skull, Shield, Search } from 'lucide-react';

export const PlayerGrid = ({
    players,
    onSelect,
    selectedId,
    filter = () => true,
    actionLabel = "Select",
    variant = "default" // default, vampire, doctor, sheriff
}) => {
    const filteredPlayers = players.filter(filter);

    const getVariantStyles = (isSelected) => {
        if (!isSelected) return "bg-surface/30 border-white/5 hover:bg-surface/50 hover:border-white/10";

        switch (variant) {
            case 'vampire': return "bg-red-500/20 border-red-500 text-red-100";
            case 'doctor': return "bg-green-500/20 border-green-500 text-green-100";
            case 'sheriff': return "bg-amber-500/20 border-amber-500 text-amber-100";
            default: return "bg-primary/20 border-primary text-primary-100";
        }
    };

    const getIcon = () => {
        switch (variant) {
            case 'vampire': return <Skull className="w-4 h-4" />;
            case 'doctor': return <Shield className="w-4 h-4" />;
            case 'sheriff': return <Search className="w-4 h-4" />;
            default: return null;
        }
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredPlayers.map((player) => {
                const isSelected = selectedId === player.id;
                const role = player.role ? ROLES[player.role] : null;

                return (
                    <motion.button
                        key={player.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(player.id)}
                        className={cn(
                            "relative p-4 rounded-xl border-2 transition-all text-left group",
                            getVariantStyles(isSelected)
                        )}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-bold truncate">{player.name}</span>
                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className={cn(
                                        "p-1 rounded-full",
                                        variant === 'vampire' ? "bg-red-500" :
                                            variant === 'doctor' ? "bg-green-500" :
                                                variant === 'sheriff' ? "bg-amber-500" : "bg-primary"
                                    )}
                                >
                                    {getIcon()}
                                </motion.div>
                            )}
                        </div>

                        {/* Hover Role Reveal (for moderator context) */}
                        {role && (
                            <div className="text-xs opacity-50 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                <span>{role.icon}</span>
                                <span>{role.name}</span>
                            </div>
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
};
