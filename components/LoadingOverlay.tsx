import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6 relative overflow-hidden">
        {/* Animated gradient border top */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 animate-gradient-x"></div>
        
        <div className="relative">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Analyzing Match Data</h3>
          <p className="text-slate-400 text-sm animate-pulse">{message}</p>
        </div>

        <div className="space-y-2">
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500/50 rounded-full animate-progress origin-left"></div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 font-mono">
            <span>Researching</span>
            <span>Simulating</span>
            <span>Predicting</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;