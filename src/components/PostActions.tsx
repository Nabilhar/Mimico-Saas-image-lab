'use client';

import { useState } from 'react';
import { Copy, Check, Share2, Trash2 } from 'lucide-react';

interface PostActionsProps {
  content: string;
  onDelete: () => void;
  showCopy?: boolean;
}

export default function PostActions({ content, onDelete, showCopy = false }: PostActionsProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false); // New state for Share feedback

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Mimico Social Content', text: content });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        console.log('Share error:', err);
      }
    } else {
      // DESKTOP FALLBACK: 
      // Instead of calling handleCopy(), we do a clean clipboard save 
      // and show "Shared!" feedback on the Share button itself.
      try {
        await navigator.clipboard.writeText(content);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
      <div className="flex items-center gap-3">
        
        {/* Copy Button */}
        {showCopy && (
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
              copied 
                ? 'bg-green-500 text-white shadow-md' 
                : 'bg-slate-100 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        )}

        {/* Share Button - Now has its own 'shared' state check */}
        <button
          onClick={handleShare}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
            shared 
              ? 'bg-cyan-600 text-white shadow-md' 
              : 'bg-slate-100 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700'
          }`}
        >
          {shared ? <Check size={16} /> : <Share2 size={16} />}
          <span>{shared ? 'Done!' : 'Share'}</span>
        </button>
      </div>

      {/* Delete Button */}
      <button
        onClick={onDelete}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}