import React, { useState, useCallback, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import HighScoreModal from './components/HighScoreModal';
import LeaderboardModal from './components/LeaderboardModal';
import { HighScore } from './types';

export type Difficulty = 'normal' | 'advanced' | 'maximum';

const INITIAL_GAME_DURATION = 30; // seconds
const HOLE_IN_ONE_BONUS = 5; // seconds
const STREAK_FOR_BONUS = 3;

const App: React.FC = () => {
  const [score, setScore] = useState<number>(0);
  const [gameDuration, setGameDuration] = useState<number>(INITIAL_GAME_DURATION);
  const [timeLeft, setTimeLeft] = useState<number>(INITIAL_GAME_DURATION);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [resetKey, setResetKey] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<HighScore[]>([]);
  const [isHighScoreModalOpen, setIsHighScoreModalOpen] = useState<boolean>(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState<boolean>(false);
  
  const [holeInOneStreak, setHoleInOneStreak] = useState<number>(0);
  const [isTripleGoalBonusAvailable, setIsTripleGoalBonusAvailable] = useState<boolean>(false);
  const [isTripleGoalBonusActive, setIsTripleGoalBonusActive] = useState<boolean>(false);

  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  useEffect(() => {
    try {
      const savedLeaderboard = localStorage.getItem('projectionPuttLeaderboard');
      if (savedLeaderboard) {
        const parsedLeaderboard = JSON.parse(savedLeaderboard);
        // Backwards compatibility for old leaderboards without difficulty
        const leaderboardWithDifficulty = parsedLeaderboard.map((score: HighScore) => ({
          ...score,
          difficulty: score.difficulty || 'normal',
        }));
        setLeaderboard(leaderboardWithDifficulty);
      }
    } catch (error) {
      console.error("Failed to load leaderboard from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (holeInOneStreak >= STREAK_FOR_BONUS && !isTripleGoalBonusActive) {
      setIsTripleGoalBonusAvailable(true);
    }
  }, [holeInOneStreak, isTripleGoalBonusActive]);

  useEffect(() => {
    if (!isGameActive || isGameOver) return;

    if (timeLeft <= 0) {
      setIsGameActive(false);
      setIsGameOver(true);
      const isNewHighScore = score > 0 && (leaderboard.length < 5 || score > leaderboard[leaderboard.length - 1].score);
      if (isNewHighScore) {
        setIsHighScoreModalOpen(true);
      }
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [isGameActive, timeLeft, isGameOver, score, leaderboard]);

  const handleBallInHole = useCallback((shotCount: number) => {
    if (isGameActive) {
      setScore(prev => prev + 1);

      if (shotCount === 1) { // Hole in one
        setTimeLeft(prev => prev + HOLE_IN_ONE_BONUS);
        setHoleInOneStreak(prev => prev + 1);
      } else {
        setHoleInOneStreak(0);
      }
    }
  }, [isGameActive]);
  
  const handleActivateBonus = useCallback(() => {
    if (!isTripleGoalBonusAvailable) return;
    setIsTripleGoalBonusAvailable(false);
    setIsTripleGoalBonusActive(true);
    setHoleInOneStreak(0); // Reset streak after using bonus
  }, [isTripleGoalBonusAvailable]);

  const handleBonusUsed = useCallback(() => {
    setIsTripleGoalBonusActive(false);
  }, []);


  const handleShot = useCallback(() => {
    if (!isGameActive && !isGameOver) {
      setIsGameActive(true);
    }
  }, [isGameActive, isGameOver]);

  const handleReset = useCallback(() => {
    setScore(0);
    setTimeLeft(gameDuration);
    setIsGameActive(false);
    setIsGameOver(false);
    setHoleInOneStreak(0);
    setIsTripleGoalBonusAvailable(false);
    setIsTripleGoalBonusActive(false);
    setResetKey(prev => prev + 1);
  }, [gameDuration]);
  
  const handleSaveHighScore = (name: string) => {
    const newScore = { name, score, difficulty };
    const newLeaderboard = [...leaderboard, newScore]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
      
    try {
        localStorage.setItem('projectionPuttLeaderboard', JSON.stringify(newLeaderboard));
        setLeaderboard(newLeaderboard);
    } catch (error) {
        console.error("Failed to save leaderboard to localStorage", error);
    }
    setIsHighScoreModalOpen(false);
  };

  const handleChangeDifficulty = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    handleReset();
  };
  
  const handleChangeGameDuration = (increment: number) => {
    setGameDuration(prev => {
        const newTime = prev + increment;
        if (newTime >= 30 && newTime <= 180) { // Min 30s, Max 180s
            setTimeLeft(newTime); // also update timeLeft immediately
            return newTime;
        }
        return prev;
    });
  };


  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center font-sans p-4">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center relative">
        <Header gameDuration={gameDuration} />
        <GameCanvas
          key={resetKey}
          onBallInHole={handleBallInHole}
          onShot={handleShot}
          isGameOver={isGameOver}
          isTripleGoalBonusActive={isTripleGoalBonusActive}
          onBonusUsed={handleBonusUsed}
          difficulty={difficulty}
          isGameActive={isGameActive}
        />
        <ControlPanel
          score={score}
          timeLeft={timeLeft}
          isGameActive={isGameActive}
          isGameOver={isGameOver}
          onReset={handleReset}
          highScore={leaderboard.length > 0 ? leaderboard[0] : null}
          holeInOneStreak={holeInOneStreak}
          isTripleGoalBonusAvailable={isTripleGoalBonusAvailable}
          onActivateBonus={handleActivateBonus}
          difficulty={difficulty}
          onChangeDifficulty={handleChangeDifficulty}
          onShowLeaderboard={() => setIsLeaderboardModalOpen(true)}
          gameDuration={gameDuration}
          onChangeGameDuration={handleChangeGameDuration}
        />
        <HighScoreModal
          isOpen={isHighScoreModalOpen}
          score={score}
          onSave={handleSaveHighScore}
          leaderboard={leaderboard}
        />
        <LeaderboardModal
          isOpen={isLeaderboardModalOpen}
          leaderboard={leaderboard}
          onClose={() => setIsLeaderboardModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default App;