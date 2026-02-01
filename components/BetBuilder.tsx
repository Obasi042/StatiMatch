import React, { useState } from 'react';
import { BetSelection } from '../types';
import { X, ChevronUp, ChevronDown, Trash2, Layers, Copy, Check } from 'lucide-react';

interface BetBuilderProps {
  selections: BetSelection[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

const BetBuilder: React.FC<BetBuilderProps> = ({ selections, onRemove, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (selections.length === 0) return null;

  const handleCopy = () => {
    const text = selections.map(s => 
      `${s.matchTitle}\n${s.market}: ${s.selection} (${s.confidence})`
    ).join('\n\n');
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`fixed bottom-0 right-0 z-50 w-full sm:w-96 transition-transform duration-300 transform ${isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-60px)]'} sm:right-4 sm:bottom-4`}>
      <div className="bg-[#131b2e] border border-indigo-500/30 shadow-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-indigo-600 p-4 flex items-center justify-between cursor-pointer hover:bg-indigo-500 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Bet Builder</h3>
              <p className="text-indigo-200 text-xs">{selections.length} Selection{selections.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="bg-black/20 rounded-full p-1">
            {isOpen ? <ChevronDown className="w-4 h-4 text-white" /> : <ChevronUp className="w-4 h-4 text-white" />}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b0f19]">
          {selections.map((selection) => (
            <div key={selection.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 flex items-start gap-3 group relative">
              <button 
                onClick={() => onRemove(selection.id)}
                className="absolute top-2 right-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className={`w-1 h-full absolute left-0 top-0 bottom-0 rounded-l-xl ${
                selection.confidence === 'High' ? 'bg-emerald-500' : 
                selection.confidence === 'Medium' ? 'bg-amber-500' : 'bg-red-500'
              }`}></div>

              <div className="pl-2 flex-1">
                <h4 className="text-xs text-gray-400 truncate pr-4">{selection.matchTitle}</h4>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-bold text-white text-sm">{selection.selection}</span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    selection.confidence === 'High' ? 'bg-emerald-500/10 text-emerald-400' : 
                    selection.confidence === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {selection.confidence}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">{selection.market}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#131b2e] border-t border-gray-800 flex gap-2">
          <button 
            onClick={onClear}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Clear
          </button>
          <button 
            onClick={handleCopy}
            className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Slip'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default BetBuilder;