import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Skull, Star, Coffee } from 'lucide-react';
import { cn } from '../utils/cn.js';

export const StreamView = () => {
    const { phase, turn, players, events, winner, winReason, votes, t, nightResult, activeVoter, gameConfig } = useGame();
    const [showPhaseTransition, setShowPhaseTransition] = useState(false);
    const [showNightResult, setShowNightResult] = useState(false);
    const [revealVictim, setRevealVictim] = useState(false);
    const [announcementStep, setAnnouncementStep] = useState(0); // 0: Intro, 1: Reveal


    // Audio Refs with preloading
    const morningAudio = useRef(null); // Chicken intro sound
    const morningBgAudio = useRef(null); // Morning background loop
    const nightAudio = useRef(null);
    const vampireAudio = useRef(null);
    const doctorAudio = useRef(null);
    const sheriffAudio = useRef(null);
    const votingAudio = useRef(null);
    const votingBgAudio = useRef(null); // Voting background music

    // Helper to get correct asset path including base URL
    const getAssetPath = (path) => {
        const base = import.meta.env.BASE_URL;
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        return `${base}${cleanPath}`;
    };

    // Initialize audio on mount
    useEffect(() => {
        const initAudio = (path, volume = 1.0) => {
            const audio = new Audio(getAssetPath(path));
            audio.preload = 'auto';
            audio.volume = volume;
            audio.load(); // Force preload
            return audio;
        };

        morningAudio.current = initAudio('sound/chicken.mp3');
        morningBgAudio.current = initAudio('sound/morning_bg.mp3');
        nightAudio.current = initAudio('sound/night time .mp3');
        vampireAudio.current = initAudio('sound/vampier_time.mp3');
        doctorAudio.current = initAudio('sound/doctor_time.mp3');
        sheriffAudio.current = initAudio('sound/sheriff_time.mp3');
        votingAudio.current = initAudio('sound/voting starts.mp3');
        votingBgAudio.current = initAudio('sound/voting_bg.mp3', 0.6);
    }, []);

    const isNightPhase = phase.includes('NIGHT');
    const alivePlayers = players.filter(p => p.isAlive);
    const deadPlayers = players.filter(p => !p.isAlive);
    const latestEvent = events[events.length - 1];

    // Audio Logic
    useEffect(() => {
        if (!nightAudio.current || !morningBgAudio.current || !votingBgAudio.current) return; // Wait for audio to initialize

        const stopAllExcept = (exceptions = []) => {
            [morningAudio, morningBgAudio, nightAudio, vampireAudio, doctorAudio, sheriffAudio, votingAudio, votingBgAudio].forEach(audio => {
                if (audio.current && !exceptions.includes(audio)) {
                    audio.current.pause();
                    audio.current.currentTime = 0;
                }
            });
        };

        // Gapless loop for night audio
        const handleNightAudioTimeUpdate = () => {
            const audio = nightAudio.current;
            if (audio && audio.duration > 0) {
                if (audio.currentTime >= audio.duration - 0.05) {
                    audio.currentTime = 0;
                    audio.play().catch(e => console.log('Audio loop restart failed:', e));
                }
            }
        };

        const handleNightAudioEnd = () => {
            const audio = nightAudio.current;
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(e => console.log('Audio loop failed:', e));
            }
        };

        // Gapless loop for morning background audio
        const handleMorningBgTimeUpdate = () => {
            const audio = morningBgAudio.current;
            if (audio && audio.duration > 0) {
                if (audio.currentTime >= audio.duration - 0.05) {
                    audio.currentTime = 0;
                    audio.play().catch(e => console.log('Morning bg loop restart failed:', e));
                }
            }
        };

        const handleMorningBgEnd = () => {
            const audio = morningBgAudio.current;
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(e => console.log('Morning bg loop failed:', e));
            }
        };

        // Gapless loop for voting background audio
        const handleVotingBgTimeUpdate = () => {
            const audio = votingBgAudio.current;
            if (audio && audio.duration > 0) {
                if (audio.currentTime >= audio.duration - 0.05) {
                    audio.currentTime = 0;
                    audio.play().catch(e => console.log('Voting bg loop restart failed:', e));
                }
            }
        };

        const handleVotingBgEnd = () => {
            const audio = votingBgAudio.current;
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(e => console.log('Voting bg loop failed:', e));
            }
        };

        if (phase === 'NIGHT') {
            stopAllExcept([nightAudio]);
            if (nightAudio.current && nightAudio.current.paused) {
                nightAudio.current.addEventListener('timeupdate', handleNightAudioTimeUpdate);
                nightAudio.current.addEventListener('ended', handleNightAudioEnd);
                nightAudio.current.play().catch(e => console.log('Audio play failed:', e));
            }
        } else if (['NIGHT_VAMPIRE', 'NIGHT_DOCTOR', 'NIGHT_SHERIFF'].includes(phase)) {
            const currentRoleAudio = phase === 'NIGHT_VAMPIRE' ? vampireAudio
                : phase === 'NIGHT_DOCTOR' ? doctorAudio
                    : sheriffAudio;

            stopAllExcept([nightAudio, currentRoleAudio]);

            if (nightAudio.current && nightAudio.current.paused) {
                nightAudio.current.addEventListener('timeupdate', handleNightAudioTimeUpdate);
                nightAudio.current.addEventListener('ended', handleNightAudioEnd);
                nightAudio.current.play().catch(e => console.log('Audio play failed:', e));
            }

            if (currentRoleAudio.current) {
                currentRoleAudio.current.currentTime = 0;
                currentRoleAudio.current.play().catch(e => console.log('Audio play failed:', e));
            }

        } else if (phase === 'MORNING_ANNOUNCEMENT') {
            // Keep Night Audio playing!
            if (nightAudio.current && nightAudio.current.paused) {
                nightAudio.current.addEventListener('timeupdate', handleNightAudioTimeUpdate);
                nightAudio.current.addEventListener('ended', handleNightAudioEnd);
                nightAudio.current.play().catch(e => console.log('Audio play failed:', e));
            }
            // Stop others
            stopAllExcept([nightAudio]);

        } else if (phase === 'DAY_DISCUSSION') {
            if (nightAudio.current) {
                nightAudio.current.removeEventListener('timeupdate', handleNightAudioTimeUpdate);
                nightAudio.current.removeEventListener('ended', handleNightAudioEnd);
            }

            stopAllExcept([morningAudio, morningBgAudio]);

            // Play chicken intro once (if not already playing)
            if (morningAudio.current && morningAudio.current.paused) {
                morningAudio.current.play().catch(e => console.log('Chicken audio play failed:', e));
            }

            // Start looping morning background music
            if (morningBgAudio.current && morningBgAudio.current.paused) {
                morningBgAudio.current.addEventListener('timeupdate', handleMorningBgTimeUpdate);
                morningBgAudio.current.addEventListener('ended', handleMorningBgEnd);
                morningBgAudio.current.play().catch(e => console.log('Morning bg play failed:', e));
            }
        } else if (phase === 'VOTING') {
            if (nightAudio.current) {
                nightAudio.current.removeEventListener('timeupdate', handleNightAudioTimeUpdate);
                nightAudio.current.removeEventListener('ended', handleNightAudioEnd);
            }
            if (morningBgAudio.current) {
                morningBgAudio.current.removeEventListener('timeupdate', handleMorningBgTimeUpdate);
                morningBgAudio.current.removeEventListener('ended', handleMorningBgEnd);
            }

            stopAllExcept([votingAudio, votingBgAudio]);

            // Play voting intro once
            if (votingAudio.current && votingAudio.current.paused) {
                votingAudio.current.play().catch(e => console.log('Voting audio play failed:', e));
            }

            // Start looping voting background music
            if (votingBgAudio.current && votingBgAudio.current.paused) {
                votingBgAudio.current.addEventListener('timeupdate', handleVotingBgTimeUpdate);
                votingBgAudio.current.addEventListener('ended', handleVotingBgEnd);
                votingBgAudio.current.play().catch(e => console.log('Voting bg play failed:', e));
            }
        } else {
            if (nightAudio.current) {
                nightAudio.current.removeEventListener('timeupdate', handleNightAudioTimeUpdate);
                nightAudio.current.removeEventListener('ended', handleNightAudioEnd);
            }
            if (morningBgAudio.current) {
                morningBgAudio.current.removeEventListener('timeupdate', handleMorningBgTimeUpdate);
                morningBgAudio.current.removeEventListener('ended', handleMorningBgEnd);
            }
            if (votingBgAudio.current) {
                votingBgAudio.current.removeEventListener('timeupdate', handleVotingBgTimeUpdate);
                votingBgAudio.current.removeEventListener('ended', handleVotingBgEnd);
            }
            stopAllExcept([]);
        }

        return () => {
            if (nightAudio.current) {
                nightAudio.current.removeEventListener('timeupdate', handleNightAudioTimeUpdate);
                nightAudio.current.removeEventListener('ended', handleNightAudioEnd);
            }
            if (morningBgAudio.current) {
                morningBgAudio.current.removeEventListener('timeupdate', handleMorningBgTimeUpdate);
                morningBgAudio.current.removeEventListener('ended', handleMorningBgEnd);
            }
            if (votingBgAudio.current) {
                votingBgAudio.current.removeEventListener('timeupdate', handleVotingBgTimeUpdate);
                votingBgAudio.current.removeEventListener('ended', handleVotingBgEnd);
            }
        };
    }, [phase]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            [morningAudio, morningBgAudio, nightAudio, vampireAudio, doctorAudio, sheriffAudio, votingAudio, votingBgAudio].forEach(audio => {
                if (audio.current) {
                    audio.current.pause();
                    audio.current.currentTime = 0;
                }
            });
        };
    }, []);

    //Night Result Animation
    useEffect(() => {
        if (phase === 'DAY_INTRO' && nightResult && turn > 0) {
            setShowNightResult(true);
            setRevealVictim(false);

            // If death, delay reveal
            if (nightResult.type === 'DEATH') {
                setTimeout(() => {
                    setRevealVictim(true);
                }, 3000); // 3s suspense
            }

            // Hide after some time
            const duration = nightResult.type === 'DEATH' ? 8000 : 5000;
            setTimeout(() => {
                setShowNightResult(false);
            }, duration);
        }
    }, [phase, nightResult]);

    // Morning Announcement Animation Sequence
    useEffect(() => {
        if (phase === 'MORNING_ANNOUNCEMENT') {
            setAnnouncementStep(0);

            // Delay before reveal
            const timer = setTimeout(() => {
                setAnnouncementStep(1);
            }, 4000); // 4 seconds suspense

            return () => clearTimeout(timer);
        }
    }, [phase]);

    // Trigger phase transition animation
    useEffect(() => {
        // Don't show transition for Setup or Role Distribution
        if (phase === 'SETUP' || phase === 'DISTRIBUTING_ROLES') {
            setShowPhaseTransition(false);
            return;
        }

        // Show transition
        setShowPhaseTransition(true);

        // Auto-hide after 3 seconds
        const timer = setTimeout(() => {
            setShowPhaseTransition(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, [phase]);

    // Helper for Storytelling Text
    const getPhaseTitle = () => {
        switch (phase) {
            case 'NIGHT_VAMPIRE': return "VAMPIRES ARE HUNTING...";
            case 'NIGHT_DOCTOR': return "THE DOCTOR IS HEALING...";
            case 'NIGHT_SHERIFF': return "THE SHERIFF IS INVESTIGATING...";
            case 'VOTING': return "VILLAGE GATHERING";
            default: return phase.replace(/_/g, ' ');
        }
    };

    const getPhaseColor = () => {
        switch (phase) {
            case 'NIGHT_VAMPIRE': return "from-red-950 to-black";
            case 'NIGHT_DOCTOR': return "from-green-950 to-black";
            case 'NIGHT_SHERIFF': return "from-blue-950 to-black";
            default: return "from-indigo-950 to-black";
        }
    };

    // Lobby / Standby Screen
    if (phase === 'SETUP') {
        const getBackgroundGradient = () => {
            if (phase === 'NIGHT_DOCTOR') return 'from-green-900/40 via-slate-950 to-black';
            if (phase === 'NIGHT_SHERIFF') return 'from-blue-900/40 via-slate-950 to-black';
            if (phase === 'NIGHT_VAMPIRE') return 'from-red-900/40 via-slate-950 to-black';
            if (isNightPhase) return 'from-indigo-950 via-slate-950 to-black';
            return 'from-amber-900/20 via-slate-950 to-black';
        };

        return (
            <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} text-white overflow-hidden relative transition-colors duration-1000`}>
                {/* Ambient Background Animation */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className={cn(
                        "absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 animate-pulse",
                        phase === 'NIGHT_DOCTOR' ? "bg-green-600" :
                            phase === 'NIGHT_SHERIFF' ? "bg-blue-600" :
                                phase === 'NIGHT_VAMPIRE' ? "bg-red-600" :
                                    isNightPhase ? "bg-indigo-600" : "bg-amber-500"
                    )} />
                    <div className={cn(
                        "absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 animate-pulse delay-1000",
                        phase === 'NIGHT_DOCTOR' ? "bg-emerald-600" :
                            phase === 'NIGHT_SHERIFF' ? "bg-cyan-600" :
                                phase === 'NIGHT_VAMPIRE' ? "bg-rose-600" :
                                    isNightPhase ? "bg-purple-600" : "bg-orange-500"
                    )} />
                </div>
                {/* Background Animation */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute bg-indigo-500/10 rounded-full blur-3xl"
                            style={{
                                width: Math.random() * 400 + 100,
                                height: Math.random() * 400 + 100,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                x: [0, Math.random() * 100 - 50],
                                y: [0, Math.random() * 100 - 50],
                                scale: [1, 1.2, 1],
                            }}
                            transition={{
                                duration: 10 + Math.random() * 10,
                                repeat: Infinity,
                                repeatType: "reverse",
                            }}
                        />
                    ))}
                </div>

                <div className="z-10 text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                    >
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl">
                            VAMPIRE VILLAGER
                        </h1>
                        <p className="text-xl md:text-2xl text-indigo-200/60 uppercase tracking-[0.5em] font-light">
                            Broadcast Starting Soon
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto px-4">
                        {players.map((player, i) => (
                            <motion.div
                                key={player.id}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl flex items-center gap-3"
                            >
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold">
                                    {player.name.charAt(0)}
                                </div>
                                <span className="font-medium text-indigo-100">{player.name}</span>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            Waiting for players... ({players.length} joined)
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Role Distribution Animation
    if (phase === 'DISTRIBUTING_ROLES') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950" />

                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="z-10 mb-12"
                >
                    <div className="w-32 h-48 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.5)] flex items-center justify-center border-4 border-white/20">
                        <span className="text-6xl">?</span>
                    </div>
                </motion.div>

                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse z-10">
                    ASSIGNING ROLES...
                </h2>

                <div className="mt-8 flex gap-2 z-10">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.2, repeat: Infinity, repeatType: "reverse", duration: 0.6 }}
                            className="w-4 h-4 rounded-full bg-indigo-500"
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Morning Announcement View
    if (phase === 'MORNING_ANNOUNCEMENT') {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden font-cinzel">
                {/* Dynamic Background */}
                <div className={cn(
                    "absolute inset-0 transition-colors duration-1000",
                    nightResult?.type === 'DEATH' && announcementStep === 1
                        ? "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-950 via-black to-black"
                        : "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black"
                )} />

                {/* Animated Fog/Smoke Overlay */}
                <div className="absolute inset-0 opacity-30">
                    <div
                        className="absolute inset-0 bg-cover animate-pulse-slow mix-blend-overlay"
                        style={{ backgroundImage: `url('${getAssetPath('smoke.png')}')` }}
                    />
                </div>

                {/* Particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(30)].map((_, i) => (
                        <motion.div
                            key={i}
                            className={cn(
                                "absolute w-1 h-1 rounded-full",
                                nightResult?.type === 'DEATH' ? "bg-red-500" : "bg-blue-200"
                            )}
                            initial={{
                                x: Math.random() * window.innerWidth,
                                y: window.innerHeight + 10,
                                opacity: 0
                            }}
                            animate={{
                                y: -100,
                                opacity: [0, 0.8, 0],
                                x: `calc(${Math.random() * 100}vw + ${Math.random() * 200 - 100}px)`
                            }}
                            transition={{
                                duration: 5 + Math.random() * 5,
                                repeat: Infinity,
                                delay: Math.random() * 5
                            }}
                        />
                    ))}
                </div>

                <div className="z-10 max-w-5xl w-full text-center p-8">
                    <AnimatePresence mode="wait">
                        {announcementStep === 0 && (
                            <motion.div
                                key="intro"
                                initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className="space-y-8"
                            >
                                <h2 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-200 to-slate-600 tracking-[0.2em] uppercase drop-shadow-2xl border-b-2 border-white/10 pb-8 inline-block">
                                    {t('morningAnnouncement')}
                                </h2>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1, duration: 1 }}
                                    className="text-2xl md:text-4xl text-slate-400 font-light italic tracking-wide"
                                >
                                    {t('morningAttack')}
                                </motion.p>
                            </motion.div>
                        )}

                        {announcementStep === 1 && (
                            <motion.div
                                key="reveal"
                                className="space-y-12 relative"
                            >
                                {nightResult?.type === 'DEATH' ? (
                                    <div className="relative">
                                        {/* Blood Splatter Effect behind */}
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1.5, opacity: 0.4 }}
                                            transition={{ duration: 0.2, type: "spring" }}
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600 rounded-full blur-[100px] -z-10"
                                        />

                                        <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                                            className="mb-12"
                                        >
                                            <Skull size={180} className="mx-auto text-red-500 drop-shadow-[0_0_50px_rgba(220,38,38,0.8)]" />
                                        </motion.div>

                                        <motion.h2
                                            initial={{ y: 50, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-tight"
                                        >
                                            <span className="text-red-500 block mb-4 drop-shadow-[0_0_10px_rgba(220,38,38,1)]">
                                                {nightResult.victim}
                                            </span>
                                            <span className="text-3xl md:text-4xl text-slate-300 font-light tracking-[0.5em] border-t border-red-900/50 pt-6 block">
                                                HAS FALLEN
                                            </span>
                                        </motion.h2>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1.5, opacity: 0.2 }}
                                            transition={{ duration: 1 }}
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500 rounded-full blur-[100px] -z-10"
                                        />

                                        <motion.div
                                            initial={{ scale: 0, rotate: 180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: "spring", bounce: 0.5, duration: 1 }}
                                            className="mb-12"
                                        >
                                            <Sun size={180} className="mx-auto text-blue-400 drop-shadow-[0_0_50px_rgba(96,165,250,0.6)]" />
                                        </motion.div>

                                        <motion.h2
                                            initial={{ y: 50, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-5xl md:text-7xl font-bold text-blue-100 tracking-tight"
                                        >
                                            {t('nightQuiet')}
                                            <span className="block text-2xl md:text-3xl text-blue-300/60 mt-6 font-light tracking-widest uppercase">
                                                The Village is Safe... For Now
                                            </span>
                                        </motion.h2>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden font-sans">
            {/* Animated Background */}
            <div className="absolute inset-0 -z-10 transition-colors duration-1000 ease-in-out">
                <AnimatePresence mode="wait">
                    {(phase === 'VOTING' || phase === 'DAY_DISCUSSION' || phase === 'DAY_INTRO') ? (
                        <motion.div
                            key="day-bg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2 }}
                            className="absolute inset-0 bg-gradient-to-b from-sky-400 to-blue-600 overflow-hidden"
                        >
                            {/* Dynamic Sky Background (Intro & Discussion) */}
                            {(phase === 'DAY_DISCUSSION' || phase === 'DAY_INTRO') && (
                                <motion.div
                                    key={`gradient-${phase}-${gameConfig?.discussionDuration}`} // Re-render on duration change
                                    className="absolute inset-0"
                                    initial={{ background: "linear-gradient(to bottom, #4facfe, #00f2fe)" }} // Morning Blue
                                    animate={{
                                        background: [
                                            "linear-gradient(to bottom, #4facfe, #00f2fe)", // Morning (Light Blue/Cyan)
                                            "linear-gradient(to bottom, #000046, #1CB5E0)", // Noon (Deep Navy/Blue)
                                            "linear-gradient(to bottom, #cb2d3e, #ef473a)"  // Sunset (Red/Orange)
                                        ]
                                    }}
                                    transition={{
                                        duration: (gameConfig?.discussionDuration || 3) * 60,
                                        ease: "linear",
                                        times: [0, 0.5, 1]
                                    }}
                                />
                            )}

                            {/* Sunset Background for Voting */}
                            {phase === 'VOTING' && (
                                <motion.div
                                    key="voting-sunset"
                                    className="absolute inset-0"
                                    initial={{ background: "linear-gradient(to bottom, #cb2d3e, #ef473a)" }}
                                    animate={{ background: "linear-gradient(to bottom, #cb2d3e, #ef473a)" }}
                                />
                            )}

                            {/* Sun Animation (Intro & Discussion) */}
                            {(phase === 'DAY_DISCUSSION' || phase === 'DAY_INTRO') && (() => {
                                const duration = (gameConfig?.discussionDuration || 3) * 60;
                                console.log('Rendering sun for phase:', phase, 'duration:', duration, 'config:', gameConfig);

                                return (
                                    <motion.div
                                        key={`sun-${phase}-${gameConfig?.discussionDuration}`} // Re-render on duration change
                                        initial={{ x: '5vw', y: '60vh' }}
                                        animate={{
                                            x: ['5vw', '50vw', '95vw'], // Left -> Center -> Right
                                            y: ['60vh', '-20vh', '60vh'], // Low -> VERY High (off screen top) -> Low
                                        }}
                                        transition={{
                                            duration: duration,
                                            ease: "linear",
                                            times: [0, 0.5, 1]
                                        }}
                                        className="absolute top-0 left-0 w-40 h-40 bg-yellow-300 rounded-full blur-2xl shadow-[0_0_100px_rgba(253,224,71,0.8)] z-10"
                                    >
                                        <div className="w-full h-full bg-yellow-100 rounded-full blur-md" />
                                    </motion.div>
                                );
                            })()}

                            {/* Sun at Sunset Position for Voting */}
                            {phase === 'VOTING' && (
                                <motion.div
                                    key="voting-sun"
                                    className="absolute top-0 left-0 w-40 h-40 bg-yellow-300 rounded-full blur-2xl shadow-[0_0_100px_rgba(253,224,71,0.8)] z-10"
                                    initial={{ x: '95vw', y: '60vh', opacity: 0.6 }}
                                    animate={{ x: '95vw', y: '60vh', opacity: 0.6 }}
                                >
                                    <div className="w-full h-full bg-orange-200 rounded-full blur-md" />
                                </motion.div>
                            )}

                            {/* Clouds */}
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={`cloud-${i}`}
                                    className="absolute bg-white/20 rounded-full blur-xl"
                                    style={{
                                        width: 100 + Math.random() * 200,
                                        height: 40 + Math.random() * 60,
                                        top: `${10 + Math.random() * 40}%`,
                                        left: `${Math.random() * 100}%`,
                                    }}
                                    animate={{
                                        x: [0, 100, 0],
                                    }}
                                    transition={{
                                        duration: 20 + Math.random() * 20,
                                        repeat: Infinity,
                                        ease: "linear"
                                    }}
                                />
                            ))}

                            {/* Floating Particles (Dust/Pollen) */}
                            {[...Array(20)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 bg-yellow-200 rounded-full blur-[1px]"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                    }}
                                    animate={{
                                        y: [0, -20, 0],
                                        opacity: [0, 0.8, 0],
                                    }}
                                    transition={{
                                        duration: 3 + Math.random() * 2,
                                        repeat: Infinity,
                                        delay: Math.random() * 2,
                                    }}
                                />
                            ))}
                        </motion.div>
                    ) : isNightPhase ? (
                        <motion.div
                            key="night-bg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2 }}
                            className={`absolute inset-0 bg-gradient-to-b ${getPhaseColor()}`}
                        >
                            {/* Stars */}
                            {[...Array(50)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 bg-white rounded-full"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                    }}
                                    animate={{
                                        opacity: [0.2, 1, 0.2],
                                        scale: [1, 1.5, 1],
                                    }}
                                    transition={{
                                        duration: 2 + Math.random() * 3,
                                        repeat: Infinity,
                                        delay: Math.random() * 2,
                                    }}
                                />
                            ))}
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 2 }}
                                className="absolute top-10 right-10"
                            >
                                <div className="w-32 h-32 rounded-full bg-yellow-100 blur-xl opacity-20 absolute" />
                                <Moon className="w-24 h-24 text-yellow-100" />
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="default-bg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2 }}
                            className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-blue-200"
                        >
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 2 }}
                                className="absolute top-10 right-10"
                            >
                                <div className="w-40 h-40 rounded-full bg-yellow-400 blur-2xl opacity-40 absolute" />
                                <Sun className="w-32 h-32 text-yellow-400" />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Phase Transition Overlay - TV Show Style */}
            < AnimatePresence >
                {showPhaseTransition && (
                    <motion.div
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none"
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            className="text-center"
                        >
                            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 uppercase tracking-tighter drop-shadow-2xl px-4">
                                {t(phase)}
                            </h1>
                            <div className="h-2 w-32 bg-primary mx-auto mt-4 rounded-full" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence >

            {/* Night Result Overlay */}
            < AnimatePresence >
                {showNightResult && nightResult && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
                    >
                        <div className="text-center max-w-4xl px-6">
                            {nightResult.type === 'QUIET' ? (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-white"
                                >
                                    <Moon className="w-24 h-24 text-blue-200 mx-auto mb-6 opacity-80" />
                                    <h2 className="text-4xl md:text-6xl font-light tracking-wide text-blue-100 mb-4">
                                        {t('nightQuietTitle') || "A Quiet Night"}
                                    </h2>
                                    <p className="text-xl md:text-2xl text-blue-200/70 font-light">
                                        {t('nightQuietDesc') || "The sun rises over a peaceful village. No one died last night."}
                                    </p>
                                </motion.div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-8"
                                    >
                                        <Skull className="w-24 h-24 text-red-500 mx-auto mb-6" />
                                        <h2 className="text-3xl md:text-5xl font-bold text-red-500 uppercase tracking-widest mb-2">
                                            {t('brutalAttack') || "Brutal Attack"}
                                        </h2>
                                        <p className="text-xl text-red-200/60">
                                            {t('morningTragedy') || "In the early hours of the morning..."}
                                        </p>
                                    </motion.div>

                                    {revealVictim && (
                                        <motion.div
                                            initial={{ scale: 0.5, opacity: 0, filter: "blur(10px)" }}
                                            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                                            transition={{ type: "spring", bounce: 0.5 }}
                                            className="bg-red-900/30 border border-red-500/50 p-8 rounded-3xl backdrop-blur-md"
                                        >
                                            <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">
                                                {nightResult.victim}
                                            </h1>
                                            <p className="text-red-300 mt-4 text-xl uppercase tracking-widest font-bold">
                                                {t('hasDied') || "HAS DIED"}
                                            </p>
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence >

            {/* Game Over Screen */}
            < AnimatePresence >
                {phase === 'GAME_OVER' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-8 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="max-w-5xl w-full text-center space-y-8 my-8"
                        >
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {winner === 'VILLAGERS' && <Sun className="w-32 h-32 text-yellow-400 mx-auto mb-4" />}
                                {winner === 'VAMPIRES' && <Moon className="w-32 h-32 text-red-500 mx-auto mb-4" />}
                                {winner === 'JESTER' && <Skull className="w-32 h-32 text-purple-500 mx-auto mb-4" />}
                            </motion.div>

                            <h1 className={`text-7xl md:text-9xl font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r ${winner === 'VILLAGERS' ? 'from-blue-400 to-green-400' :
                                winner === 'VAMPIRES' ? 'from-red-500 to-purple-600' :
                                    'from-purple-400 to-pink-400'
                                }`}>
                                {winner} WIN!
                            </h1>

                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10 max-w-2xl mx-auto">
                                <h3 className="text-2xl font-bold text-white mb-2">Game Over</h3>
                                <p className="text-xl text-slate-300 leading-relaxed">
                                    {winReason || "The game has ended."}
                                </p>
                            </div>

                            {/* Game Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="text-3xl font-bold text-white">{turn}</div>
                                    <div className="text-xs uppercase tracking-wider text-slate-400">Turns</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="text-3xl font-bold text-white">{players.filter(p => p.isAlive).length}</div>
                                    <div className="text-xs uppercase tracking-wider text-slate-400">Survivors</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="text-3xl font-bold text-white">{players.filter(p => !p.isAlive).length}</div>
                                    <div className="text-xs uppercase tracking-wider text-slate-400">Casualties</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="text-3xl font-bold text-white">{players.length}</div>
                                    <div className="text-xs uppercase tracking-wider text-slate-400">Total Players</div>
                                </div>
                            </div>

                            {/* Player Roles Breakdown */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 max-w-4xl mx-auto">
                                <h3 className="text-2xl font-bold text-white mb-6">Player Roles</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {players.map(player => (
                                        <div
                                            key={player.id}
                                            className={`p-4 rounded-xl border ${!player.isAlive
                                                ? 'bg-red-900/20 border-red-500/30'
                                                : 'bg-white/5 border-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full ${player.isAlive ? 'bg-green-400' : 'bg-red-400'
                                                        }`} />
                                                    <span className="text-white font-semibold">{player.name}</span>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-sm font-bold ${player.role === 'VAMPIRE' ? 'bg-red-500/20 text-red-300' :
                                                    player.role === 'DOCTOR' ? 'bg-green-500/20 text-green-300' :
                                                        player.role === 'SHERIFF' ? 'bg-yellow-500/20 text-yellow-300' :
                                                            player.role === 'JESTER' ? 'bg-purple-500/20 text-purple-300' :
                                                                'bg-blue-500/20 text-blue-300'
                                                    }`}>
                                                    {player.role}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>


                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence >

            {/* Main Content */}
            < div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col" >
                {/* Header Info */}
                < div className="flex justify-between items-start mb-12" >
                    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl">
                        <h2 className="text-5xl font-black text-white mb-2 tracking-tight">{t('turn')} {turn}</h2>
                        <p className="text-white/80 text-2xl uppercase tracking-[0.2em] font-light border-t border-white/20 pt-2 flex items-center gap-2">
                            {phase === 'VOTING' && <Coffee className="w-6 h-6 text-amber-400" />}
                            {t(phase)}
                        </p>
                    </div>

                    {/* Removed Breaking News Bar as requested */}
                </div >

                {/* Players Grid */}
                < div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1" >
                    {/* Alive Players (Main Stage) */}
                    < div className="lg:col-span-8 space-y-6" >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                            <h3 className="text-3xl font-black text-white uppercase tracking-widest drop-shadow-lg">
                                {t('survivors')} ({alivePlayers.length})
                            </h3>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <AnimatePresence>
                                {alivePlayers.map((player, i) => (
                                    <motion.div
                                        key={player.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5, color: '#ef4444' }}
                                        transition={{ delay: i * 0.05 }}
                                        className={cn(
                                            "backdrop-blur-md border p-6 rounded-2xl flex flex-col items-center gap-4 shadow-xl transition-all group relative",
                                            phase === 'VOTING' && player.id === activeVoter
                                                ? 'bg-yellow-500/30 border-yellow-400 border-4 shadow-[0_0_30px_rgba(250,204,21,0.6)] animate-pulse'
                                                : phase === 'VOTING'
                                                    ? 'bg-amber-900/40 border-white/10 hover:bg-white/20'
                                                    : 'bg-white/10 border-white/10 hover:bg-white/20'
                                        )}
                                    >
                                        {/* Active Voter Label */}
                                        {phase === 'VOTING' && player.id === activeVoter && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full text-xs font-bold uppercase shadow-lg z-10">
                                                {t('voting') || 'Voting...'}
                                            </div>
                                        )}
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl text-white font-bold shadow-inner group-hover:scale-110 transition-transform relative">
                                            {player.name.charAt(0)}
                                            {/* Vote Badge - Calculated from votes object */}
                                            {phase === 'VOTING' && (() => {
                                                const voteCount = Object.values(votes).filter(targetId => targetId === player.id).length;
                                                return voteCount > 0 && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white shadow-lg"
                                                    >
                                                        {voteCount}
                                                    </motion.div>
                                                );
                                            })()}

                                            {/* Voters Visualization - Clean List */}
                                            {phase === 'VOTING' && (() => {
                                                const voters = Object.entries(votes)
                                                    .filter(([_, targetId]) => targetId === player.id)
                                                    .map(([voterId]) => players.find(p => p.id === voterId))
                                                    .filter(Boolean);

                                                return voters.length > 0 && (
                                                    <div className="absolute -bottom-1 -right-1 bg-indigo-600 border-2 border-white rounded-lg px-2 py-1 shadow-xl">
                                                        <div className="text-xs font-bold text-white">
                                                            {voters.map(v => v.name).join(', ')}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <span className="text-xl font-bold text-white tracking-wide">{player.name}</span>

                                        {/* Voter List Below Name */}
                                        {phase === 'VOTING' && (() => {
                                            const voters = Object.entries(votes)
                                                .filter(([_, targetId]) => targetId === player.id)
                                                .map(([voterId]) => players.find(p => p.id === voterId))
                                                .filter(Boolean);

                                            return voters.length > 0 && (
                                                <div className="text-sm text-indigo-300 font-medium">
                                                    ← {voters.map(v => v.name).join(', ')}
                                                </div>
                                            );
                                        })()}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div >

                    {/* Graveyard (Sidebar) */}
                    < div className="lg:col-span-4 bg-black/20 backdrop-blur-sm rounded-3xl p-6 border border-white/5" >
                        <h3 className="text-xl font-bold text-red-200/80 uppercase tracking-wider border-b border-red-200/10 pb-4 mb-6 flex items-center gap-3">
                            <Skull className="w-6 h-6" />
                            {t('fallen')} ({deadPlayers.length})
                        </h3>
                        <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                            {deadPlayers.map((player) => (
                                <div
                                    key={player.id}
                                    className="bg-red-900/10 border border-red-500/10 p-4 rounded-xl flex items-center gap-4 grayscale opacity-70 hover:opacity-100 transition-opacity"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 font-bold">
                                        <Skull className="w-5 h-5" />
                                    </div>
                                    <span className="text-lg font-medium text-red-200/70 line-through decoration-red-500/50">{player.name}</span>
                                </div>
                            ))}
                            {deadPlayers.length === 0 && (
                                <div className="text-center py-12 text-white/20 italic">
                                    No casualties... yet.
                                </div>
                            )}
                        </div>
                    </div >
                </div >
            </div >
        </div >
    );
};
