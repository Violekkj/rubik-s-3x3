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
    <div
      id="scramble-hud"
      className="w-full max-w-3xl mx-auto px-3 py-1 flex items-center justify-between gap-2 select-none min-h-[44px] max-h-[64px]"
    >
      {/* Texto do Scramble (máximo 2 linhas, mono compacto) */}
      <div
        id="scramble-text"
        className="flex-1 font-mono text-[clamp(0.8125rem,1.2vw,1rem)] font-semibold tracking-wide text-cube-text text-center px-2 select-text line-clamp-2 leading-snug"
        title={scramble}
      >
        {scramble || 'Carregando scramble...'}
      </div>

      {/* Botões só com ícone (28x28px), numa única linha compacta */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          id="btn-prev-scramble"
          onClick={onPrevScramble}
          disabled={!hasPrevScramble}
          aria-label="Scramble anterior"
          title="Scramble anterior"
          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
            hasPrevScramble
              ? 'bg-cube-surface2 hover:bg-cube-surface3 text-cube-textMuted hover:text-white border-cube-border'
              : 'bg-cube-surface1 text-cube-textDim opacity-30 border-transparent cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <button
          id="btn-copy-scramble"
          onClick={handleCopy}
          aria-label={copied ? 'Scramble copiado' : 'Copiar scramble'}
          title={copied ? 'Copiado!' : 'Copiar scramble'}
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-cube-surface2 hover:bg-cube-surface3 text-cube-textMuted hover:text-white border border-cube-border transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-cube-green" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        <button
          id="btn-next-scramble"
          onClick={onNextScramble}
          aria-label="Gerar novo scramble"
          title="Gerar novo scramble"
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-cube-surface2 hover:bg-cube-surface3 text-cube-textMuted hover:text-white border border-cube-border transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <button
          id="btn-edit-scramble"
          onClick={onOpenEditModal}
          aria-label="Editar scramble personalizado"
          title="Editar scramble personalizado"
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-cube-surface2 hover:bg-cube-surface3 text-cube-textMuted hover:text-white border border-cube-border transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
