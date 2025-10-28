import React, { useRef, useEffect } from 'react';
import { Vector2D } from '../types';
import { Difficulty } from '../App';

interface GameCanvasProps {
  onBallInHole: (shotCount: number) => void;
  onShot: () => void;
  isGameOver: boolean;
  isTripleGoalBonusActive: boolean;
  onBonusUsed: () => void;
  difficulty: Difficulty;
  isGameActive: boolean;
}

const BALL_RADIUS = 10;
const HOLE_RADIUS = 15;
const FRICTION = 0.98;
const MIN_VELOCITY = 0.1;
const MAX_POWER = 15;
const HOLE_SPEED = 1.5;

const GameCanvas: React.FC<GameCanvasProps> = ({ 
    onBallInHole, 
    onShot, 
    isGameOver,
    isTripleGoalBonusActive,
    onBonusUsed,
    difficulty,
    isGameActive
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const ballPos = useRef<Vector2D>({ x: 100, y: 250 });
  const ballVel = useRef<Vector2D>({ x: 0, y: 0 });
  const holePos = useRef<Vector2D>({ x: 700, y: 250 });
  const holeVel = useRef<Vector2D>({ x: 0, y: 0 });
  const bonusHole1Pos = useRef<Vector2D | null>(null);
  const bonusHole2Pos = useRef<Vector2D | null>(null);
  
  const isAiming = useRef<boolean>(false);
  const startDragPos = useRef<Vector2D | null>(null);
  const endDragPos = useRef<Vector2D | null>(null);

  const animationFrameId = useRef<number>(0);
  const isMoving = useRef<boolean>(false);
  const shotCount = useRef<number>(0);
  const needsHoleRandomizeOnStop = useRef<boolean>(false);

  const bonusTexts = useRef<{ text: string; x: number; y: number; opacity: number; life: number; }[]>([]);

  const onBallInHoleRef = useRef(onBallInHole);
  const onShotRef = useRef(onShot);
  const onBonusUsedRef = useRef(onBonusUsed);
  
  const isGameActiveRef = useRef(isGameActive);
  useEffect(() => {
    isGameActiveRef.current = isGameActive;
  }, [isGameActive]);


  useEffect(() => {
    onBallInHoleRef.current = onBallInHole;
    onShotRef.current = onShot;
    onBonusUsedRef.current = onBonusUsed;
  });

   const randomizeHolePosition = (canvas: HTMLCanvasElement) => {
        const padding = 50;
        const newHolePos = {
            x: Math.random() * (canvas.width - padding * 2) + padding,
            y: Math.random() * (canvas.height - padding * 2) + padding,
        };

        const distFromStart = Math.sqrt((newHolePos.x - 100) ** 2 + (newHolePos.y - 250) ** 2);
        if (distFromStart < 200) {
            randomizeHolePosition(canvas); 
            return;
        }
        
        holePos.current = newHolePos;

        if (difficulty === 'maximum') {
            const angle = Math.random() * Math.PI * 2;
            holeVel.current = { x: Math.cos(angle) * HOLE_SPEED, y: Math.sin(angle) * HOLE_SPEED };
        }
    };

  useEffect(() => {
    if (isTripleGoalBonusActive) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const padding = 50;
      bonusHole1Pos.current = {
        x: Math.random() * (canvas.width - padding * 2) + padding,
        y: Math.random() * (canvas.height - padding * 2) + padding,
      };
      bonusHole2Pos.current = {
        x: Math.random() * (canvas.width - padding * 2) + padding,
        y: Math.random() * (canvas.height - padding * 2) + padding,
      };
    } else {
      bonusHole1Pos.current = null;
      bonusHole2Pos.current = null;
    }
  }, [isTripleGoalBonusActive]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ballPos.current = { x: 100, y: 250 };
    ballVel.current = { x: 0, y: 0 };
    randomizeHolePosition(canvas);
    isAiming.current = false;
    startDragPos.current = null;
    endDragPos.current = null;
    isMoving.current = false;
    shotCount.current = 0;
    needsHoleRandomizeOnStop.current = false;
    
    const drawHole = (pos: Vector2D, color: string) => {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;

        const gradient = ctx.createRadialGradient(
            pos.x, pos.y, HOLE_RADIUS * 0.2,
            pos.x, pos.y, HOLE_RADIUS
        );
        gradient.addColorStop(0, '#000');
        gradient.addColorStop(0.8, '#111');
        gradient.addColorStop(1, '#222');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, HOLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    const gameLoop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (difficulty === 'maximum' && isGameActiveRef.current) {
            holePos.current.x += holeVel.current.x;
            holePos.current.y += holeVel.current.y;
            
            if (holePos.current.x - HOLE_RADIUS < 0 || holePos.current.x + HOLE_RADIUS > canvas.width) {
                holeVel.current.x *= -1;
            }
            if (holePos.current.y - HOLE_RADIUS < 0 || holePos.current.y + HOLE_RADIUS > canvas.height) {
                holeVel.current.y *= -1;
            }
        }

        drawHole(holePos.current, '#06b6d4');
        if (isTripleGoalBonusActive && bonusHole1Pos.current && bonusHole2Pos.current) {
            drawHole(bonusHole1Pos.current, '#f59e0b');
            drawHole(bonusHole2Pos.current, '#f59e0b');
        }
        
        ballPos.current.x += ballVel.current.x;
        ballPos.current.y += ballVel.current.y;
        ballVel.current.x *= FRICTION;
        ballVel.current.y *= FRICTION;

        const speed = Math.sqrt(ballVel.current.x ** 2 + ballVel.current.y ** 2);
        
        if (isMoving.current && speed <= MIN_VELOCITY) {
            isMoving.current = false;
            ballVel.current = { x: 0, y: 0 };
            if (needsHoleRandomizeOnStop.current) {
                randomizeHolePosition(canvas);
                needsHoleRandomizeOnStop.current = false;
            }
        }

        if (ballPos.current.x - BALL_RADIUS < 0 || ballPos.current.x + BALL_RADIUS > canvas.width) {
            ballVel.current.x *= -1;
            ballPos.current.x = Math.max(BALL_RADIUS, Math.min(ballPos.current.x, canvas.width - BALL_RADIUS));
        }
        if (ballPos.current.y - BALL_RADIUS < 0 || ballPos.current.y + BALL_RADIUS > canvas.height) {
            ballVel.current.y *= -1;
            ballPos.current.y = Math.max(BALL_RADIUS, Math.min(ballPos.current.y, canvas.height - BALL_RADIUS));
        }
        
        const checkWin = (hole: Vector2D | null): boolean => {
            if (!hole) return false;
            const dist = Math.sqrt((ballPos.current.x - hole.x) ** 2 + (ballPos.current.y - hole.y) ** 2);
            return dist < HOLE_RADIUS && speed < 5;
        }

        const scoredInMainHole = checkWin(holePos.current);
        const scoredInBonus1 = isTripleGoalBonusActive && checkWin(bonusHole1Pos.current);
        const scoredInBonus2 = isTripleGoalBonusActive && checkWin(bonusHole2Pos.current);
        
        if (scoredInMainHole || scoredInBonus1 || scoredInBonus2) {
            if (shotCount.current === 1) {
                 let scoredHolePosition = holePos.current;
                 if (scoredInBonus1) {
                    scoredHolePosition = bonusHole1Pos.current!;
                 } else if (scoredInBonus2) {
                    scoredHolePosition = bonusHole2Pos.current!;
                 }
                bonusTexts.current.push({
                    text: "+5",
                    x: scoredHolePosition.x,
                    y: scoredHolePosition.y - HOLE_RADIUS,
                    opacity: 1,
                    life: 90
                });
            }

            onBallInHoleRef.current(shotCount.current);
            if(scoredInBonus1 || scoredInBonus2){
                onBonusUsedRef.current();
            }
            ballPos.current = { x: 100, y: 250 };
            ballVel.current = { x: 0, y: 0 };
            isMoving.current = false;
            shotCount.current = 0;
            randomizeHolePosition(canvas);
        }
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ballPos.current.x, ballPos.current.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        if (isAiming.current && startDragPos.current && endDragPos.current) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(startDragPos.current.x, startDragPos.current.y);
            ctx.lineTo(endDragPos.current.x, endDragPos.current.y);
            ctx.stroke();

            const dx = endDragPos.current.x - startDragPos.current.x;
            const dy = endDragPos.current.y - startDragPos.current.y;
            
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.moveTo(ballPos.current.x, ballPos.current.y);
            ctx.lineTo(ballPos.current.x - dx, ballPos.current.y - dy);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 28px sans-serif';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 5;

        for (let i = bonusTexts.current.length - 1; i >= 0; i--) {
            const text = bonusTexts.current[i];
            
            ctx.fillStyle = `rgba(255, 215, 0, ${text.opacity})`;
            ctx.fillText(text.text, text.x, text.y);
            
            text.y -= 0.75;
            text.life--;
            text.opacity = text.life / 90;
            
            if (text.life <= 0) {
                bonusTexts.current.splice(i, 1);
            }
        }
        ctx.restore();


        animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    const getMousePos = (e: MouseEvent): Vector2D => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isAiming.current) return;
      endDragPos.current = getMousePos(e);
    };

    const handleGlobalMouseUp = () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);

      if (!isAiming.current || !startDragPos.current || !endDragPos.current) return;
      isAiming.current = false;

      const dx = endDragPos.current.x - startDragPos.current.x;
      const dy = endDragPos.current.y - startDragPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      startDragPos.current = null;
      endDragPos.current = null;

      if (dist > 5) {
        const power = Math.min(dist / 10, MAX_POWER);
        const angle = Math.atan2(dy, dx);
        
        ballVel.current.x = -Math.cos(angle) * power;
        ballVel.current.y = -Math.sin(angle) * power;

        isMoving.current = true;

        onShotRef.current();
        shotCount.current++;
        
        if (difficulty === 'advanced') {
          needsHoleRandomizeOnStop.current = true;
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (isMoving.current || isGameOver) return;
      const mousePos = getMousePos(e);
      const distToBall = Math.sqrt((mousePos.x - ballPos.current.x) ** 2 + (mousePos.y - ballPos.current.y) ** 2);
      if (distToBall < BALL_RADIUS * 2) {
        isAiming.current = true;
        startDragPos.current = mousePos;
        endDragPos.current = mousePos;
        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
      }
    };
    
    canvas.addEventListener('mousedown', handleMouseDown);
    
    return () => {
        cancelAnimationFrame(animationFrameId.current);
        canvas.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isGameOver, isTripleGoalBonusActive, difficulty]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={500}
      className="bg-slate-800 rounded-xl shadow-inner border border-slate-700"
    />
  );
};

export default GameCanvas;