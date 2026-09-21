import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/gameEngine';
import { networkClient } from './network/client';
import { sound } from './game/audio';
import {
  progressionStorage,
  generateDailyMissions,
  INITIAL_ACHIEVEMENTS,
} from './game/progression';
import {
  ActivePowerUp,
  AIRaceConfig,
  CameraMode,
  DynamicTrackEvent,
  GameMode,
  GraphicsQuality,
  PlayerInput,
  PlayerRaceState,
  PowerUpType,
  RaceResult,
  RoomState,
  RunStats,
  ShipDecalType,
  ShipUpgrades,
  ThrusterFlameColor,
  CockpitSkin,
  TrackId,
  UpgradeType,
  ShipDamageZones,
  CustomRoomSettings,
  MultiplayerMode,
  BeamTelemetry,
  BeamCustomization,
  BeamUpgrades,
} from './types';
import { DEFAULT_BEAM_CUSTOMIZATION, DEFAULT_BEAM_UPGRADES } from './game/beamSystem';
import { ActiveJunctionTelemetry, BranchRouteDirection } from './game/junctionSystem';
import { MainMenu } from './components/MainMenu';
import { LobbyView } from './components/LobbyView';
import { GarageView } from './components/GarageView';
import { RaceHUD } from './components/RaceHUD';
import { ResultsModal } from './components/ResultsModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { SettingsModal } from './components/SettingsModal';
import { MissionsModal } from './components/MissionsModal';
import { LeaderboardsModal } from './components/LeaderboardsModal';
import { ProfileModal } from './components/ProfileModal';
import { GameModeSelectModal } from './components/GameModeSelectModal';
import { AIRaceModal } from './components/AIRaceModal';
import { SpaceHubModal } from './components/SpaceHubModal';
import { StoryUniverseModal } from './components/StoryUniverseModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { CollisionHUD } from './components/CollisionHUD';
import { CollisionEventFeedback, PlayerCollisionConfig } from './types';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // App & Navigation State
  const [appState, setAppState] = useState<'MAIN_MENU' | 'GARAGE' | 'LOBBY' | 'RACING'>('MAIN_MENU');
  const [currentRoom, setCurrentRoom] = useState<RoomState | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('GRAND_PRIX');
  const [isAIRaceActive, setIsAIRaceActive] = useState<boolean>(false);

  // Player Customization & Progression State
  const [progression, setProgression] = useState(() => progressionStorage.load());
  const [currentShipId, setCurrentShipId] = useState(progression.selectedShipId);
  const [currentColor, setCurrentColor] = useState(progression.primaryColor);
  const [currentSecondaryColor, setCurrentSecondaryColor] = useState(progression.secondaryColor);
  const [currentDecal, setCurrentDecal] = useState<ShipDecalType>(progression.decal);
  const [currentThrusterColor, setCurrentThrusterColor] = useState<ThrusterFlameColor>(progression.thrusterColor);
  const [currentCockpitSkin, setCurrentCockpitSkin] = useState<CockpitSkin>(progression.cockpitSkin);
  const [currentUpgrades, setCurrentUpgrades] = useState<ShipUpgrades>(progression.upgrades);

  // Race Telemetry State
  const [speed, setSpeed] = useState<number>(0);
  const [boost, setBoost] = useState<number>(100);
  const [currentLap, setCurrentLap] = useState<number>(1);
  const [totalLaps, setTotalLaps] = useState<number>(2);
  const [rank, setRank] = useState<number>(1);
  const [totalPlayers, setTotalPlayers] = useState<number>(1);
  const [checkpoint, setCheckpoint] = useState<number>(0);
  const [totalCheckpoints, setTotalCheckpoints] = useState<number>(16);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [activeEvent, setActiveEvent] = useState<DynamicTrackEvent | null>(null);
  const [hazardHitMessage, setHazardHitMessage] = useState<string | null>(null);
  const [shortcutMessage, setShortcutMessage] = useState<string | null>(null);
  const [powerUps, setPowerUps] = useState<ActivePowerUp[]>([]);
  const [hullHealth, setHullHealth] = useState<number>(100);
  const [sessionCredits, setSessionCredits] = useState<number>(0);
  const [distanceMeters, setDistanceMeters] = useState<number>(0);
  const [milestoneMessage, setMilestoneMessage] = useState<string | null>(null);
  const [isWrongWay, setIsWrongWay] = useState<boolean>(false);
  const [destroyedMessage, setDestroyedMessage] = useState<string | null>(null);
  const [respawnTimeRemaining, setRespawnTimeRemaining] = useState<number>(0);
  const [currentLapMs, setCurrentLapMs] = useState<number>(0);
  const [bestLapMs, setBestLapMs] = useState<number>(0);
  const [earnedCredits, setEarnedCredits] = useState<number>(0);

  // Camera & Video Settings
  const [cameraMode, setCameraMode] = useState<CameraMode>('CHASE_NEAR');
  const [cameraShakeEnabled, setCameraShakeEnabled] = useState<boolean>(true);
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>('HIGH');

  // Modals visibility
  const [isResultsOpen, setIsResultsOpen] = useState<boolean>(false);
  const [resultsData, setResultsData] = useState<RaceResult[]>([]);
  const [isGameOverOpen, setIsGameOverOpen] = useState<boolean>(false);
  const [gameOverStats, setGameOverStats] = useState<RunStats | null>(null);
  const [isPauseOpen, setIsPauseOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState<boolean>(false);
  const [isLeaderboardsOpen, setIsLeaderboardsOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isGameModesOpen, setIsGameModesOpen] = useState<boolean>(false);
  const [isAIRaceModalOpen, setIsAIRaceModalOpen] = useState<boolean>(false);
  const [isSpaceHubOpen, setIsSpaceHubOpen] = useState<boolean>(false);
  const [isStoryOpen, setIsStoryOpen] = useState<boolean>(false);
  const [isMultiplayerModalOpen, setIsMultiplayerModalOpen] = useState<boolean>(false);
  const [spectatorTargetName, setSpectatorTargetName] = useState<string>('');
  const [damageZones, setDamageZones] = useState<ShipDamageZones>({
    frontHull: 0,
    rearEngine: 0,
    leftWing: 0,
    rightWing: 0,
    shieldCore: 100,
  });

  // Network status
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [ping, setPing] = useState<number>(18);

  // Asteroid Beam Telemetry
  const [beamTelemetry, setBeamTelemetry] = useState<BeamTelemetry | null>(null);

  // Branching Path & Junction Switching Telemetry
  const [junctionTelemetry, setJunctionTelemetry] = useState<ActiveJunctionTelemetry | null>(null);

  // Dedicated Player-to-Player Collision Feedback & Config
  const [collisionFeedback, setCollisionFeedback] = useState<CollisionEventFeedback | null>(null);
  const [collisionConfig, setCollisionConfig] = useState<PlayerCollisionConfig | undefined>(undefined);
  const respawnIntervalRef = useRef<any>(null);

  // Keyboard & Mouse input tracking
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const isRightMouseDown = useRef<boolean>(false);

  // 1. Initialize GameEngine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current, {
      onSpeedUpdate: s => setSpeed(s),
      onBoostUpdate: b => setBoost(b),
      onLapUpdate: (lap, total) => {
        setCurrentLap(lap);
        setTotalLaps(total);
      },
      onCheckpointUpdate: (curr, total) => {
        setCheckpoint(curr);
        setTotalCheckpoints(total);
      },
      onRankUpdate: (r, tot) => {
        setRank(r);
        setTotalPlayers(tot);
      },
      onRaceFinish: finalTime => {
        handleRaceFinishedLocally(finalTime);
      },
      onTrackEventUpdate: ev => setActiveEvent(ev),
      onHazardHit: msg => {
        setHazardHitMessage(msg);
        setTimeout(() => setHazardHitMessage(null), 2500);
      },
      onShortcutUsed: msg => {
        setShortcutMessage(msg);
        setTimeout(() => setShortcutMessage(null), 3000);
      },
      onPowerUpCollected: type => {
        sound.playShieldActivate();
      },
      onPowerUpsUpdate: list => setPowerUps(list),
      onCreditCollected: (tot, added) => {
        setSessionCredits(tot);
        setProgression(prev => {
          const updated = { ...prev, credits: prev.credits + added };
          progressionStorage.save(updated);
          return updated;
        });
      },
      onHullUpdate: hp => setHullHealth(hp),
      onDistanceUpdate: dist => setDistanceMeters(dist),
      onMilestoneReached: m => {
        setMilestoneMessage(m);
        setTimeout(() => setMilestoneMessage(null), 3500);
      },
      onGameOver: stats => {
        setGameOverStats(stats);
        setIsGameOverOpen(true);
        setAppState('MAIN_MENU');
      },
      onWrongWayUpdate: wrong => setIsWrongWay(wrong),
      onShipDestroyed: (reason, sec) => {
        setDestroyedMessage(reason);
        setRespawnTimeRemaining(sec);
        if (respawnIntervalRef.current) {
          clearInterval(respawnIntervalRef.current);
        }
        respawnIntervalRef.current = setInterval(() => {
          setRespawnTimeRemaining(prev => {
            if (prev <= 0.1) {
              if (respawnIntervalRef.current) {
                clearInterval(respawnIntervalRef.current);
                respawnIntervalRef.current = null;
              }
              return 0;
            }
            return prev - 0.1;
          });
        }, 100);
      },
      onShipRespawned: () => {
        if (respawnIntervalRef.current) {
          clearInterval(respawnIntervalRef.current);
          respawnIntervalRef.current = null;
        }
        setDestroyedMessage(null);
        setRespawnTimeRemaining(0);
      },
      onLapTimesUpdate: (currentMs, bestMs) => {
        setCurrentLapMs(currentMs);
        setBestLapMs(bestMs);
      },
      onCameraModeChange: mode => setCameraMode(mode),
      onDamageZonesUpdate: zones => setDamageZones(zones),
      onSpectatorTargetChange: name => setSpectatorTargetName(name),
      onBeamTelemetry: telemetry => setBeamTelemetry(telemetry),
      onJunctionTelemetry: telemetry => setJunctionTelemetry(telemetry),
      onCollisionFeedback: feedback => setCollisionFeedback(feedback),
    });

    setCollisionConfig(engine.getCollisionConfig());

    engine.setPlayerShip(
      currentShipId,
      currentColor,
      currentSecondaryColor,
      currentDecal,
      currentUpgrades,
      currentThrusterColor,
      currentCockpitSkin
    );

    if (progression.beamCustomization) {
      engine.setBeamCustomization(progression.beamCustomization);
    }
    if (progression.beamUpgrades) {
      engine.setBeamUpgrades(progression.beamUpgrades);
    }

    engineRef.current = engine;

    return () => {
      if (respawnIntervalRef.current) {
        clearInterval(respawnIntervalRef.current);
        respawnIntervalRef.current = null;
      }
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // 2. Setup WebSocket Network Client Listeners
  useEffect(() => {
    networkClient.onConnectStatusChange = conn => {
      setIsConnected(conn);
    };

    networkClient.onRoomUpdate = room => {
      setCurrentRoom(room);
      if (engineRef.current) {
        if (room.trackId && room.trackId !== engineRef.current.trackId) {
          engineRef.current.setTrack(room.trackId);
        }
        if (room.settings) {
          engineRef.current.collisionsEnabled = room.settings.collisionsEnabled ?? true;
          engineRef.current.powerUpsEnabled = room.settings.powerUpsEnabled ?? true;
          engineRef.current.damageMode = room.settings.damageMode ?? 'CASUAL';
        }
        const me = networkClient.playerId ? room.players[networkClient.playerId] : null;
        engineRef.current.isSpectator = me?.isSpectator ?? false;
      }
    };

    networkClient.onCountdownTick = count => {
      setCountdown(count);
      sound.playCountdownTick();
      if (count === 0) {
        sound.playCountdownGo();
        setTimeout(() => setCountdown(null), 1200);
      }
    };

    networkClient.onRaceStarted = room => {
      setCurrentRoom(room);
      setAppState('RACING');
      setIsAIRaceActive(false);
      setIsResultsOpen(false);
      setIsGameOverOpen(false);
      setIsPauseOpen(false);

      if (engineRef.current) {
        if (room.trackId && room.trackId !== engineRef.current.trackId) {
          engineRef.current.setTrack(room.trackId);
        }
        if (room.settings) {
          engineRef.current.collisionsEnabled = room.settings.collisionsEnabled ?? true;
          engineRef.current.powerUpsEnabled = room.settings.powerUpsEnabled ?? true;
          engineRef.current.damageMode = room.settings.damageMode ?? 'CASUAL';
        }
        const me = networkClient.playerId ? room.players[networkClient.playerId] : null;
        engineRef.current.isSpectator = me?.isSpectator ?? false;
        engineRef.current.startRace();
      }
    };

    networkClient.onRaceStateSync = players => {
      if (engineRef.current && networkClient.playerId) {
        engineRef.current.syncRemotePlayers(players, networkClient.playerId);
      }
    };

    networkClient.onPlayerFinished = results => {
      // Player finished notification
    };

    networkClient.onRaceFinished = results => {
      setResultsData(results);
      setIsResultsOpen(true);
      setAppState('MAIN_MENU');
      if (engineRef.current) {
        engineRef.current.stopRace();
      }
      const myResult = results.find(r => r.playerId === networkClient.playerId);
      const isWinner = results[0]?.playerId === networkClient.playerId;
      const prizeCredits = isWinner ? 450 : 200;
      setEarnedCredits(prizeCredits);

      setProgression(prev => {
        const updated = {
          ...prev,
          credits: prev.credits + prizeCredits,
          xp: prev.xp + (isWinner ? 350 : 150),
          stats: {
            ...prev.stats,
            racesCompleted: prev.stats.racesCompleted + 1,
            racesWon: prev.stats.racesWon + (isWinner ? 1 : 0),
          },
        };
        progressionStorage.save(updated);
        return updated;
      });
    };

    const pingTimer = setInterval(() => {
      setPing(networkClient.ping || 16);
    }, 1500);

    return () => clearInterval(pingTimer);
  }, []);

  // 3. Desktop Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      keysPressed.current[e.code] = true;

      if (e.code === 'KeyC') {
        if (engineRef.current) {
          const nextMode = engineRef.current.toggleCameraMode();
          setCameraMode(nextMode);
        }
      }

      if (e.code === 'KeyR') {
        if (engineRef.current && appState === 'RACING') {
          engineRef.current.resetToStart();
          engineRef.current.startRace();
        }
      }

      if (e.code === 'Escape') {
        if (appState === 'RACING') {
          handleTogglePause();
        }
      }

      // Branch Route Switching Input (A / D / W or Arrow keys, E to confirm)
      if (engineRef.current?.junctionManager?.activeJunctionTelemetry) {
        let dir: BranchRouteDirection | null = null;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
          dir = 'LEFT';
        } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
          dir = 'RIGHT';
        } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
          dir = 'CENTER';
        } else if (e.code === 'KeyE') {
          engineRef.current.junctionManager.commitRoute();
          if (engineRef.current.junctionManager.activeJunctionTelemetry) {
            setJunctionTelemetry({ ...engineRef.current.junctionManager.activeJunctionTelemetry });
          }
        }

        if (dir) {
          engineRef.current.input.selectRouteDirection = dir;
          const ok = engineRef.current.junctionManager.selectRouteByDirection(dir);
          if (ok) {
            sound.playRouteSelected();
            if (engineRef.current.junctionManager.activeJunctionTelemetry) {
              setJunctionTelemetry({ ...engineRef.current.junctionManager.activeJunctionTelemetry });
            }
          }
        }
      }

      updateInputState();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
      updateInputState();
    };

    const updateInputState = () => {
      if (!engineRef.current) return;
      const keys = keysPressed.current;

      let steer = 0;
      if (keys['KeyA'] || keys['ArrowLeft']) steer += 1;
      if (keys['KeyD'] || keys['ArrowRight']) steer -= 1;

      let throttle = 0;
      if (keys['KeyW'] || keys['ArrowUp']) throttle += 1;
      if (keys['KeyS'] || keys['ArrowDown']) throttle -= 1;

      const boostActive = !!keys['Space'];
      const driftActive = !!keys['ShiftLeft'] || !!keys['ShiftRight'];
      const beamActive = !!keys['KeyE'] || isRightMouseDown.current;

      engineRef.current.input = {
        ...engineRef.current.input,
        throttle,
        steer,
        boost: boostActive,
        drift: driftActive,
        fireBeam: beamActive,
        recover: false,
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        isRightMouseDown.current = true;
        updateInputState();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        isRightMouseDown.current = false;
        updateInputState();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (appState === 'RACING') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [appState]);

  // 4. Local AI Race Completion Handler
  const handleRaceFinishedLocally = (finalTime: number) => {
    const myResult: RaceResult = {
      playerId: 'player',
      playerName: progression.playerName,
      shipId: currentShipId,
      totalTime: finalTime,
      bestLapTime: bestLapMs || finalTime / 2,
      rank: rank || 1,
      completed: true,
    };

    const aiResults: RaceResult[] =
      engineRef.current?.localAIRacers.map(ai => ({
        playerId: ai.id,
        playerName: ai.name,
        shipId: ai.shipId,
        totalTime: finalTime + (ai.rank - 1) * 2400 + Math.random() * 800,
        bestLapTime: (finalTime / 2) * (1 + (ai.rank - 1) * 0.05),
        rank: ai.rank,
        completed: true,
      })) || [];

    const all = [myResult, ...aiResults].sort((a, b) => a.rank - b.rank);
    setResultsData(all);
    setIsResultsOpen(true);
    setAppState('MAIN_MENU');
    const isWinner = rank === 1;
    const prize = isWinner ? 500 : 250;
    setEarnedCredits(prize);

    setProgression(prev => {
      const updated = {
        ...prev,
        credits: prev.credits + prize,
        xp: prev.xp + (isWinner ? 400 : 200),
        stats: {
          ...prev.stats,
          racesCompleted: prev.stats.racesCompleted + 1,
          racesWon: prev.stats.racesWon + (isWinner ? 1 : 0),
        },
      };
      progressionStorage.save(updated);
      return updated;
    });

    if (engineRef.current) {
      engineRef.current.stopRace();
    }
  };

  // 5. User Interaction Actions
  const handleQuickMatch = (mode?: MultiplayerMode) => {
    sound.playMenuClick();
    networkClient.quickMatch(
      progression.playerName,
      currentShipId,
      currentColor,
      currentSecondaryColor,
      currentDecal,
      currentUpgrades,
      undefined,
      mode
    );
    setAppState('LOBBY');
  };

  const handleCreateRoom = (
    settings?: CustomRoomSettings,
    isSpectator: boolean = false,
    team: 'ALPHA' | 'OMEGA' = 'ALPHA'
  ) => {
    sound.playMenuClick();
    networkClient.createRoom(
      progression.playerName,
      currentShipId,
      currentColor,
      currentSecondaryColor,
      currentDecal,
      currentUpgrades,
      settings?.trackId,
      settings,
      isSpectator,
      team
    );
    setAppState('LOBBY');
  };

  const handleJoinRoom = (
    code?: string,
    isSpectator: boolean = false,
    team: 'ALPHA' | 'OMEGA' = 'ALPHA'
  ) => {
    const targetCode = code || prompt('ENTER 6-CHARACTER WARP SECTOR CODE:');
    if (targetCode && targetCode.trim()) {
      sound.playMenuClick();
      networkClient.joinRoom(
        targetCode.trim().toUpperCase(),
        progression.playerName,
        currentShipId,
        currentColor,
        currentSecondaryColor,
        currentDecal,
        currentUpgrades,
        isSpectator,
        team
      );
      setAppState('LOBBY');
    }
  };

  const handleStartAIRace = (config: AIRaceConfig) => {
    sound.playMenuClick();
    setIsAIRaceModalOpen(false);
    setIsAIRaceActive(true);
    setAppState('RACING');
    setIsResultsOpen(false);
    setIsGameOverOpen(false);

    if (engineRef.current) {
      engineRef.current.startAIRace(config);
    }
  };

  const handleTogglePause = () => {
    if (!engineRef.current) return;
    engineRef.current.togglePause();
    setIsPauseOpen(engineRef.current.isPaused);
  };

  const handleRestartRace = () => {
    setIsPauseOpen(false);
    setIsGameOverOpen(false);
    setIsResultsOpen(false);
    setAppState('RACING');

    if (engineRef.current) {
      engineRef.current.resumeGame();
      engineRef.current.restartGame();
    }
  };

  const handleReturnToLobby = () => {
    setIsPauseOpen(false);
    setIsGameOverOpen(false);
    setIsResultsOpen(false);
    setAppState('MAIN_MENU');

    if (engineRef.current) {
      engineRef.current.resumeGame();
      engineRef.current.stopRace();
    }
  };

  const handleSelectShip = (shipId: string) => {
    setCurrentShipId(shipId);
    setProgression(prev => {
      const updated = { ...prev, selectedShipId: shipId };
      progressionStorage.save(updated);
      return updated;
    });
    if (engineRef.current) {
      engineRef.current.setPlayerShip(
        shipId,
        currentColor,
        currentSecondaryColor,
        currentDecal,
        currentUpgrades,
        currentThrusterColor,
        currentCockpitSkin
      );
    }
  };

  const handleSelectColor = (color: string) => {
    setCurrentColor(color);
    setProgression(prev => {
      const updated = { ...prev, primaryColor: color };
      progressionStorage.save(updated);
      return updated;
    });
    if (engineRef.current) {
      engineRef.current.setPlayerShip(
        currentShipId,
        color,
        currentSecondaryColor,
        currentDecal,
        currentUpgrades,
        currentThrusterColor,
        currentCockpitSkin
      );
    }
  };

  const handleSelectSecondaryColor = (color: string) => {
    setCurrentSecondaryColor(color);
    setProgression(prev => {
      const updated = { ...prev, secondaryColor: color };
      progressionStorage.save(updated);
      return updated;
    });
    if (engineRef.current) {
      engineRef.current.setPlayerShip(
        currentShipId,
        currentColor,
        color,
        currentDecal,
        currentUpgrades,
        currentThrusterColor,
        currentCockpitSkin
      );
    }
  };

  const handleSelectDecal = (decal: ShipDecalType) => {
    setCurrentDecal(decal);
    setProgression(prev => {
      const updated = { ...prev, decal };
      progressionStorage.save(updated);
      return updated;
    });
    if (engineRef.current) {
      engineRef.current.setPlayerShip(
        currentShipId,
        currentColor,
        currentSecondaryColor,
        decal,
        currentUpgrades,
        currentThrusterColor,
        currentCockpitSkin
      );
    }
  };

  const handleSelectThrusterColor = (flame: ThrusterFlameColor) => {
    setCurrentThrusterColor(flame);
    setProgression(prev => {
      const updated = { ...prev, thrusterColor: flame };
      progressionStorage.save(updated);
      return updated;
    });
    if (engineRef.current) {
      engineRef.current.setPlayerShip(
        currentShipId,
        currentColor,
        currentSecondaryColor,
        currentDecal,
        currentUpgrades,
        flame,
        currentCockpitSkin
      );
    }
  };

  const handleSelectCockpitSkin = (skin: CockpitSkin) => {
    setCurrentCockpitSkin(skin);
    setProgression(prev => {
      const updated = { ...prev, cockpitSkin: skin };
      progressionStorage.save(updated);
      return updated;
    });
    if (engineRef.current) {
      engineRef.current.setPlayerShip(
        currentShipId,
        currentColor,
        currentSecondaryColor,
        currentDecal,
        currentUpgrades,
        currentThrusterColor,
        skin
      );
    }
  };

  const handlePurchaseUpgrade = (type: UpgradeType, cost: number) => {
    const currentLvl = (currentUpgrades as any)[type] || 0;
    const nextLvl = currentLvl + 1;
    const updatedUpgrades = { ...currentUpgrades, [type]: nextLvl };

    setCurrentUpgrades(updatedUpgrades);
    setProgression(prev => {
      const updated = {
        ...prev,
        credits: prev.credits - cost,
        upgrades: updatedUpgrades,
      };
      progressionStorage.save(updated);
      return updated;
    });

    if (engineRef.current) {
      engineRef.current.localUpgrades = updatedUpgrades;
    }
  };

  const handleUpdateBeamCustomization = (customization: BeamCustomization) => {
    setProgression(prev => {
      const updated = { ...prev, beamCustomization: customization };
      progressionStorage.save(updated);
      return updated;
    });
    if (engineRef.current) {
      engineRef.current.setBeamCustomization(customization);
    }
  };

  const handlePurchaseBeamUpgrade = (upgradeKey: keyof BeamUpgrades, cost: number) => {
    const currentBeamUpgrades = progression.beamUpgrades || DEFAULT_BEAM_UPGRADES;
    const currentLvl = currentBeamUpgrades[upgradeKey] || 0;
    const nextLvl = currentLvl + 1;
    const updatedBeamUpgrades = { ...currentBeamUpgrades, [upgradeKey]: nextLvl };

    setProgression(prev => {
      const updated = {
        ...prev,
        credits: prev.credits - cost,
        beamUpgrades: updatedBeamUpgrades,
      };
      progressionStorage.save(updated);
      return updated;
    });

    if (engineRef.current) {
      engineRef.current.setBeamUpgrades(updatedBeamUpgrades);
    }
  };

  const handleUnlockShip = (shipId: string, cost: number) => {
    setProgression(prev => {
      const updated = {
        ...prev,
        credits: prev.credits - cost,
        unlockedShipIds: [...prev.unlockedShipIds, shipId],
        selectedShipId: shipId,
      };
      progressionStorage.save(updated);
      return updated;
    });
    handleSelectShip(shipId);
  };

  const handleUpdateName = (newName: string) => {
    setProgression(prev => {
      const updated = { ...prev, playerName: newName };
      progressionStorage.save(updated);
      return updated;
    });
  };

  return (
    <div className="relative w-screen h-screen bg-[#030712] overflow-hidden select-none">
      {/* 3D Three.js WebGL Canvas Stage */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Main Menu View */}
      {appState === 'MAIN_MENU' && (
        <MainMenu
          playerName={progression.playerName}
          onUpdatePlayerName={handleUpdateName}
          onQuickMatch={handleQuickMatch}
          onOpenCreateRoom={handleCreateRoom}
          onOpenJoinRoom={handleJoinRoom}
          onOpenMultiplayer={() => setIsMultiplayerModalOpen(true)}
          onOpenAIRace={() => setIsAIRaceModalOpen(true)}
          onOpenGameModes={() => setIsGameModesOpen(true)}
          onOpenGarage={() => setAppState('GARAGE')}
          onOpenMissions={() => setIsMissionsOpen(true)}
          onOpenLeaderboards={() => setIsLeaderboardsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenSpaceHub={() => setIsSpaceHubOpen(true)}
          onOpenStory={() => setIsStoryOpen(true)}
          credits={progression.credits}
          playerLevel={progression.level}
          ping={ping}
          isConnected={isConnected}
          currentShipId={currentShipId}
          onStartGameMode={mode => {
            setGameMode(mode);
            handleStartAIRace({
              difficulty: 'ACE',
              trackId: 'circuit_alpha',
              botCount: mode === 'TIME_TRIAL' ? 0 : 4,
              laps: mode === 'TIME_TRIAL' ? 3 : 5,
            });
          }}
        />
      )}

      {/* Garage / Workshop View */}
      {appState === 'GARAGE' && (
        <GarageView
          currentShipId={currentShipId}
          currentColor={currentColor}
          currentSecondaryColor={currentSecondaryColor}
          currentDecal={currentDecal}
          currentThrusterColor={currentThrusterColor}
          currentCockpitSkin={currentCockpitSkin}
          currentUpgrades={currentUpgrades}
          currentBeamCustomization={progression.beamCustomization || DEFAULT_BEAM_CUSTOMIZATION}
          currentBeamUpgrades={progression.beamUpgrades || DEFAULT_BEAM_UPGRADES}
          unlockedShips={progression.unlockedShipIds}
          credits={progression.credits}
          playerLevel={progression.level}
          pilotName={progression.playerName}
          onUpdatePilotName={handleUpdateName}
          onSelectShip={handleSelectShip}
          onSelectColor={handleSelectColor}
          onSelectSecondaryColor={handleSelectSecondaryColor}
          onSelectDecal={handleSelectDecal}
          onSelectThrusterColor={handleSelectThrusterColor}
          onSelectCockpitSkin={handleSelectCockpitSkin}
          onPurchaseUpgrade={handlePurchaseUpgrade}
          onUpdateBeamCustomization={handleUpdateBeamCustomization}
          onPurchaseBeamUpgrade={handlePurchaseBeamUpgrade}
          onUnlockShip={handleUnlockShip}
          onBack={() => setAppState('MAIN_MENU')}
        />
      )}

      {/* Multiplayer Lobby Room View */}
      {appState === 'LOBBY' && currentRoom && (
        <LobbyView
          room={currentRoom}
          playerId={networkClient.playerId}
          onSetReady={ready => networkClient.setReady(ready)}
          onStartRace={() => networkClient.startRace()}
          onAddBot={() => networkClient.addBot()}
          onSelectTrack={t => networkClient.setTrack(t)}
          onLeaveRoom={() => {
            networkClient.leaveRoom();
            setAppState('MAIN_MENU');
          }}
          onOpenGarage={() => setAppState('GARAGE')}
          onToggleTeam={() => {
            const me = currentRoom.players?.[networkClient.playerId];
            const nextTeam = me?.team === 'ALPHA' ? 'OMEGA' : 'ALPHA';
            networkClient.setTeam(nextTeam);
          }}
          onToggleRole={() => {
            const me = currentRoom.players?.[networkClient.playerId];
            networkClient.setRole(!me?.isSpectator);
          }}
          onUpdateSettings={settings => {
            networkClient.updateSettings(settings);
          }}
        />
      )}

      {/* In-Game Heads Up Display (HUD) */}
      {appState === 'RACING' && (
        <RaceHUD
          speed={speed}
          boost={boost}
          currentLap={currentLap}
          totalLaps={totalLaps}
          rank={rank}
          totalPlayers={totalPlayers}
          checkpoint={checkpoint}
          totalCheckpoints={totalCheckpoints}
          countdown={countdown}
          activeEvent={activeEvent}
          hazardHitMessage={hazardHitMessage}
          shortcutMessage={shortcutMessage}
          powerUps={powerUps}
          hullHealth={hullHealth}
          sessionCredits={sessionCredits}
          distanceMeters={distanceMeters}
          milestoneMessage={milestoneMessage}
          isWrongWay={isWrongWay}
          destroyedMessage={destroyedMessage}
          respawnTimeRemaining={respawnTimeRemaining}
          currentLapMs={currentLapMs}
          bestLapMs={bestLapMs}
          cameraMode={cameraMode}
          trackId={engineRef.current?.trackId || 'circuit_alpha'}
          damageZones={damageZones}
          isSpectator={engineRef.current?.isSpectator}
          spectatorTargetName={spectatorTargetName}
          beamTelemetry={beamTelemetry}
          junctionTelemetry={junctionTelemetry}
          onSelectRoute={direction => {
            if (engineRef.current) {
              engineRef.current.input.selectRouteDirection = direction;
              const ok = engineRef.current.junctionManager.selectRouteByDirection(direction);
              if (ok) {
                sound.playRouteSelected();
                if (engineRef.current.junctionManager.activeJunctionTelemetry) {
                  setJunctionTelemetry({ ...engineRef.current.junctionManager.activeJunctionTelemetry });
                }
              }
            }
          }}
          onCommitRoute={() => {
            if (engineRef.current) {
              engineRef.current.junctionManager.commitRoute();
              sound.playMenuClick();
              if (engineRef.current.junctionManager.activeJunctionTelemetry) {
                setJunctionTelemetry({ ...engineRef.current.junctionManager.activeJunctionTelemetry });
              }
            }
          }}
          onNextSpectatorTarget={() => engineRef.current?.cycleSpectatorTarget()}
          onTogglePause={handleTogglePause}
          onToggleCamera={() => {
            if (engineRef.current) {
              const m = engineRef.current.toggleCameraMode();
              setCameraMode(m);
            }
          }}
          onInputChange={inp => {
            if (engineRef.current) {
              engineRef.current.input = { ...engineRef.current.input, ...inp };
            }
          }}
          onRecover={() => {
            if (engineRef.current) {
              engineRef.current.input.recover = true;
            }
          }}
        />
      )}

      {/* Arcade Collision Feedback HUD */}
      {appState === 'RACING' && <CollisionHUD feedback={collisionFeedback} />}

      {/* Post-Race Results Modal */}
      {isResultsOpen && (
        <ResultsModal
          results={resultsData}
          localPlayerId={isAIRaceActive ? 'player' : networkClient.playerId}
          onRestart={handleRestartRace}
          onReturnToLobby={handleReturnToLobby}
          earnedCredits={earnedCredits}
        />
      )}

      {/* Game Over / Vessel Destroyed Modal */}
      {isGameOverOpen && (
        <GameOverModal
          stats={gameOverStats}
          onRestart={handleRestartRace}
          onReturnToLobby={handleReturnToLobby}
        />
      )}

      {/* In-Game Pause Modal */}
      {isPauseOpen && (
        <PauseModal
          isOpen={isPauseOpen}
          onResume={handleTogglePause}
          onRestart={handleRestartRace}
          onReturnToLobby={handleReturnToLobby}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* Settings & Audio Modal */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentCameraMode={cameraMode}
          onSelectCameraMode={m => {
            setCameraMode(m);
            engineRef.current?.setCameraMode(m);
          }}
          cameraShakeEnabled={cameraShakeEnabled}
          onToggleCameraShake={en => {
            setCameraShakeEnabled(en);
            engineRef.current?.setCameraShakeEnabled(en);
          }}
          graphicsQuality={graphicsQuality}
          onSelectGraphicsQuality={q => {
            setGraphicsQuality(q);
            engineRef.current?.setGraphicsQuality(q);
          }}
          collisionConfig={collisionConfig}
          onUpdateCollisionConfig={cfg => {
            setCollisionConfig(prev => (prev ? { ...prev, ...cfg } : prev));
            engineRef.current?.setCollisionConfig(cfg);
          }}
        />
      )}

      {/* Missions & Quests Modal */}
      {isMissionsOpen && (
        <MissionsModal
          isOpen={isMissionsOpen}
          onClose={() => setIsMissionsOpen(false)}
          missions={progression.dailyMissions}
          achievements={progression.achievements}
          credits={progression.credits}
          playerLevel={progression.level}
          xp={progression.xp}
          onClaimMission={id => {
            const m = progression.dailyMissions.find(x => x.id === id);
            if (m) {
              setProgression(prev => {
                const updatedMissions = prev.dailyMissions.map(x =>
                  x.id === id ? { ...x, claimed: true } : x
                );
                const updated = {
                  ...prev,
                  credits: prev.credits + m.rewardCredits,
                  dailyMissions: updatedMissions,
                };
                progressionStorage.save(updated);
                return updated;
              });
            }
          }}
          onClaimAchievement={id => {
            const a = progression.achievements.find(x => x.id === id);
            if (a) {
              setProgression(prev => {
                const updatedAchs = prev.achievements.map(x =>
                  x.id === id ? { ...x, unlocked: true } : x
                );
                const updated = {
                  ...prev,
                  credits: prev.credits + a.rewardCredits,
                  achievements: updatedAchs,
                };
                progressionStorage.save(updated);
                return updated;
              });
            }
          }}
        />
      )}

      {/* Global Leaderboards Modal */}
      {isLeaderboardsOpen && (
        <LeaderboardsModal
          isOpen={isLeaderboardsOpen}
          onClose={() => setIsLeaderboardsOpen(false)}
          entries={progression.leaderboards}
          currentTrackId={engineRef.current?.trackId || 'circuit_alpha'}
          userBestLap={
            progression.stats.bestLapTime > 0
              ? `${(progression.stats.bestLapTime / 1000).toFixed(3)}s`
              : '--:--.---'
          }
          onSelectTrack={t => {
            if (engineRef.current) engineRef.current.setTrack(t);
          }}
        />
      )}

      {/* Pilot Profile Dossier Modal */}
      {isProfileOpen && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          progression={progression}
          onUpdateName={handleUpdateName}
        />
      )}

      {/* Game Mode Select Modal */}
      {isGameModesOpen && (
        <GameModeSelectModal
          isOpen={isGameModesOpen}
          onClose={() => setIsGameModesOpen(false)}
          onStartConfiguredRace={config => {
            setGameMode(config.mode);
            handleStartAIRace({
              difficulty: config.difficulty,
              trackId: config.trackId,
              botCount: config.botCount,
              laps: config.laps,
            });
          }}
          onSelectMode={mode => {
            setGameMode(mode);
            handleStartAIRace({
              difficulty: 'ACE',
              trackId: 'circuit_alpha',
              botCount: mode === 'ENDURANCE' ? 1 : 5,
              laps: mode === 'ENDURANCE' ? 99 : 3,
            });
          }}
        />
      )}

      {/* Solo AI Battle Modal */}
      {isAIRaceModalOpen && (
        <AIRaceModal
          isOpen={isAIRaceModalOpen}
          onClose={() => setIsAIRaceModalOpen(false)}
          onStartAIRace={handleStartAIRace}
        />
      )}

      {/* Space Station Hub Modal */}
      {isSpaceHubOpen && (
        <SpaceHubModal
          onClose={() => setIsSpaceHubOpen(false)}
          pilotName={progression.playerName}
          credits={progression.credits}
          level={progression.level}
          onNavigateTo={view => {
            setIsSpaceHubOpen(false);
            if (view === 'GARAGE') setAppState('GARAGE');
            else if (view === 'MODE_SELECT') setIsGameModesOpen(true);
            else if (view === 'MISSIONS') setIsMissionsOpen(true);
            else if (view === 'STORY') setIsStoryOpen(true);
            else if (view === 'LEADERBOARDS') setIsLeaderboardsOpen(true);
            else if (view === 'PROFILE') setIsProfileOpen(true);
          }}
        />
      )}

      {/* Cosmic Chronicles & Factions Story Modal */}
      {isStoryOpen && (
        <StoryUniverseModal
          onClose={() => setIsStoryOpen(false)}
          onLaunchMission={(trackId, mode) => {
            setIsStoryOpen(false);
            setGameMode(mode);
            handleStartAIRace({
              difficulty: 'ACE',
              trackId,
              botCount: mode === 'DUEL' ? 1 : 5,
              laps: mode === 'DUEL' ? 3 : 2,
            });
          }}
        />
      )}

      {/* Advanced Real-Time Multiplayer Modal */}
      <MultiplayerModal
        isOpen={isMultiplayerModalOpen}
        onClose={() => setIsMultiplayerModalOpen(false)}
        onQuickMatch={mode => {
          setIsMultiplayerModalOpen(false);
          handleQuickMatch(mode);
        }}
        onCreateRoom={(settings, isSpectator, team) => {
          setIsMultiplayerModalOpen(false);
          handleCreateRoom(settings, isSpectator, team);
        }}
        onJoinRoomCode={(code, isSpectator, team) => {
          setIsMultiplayerModalOpen(false);
          handleJoinRoom(code, isSpectator, team);
        }}
      />
    </div>
  );
}
