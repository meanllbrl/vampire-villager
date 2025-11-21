import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

const SCRIPTS = {
    SETUP: "Welcome everyone! Please join the game. I'll start once everyone is ready.",
    MORNING_ANNOUNCEMENT: (turn) => `Good morning villagers! It is now Day ${turn}. The sun has risen, and you have all survived another night... or have you?`,
    NIGHT: "It is now night time. Everyone, please close your eyes.",
    NIGHT_VAMPIRE: "Vampires, wake up! Identify yourselves to each other. Choose your victim silently.",
    NIGHT_DOCTOR: "Doctor, wake up! Choose someone to protect from the vampires tonight.",
    NIGHT_SHERIFF: "Sheriff, wake up! Choose someone to investigate. I will tell you if they are a vampire.",
    DAY_DISCUSSION: "Everyone, open your eyes! It's time to discuss. Who do you think is hiding among you?",
    VOTING: "The discussion is over. It's time to vote! Who do you want to eliminate?",
    DEFENSE: "The town has chosen. You have one chance to defend yourself before the final judgment.",
    GAME_OVER: "The game has ended! Let's see who won...",
};

export const PhaseScript = ({ phase, turn }) => {
    const text = typeof SCRIPTS[phase] === 'function' ? SCRIPTS[phase](turn) : SCRIPTS[phase];

    return (
        <div className="bg-surface/50 backdrop-blur-xl border border-primary/20 rounded-3xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                        Moderator Script
                    </h3>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={phase}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-xl font-medium leading-relaxed text-white/90"
                        >
                            "{text}"
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
