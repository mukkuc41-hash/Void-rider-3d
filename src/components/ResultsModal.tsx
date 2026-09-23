import React, { useState } from 'react';
import { Trophy, RotateCcw, Home, Zap, Clock, Medal, Award, ChevronRight, ShieldAlert } from 'lucide-react';
import { RaceResult, GameMode } from '../types';
import { sound } from '../game/audio';
import { championshipManager, CHAMPIONSHIP_STAGES } from '../game/championshipManager';

interface ResultsModalProps {
  results: RaceResult[];
  localPlayerId: string;
  onRestart: () => void;
  onReturnToLobby: () => void;
  earnedCredits: number;
  gameMode?: GameMode;
  onNextChampionshipStage?: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  results,
  localPlayerId,
  onRestart,
  onReturnToLobby,
  earnedCredits,
  gameMode,
  onNextChampionshipStage,
}) => {
  const [activeTab, setActiveTab] = useState<'RACE' | 'STANDINGS'>('RACE');

  const sorted = [...results].sort((a, b) => {
    if (a.completed && !b.completed) return -1;
    if (!a.completed && b.completed) return 1;
    return a.totalTime - b.totalTime;
  });

  const myResult = sorted.find(r => r.playerId === localPlayerId);
  const myRank = sorted.findIndex(r => r.playerId === localPlayerId) + 1;

  const isChampionship = gameMode === 'VOID_CHAMPIONSHIP';
  const stageIndex = Math.min(championshipManager.currentStageIndex, CHAMPIONSHIP_STAGES.length - 1);
  const currentStage = CHAMPIONSHIP_STAGES[stageIndex];
  const standings = championshipManager.getStandings();
  const isChampionshipCompleted = championshipManager.isCompleted;

  const formatTime = (ms: number) => {
    if (ms <= 0) return 'DNF';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const millis = Math.floor(ms % 1000);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${millis
      .toString()
      .padStart(3, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-xl bg-slate-950/95 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,240,255,0.2)] flex flex-col items-center max-h-[90vh] overflow-y-auto">
        {/* Podium Medal Graphic */}
        <div className="p-4 rounded-3xl bg-cyan-950/70 border border-cyan-400 text-cyan-400 shadow-[0_0_25px_#00f0ff] mb-3">
          <Trophy className="w-10 h-10" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-ui font-black uppercase tracking-wider text-white text-center">
          {isChampionship
            ? isChampionshipCompleted
              ? 'VOID CHAMPIONSHIP CONCLUDED'
              : `${currentStage?.title || 'CHAMPIONSHIP STAGE'} COMPLETED`
            : 'SECTOR GRAND PRIX CONCLUDED'}
        </h2>
        <p className="text-xs font-mono text-cyan-400 mt-0.5 text-center">
          {isChampionship
            ? `${currentStage?.subtitle || ''} // Authoritative telemetry verified`
            : 'Authoritative orbital timing verified'}
        </p>

        {/* Player Victory Summary Banner */}
        <div className="w-full my-4 p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 font-ui font-black text-lg">
              {myRank || 1}
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                YOUR FINISH POSITION
              </span>
              <div className="text-lg font-ui font-black text-white">
                {myRank === 1 ? '1ST PLACE - GOLD' : myRank === 2 ? '2ND PLACE - SILVER' : myRank === 3 ? '3RD PLACE - BRONZE' : `${myRank}TH PLACE`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-xs font-bold">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>+{earnedCredits.toLocaleString()} CR</span>
          </div>
        </div>

        {/* Championship Mode Tab Switcher */}
        {isChampionship && (
          <div className="w-full flex rounded-xl bg-slate-900/90 p-1 border border-cyan-500/30 mb-4">
            <button
              onClick={() => {
                sound.playMenuClick();
                setActiveTab('RACE');
              }}
              className={`flex-1 py-1.5 text-xs font-ui font-black tracking-wider rounded-lg transition-all ${
                activeTab === 'RACE'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#00f0ff]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              STAGE RESULTS
            </button>
            <button
              onClick={() => {
                sound.playMenuClick();
                setActiveTab('STANDINGS');
              }}
              className={`flex-1 py-1.5 text-xs font-ui font-black tracking-wider rounded-lg transition-all ${
                activeTab === 'STANDINGS'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#00f0ff]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              TOURNAMENT STANDINGS
            </button>
          </div>
        )}

        {/* Active View: Race Results or Tournament Standings */}
        {activeTab === 'STANDINGS' && isChampionship ? (
          <div className="w-full space-y-2 mb-6">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-2">
              OVERALL CHAMPIONSHIP STANDINGS (6 PILOTS)
            </span>
            {standings.map((driver, idx) => (
              <div
                key={driver.id}
                className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-mono transition-all ${
                  driver.isPlayer
                    ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.2)] text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center font-ui font-black text-cyan-400">
                    {idx + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-ui font-black text-sm uppercase">
                      {driver.name} {driver.isPlayer && '(YOU)'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      STAGES COMPLETED: {driver.stageResults.length} / 6
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-amber-400 text-sm">
                    {driver.totalPoints} PTS
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {idx === 0 ? 'LEADER' : `-${standings[0].totalPoints - driver.totalPoints} PTS`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full space-y-2 mb-6">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-2">
              FINAL ORBITAL CLASSIFICATION
            </span>
            {sorted.map((res, idx) => {
              const isMe = res.playerId === localPlayerId;
              return (
                <div
                  key={res.playerId}
                  className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-mono transition-all ${
                    isMe
                      ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.2)] text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center font-ui font-black text-cyan-400">
                      {idx + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-ui font-black text-sm uppercase">
                        {res.playerName} {isMe && '(YOU)'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        BEST: {formatTime(res.bestLapTime)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-white">{formatTime(res.totalTime)}</div>
                    <div className="text-[10px] text-slate-400">
                      {res.completed ? 'COMPLETED' : 'DNF'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Controls */}
        <div className="w-full flex flex-col sm:flex-row gap-3 pt-4 border-t border-cyan-500/20">
          {isChampionship && !isChampionshipCompleted && onNextChampionshipStage && (
            <button
              onClick={() => {
                sound.playMenuClick();
                onNextChampionshipStage();
              }}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-ui font-black text-xs uppercase tracking-widest shadow-[0_0_20px_#10b981] transition-all flex items-center justify-center gap-2"
            >
              NEXT STAGE <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              sound.playMenuClick();
              if (isChampionship) {
                championshipManager.retryCurrentStage();
              }
              onRestart();
            }}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-ui font-black text-xs uppercase tracking-widest shadow-[0_0_20px_#00f0ff] transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> {isChampionship ? 'RETRY STAGE' : 'REMATCH'}
          </button>

          <button
            onClick={() => {
              sound.playMenuClick();
              onReturnToLobby();
            }}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 font-ui font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> RETURN TO HANGAR
          </button>
        </div>
      </div>
    </div>
  );
};
