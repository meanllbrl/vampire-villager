import React from 'react';
import { GameProvider, useGame } from './context/GameContext.jsx';
import { Setup } from './components/Setup.jsx';
import { ModeratorDashboard } from './pages/ModeratorDashboard.jsx';
import { StreamView } from './pages/StreamView.jsx';

const AppContent = () => {
    const { phase } = useGame();
    // Check for stream mode via query parameter (works better on GitHub Pages)
    const urlParams = new URLSearchParams(window.location.search);
    const isStreamRoute = urlParams.get('stream') === 'true' || window.location.pathname === '/stream';
    const [viewMode, setViewMode] = React.useState(isStreamRoute ? 'stream' : 'moderator');

    if (phase === 'SETUP') {
        return <Setup />;
    }

    return (
        <div>
            {/* View Toggle (for moderator to switch) - Hidden on /stream route */}
            {!isStreamRoute && (
                <div className="fixed top-4 left-4 z-50 flex gap-2">
                    <button
                        onClick={() => setViewMode('moderator')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'moderator'
                            ? 'bg-primary text-white'
                            : 'bg-surface/50 backdrop-blur-xl text-muted hover:text-text'
                            }`}
                    >
                        Moderator
                    </button>
                    <button
                        onClick={() => setViewMode('stream')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'stream'
                            ? 'bg-secondary text-white'
                            : 'bg-surface/50 backdrop-blur-xl text-muted hover:text-text'
                            }`}
                    >
                        Stream View
                    </button>
                </div>
            )}

            {viewMode === 'moderator' ? <ModeratorDashboard /> : <StreamView />}
        </div>
    );
};

function App() {
    // Check for stream mode via query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const isStreamRoute = urlParams.get('stream') === 'true' || window.location.pathname === '/stream';

    return (
        <GameProvider readOnly={isStreamRoute}>
            <AppContent />
        </GameProvider>
    );
}

export default App;
