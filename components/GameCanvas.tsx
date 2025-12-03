
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

type ThemeType = 'classic_grass' | 'desert_sands' | 'midnight_space' | 'cyber_blueprint';

interface PhysicsConfig {
    friction: number;
    bounce: number; // Restitution (0.0 = dead thud, 1.0 = perfect elastic)
    label: string;
    subLabel: string;
}

const BALL_RADIUS = 10;
const HOLE_RADIUS = 15;
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
  
  // Theme state
  const currentTheme = useRef<ThemeType>('cyber_blueprint');
  const currentPhysics = useRef<PhysicsConfig>({ friction: 0.975, bounce: 0.8, label: 'STANDARD', subLabel: 'Normal Conditions' });
  
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
  const timeRef = useRef<number>(0); // For animations
  
  // Wind state
  const currentWind = useRef<Vector2D>({ x: 0, y: 0 });

  const onBallInHoleRef = useRef(onBallInHole);
  const onShotRef = useRef(onShot);
  const onBallStopRef = useRef(onBallStop);
  
  useEffect(() => {
    onBallInHoleRef.current = onBallInHole;
    onShotRef.current = onShot;
    onBallStopRef.current = onBallStop;
  });
  
   const generateWind = () => {
        let maxForce = 0;
        if (difficulty === 'normal') maxForce = 0.01; // Tiny breeze
        if (difficulty === 'advanced') maxForce = 0.04; // Noticeable
        if (difficulty === 'maximum') maxForce = 0.08; // Strong

        const angle = Math.random() * Math.PI * 2;
        const force = Math.random() * maxForce;

        currentWind.current = {
            x: Math.cos(angle) * force,
            y: Math.sin(angle) * force
        };
   };

   const randomizeHolePosition = (canvas: HTMLCanvasElement) => {
        const padding = 50;
        let newHolePos: Vector2D;
        let validPosition = false;
        let attempts = 0;

        while(!validPosition && attempts < 100) {
            attempts++;
            newHolePos = {
                x: Math.random() * (canvas.width - padding * 2) + padding,
                y: Math.random() * (canvas.height - padding * 2) + padding,
            };
            const distFromStart = Math.sqrt((newHolePos.x - 100) ** 2 + (newHolePos.y - 250) ** 2);
            if (distFromStart < 200) continue;
            
            let overlapsObstacle = false;
            for (const obs of obstacles.current) {
                // Check collision between hole (circle) and obstacle (rectangle)
                const closestX = Math.max(obs.x, Math.min(newHolePos.x, obs.x + obs.width));
                const closestY = Math.max(obs.y, Math.min(newHolePos.y, obs.y + obs.height));
                
                const dx = newHolePos.x - closestX;
                const dy = newHolePos.y - closestY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Ensure hole is at least 15px away from any obstacle edge
                if (distance < HOLE_RADIUS + 15) {
                    overlapsObstacle = true;
                    break;
                }
            }

            if (overlapsObstacle) continue;

            holePos.current = newHolePos;
            validPosition = true;
        }

        if (!validPosition) {
             // Fallback
             holePos.current = { x: canvas.width - 100, y: canvas.height / 2 };
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
            let attempts = 0;
            while (!valid && attempts < 100) {
                attempts++;
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
        const themes: ThemeType[] = ['classic_grass', 'desert_sands', 'midnight_space', 'cyber_blueprint'];
        currentTheme.current = themes[Math.floor(Math.random() * themes.length)];
        
        // SET PHYSICS BASED ON THEME
        switch (currentTheme.current) {
            case 'classic_grass':
                currentPhysics.current = { friction: 0.975, bounce: 0.7, label: 'STANDARD', subLabel: 'Normal Bounce' };
                break;
            case 'desert_sands':
                currentPhysics.current = { friction: 0.94, bounce: 0.4, label: 'HIGH FRICTION', subLabel: 'Sand Absorb' };
                break;
            case 'midnight_space':
                currentPhysics.current = { friction: 0.995, bounce: 0.95, label: 'ZERO G', subLabel: 'Slippery' };
                break;
            case 'cyber_blueprint':
                currentPhysics.current = { friction: 0.985, bounce: 1.0, label: 'ARCADE', subLabel: 'Max Bounce' };
                break;
        }

        generateObstacles(canvas);
        randomizeHolePosition(canvas);
        generateWind(); // Generate new wind pattern
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

    const drawBackground = () => {
        const theme = currentTheme.current;
        const w = canvas.width;
        const h = canvas.height;

        if (theme === 'classic_grass') {
            // Grass Base
            ctx.fillStyle = '#4ade80'; // lighter green
            ctx.fillRect(0, 0, w, h);
            
            // Stripes
            ctx.fillStyle = '#22c55e'; // darker green
            const stripeWidth = 60;
            for (let i = 0; i < w; i += stripeWidth * 2) {
                ctx.fillRect(i, 0, stripeWidth, h);
            }
            
            // Texture noise (simple dots)
            ctx.fillStyle = 'rgba(0,0,0,0.03)';
            for(let i=0; i<100; i++) {
                const x = Math.random() * w;
                const y = Math.random() * h;
                const r = Math.random() * 2;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }

        } else if (theme === 'desert_sands') {
            // Sand Base
            ctx.fillStyle = '#fde047'; // warm yellow
            ctx.fillRect(0, 0, w, h);
            
            // Dunes/Texture
            ctx.fillStyle = '#facc15'; // darker yellow
            for (let i = 0; i < h; i += 5) {
                if (i % 20 === 0) ctx.globalAlpha = 0.1;
                else ctx.globalAlpha = 0;
                ctx.fillRect(0, i, w, 5);
            }
            ctx.globalAlpha = 1;

            // Specks
            ctx.fillStyle = '#b45309'; // brown specks
            for(let i=0; i<300; i++) {
                 const x = Math.random() * w;
                 const y = Math.random() * h;
                 ctx.fillRect(x, y, 1.5, 1.5);
            }

        } else if (theme === 'cyber_blueprint') {
             // Blueprint Base
            const bgGradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
            bgGradient.addColorStop(0, '#1e293b');
            bgGradient.addColorStop(1, '#0f172a');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, w, h);

            // Grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            const gridSize = 40;
            ctx.beginPath();
            for (let x = 0; x <= w; x += gridSize) {
                ctx.moveTo(x, 0); ctx.lineTo(x, h);
            }
            for (let y = 0; y <= h; y += gridSize) {
                ctx.moveTo(0, y); ctx.lineTo(w, y);
            }
            ctx.stroke();

        } else { // midnight_space
            // Space Base
            ctx.fillStyle = '#020617'; // very dark slate
            ctx.fillRect(0, 0, w, h);
            
            // Stars
            ctx.fillStyle = '#fff';
            // Simple stars
            for (let x = 0; x < w; x+=50) {
                for (let y = 0; y < h; y+=50) {
                    if (Math.sin(x*y) > 0.5) {
                        ctx.globalAlpha = Math.abs(Math.sin(timeRef.current * 0.002 + x));
                        ctx.fillRect(x + Math.sin(y)*20, y + Math.cos(x)*20, 2, 2);
                    }
                }
            }
            ctx.globalAlpha = 1;
        }
    }

    const drawInfoOverlay = () => {
        if (gameMode === 'onlineMultiplayer' || gameMode === 'menu') return;

        // WIND INDICATOR
        const wx = currentWind.current.x;
        const wy = currentWind.current.y;
        const magnitude = Math.sqrt(wx * wx + wy * wy);
        
        const centerX = 50;
        const centerY = 50;
        const arrowLen = 30;

        ctx.fillStyle = (currentTheme.current === 'classic_grass' || currentTheme.current === 'desert_sands') 
            ? "rgba(0, 0, 0, 0.6)" 
            : "rgba(255, 255, 255, 0.5)";
            
        ctx.font = "10px font-bold sans-serif";
        ctx.textAlign = "center";
        
        if (magnitude > 0.001) {
            const angle = Math.atan2(wy, wx);
            const mph = Math.round(magnitude * 100);
            ctx.fillText(`WIND ${mph}`, centerX, centerY + 25);

            // Draw Arrow
            ctx.strokeStyle = (currentTheme.current === 'classic_grass' || currentTheme.current === 'desert_sands') 
                ? "rgba(6, 182, 212, 1)" 
                : "rgba(6, 182, 212, 0.8)";

            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX - Math.cos(angle) * (arrowLen/2), centerY - Math.sin(angle) * (arrowLen/2));
            ctx.lineTo(centerX + Math.cos(angle) * (arrowLen/2), centerY + Math.sin(angle) * (arrowLen/2));
            
            // Arrow head
            const headLen = 8;
            const endX = centerX + Math.cos(angle) * (arrowLen/2);
            const endY = centerY + Math.sin(angle) * (arrowLen/2);
            ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI / 6), endY - headLen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI / 6), endY - headLen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        }

        // PHYSICS INDICATOR (Top Right)
        const physX = canvas.width - 70;
        const physY = 50;
        
        ctx.fillStyle = (currentTheme.current === 'classic_grass' || currentTheme.current === 'desert_sands') 
            ? "rgba(0, 0, 0, 0.8)" 
            : "rgba(255, 255, 255, 0.9)";
        
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(currentPhysics.current.label, physX, physY);
        
        ctx.fillStyle = (currentTheme.current === 'classic_grass' || currentTheme.current === 'desert_sands') 
            ? "rgba(0, 0, 0, 0.5)" 
            : "rgba(255, 255, 255, 0.5)";
        ctx.font = "10px sans-serif";
        ctx.fillText(currentPhysics.current.subLabel, physX, physY + 12);
    };

    const drawFlag = (pos: Vector2D) => {
        const poleHeight = 40;
        const flagWidth = 25;
        const flagHeight = 15;
        
        // Pole
        ctx.strokeStyle = (currentTheme.current === 'midnight_space' || currentTheme.current === 'cyber_blueprint') 
            ? '#94a3b8' : '#334155'; // lighter pole in dark themes
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x, pos.y - poleHeight);
        ctx.stroke();
        
        // Hole Shadow/Base
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y, 5, 2, 0, 0, Math.PI*2);
        ctx.fill();

        // Animated Flag
        ctx.fillStyle = '#ef4444'; // Red flag
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y - poleHeight);
        
        // Sine wave for waving effect
        const waveFreq = 0.2; // speed
        const waveAmp = 3;   // height of wave
        const time = timeRef.current;
        
        // Top edge of flag
        for (let i = 0; i <= flagWidth; i++) {
            const yOffset = Math.sin((time * waveFreq) + (i * 0.5)) * (i / flagWidth) * waveAmp;
            ctx.lineTo(pos.x + i, pos.y - poleHeight + yOffset);
        }
        
        // Right edge
        const rightYOffset = Math.sin((time * waveFreq) + (flagWidth * 0.5)) * waveAmp;
        ctx.lineTo(pos.x + flagWidth, pos.y - poleHeight + flagHeight + rightYOffset);
        
        // Bottom edge
        for (let i = flagWidth; i >= 0; i--) {
            const yOffset = Math.sin((time * waveFreq) + (i * 0.5)) * (i / flagWidth) * waveAmp;
            ctx.lineTo(pos.x + i, pos.y - poleHeight + flagHeight + yOffset);
        }
        
        ctx.closePath();
        ctx.fill();
    };

    const drawHole = (pos: Vector2D) => {
        ctx.save();
        
        let glowColor = '#06b6d4'; // Default Cyan
        if (currentTheme.current === 'desert_sands') glowColor = '#d97706';
        if (currentTheme.current === 'classic_grass') glowColor = '#15803d';
        if (currentTheme.current === 'midnight_space') glowColor = '#8b5cf6';

        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 20;
        
        // Hole itself
        ctx.fillStyle = '#0f172a'; // dark hole
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, HOLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        
        // Ring
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    };

    const drawObstacle = (obs: Obstacle) => {
        const theme = currentTheme.current;
        const { x, y, width, height } = obs;

        if (theme === 'classic_grass') {
            // Wooden Crate Look
            const plankCount = 4;
            const plankHeight = height / plankCount;
            
            // Main Fill
            ctx.fillStyle = '#78350f'; // Dark wood
            ctx.fillRect(x, y, width, height);

            // Planks
            ctx.fillStyle = '#92400e'; // Lighter wood
            for(let i=0; i<plankCount; i++) {
                ctx.fillRect(x + 2, y + i * plankHeight + 2, width - 4, plankHeight - 4);
            }

            // Frame/Border
            ctx.strokeStyle = '#451a03'; // Very dark brown
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);

            // X-Brace
            ctx.beginPath();
            ctx.moveTo(x, y); ctx.lineTo(x + width, y + height);
            ctx.moveTo(x + width, y); ctx.lineTo(x, y + height);
            ctx.stroke();

            // Bolts
            ctx.fillStyle = '#d4d4d4'; // Silver
            const boltSize = 3;
            ctx.beginPath();
            ctx.arc(x + 5, y + 5, boltSize, 0, Math.PI*2);
            ctx.arc(x + width - 5, y + 5, boltSize, 0, Math.PI*2);
            ctx.arc(x + 5, y + height - 5, boltSize, 0, Math.PI*2);
            ctx.arc(x + width - 5, y + height - 5, boltSize, 0, Math.PI*2);
            ctx.fill();

        } else if (theme === 'desert_sands') {
            // Sandstone Block
            ctx.fillStyle = '#c2410c'; // Reddish sandstone
            ctx.fillRect(x, y, width, height);
            
            // Texture (Noise)
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for(let i=0; i< width * height / 50; i++) {
                ctx.fillRect(x + Math.random() * width, y + Math.random() * height, 2, 2);
            }

            // Cracks
            ctx.strokeStyle = 'rgba(67, 20, 7, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + width * 0.2, y + height * 0.2);
            ctx.lineTo(x + width * 0.3, y + height * 0.4);
            ctx.lineTo(x + width * 0.25, y + height * 0.5);
            ctx.stroke();

            // Border
            ctx.strokeStyle = '#7c2d12';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);

        } else if (theme === 'midnight_space') {
            // Sci-Fi Metal Panel
            const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
            gradient.addColorStop(0, '#334155');
            gradient.addColorStop(1, '#0f172a');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, width, height);

            // Bevel
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.beginPath();
            ctx.moveTo(x, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width - 5, y + 5); ctx.lineTo(x + 5, y + 5); ctx.lineTo(x + 5, y + height - 5); ctx.lineTo(x, y + height);
            ctx.fill();

            // Tech lines
            ctx.strokeStyle = '#0ea5e9'; // Cyan neon
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 10, y + height / 2); ctx.lineTo(x + width - 10, y + height / 2);
            ctx.stroke();

            // Border
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

        } else if (theme === 'cyber_blueprint') {
            // Holographic Block
            ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
            ctx.fillRect(x, y, width, height);

            // Grid pattern inside
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)'; // Faint cyan
            ctx.lineWidth = 1;
            const step = 10;
            ctx.beginPath();
            for(let ix = x; ix <= x + width; ix += step) {
                ctx.moveTo(ix, y); ctx.lineTo(ix, y + height);
            }
            for(let iy = y; iy <= y + height; iy += step) {
                ctx.moveTo(x, iy); ctx.lineTo(x + width, iy);
            }
            ctx.stroke();

            // Glowing Border
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 10;
            ctx.strokeRect(x, y, width, height);
            ctx.shadowBlur = 0; // reset
        }
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
            const themes: ThemeType[] = ['classic_grass', 'desert_sands', 'midnight_space', 'cyber_blueprint'];
            currentTheme.current = themes[Math.floor(Math.random() * themes.length)];
             // SET PHYSICS BASED ON NEW THEME
             switch (currentTheme.current) {
                case 'classic_grass':
                    currentPhysics.current = { friction: 0.975, bounce: 0.7, label: 'STANDARD', subLabel: 'Normal Bounce' };
                    break;
                case 'desert_sands':
                    currentPhysics.current = { friction: 0.94, bounce: 0.4, label: 'HIGH FRICTION', subLabel: 'Sand Absorb' };
                    break;
                case 'midnight_space':
                    currentPhysics.current = { friction: 0.995, bounce: 0.95, label: 'ZERO G', subLabel: 'Slippery' };
                    break;
                case 'cyber_blueprint':
                    currentPhysics.current = { friction: 0.985, bounce: 1.0, label: 'ARCADE', subLabel: 'Max Bounce' };
                    break;
            }

            generateObstacles(canvas);
            randomizeHolePosition(canvas);
            generateWind(); // Change wind on goal
            isRoundOver.current = false;
        }, 500); // Slightly longer delay to appreciate the goal
    };

    const gameLoop = (timestamp: number) => {
        timeRef.current = timestamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 1. Draw Background
        drawBackground();

        // 2. Draw Info (Wind + Physics)
        drawInfoOverlay();

        // 3. Draw Hole
        const currentHolePos = gameMode === 'onlineMultiplayer' && onlineGameState ? onlineGameState.holePosition : holePos.current;
        drawHole(currentHolePos);
        
        // 4. Draw Flag
        drawFlag(currentHolePos);

        // 5. Draw Obstacles (shared)
        const currentObstacles = gameMode === 'onlineMultiplayer' && onlineGameState ? onlineGameState.obstacles : obstacles.current;
        
        currentObstacles.forEach(obs => {
            drawObstacle(obs);
        });

        // --- RENDER BASED ON MODE ---
        if (gameMode === 'onlineMultiplayer' && onlineGameState) {
             onlineGameState.players.forEach(p => {
                ctx.fillStyle = p.playerNumber === 1 ? '#fff' : '#ef4444';
                ctx.shadowColor = p.playerNumber === 1 ? '#fff' : '#ef4444';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(p.ball.position.x, p.ball.position.y, BALL_RADIUS, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
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
                // Apply Wind if moving
                if (ball.isMoving) {
                    ball.vel.x += currentWind.current.x;
                    ball.vel.y += currentWind.current.y;
                }
                
                // MOVEMENT & FRICTION
                ball.pos.x += ball.vel.x;
                ball.pos.y += ball.vel.y;
                ball.vel.x *= currentPhysics.current.friction;
                ball.vel.y *= currentPhysics.current.friction;
                
                const speed = Math.sqrt(ball.vel.x ** 2 + ball.vel.y ** 2);
                if (ball.isMoving && speed < MIN_VELOCITY) {
                    ball.isMoving = false;
                    ball.vel = {x: 0, y: 0};
                }

                // Wall Collisions
                const bounce = currentPhysics.current.bounce;
                if (ball.pos.x - BALL_RADIUS < 0) {
                    ball.pos.x = BALL_RADIUS;
                    ball.vel.x *= -bounce;
                } else if (ball.pos.x + BALL_RADIUS > canvas.width) {
                    ball.pos.x = canvas.width - BALL_RADIUS;
                    ball.vel.x *= -bounce;
                }

                if (ball.pos.y - BALL_RADIUS < 0) {
                    ball.pos.y = BALL_RADIUS;
                    ball.vel.y *= -bounce;
                } else if (ball.pos.y + BALL_RADIUS > canvas.height) {
                    ball.pos.y = canvas.height - BALL_RADIUS;
                    ball.vel.y *= -bounce;
                }
                
                // Obstacle Collisions
                obstacles.current.forEach(obs => {
                    const closestX = Math.max(obs.x, Math.min(ball.pos.x, obs.x + obs.width));
                    const closestY = Math.max(obs.y, Math.min(ball.pos.y, obs.y + obs.height));
                    const dx = ball.pos.x - closestX;
                    const dy = ball.pos.y - closestY;
                    const distSqr = dx * dx + dy * dy;

                    if (distSqr < BALL_RADIUS * BALL_RADIUS) {
                        const dist = Math.sqrt(distSqr);
                        const overlap = BALL_RADIUS - dist;
                        const normalX = dx / dist;
                        const normalY = dy / dist;
                        
                        // Push ball out
                        ball.pos.x += overlap * normalX; 
                        ball.pos.y += overlap * normalY;
                        
                        // Reflect with Restitution (bounce)
                        const dot = ball.vel.x * normalX + ball.vel.y * normalY;
                        // vNew = vOld - (1 + e) * (v . n) * n
                        ball.vel.x -= (1 + bounce) * dot * normalX; 
                        ball.vel.y -= (1 + bounce) * dot * normalY;
                    }
                });

                if (!ball.inHole && Math.sqrt((ball.pos.x - holePos.current.x) ** 2 + (ball.pos.y - holePos.current.y) ** 2) < HOLE_RADIUS && speed < 5) {
                    handleLocalMultiplayerGoal((index + 1) as 1 | 2);
                }

                if (!ball.inHole) {
                    ctx.fillStyle = index === 0 ? '#fff' : '#ef4444';
                    ctx.shadowColor = index === 0 ? '#fff' : '#ef4444';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(ball.pos.x, ball.pos.y, BALL_RADIUS, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
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
                // Simple elastic collision for balls to keep gameplay fun
                p1.vel.x -= p * nx; p1.vel.y -= p * ny;
                p2.vel.x += p * nx; p2.vel.y += p * ny;
                // Separation hack
                const overlap = BALL_RADIUS * 2 - dist;
                p1.pos.x -= overlap/2 * nx; p1.pos.y -= overlap/2 * ny;
                p2.pos.x += overlap/2 * nx; p2.pos.y += overlap/2 * ny;
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
            ctx.fillStyle = (currentTheme.current === 'classic_grass' || currentTheme.current === 'desert_sands') 
                ? "rgba(0, 0, 0, 0.6)" 
                : "rgba(255, 255, 255, 0.5)";
            ctx.font = "14px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("P1: Mouse | P2: Arrow Keys + Spacebar", canvas.width / 2, 20);

        } else { // Single player or practice
            // Apply Wind if moving
            if (isSingleBallMoving.current) {
                singleBallVel.current.x += currentWind.current.x;
                singleBallVel.current.y += currentWind.current.y;
            }

            singleBallPos.current.x += singleBallVel.current.x;
            singleBallPos.current.y += singleBallVel.current.y;
            
            // Apply Friction
            singleBallVel.current.x *= currentPhysics.current.friction;
            singleBallVel.current.y *= currentPhysics.current.friction;

            const speed = Math.sqrt(singleBallVel.current.x ** 2 + singleBallVel.current.y ** 2);
            
            if (isSingleBallMoving.current && speed <= MIN_VELOCITY) {
                isSingleBallMoving.current = false;
                singleBallVel.current = { x: 0, y: 0 };
                onBallStopRef.current();
            }

            // Wall Collisions
            const bounce = currentPhysics.current.bounce;
            if (singleBallPos.current.x - BALL_RADIUS < 0) {
                singleBallPos.current.x = BALL_RADIUS;
                singleBallVel.current.x *= -bounce;
            } else if (singleBallPos.current.x + BALL_RADIUS > canvas.width) {
                singleBallPos.current.x = canvas.width - BALL_RADIUS;
                singleBallVel.current.x *= -bounce;
            }

            if (singleBallPos.current.y - BALL_RADIUS < 0) {
                singleBallPos.current.y = BALL_RADIUS;
                singleBallVel.current.y *= -bounce;
            } else if (singleBallPos.current.y + BALL_RADIUS > canvas.height) {
                singleBallPos.current.y = canvas.height - BALL_RADIUS;
                singleBallVel.current.y *= -bounce;
            }
            
            // Obstacle Collisions
            obstacles.current.forEach(obs => {
                const closestX = Math.max(obs.x, Math.min(singleBallPos.current.x, obs.x + obs.width));
                const closestY = Math.max(obs.y, Math.min(singleBallPos.current.y, obs.y + obs.height));
                const dx = singleBallPos.current.x - closestX;
                const dy = singleBallPos.current.y - closestY;
                const distSqr = dx * dx + dy * dy;

                if (distSqr < BALL_RADIUS * BALL_RADIUS) {
                    const dist = Math.sqrt(distSqr);
                    const overlap = BALL_RADIUS - dist;
                    const normalX = dx / dist;
                    const normalY = dy / dist;
                    
                    singleBallPos.current.x += overlap * normalX; 
                    singleBallPos.current.y += overlap * normalY;
                    
                    const dot = singleBallVel.current.x * normalX + singleBallVel.current.y * normalY;
                    singleBallVel.current.x -= (1 + bounce) * dot * normalX; 
                    singleBallVel.current.y -= (1 + bounce) * dot * normalY;
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
                    
                    const themes: ThemeType[] = ['classic_grass', 'desert_sands', 'midnight_space', 'cyber_blueprint'];
                    currentTheme.current = themes[Math.floor(Math.random() * themes.length)];
                    // SET PHYSICS BASED ON NEW THEME
                    switch (currentTheme.current) {
                        case 'classic_grass':
                            currentPhysics.current = { friction: 0.975, bounce: 0.7, label: 'STANDARD', subLabel: 'Normal Bounce' };
                            break;
                        case 'desert_sands':
                            currentPhysics.current = { friction: 0.94, bounce: 0.4, label: 'HIGH FRICTION', subLabel: 'Sand Absorb' };
                            break;
                        case 'midnight_space':
                            currentPhysics.current = { friction: 0.995, bounce: 0.95, label: 'ZERO G', subLabel: 'Slippery' };
                            break;
                        case 'cyber_blueprint':
                            currentPhysics.current = { friction: 0.985, bounce: 1.0, label: 'ARCADE', subLabel: 'Max Bounce' };
                            break;
                    }

                    generateObstacles(canvas);
                    randomizeHolePosition(canvas);
                    generateWind(); // Change wind on goal
                    isSingleBallInHole.current = false;
                }, 500);
            }
            
            if (!isSingleBallInHole.current) {
                ctx.fillStyle = '#fff';
                ctx.shadowColor = '#fff';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(singleBallPos.current.x, singleBallPos.current.y, BALL_RADIUS, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
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

            ctx.strokeStyle = (currentTheme.current === 'classic_grass' || currentTheme.current === 'desert_sands') 
                ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(startDragPos.current.x, startDragPos.current.y);
            ctx.lineTo(endDragPos.current.x, endDragPos.current.y);
            ctx.stroke();

            const dx = endDragPos.current.x - startDragPos.current.x;
            const dy = endDragPos.current.y - startDragPos.current.y;
            
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)'; // Cyan Aim
            ctx.lineWidth = 2;
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
    <div ref={containerRef} className="w-full flex-grow relative my-2 landscape:my-0 min-h-0">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="bg-slate-900 rounded-xl shadow-2xl border border-slate-700 absolute ring-1 ring-white/10"
        />
    </div>
  );
};

export default GameCanvas;
