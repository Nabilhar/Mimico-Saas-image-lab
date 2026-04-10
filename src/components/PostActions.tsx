'use client';

import { useState } from 'react';
import { Copy, Check, Share2, Trash2, X, Image } from 'lucide-react';

interface PostActionsProps {
  content: string;
  imageUrl?: string | null;
  onDelete: () => void;
  showCopy?: boolean;
}

export default function PostActions({ content, imageUrl, onDelete, showCopy = false }: PostActionsProps) {
  const [textCopied, setTextCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<'ready' | 'done'>('ready');

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setTextCopied(true);
      setTimeout(() => setTextCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text!", err);
    }
  };

  const handleCopyImage = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 2000);
    } catch (err) {
      console.warn("Clipboard fallback to download:", err);
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `mimico-post-${Date.now()}.png`;
      link.click();
      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 2000);
    }
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `mimico-post-${Date.now()}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareKit = async () => {
    if (!imageUrl) {
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Mimico Social Content', text: content });
        } catch {
          await navigator.clipboard.writeText(content);
        }
      } else {
        await navigator.clipboard.writeText(content);
        setTextCopied(true);
        setTimeout(() => setTextCopied(false), 2000);
      }
      return;
    }

    try {
      await Promise.all([
        navigator.clipboard.writeText(content),
        Promise.resolve(downloadImage()),
      ]);
      setModalStep('ready');
      setShowModal(true);
    } catch (err) {
      console.error('Share kit error:', err);
      await navigator.clipboard.writeText(content);
      setShowModal(true);
    }
  };

  const handleModalCopyAgain = async () => {
    await navigator.clipboard.writeText(content);
    setModalStep('done');
    setTimeout(() => setModalStep('ready'), 2000);
  };

  return (
    <>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          {showCopy && (
            <button
              onClick={handleCopyText}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                textCopied ? 'bg-green-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700'
              }`}
            >
              {textCopied ? <Check size={13} /> : <Copy size={13} />}
              <span>{textCopied ? 'Copied!' : 'Copy text'}</span>
            </button>
          )}

          {imageUrl && (
            <button
              onClick={handleCopyImage}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                imageCopied ? 'bg-green-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700'
              }`}
            >
              {imageCopied ? <Check size={13} /> : <Image size={13} />}
              <span>{imageCopied ? 'Copied!' : 'Copy image'}</span>
            </button>
          )}

          <button
            onClick={handleShareKit}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-cyan-700 text-white hover:bg-cyan-800 transition-all duration-300 shadow-sm"
          >
            <Share2 size={13} />
            <span>Share kit</span>
          </button>
        </div>

        <button
          onClick={onDelete}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-6 sm:pb-0"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600">Share kit ready</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">Your post is ready to share</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">✓</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Image downloaded</p>
                  <p className="text-xs text-slate-400 mt-0.5">Check your Downloads folder.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">✓</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Caption copied</p>
                  <p className="text-xs text-slate-400 mt-0.5">Ready to paste.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">3</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Open app and paste</p>
                  <p className="text-xs text-slate-400 mt-0.5">Upload image, paste caption.</p>
                </div>
              </div>
            </div>

            <div className="px-5 pb-4 grid grid-cols-2 gap-2">
              <a 
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1877F2] text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </a>
              <a 
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                Instagram
              </a>
            </div>

            <div className="px-5 pb-5 text-center">
              <button
                onClick={handleModalCopyAgain}
                className="text-xs text-slate-400 hover:text-cyan-600 transition-colors underline underline-offset-2"
              >
                {modalStep === 'done' ? '✓ Caption copied again!' : 'Copy caption again'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}