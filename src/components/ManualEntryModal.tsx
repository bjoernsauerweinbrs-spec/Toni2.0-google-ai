import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Activity, Target, TrendingUp, Heart, Moon, Weight } from 'lucide-react';
import { Player } from '../types';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  onSave: (updatedPlayer: Partial<Player>) => void;
  persona: 'DOCTOR' | 'TRAINER' | 'MANAGER';
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  isOpen,
  onClose,
  player,
  onSave,
  persona
}) => {
  const [formData, setFormData] = useState<Partial<Player>>({
    ...player
  });

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const renderDoctorFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <Heart size={14} /> Resting HR (bpm)
          </label>
          <input
            type="number"
            value={formData.activity?.resting_hr || ''}
            onChange={(e) => setFormData({
              ...formData,
              activity: { ...formData.activity!, resting_hr: parseInt(e.target.value) }
            })}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white font-mono focus:border-cyan-500 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <Moon size={14} /> Deep Sleep (h)
          </label>
          <input
            type="text"
            value={formData.sleep_cycles?.deep_sleep || ''}
            onChange={(e) => setFormData({
              ...formData,
              sleep_cycles: { ...formData.sleep_cycles!, deep_sleep: e.target.value }
            })}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white font-mono focus:border-cyan-500 outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <Weight size={14} /> Weight (kg)
          </label>
          <input
            type="number"
            value={formData.biometrics?.weight || ''}
            onChange={(e) => setFormData({
              ...formData,
              biometrics: { ...formData.biometrics!, weight: parseFloat(e.target.value) }
            })}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white font-mono focus:border-cyan-500 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <Activity size={14} /> Body Fat (%)
          </label>
          <input
            type="number"
            value={formData.biometrics?.body_fat || ''}
            onChange={(e) => setFormData({
              ...formData,
              biometrics: { ...formData.biometrics!, body_fat: parseFloat(e.target.value) }
            })}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white font-mono focus:border-cyan-500 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={14} /> Muscle (kg)
          </label>
          <input
            type="number"
            value={formData.biometrics?.muscle_mass || ''}
            onChange={(e) => setFormData({
              ...formData,
              biometrics: { ...formData.biometrics!, muscle_mass: parseFloat(e.target.value) }
            })}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white font-mono focus:border-cyan-500 outline-none"
          />
        </div>
      </div>
    </div>
  );

  const renderTrainerFields = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
          <Target size={14} /> Tactical Position
        </label>
        <input
          type="text"
          value={formData.tactical_position || ''}
          onChange={(e) => setFormData({ ...formData, tactical_position: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white font-mono focus:border-amber-500 outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(formData.scouting_metrics || {}).map(([key, val]) => (
          <div key={key} className="space-y-2">
            <label className="text-xs font-black text-amber-400 uppercase tracking-widest capitalize">
              {key}
            </label>
            <input
              type="number"
              value={val}
              onChange={(e) => setFormData({
                ...formData,
                scouting_metrics: { ...formData.scouting_metrics!, [key]: parseInt(e.target.value) }
              })}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white font-mono focus:border-amber-500 outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const colors = {
    DOCTOR: 'cyan',
    TRAINER: 'amber',
    MANAGER: 'emerald'
  };

  const color = colors[persona];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`w-full max-w-2xl bg-[#0a0a0a] border-2 border-${color}-500/30 rounded-[32px] overflow-hidden shadow-2xl`}
        >
          <div className={`p-8 border-b border-${color}-500/20 flex items-center justify-between bg-${color}-500/5`}>
            <div>
              <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">
                {persona} INPUT CENTER
              </h2>
              <p className={`text-${color}-400 text-xs font-bold uppercase tracking-widest mt-1`}>
                Manual Parameter Entry: {player.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {persona === 'DOCTOR' && renderDoctorFields()}
            {persona === 'TRAINER' && renderTrainerFields()}
            {persona === 'MANAGER' && (
              <div className="text-white/50 italic text-center py-12">
                Manager financial overrides are handled in the Briefcase module.
              </div>
            )}
          </div>

          <div className="p-8 bg-white/5 border-t border-white/10 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`px-8 py-3 bg-${color}-500 hover:bg-${color}-400 text-black rounded-xl font-black flex items-center gap-2 transition-all uppercase tracking-widest text-sm shadow-lg shadow-${color}-500/20`}
            >
              <Save size={18} /> Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
