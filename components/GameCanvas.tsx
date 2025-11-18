import React, { useRef, useEffect } from 'react';
import { Vector2D, GameState, Obstacle } from '../types';
import { Difficulty, GameMode } from '../App';

interface GameCanvasProps {
  onBallInHole: (data: { shotCount: number; scoringPlayer?: 1 | 2 }) => void;
  onShot: (args?: any) => void;
  isGameOver: boolean;
  difficulty: Difficulty;
  onBallStop: () => void;
  // Online MP
  gameMode: GameMode;
  onlineGameState: GameState | null;
  playerNumber: 1 | 2 | null;
}


const BALL_RADIUS = 10;
const HOLE_RADIUS = 15;
const FRICTION = 0.98;
const MIN_VELOCITY = 0.1;
const MAX_POWER = 15;

const GameCanvas: React.FC<GameCanvasProps> = ({ 
    onBallInHole, 
    onShot, 
    isGameOver,
    difficulty,
    onBallStop,
    gameMode,
    onlineGameState,
    playerNumber,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Single player state
  const singleBallPos = useRef<Vector2D>({ x: 100, y: 250 });
  const singleBallVel = useRef<Vector2D>({ x: 0, y: 0 });
  const isSingleBallMoving = useRef<boolean>(false);
  const isSingleBallInHole = useRef<boolean>(false);
  const shotCount = useRef<number>(0);

  // Local multiplayer state
  const multiBalls = useRef([
    { pos: { x: 100, y: 225 }, vel: { x: 0, y: 0 }, isMoving: false, inHole: false },
    { pos: { x: 100, y: 275 }, vel: { x: 0, y: 0 }, isMoving: false, inHole: false },
  ]);
  const p2AimRef = useRef({ angle: 0, power: 0, charging: false });
  const keysPressed = useRef<Record<string, boolean>>({});
  const isRoundOver = useRef<boolean>(false);

  // Shared state
  const holePos = useRef<Vector2D>({ x: 700, y: 250 });
  const obstacles = useRef<Obstacle[]>([]);
  const isAiming = useRef<boolean>(false);
  const startDragPos = useRef<Vector2D | null>(null);
  const endDragPos = useRef<Vector2D | null>(null);
  const animationFrameId = useRef<number>(0);

  const onBallInHoleRef = useRef(onBallInHole);
  const onShotRef = useRef(onShot);
  const onBallStopRef = useRef(onBallStop);
  
  useEffect(() => {
    onBallInHoleRef.current = onBallInHole;
    onShotRef.current = onShot;
    onBallStopRef.current = onBallStop;
  });
  
   const randomizeHolePosition = (canvas: HTMLCanvasElement) => {
        const padding = 50;
        let newHolePos: Vector2D;
        let validPosition = false;
        while(!validPosition) {
            newHolePos = {
                x: Math.random() * (canvas.width - padding * 2) + padding,
                y: Math.random() * (canvas.height - padding * 2) + padding,
            };
            const distFromStart = Math.sqrt((newHolePos.x - 100) ** 2 + (newHolePos.y - 250) ** 2);
            if (distFromStart < 200) continue;
            holePos.current = newHolePos;
            validPosition = true;
        }
    };

    const generateObstacles = (canvas: HTMLCanvasElement) => {
        obstacles.current = [];
        let obstacleCount = 0;
        if (difficulty === 'normal') obstacleCount = 2;
        if (difficulty === 'advanced') obstacleCount = 4;
        if (difficulty === 'maximum') obstacleCount = 6;
    
        for (let i = 0; i < obstacleCount; i++) {
            let newObstacle: Obstacle;
            let valid = false;
            while (!valid) {
                const width = Math.random() * 80 + 20;
                const height = Math.random() * 80 + 20;
                const x = Math.random() * (canvas.width - width);
                const y = Math.random() * (canvas.height - height);
                newObstacle = { x, y, width, height };
    
                const distFromStart = Math.sqrt((x - 100)**2 + (y - 250)**2);
                if (distFromStart < 100) continue;
                
                let overlaps = false;
                for (const obs of obstacles.current) {
                    if (x < obs.x + obs.width && x + width > obs.x && y < obs.y + obs.height && y + height > obs.y) {
                        overlaps = true;
                        break;
                    }
                }
                if (overlaps) continue;
                
                valid = true;
                obstacles.current.push(newObstacle);
            }
        }
    };

    // Keyboard controls for local multiplayer
    useEffect(() => {
        if (gameMode !== 'localMultiplayer') return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (isGameOver) return;
            keysPressed.current[e.key] = true;
            // Allow charging even if balls are moving
            if (e.key === ' ' && !p2AimRef.current.charging) {
                p2AimRef.current.charging = true;
                p2AimRef.current.power = 0;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            keysPressed.current[e.key] = false;
            if (e.key === ' ') {
                if (p2AimRef.current.charging) {
                    const power = p2AimRef.current.power;
                    const angle = p2AimRef.current.angle;
                    multiBalls.current[1].vel = {
                        x: Math.cos(angle) * power,
                        y: Math.sin(angle) * power
                    };
                    multiBalls.current[1].isMoving = true;
                    onShotRef.current();
                    
                    p2AimRef.current.charging = false;
                    p2AimRef.current.power = 0;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameMode, isGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const canvasAspectRatio = 800 / 500;
        let newWidth, newHeight;
        if (containerWidth / containerHeight > canvasAspectRatio) {
            newHeight = containerHeight;
            newWidth = newHeight * canvasAspectRatio;
        } else {
            newWidth = containerWidth;
            newHeight = newWidth / canvasAspectRatio;
        }
        canvas.style.width = `${newWidth}px`;
        canvas.style.height = `${newHeight}px`;
        canvas.style.top = `${(containerHeight - newHeight) / 2}px`;
        canvas.style.left = `${(containerWidth - newWidth) / 2}px`;
    };
    
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);
    resizeCanvas();
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Initial setup
    const reset = () => {
        generateObstacles(canvas);
        randomizeHolePosition(canvas);
        shotCount.current = 0;
        isRoundOver.current = false;
        if (gameMode === 'localMultiplayer') {
            multiBalls.current = [
                { pos: { x: 100, y: 225 }, vel: { x: 0, y: 0 }, isMoving: false, inHole: false },
                { pos: { x: 100, y: 275 }, vel: { x: 0, y: 0 }, isMoving: false, inHole: false },
            ];
        } else {
            singleBallPos.current = { x: 100, y: 250 };
            singleBallVel.current = { x: 0, y: 0 };
            isSingleBallMoving.current = false;
            isSingleBallInHole.current = false;
        }
    }
    reset();

    const drawHole = (pos: Vector2D, color: string) => {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        const gradient = ctx.createRadialGradient(pos.x, pos.y, HOLE_RADIUS * 0.2, pos.x, pos.y, HOLE_RADIUS);
        gradient.addColorStop(0, '#000');
        gradient.addColorStop(1, '#222');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, HOLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    const handleLocalMultiplayerGoal = (scoringPlayer: 1 | 2) => {
        if (isRoundOver.current || isGameOver) return;
        isRoundOver.current = true;
        
        multiBalls.current[scoringPlayer - 1].inHole = true;
        multiBalls.current[scoringPlayer - 1].vel = { x: 0, y: 0 };

        onBallInHoleRef.current({ shotCount: 0, scoringPlayer });

        setTimeout(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            multiBalls.current[0] = { pos: { x: 100, y: 225 }, vel: { x: 0, y: 0 }, isMoving: false, inHole: false };
            multiBalls.current[1] = { pos: { x: 100, y: 275 }, vel: { x: 0, y: 0 }, isMoving: false, inHole: false };
            randomizeHolePosition(canvas);
            isRoundOver.current = false;
        }, 200);
    };

    const gameLoop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Obstacles (shared)
        const currentObstacles = gameMode === 'onlineMultiplayer' && onlineGameState ? onlineGameState.obstacles : obstacles.current;
        ctx.fillStyle = '#475569';
        currentObstacles.forEach(obs => {
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        });

        // Draw Hole (shared)
        const currentHolePos = gameMode === 'onlineMultiplayer' && onlineGameState ? onlineGameState.holePosition : holePos.current;
        drawHole(currentHolePos, '#06b6d4');


        // --- RENDER BASED ON MODE ---
        if (gameMode === 'onlineMultiplayer' && onlineGameState) {
             onlineGameState.players.forEach(p => {
                ctx.fillStyle = p.playerNumber === 1 ? '#fff' : '#ef4444';
                ctx.beginPath();
                ctx.arc(p.ball.position.x, p.ball.position.y, BALL_RADIUS, 0, Math.PI * 2);
                ctx.fill();
            });
        } else if (gameMode === 'localMultiplayer') {
            // P2 keyboard aiming logic
            if (!isGameOver) {
                if (keysPressed.current['ArrowLeft']) p2AimRef.current.angle -= 0.05;
                if (keysPressed.current['ArrowRight']) p2AimRef.current.angle += 0.05;
                if (p2AimRef.current.charging) {
                    p2AimRef.current.power = Math.min(p2AimRef.current.power + 0.2, MAX_POWER);
                }
            }
            
            // Physics and drawing for both balls
            multiBalls.current.forEach((ball, index) => {
                ball.pos.x += ball.vel.x;
                ball.pos.y += ball.vel.y;
                ball.vel.x *= FRICTION;
                ball.vel.y *= FRICTION;
                
                const speed = Math.sqrt(ball.vel.x ** 2 + ball.vel.y ** 2);
                if (ball.isMoving && speed < MIN_VELOCITY) {
                    ball.isMoving = false;
                    ball.vel = {x: 0, y: 0};
                }

                if (ball.pos.x - BALL_RADIUS < 0 || ball.pos.x + BALL_RADIUS > canvas.width) ball.vel.x *= -1;
                if (ball.pos.y - BALL_RADIUS < 0 || ball.pos.y + BALL_RADIUS > canvas.height) ball.vel.y *= -1;
                
                obstacles.current.forEach(obs => {
                    const closestX = Math.max(obs.x, Math.min(ball.pos.x, obs.x + obs.width));
                    const closestY = Math.max(obs.y, Math.min(ball.pos.y, obs.y + obs.height));
                    const dx = ball.pos.x - closestX;
                    const dy = ball.pos.y - closestY;
                    if (Math.sqrt(dx * dx + dy * dy) < BALL_RADIUS) {
                        const overlap = BALL_RADIUS - Math.sqrt(dx*dx+dy*dy);
                        const normalX = dx / Math.sqrt(dx*dx+dy*dy);
                        const normalY = dy / Math.sqrt(dx*dx+dy*dy);
                        ball.pos.x += overlap * normalX; ball.pos.y += overlap * normalY;
                        const dot = ball.vel.x * normalX + ball.vel.y * normalY;
                        ball.vel.x -= 2 * dot * normalX; ball.vel.y -= 2 * dot * normalY;
                    }
                });

                if (!ball.inHole && Math.sqrt((ball.pos.x - holePos.current.x) ** 2 + (ball.pos.y - holePos.current.y) ** 2) < HOLE_RADIUS && speed < 5) {
                    handleLocalMultiplayerGoal((index + 1) as 1 | 2);
                }

                if (!ball.inHole) {
                    ctx.fillStyle = index === 0 ? '#fff' : '#ef4444';
                    ctx.beginPath();
                    ctx.arc(ball.pos.x, ball.pos.y, BALL_RADIUS, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Ball-to-ball collision
            const [p1, p2] = multiBalls.current;
            const dx = p2.pos.x - p1.pos.x;
            const dy = p2.pos.y - p1.pos.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < BALL_RADIUS * 2) {
                const nx = dx/dist, ny = dy/dist;
                const p = 2 * (p1.vel.x * nx + p1.vel.y * ny - p2.vel.x * nx - p2.vel.y * ny) / 2;
                p1.vel.x -= p * nx; p1.vel.y -= p * ny;
                p2.vel.x += p * nx; p2.vel.y += p * ny;
            }

            // Draw P2 Aim Indicator
            if (!isGameOver) {
                const p2Ball = multiBalls.current[1];
                const aimLength = 50 + p2AimRef.current.power * 5;
                const endX = p2Ball.pos.x + Math.cos(p2AimRef.current.angle) * aimLength;
                const endY = p2Ball.pos.y + Math.sin(p2AimRef.current.angle) * aimLength;
                ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + p2AimRef.current.power / MAX_POWER / 2})`;
                ctx.lineWidth = 3;
                ctx.setLineDash([5,5]);
                ctx.beginPath();
                ctx.moveTo(p2Ball.pos.x, p2Ball.pos.y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            // Draw instructions
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            ctx.font = "14px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("P1: Mouse | P2: Arrow Keys + Spacebar", canvas.width / 2, 20);

        } else { // Single player or practice
            singleBallPos.current.x += singleBallVel.current.x;
            singleBallPos.current.y += singleBallVel.current.y;
            singleBallVel.current.x *= FRICTION;
            singleBallVel.current.y *= FRICTION;

            const speed = Math.sqrt(singleBallVel.current.x ** 2 + singleBallVel.current.y ** 2);
            
            if (isSingleBallMoving.current && speed <= MIN_VELOCITY) {
                isSingleBallMoving.current = false;
                singleBallVel.current = { x: 0, y: 0 };
                onBallStopRef.current();
            }

            if (singleBallPos.current.x - BALL_RADIUS < 0 || singleBallPos.current.x + BALL_RADIUS > canvas.width) singleBallVel.current.x *= -1;
            if (singleBallPos.current.y - BALL_RADIUS < 0 || singleBallPos.current.y + BALL_RADIUS > canvas.height) singleBallVel.current.y *= -1;
            
            obstacles.current.forEach(obs => {
                const closestX = Math.max(obs.x, Math.min(singleBallPos.current.x, obs.x + obs.width));
                const closestY = Math.max(obs.y, Math.min(singleBallPos.current.y, obs.y + obs.height));
                const dx = singleBallPos.current.x - closestX;
                const dy = singleBallPos.current.y - closestY;
                if (Math.sqrt(dx * dx + dy * dy) < BALL_RADIUS) {
                    const overlap = BALL_RADIUS - Math.sqrt(dx*dx+dy*dy);
                    const normalX = dx / Math.sqrt(dx*dx+dy*dy);
                    const normalY = dy / Math.sqrt(dx*dx+dy*dy);
                    singleBallPos.current.x += overlap * normalX; singleBallPos.current.y += overlap * normalY;
                    const dot = singleBallVel.current.x * normalX + singleBallVel.current.y * normalY;
                    singleBallVel.current.x -= 2 * dot * normalX; singleBallVel.current.y -= 2 * dot * normalY;
                }
            });
            
            if (!isSingleBallInHole.current && Math.sqrt((singleBallPos.current.x - holePos.current.x) ** 2 + (singleBallPos.current.y - holePos.current.y) ** 2) < HOLE_RADIUS && speed < 5) {
                isSingleBallInHole.current = true;
                singleBallVel.current = { x: 0, y: 0 };
                onBallInHoleRef.current({shotCount: shotCount.current, scoringPlayer: 1});

                setTimeout(() => {
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    singleBallPos.current = { x: 100, y: 250 };
                    isSingleBallMoving.current = false;
                    shotCount.current = 0;
                    randomizeHolePosition(canvas);
                    isSingleBallInHole.current = false;
                }, 200);
            }
            
            if (!isSingleBallInHole.current) {
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(singleBallPos.current.x, singleBallPos.current.y, BALL_RADIUS, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Mouse Aiming indicator (P1 local, single player, online)
        if (isAiming.current && startDragPos.current && endDragPos.current) {
            let aimBallPos: Vector2D;
             if (gameMode === 'onlineMultiplayer' && onlineGameState && playerNumber) {
                aimBallPos = onlineGameState.players[playerNumber - 1].ball.position;
            } else if (gameMode === 'localMultiplayer') {
                aimBallPos = multiBalls.current[0].pos;
            } else {
                aimBallPos = singleBallPos.current;
            }

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
            ctx.moveTo(aimBallPos.x, aimBallPos.y);
            ctx.lineTo(aimBallPos.x - dx, aimBallPos.y - dy);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    const getMousePos = (e: MouseEvent): Vector2D => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return { 
            x: (e.clientX - rect.left) * scaleX, 
            y: (e.clientY - rect.top) * scaleY 
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
      
      const power = Math.min(Math.sqrt(dx * dx + dy * dy) / 10, MAX_POWER);
      const angle = Math.atan2(dy, dx);
      
      const velocity = {
          x: -Math.cos(angle) * power,
          y: -Math.sin(angle) * power
      };

      if (gameMode === 'onlineMultiplayer') {
          onShotRef.current({ velocity });
      } else if (gameMode === 'localMultiplayer') {
          multiBalls.current[0].vel = velocity;
          multiBalls.current[0].isMoving = true;
          onShotRef.current();
      } else {
          singleBallVel.current = velocity;
          isSingleBallMoving.current = true;
          shotCount.current++;
          onShotRef.current();
      }
      
      startDragPos.current = null;
      endDragPos.current = null;
    };

    const handleMouseDown = (e: MouseEvent) => {
        if (isGameOver) return;

        let ballToCheck: Vector2D;

        if (gameMode === 'onlineMultiplayer') {
            if (!onlineGameState || !playerNumber) return;
            const myPlayer = onlineGameState.players[playerNumber - 1];
            ballToCheck = myPlayer.ball.position;
            const vel = myPlayer.ball.velocity;
            if (Math.sqrt(vel.x * vel.x + vel.y * vel.y) > MIN_VELOCITY) return;
        } else if (gameMode === 'localMultiplayer') {
            ballToCheck = multiBalls.current[0].pos;
            // No movement check for local multiplayer, just proceed to aiming.
        } else {
            ballToCheck = singleBallPos.current;
            if (isSingleBallMoving.current) return;
        }

        const mousePos = getMousePos(e);
        const distToBall = Math.sqrt((mousePos.x - ballToCheck.x) ** 2 + (mousePos.y - ballToCheck.y) ** 2);
        
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
        observer.disconnect();
        cancelAnimationFrame(animationFrameId.current);
        canvas.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isGameOver, difficulty, gameMode, onlineGameState, playerNumber]);

  return (
    <div ref={containerRef} className="w-full flex-grow relative my-2 min-h-0">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="bg-slate-800 rounded-xl shadow-inner border border-slate-700 absolute"
        />
    </div>
  );
};

export default GameCanvas;