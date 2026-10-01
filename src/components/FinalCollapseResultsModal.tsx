import React from 'react';
import { FinalCollapseStats } from '../game/FinalCollapseManager';

interface FinalCollapseResultsModalProps {
  stats: FinalCollapseStats;
  onRestart: () => void;
  onReturnToLobby: () => void;
}

export const FinalCollapseResultsModal: React.FC<FinalCollapseResultsModalProps> = ({
  stats,
  onRestart,
  onReturnToLobby,
}) => {
  const isSurvived = stats.survivalStatus === 'SURVIVED' && stats.shipSecured;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fadeIn select-none font-mono">
      {/* Background ambient lighting */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          isSurvived
            ? 'bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18),transparent_70%)]'
            : 'bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.22),transparent_70%)]'
        }`}
      />

      <div
        className={`relative z-10 max-w-2xl w-full rounded-2xl border-2 p-6 sm:p-8 bg-[#060814]/95 shadow-2xl ${
          isSurvived
            ? 'border-emerald-500/80 shadow-[0_0_80px_rgba(16,185,129,0.45)]'
            : 'border-red-500/80 shadow-[0_0_80px_rgba(239,68,68,0.5)]'
        }`}
      >
        {/* Header Header Subtitle */}
        <div className="text-center mb-5">
          <div className="inline-block px-3 py-1 rounded-full border text-[10px] font-black tracking-[0.3em] uppercase mb-2">
            {isSurvived ? (
              <span className="text-emerald-400 bg-emerald-950/80 border-emerald-500/50">
                ✓ MISSION OUTCOME: SUCCESS
              </span>
            ) : (
              <span className="text-red-400 bg-red-950/80 border-red-500/50 animate-pulse">
                ✕ MISSION OUTCOME: FAILED
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-ui font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 drop-shadow-md">
            THE FINAL COLLAPSE
          </h1>

          <div
            className={`text-xl sm:text-2xl font-black tracking-widest mt-1 uppercase ${
              isSurvived ? 'text-emerald-400' : 'text-red-500'
            }`}
          >
            {isSurvived ? 'EVACUATION SUCCESSFUL' : 'EVACUATION FAILED'}
          </div>

          <p className="text-xs sm:text-sm text-slate-300 mt-1 tracking-wider">
            {isSurvived
              ? 'YOU REACHED THE SAFE ZONE // PILOT SECURED IN BAY 07'
              : 'YOU DID NOT REACH THE SAFE ZONE'}
          </p>

          {!isSurvived && stats.failureCause && (
            <div className="mt-2 text-xs font-bold text-red-300 bg-red-950/50 py-1 px-3 rounded-lg border border-red-500/40 inline-block">
              FAILURE CAUSE: <span className="text-white">{stats.failureCause.replace(/_/g, ' ')}</span>
            </div>
          )}
        </div>

        {/* 16 Authoritative Real Values Grid */}
        <div className="bg-black/60 rounded-xl border border-slate-700/60 p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
          {/* Progression Milestones */}
          <div className="space-y-1.5 border-b sm:border-b-0 sm:border-r border-slate-800 pb-3 sm:pb-0 sm:pr-4">
            <div className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase border-b border-cyan-500/20 pb-1 mb-2">
              Evacuation Milestones
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">SAFE ZONE REACHED:</span>
              <span className={`font-black ${isSurvived ? 'text-emerald-400' : 'text-red-400'}`}>
                {isSurvived ? 'YES' : 'NO'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">TOWER ENTRY:</span>
              <span className={stats.towerEntryReached ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                {stats.towerEntryReached ? 'YES' : 'NO'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">BASEMENT ENTRY:</span>
              <span className={stats.basementEntryReached ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                {stats.basementEntryReached ? 'YES' : 'NO'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">HANGAR ENTRY:</span>
              <span className={stats.hangarEntryReached ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                {stats.hangarEntryReached ? 'YES' : 'NO'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">PARKING BAY ENTRY:</span>
              <span className={stats.parkingBayReached ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                {stats.parkingBayReached ? 'YES' : 'NO'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">SHIP ALIGNED:</span>
              <span className={stats.shipAligned ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                {stats.shipAligned ? 'YES' : 'NO'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">SHIP PARKED:</span>
              <span className={stats.shipParked ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                {stats.shipParked ? 'YES' : 'NO'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">SHIP SECURED:</span>
              <span className={stats.shipSecured ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                {stats.shipSecured ? 'YES' : 'NO'}
              </span>
            </div>
          </div>

          {/* Mission & Flight Telemetry */}
          <div className="space-y-1.5 sm:pl-2">
            <div className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase border-b border-cyan-500/20 pb-1 mb-2">
              Flight Telemetry
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">ACTUAL RACE TIME:</span>
              <span className="font-black text-white">{stats.raceTimeFormatted}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">ACTUAL EVACUATION TIME:</span>
              <span className="font-black text-amber-300">{stats.evacuationTimeFormatted}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">ACTUAL DISTANCE:</span>
              <span className="font-bold text-white">{stats.distanceTraveledM}m</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">CHECKPOINTS:</span>
              <span className="font-bold text-white">{stats.checkpointsReached}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">BOOST USED:</span>
              <span className="font-bold text-white">{stats.boostUsedCount}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">SHIELDS USED:</span>
              <span className="font-bold text-white">{stats.shieldsUsedCount}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-slate-400">FAILURE CAUSE:</span>
              <span className={`font-bold ${isSurvived ? 'text-emerald-400' : 'text-red-400'}`}>
                {isSurvived ? 'NONE (SURVIVED)' : (stats.failureCause || 'UNKNOWN')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRestart}
            className={`px-6 py-3 rounded-xl font-black text-sm tracking-wider uppercase transition-all shadow-lg ${
              isSurvived
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/30'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
            }`}
          >
            {isSurvived ? 'REPLAY EVACUATION' : 'RETRY EVACUATION'}
          </button>
          <button
            onClick={onReturnToLobby}
            className="px-6 py-3 rounded-xl font-bold text-sm tracking-wider uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/50 transition-colors"
          >
            RETURN TO HANGAR
          </button>
        </div>
      </div>
    </div>
  );
};
