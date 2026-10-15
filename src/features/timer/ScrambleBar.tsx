import React, { useState } from 'react';
import { Copy, Check, RotateCw, ChevronLeft, Edit3 } from 'lucide-react';

interface ScrambleBarProps {
  scramble: string;
  onNextScramble: () => void;
  onPrevScramble: () => void;
  hasPrevScramble: boolean;
  onOpenEditModal: () => void;
}

export const ScrambleBar: React.FC<ScrambleBarProps> = ({
  scramble,
  onNextScramble,
  onPrevScramble,
  hasPrevScramble,
  onOpenEditModal,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scramble);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-3 flex flex-col items-center select-none">
      {/* Texto do Scramble em Fonte Monoespaçada Legível */}
      <div className="text-center font-mono text-base md:text-xl lg:text-2xl font-semibold tracking-wide text-cube-text leading-relaxed px-2 py-1 select-text">
        {scramble || 'Carregando scramble...'}
      </div>

      {/* Botões de Ação do Scramble */}
      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap justify-center text-xs">
        <button
          id="btn-copy-scramble"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cube-surface2 hover:bg-cube-surface3 text-cube-textMuted hover:text-white border border-cube-border transition-colors"
          title="Copiar scramble para a área de transferência"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-cube-green" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copiado!' : 'Copiar'}</span>
        </button>

        <button
          id="btn-prev-scramble"
          onClick={onPrevScramble}
          disabled={!hasPrevScramble}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cube-border transition-colors ${
            hasPrevScramble
              ? 'bg-cube-surface2 hover:bg-cube-surface3 text-cube-textMuted hover:text-white'
              : 'bg-cube-surface1 text-cube-textDim opacity-40 cursor-not-allowed'
          }`}
          title="Scramble anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Anterior</span>
        </button>

        <button
          id="btn-next-scramble"
          onClick={onNextScramble}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cube-surface2 hover:bg-cube-surface3 text-cube-textMuted hover:text-white border border-cube-border transition-colors"
          title="Gerar novo scramble"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Novo</span>
        </button>

        <button
          id="btn-edit-scramble"
          onClick={onOpenEditModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cube-surface2 hover:bg-cube-surface3 text-cube-textMuted hover:text-white border border-cube-border transition-colors"
          title="Digitar ou colar scramble personalizado"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Editar Scramble</span>
        </button>
      </div>
    </div>
  );
};
