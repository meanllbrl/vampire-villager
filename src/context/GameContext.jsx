import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getRoleDistribution, getDefaultConfig, ROLES } from '../data/roles.js';
import { TRANSLATIONS } from '../data/translations.js';

const GameContext = createContext(undefined);

export const GameProvider = ({ children, readOnly = false }) => {
    // Load initial state from localStorage
    const loadState = (key, defaultValue) => {
        try {
            const saved = localStorage.getItem(`vampire_villager_${key}`);
            return saved ? JSON.parse(saved) : defaultValue;
        } catch (e) {
            console.error('Failed to load state:', e);
            return defaultValue;
        }
    };

    const [phase, setPhase] = useState(() => loadState('phase', 'SETUP'));
    const [turn, setTurn] = useState(() => loadState('turn', 0));
    const [players, setPlayers] = useState(() => loadState('players', []));
    const [nightAction, setNightAction] = useState(() => loadState('nightAction', {}));
    const [events, setEvents] = useState(() => loadState('events', []));
    const [winner, setWinner] = useState(() => loadState('winner', null));
    const [winReason, setWinReason] = useState(() => loadState('winReason', null));
    const [isNightPhase, setIsNightPhase] = useState(() => loadState('isNightPhase', false));
    const [votes, setVotes] = useState(() => loadState('votes', {})); // { voterId: targetId }
    const [language, setLanguage] = useState(() => loadState('language', 'TR'));
    const [roleActions, setRoleActions] = useState(() => loadState('roleActions', {
        [ROLES.DOCTOR]: 1,
        [ROLES.SHERIFF]: 1
    }));

    const [gameConfig, setGameConfig] = useState(() => loadState('gameConfig', getDefaultConfig(0)));

    const [nightResult, setNightResult] = useState(() => loadState('nightResult', null)); // { type: 'DEATH' | 'QUIET', victim: name | null }

    const [activeVoter, setActiveVoter] = useState(() => loadState('activeVoter', null)); // ID of player currently voting

    // Translation Helper
    const t = useCallback((key, params = {}) => {
        let text = TRANSLATIONS[language][key] || key;
        Object.keys(params).forEach(param => {
            text = text.replace(`{${param}}`, params[param]);
        });
        return text;
    }, [language]);

    // Save state changes to localStorage
    // Save state changes to localStorage
    useEffect(() => {
        if (readOnly) return; // STRICTLY prevent writes in read-only mode

        localStorage.setItem('vampire_villager_phase', JSON.stringify(phase));
        localStorage.setItem('vampire_villager_turn', JSON.stringify(turn));
        localStorage.setItem('vampire_villager_players', JSON.stringify(players));
        localStorage.setItem('vampire_villager_nightAction', JSON.stringify(nightAction));
        localStorage.setItem('vampire_villager_events', JSON.stringify(events));
        localStorage.setItem('vampire_villager_winner', JSON.stringify(winner));
        localStorage.setItem('vampire_villager_winReason', JSON.stringify(winReason));
        localStorage.setItem('vampire_villager_gameConfig', JSON.stringify(gameConfig));
        localStorage.setItem('vampire_villager_votes', JSON.stringify(votes));
        localStorage.setItem('vampire_villager_language', JSON.stringify(language));
        localStorage.setItem('vampire_villager_roleActions', JSON.stringify(roleActions));
        localStorage.setItem('vampire_villager_nightResult', JSON.stringify(nightResult));
        localStorage.setItem('vampire_villager_activeVoter', JSON.stringify(activeVoter));
    }, [phase, turn, players, nightAction, events, winner, winReason, gameConfig, votes, language, roleActions, nightResult, activeVoter, readOnly]);

    // Sync state across tabs
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (!e.key || !e.key.startsWith('vampire_villager_')) return;

            console.log('Storage update received:', e.key, e.newValue);
            const key = e.key.replace('vampire_villager_', '');

            try {
                const value = e.newValue ? JSON.parse(e.newValue) : null;

                switch (key) {
                    case 'phase': setPhase(value || 'SETUP'); break;
                    case 'turn': setTurn(value || 0); break;
                    case 'players': setPlayers(value || []); break;
                    case 'nightAction': setNightAction(value || {}); break;
                    case 'events': setEvents(value || []); break;
                    case 'winner': setWinner(value); break;
                    case 'winReason': setWinReason(value); break;
                    case 'gameConfig': setGameConfig(value || getDefaultConfig(0)); break;
                    case 'votes': setVotes(value || {}); break;
                    case 'language': setLanguage(value || 'TR'); break;
                    case 'roleActions': setRoleActions(value || {
                        [ROLES.DOCTOR]: gameConfig.doctorLimit || 1,
                        [ROLES.SHERIFF]: gameConfig.sheriffLimit || 1
                    }); break;
                    case 'nightResult': setNightResult(value); break;
                    case 'activeVoter': setActiveVoter(value); break;
                    default: break;
                }
            } catch (err) {
                console.error('Error parsing storage update:', err);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [gameConfig]);

    // ... (rest of code)

    const resetGame = useCallback(() => {
        // Instead of removing items, we set them to initial state to ensure consistency across tabs
        // localStorage.removeItem calls are removed to prevent "null" reads in other tabs

        setPhase('SETUP');
        setTurn(0);
        setNightAction({});
        setEvents([]);
        setWinner(null);
        setWinReason(null);
        setVotes({});
        setGameConfig(getDefaultConfig(0));
        setRoleActions({ [ROLES.DOCTOR]: 1, [ROLES.SHERIFF]: 1 });
        setNightResult(null);
        setActiveVoter(null);

        setPlayers(prev => prev.map(p => ({
            ...p,
            role: null,
            isAlive: true,
            votes: 0
        })));
    }, []);

    // Update isNightPhase derived state
    useEffect(() => {
        setIsNightPhase(phase.includes('NIGHT'));
    }, [phase]);

    const addEvent = useCallback((description) => {
        setEvents(prev => [...prev, {
            turn,
            phase,
            description,
            timestamp: Date.now(),
        }]);
    }, [turn, phase]);

    const addPlayer = useCallback((name) => {
        if (phase !== 'SETUP') return;

        const trimmedName = name?.trim();
        if (!trimmedName || trimmedName.length === 0) return;

        if (players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
            alert('Player name already exists!');
            return;
        }

        if (players.length >= 30) {
            alert('Maximum 30 players allowed');
            return;
        }

        const newPlayer = {
            id: `player-${Date.now()}-${Math.random()}`,
            name: trimmedName,
            role: null,
            isAlive: true,
            votes: 0,
        };

        setPlayers(prev => {
            const newPlayers = [...prev, newPlayer];
            setGameConfig(getDefaultConfig(newPlayers.length));
            return newPlayers;
        });
    }, [phase, players]);

    const removePlayer = useCallback((id) => {
        if (phase !== 'SETUP') return;
        setPlayers(prev => {
            const newPlayers = prev.filter(p => p.id !== id);
            setGameConfig(getDefaultConfig(newPlayers.length));
            return newPlayers;
        });
    }, [phase]);

    const updateGameConfig = useCallback((newConfig) => {
        setGameConfig(prev => ({ ...prev, ...newConfig }));
    }, []);

    const startGame = useCallback(() => {
        if (players.length < 4) {
            alert('You need at least 4 players to start!');
            return;
        }

        const roleDist = getRoleDistribution(players.length, gameConfig);
        console.log('Starting game with roles:', roleDist);

        setPlayers(prev => {
            const updatedPlayers = prev.map((player, index) => ({
                ...player,
                role: roleDist[index],
                isAlive: true,
                votes: 0,
            }));
            console.log('Players updated with roles:', updatedPlayers);
            return updatedPlayers;
        });

        setTurn(1);
        setRoleActions({
            [ROLES.DOCTOR]: gameConfig.doctorLimit || 1,
            [ROLES.SHERIFF]: gameConfig.sheriffLimit || 1
        });

        setPhase('DISTRIBUTING_ROLES');
        addEvent(t('gameStarted'));

        setTimeout(() => {
            setPhase('DAY_DISCUSSION');
        }, 4000);
    }, [players.length, gameConfig, addEvent, t]);

    const checkWinCondition = useCallback((currentPlayers) => {
        const activePlayers = currentPlayers || players;
        const alivePlayers = activePlayers.filter(p => p.isAlive);
        const vampires = alivePlayers.filter(p => p.role === ROLES.VAMPIRE);
        // Jester is NOT a villager, but also shouldn't count towards villager total for parity check
        // Logic: Vampires win if they equal or outnumber everyone else (excluding Jester? No, usually Jester counts as a "non-vampire" body)
        // Standard Mafia rules: Vampires >= Non-Vampires
        const nonVampires = alivePlayers.filter(p => p.role !== ROLES.VAMPIRE);

        const jester = activePlayers.find(p => p.role === ROLES.JESTER);

        if (vampires.length === 0) {
            setWinner('VILLAGERS');
            setWinReason(t('villagersWin'));
            setPhase('GAME_OVER');
            addEvent(t('villagersWin'));
            return true;
        }

        if (vampires.length >= nonVampires.length - vampires.length) {
            // Wait, nonVampires includes everyone else. 
            // If 2 Vampires, 2 Villagers. Total 4. Non-Vampires = 2. Vampires = 2. 2 >= 2. Win.
            // If 1 Vampire, 1 Villager, 1 Jester. Total 3. Non-Vampires = 2. Vampires = 1. 1 >= 2 False.
            // If 1 Vampire, 1 Jester. Total 2. Non-Vampires = 1. Vampires = 1. 1 >= 1. Win.

            setWinner('VAMPIRES');
            setWinReason(t('vampiresWin'));
            setPhase('GAME_OVER');
            addEvent(t('vampiresWin'));
            return true;
        }

        return false;
    }, [players, addEvent, t]);

    const resolveNight = useCallback(() => {
        const { vampireTarget, doctorTarget } = nightAction;
        // We DO NOT update players here anymore. We only calculate the result.
        // Death is applied in applyNightResults()

        let result = { type: 'QUIET', victim: null, victimId: null };

        // Logic:
        // 1. If Vampire skipped (vampireTarget is null/undefined) -> QUIET
        // 2. If Vampire target == Doctor target -> QUIET (Saved)
        // 3. If Vampire target != Doctor target -> DEATH

        if (vampireTarget && vampireTarget !== doctorTarget) {
            const victim = players.find(p => p.id === vampireTarget);
            // Don't add event yet, reveal it in morning
            result = { type: 'DEATH', victim: victim?.name, victimId: vampireTarget };
        } else if (vampireTarget && vampireTarget === doctorTarget) {
            // Saved
            result = { type: 'QUIET', victim: null, victimId: null };
        } else {
            // Vampire skipped or no action
            result = { type: 'QUIET', victim: null, victimId: null };
        }

        setNightResult(result);
        setNightAction({}); // Clear actions

        // No win condition check here because no one died yet
    }, [nightAction, players]);

    const applyNightResults = useCallback(() => {
        if (!nightResult || nightResult.type !== 'DEATH' || !nightResult.victimId) {
            addEvent(t('nightQuiet'));
            return;
        }

        const victimId = nightResult.victimId;
        const newPlayers = players.map(p =>
            p.id === victimId ? { ...p, isAlive: false } : p
        );

        const victim = players.find(p => p.id === victimId);
        addEvent(t('killedByVampire', { name: victim?.name }));

        setPlayers(newPlayers);

        // Check win condition immediately
        checkWinCondition(newPlayers);
    }, [nightResult, players, addEvent, t, checkWinCondition]);

    const eliminatePlayer = useCallback((playerId) => {
        const newPlayers = players.map(p =>
            p.id === playerId ? { ...p, isAlive: false, votes: 0 } : { ...p, votes: 0 }
        );

        setPlayers(newPlayers);
        setVotes({}); // Clear votes after elimination

        const eliminated = players.find(p => p.id === playerId);
        addEvent(t('eliminatedByVote', { name: eliminated?.name }));

        // Check Jester Win Condition
        if (eliminated?.role === ROLES.JESTER) {
            setWinner('JESTER');
            setWinReason(t('jesterWin'));
            setPhase('GAME_OVER');
            addEvent(t('jesterWin'));
            return true; // Game Over
        }

        return checkWinCondition(newPlayers);
    }, [players, addEvent, checkWinCondition, t]);

    const resolveVotes = useCallback(() => {
        const voteCounts = {};
        const alivePlayerIds = new Set(players.filter(p => p.isAlive).map(p => p.id));

        Object.entries(votes).forEach(([voterId, targetId]) => {
            // Only count votes from alive players
            if (alivePlayerIds.has(voterId)) {
                voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
            }
        });

        let maxVotes = 0;
        let candidate = null;
        let isTie = false;

        Object.entries(voteCounts).forEach(([playerId, count]) => {
            if (count > maxVotes) {
                maxVotes = count;
                candidate = playerId;
                isTie = false;
            } else if (count === maxVotes) {
                isTie = true;
            }
        });

        // Eliminate if there's a clear winner and they have at least 1 vote
        if (candidate && !isTie) {
            return eliminatePlayer(candidate);
        } else {
            addEvent(t('votingTie'));
            return false; // No elimination, game continues
        }
    }, [votes, eliminatePlayer, addEvent, t, players]);

    const nextPhase = useCallback(() => {
        console.log('nextPhase called. Current phase:', phase, 'Turn:', turn);
        // Phase order depends on turn
        // New Order: NIGHT -> MORNING_ANNOUNCEMENT -> DAY_DISCUSSION -> VOTING -> NIGHT
        const phaseOrder = [
            'NIGHT',
            'NIGHT_VAMPIRE',
            ...(gameConfig.hasDoctor ? ['NIGHT_DOCTOR'] : []),
            ...(gameConfig.hasSheriff ? ['NIGHT_SHERIFF'] : []),
            'MORNING_ANNOUNCEMENT', // Morning Announcement (Who died)
            'DAY_DISCUSSION',       // Discussion
            'VOTING',               // Voting
        ];

        let currentIndex = phaseOrder.indexOf(phase);
        console.log('Phase Order:', phaseOrder);
        console.log('Current Index:', currentIndex);

        // Handle case where current phase might not be in the list
        if (currentIndex === -1) {
            if (phase.startsWith('NIGHT')) currentIndex = phaseOrder.indexOf('NIGHT_SHERIFF');
            else currentIndex = phaseOrder.indexOf('VOTING');
            console.log('Fallback Index:', currentIndex);
        }

        let nextPhaseValue = phaseOrder[(currentIndex + 1) % phaseOrder.length];
        console.log('Initial Next Phase Value:', nextPhaseValue);

        // Turn 1 Override: DAY_DISCUSSION -> NIGHT (Skip Voting)
        if (phase === 'DAY_DISCUSSION' && turn === 1) {
            nextPhaseValue = 'NIGHT';
            console.log('Turn 1 Override: Skipping Voting, going to NIGHT');
        }

        // If transitioning from Night to Morning Announcement, resolve night (calculate result)
        if (phase.startsWith('NIGHT') && nextPhaseValue === 'MORNING_ANNOUNCEMENT') {
            resolveNight();
        }

        // If transitioning from Morning Announcement to Day Discussion, APPLY death
        if (phase === 'MORNING_ANNOUNCEMENT' && nextPhaseValue === 'DAY_DISCUSSION') {
            applyNightResults();
        }

        // If transitioning from VOTING to NIGHT (Next Round), resolve votes
        if (phase === 'VOTING') {
            try {
                console.log('Resolving votes...');
                const isGameOver = resolveVotes();

                if (isGameOver) {
                    console.log('Game Over detected during voting resolution. Stopping phase transition.');
                    return; // Stop here, don't set phase to NIGHT
                }

                // Force next phase to NIGHT if we are in VOTING and game is not over
                nextPhaseValue = 'NIGHT';
                console.log('Voting complete. Proceeding to NIGHT.');

            } catch (e) {
                console.error('Error resolving votes:', e);
                return; // Stop on error
            }
        }

        // Increment turn when Morning Announcement starts
        if (nextPhaseValue === 'MORNING_ANNOUNCEMENT') {
            setTurn(prev => prev + 1);
            // Reset night actions for the new round
            setNightAction({});
        }

        if (nextPhaseValue === 'VOTING') {
            // Reset votes when voting starts
            setVotes({});
            setPlayers(prev => prev.map(p => ({ ...p, votes: 0 })));
        }

        console.log('Setting Phase to:', nextPhaseValue);
        setPhase(nextPhaseValue);
    }, [phase, gameConfig, resolveNight, turn, resolveVotes, checkWinCondition]);

    const setVampireTarget = useCallback((targetId) => {
        setNightAction(prev => ({ ...prev, vampireTarget: targetId }));
    }, []);

    const setDoctorTarget = useCallback((targetId) => {
        setNightAction(prev => ({ ...prev, doctorTarget: targetId }));
    }, []);

    const setSheriffTarget = useCallback((targetId) => {
        if (!targetId) {
            setNightAction(prev => ({ ...prev, sheriffTarget: null, sheriffResult: null }));
            return;
        }
        const target = players.find(p => p.id === targetId);

        if (!target || !target.isAlive) {
            console.error('Sheriff cannot investigate a dead player');
            return;
        }

        const result = target?.role === ROLES.VAMPIRE ? 'vampire' : 'villager';
        setNightAction(prev => ({ ...prev, sheriffTarget: targetId, sheriffResult: result }));
    }, [players]);

    // New Voting System
    const castVote = useCallback((voterId, targetId) => {
        // Check if voter is alive
        const voter = players.find(p => p.id === voterId);
        if (!voter || !voter.isAlive) return;

        // Allow changing vote by updating the votes object
        setVotes(prev => ({ ...prev, [voterId]: targetId }));
    }, [players]);

    const clearVotes = useCallback(() => {
        setVotes({});
        setPlayers(prev => prev.map(p => ({ ...p, votes: 0 })));
    }, []);



    const useRoleAction = useCallback((role) => {
        setRoleActions(prev => ({
            ...prev,
            [role]: Math.max(0, (prev[role] || 0) - 1)
        }));
    }, []);



    return (
        <GameContext.Provider
            value={{
                phase,
                turn,
                players,
                nightAction,
                events,
                winner,
                winReason,
                votes,
                language,
                setLanguage,
                t,
                addPlayer,
                removePlayer,
                startGame,
                nextPhase,
                resetGame,
                restartGame: resetGame,
                setVampireTarget,
                setDoctorTarget,
                setSheriffTarget,
                resolveNight,
                castVote,
                clearVotes,
                eliminatePlayer,
                roleActions,
                useRoleAction,
                gameConfig,
                updateGameConfig,
                nightResult,
                activeVoter,
                setActiveVoter,
                applyNightResults,
            }}
        >
            {children}
        </GameContext.Provider>
    );
};


export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within GameProvider');
    }
    return context;
};
