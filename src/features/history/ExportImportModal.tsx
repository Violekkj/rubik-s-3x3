import React, { useState, useRef } from 'react';
import { X, Download, Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { db, SolveRecord, SessionRecord, UserSettingsRecord } from '../../data/db';
import { useSessionStore } from '../../stores/sessionStore';
import { useSolveStore } from '../../stores/solveStore';
import { useProfileStore } from '../../stores/profileStore';
import { ImageProcessor } from '../profile/imageProcessor';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({ isOpen, onClose }) => {
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loadSessions, activeSessionId } = useSessionStore();
  const { loadSolvesForSession } = useSolveStore();

  if (!isOpen) return null;

  // Exportar Backup JSON completo
  const handleExportJson = async () => {
    try {
      const solves = await db.solves.toArray();
      const sessions = await db.sessions.toArray();
      const settings = await db.settings.get('default');
      const profile = await db.profiles.get('current');

      let exportedProfile = undefined;
      if (profile) {
        let avatarBase64: string | undefined = undefined;
        let bannerBase64: string | undefined = undefined;
        if (profile.avatarBlob) {
          try {
            avatarBase64 = await ImageProcessor.blobToBase64(profile.avatarBlob);
          } catch (e) {
            console.warn('Erro ao converter avatar para Base64:', e);
          }
        }
        if (profile.bannerBlob) {
          try {
            bannerBase64 = await ImageProcessor.blobToBase64(profile.bannerBlob);
          } catch (e) {
            console.warn('Erro ao converter banner para Base64:', e);
          }
        }
        const { avatarBlob, bannerBlob, ...restProfile } = profile;
        exportedProfile = {
          ...restProfile,
          avatarBase64,
          bannerBase64,
        };
      }

      const backupData = {
        app: 'CubeLab',
        schemaVersion: 2,
        exportedAt: new Date().toISOString(),
        sessions,
        solves,
        settings,
        profile: exportedProfile,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cubelab-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Erro ao exportar JSON:', e);
    }
  };

  // Exportar CSV
  const handleExportCsv = async () => {
    try {
      const solves = await db.solves.where('sessionId').equals(activeSessionId).sortBy('createdAt');
      const headers = ['#', 'Tempo (s)', 'Penalidade', 'Tempo Efetivo (s)', 'Scramble', 'Data', 'Inspeção (s)', 'Nota'];

      const rows = solves.map((s, idx) => [
        idx + 1,
        (s.timeMs / 1000).toFixed(2),
        s.penalty,
        s.penalty === 'dnf' ? 'DNF' : (s.effectiveTimeMs / 1000).toFixed(2),
        `"${s.scramble.replace(/"/g, '""')}"`,
        `"${new Date(s.createdAt).toISOString()}"`,
        s.inspectionMs ? (s.inspectionMs / 1000).toFixed(1) : '',
        `"${(s.note || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cubelab-solves-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Erro ao exportar CSV:', e);
    }
  };

  // Importar arquivo (JSON CubeLab ou csTimer)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let importedCount = 0;

      // Tenta parse JSON
      const json = JSON.parse(text);

      // Caso 1: Backup nativo CubeLab (schemaVersion: 1 ou 2)
      if (json.app === 'CubeLab' && Array.isArray(json.solves)) {
        if (Array.isArray(json.sessions)) {
          for (const s of json.sessions as SessionRecord[]) {
            await db.sessions.put(s);
          }
        }
        if (json.settings) {
          await db.settings.put(json.settings as UserSettingsRecord);
        }
        if (json.profile) {
          const p = json.profile;
          let avatarBlob: Blob | undefined = undefined;
          let bannerBlob: Blob | undefined = undefined;
          if (p.avatarBase64) {
            try {
              avatarBlob = await ImageProcessor.base64ToBlob(p.avatarBase64);
            } catch (e) {
              console.warn('Erro ao converter Base64 para avatarBlob:', e);
            }
          }
          if (p.bannerBase64) {
            try {
              bannerBlob = await ImageProcessor.base64ToBlob(p.bannerBase64);
            } catch (e) {
              console.warn('Erro ao converter Base64 para bannerBlob:', e);
            }
          }
          const { avatarBase64, bannerBase64, ...restProfile } = p;
          await db.profiles.put({
            ...restProfile,
            avatarBlob,
            bannerBlob,
          });
          await useProfileStore.getState().loadProfile();
        }
        for (const solve of json.solves as SolveRecord[]) {
          await db.solves.put(solve);
          importedCount++;
        }
      }
      // Caso 2: Formato export do csTimer
      else if (json.properties || json.session1) {
        // csTimer armazena sessões com chave session1, session2 ou objeto com propriedades
        const currentSession = activeSessionId;
        const sessionKeys = Object.keys(json).filter(k => k.startsWith('session'));

        for (const sKey of sessionKeys) {
          const rawSolves = json[sKey];
          if (Array.isArray(rawSolves)) {
            for (const item of rawSolves) {
              // Estrutura do item csTimer: [[penalty, timeMs], scramble, comment, timestamp]
              if (Array.isArray(item) && item.length >= 2) {
                const [timeInfo, scramble, comment, ts] = item;
                const penaltyCode = Array.isArray(timeInfo) ? timeInfo[0] : 0;
                const timeMs = Array.isArray(timeInfo) ? timeInfo[1] : 0;

                let penalty: 'none' | 'plus2' | 'dnf' = 'none';
                if (penaltyCode === 2000) penalty = 'plus2';
                else if (penaltyCode === -1) penalty = 'dnf';

                const effectiveTimeMs = penalty === 'dnf' ? Infinity : penalty === 'plus2' ? timeMs + 2000 : timeMs;

                const solveRecord: SolveRecord = {
                  id: `cstimer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  sessionId: currentSession,
                  createdAt: typeof ts === 'number' && ts > 0 ? ts * 1000 : Date.now(),
                  timeMs,
                  effectiveTimeMs,
                  penalty,
                  scramble: typeof scramble === 'string' ? scramble : '',
                  scrambleSource: 'random',
                  note: typeof comment === 'string' && comment.length > 0 ? comment : undefined,
                };

                await db.solves.put(solveRecord);
                importedCount++;
              }
            }
          }
        }
      } else {
        throw new Error('Formato de arquivo não reconhecido.');
      }

      await loadSessions();
      await loadSolvesForSession(activeSessionId);

      setImportStatus({
        success: true,
        message: `Importação concluída com sucesso! ${importedCount} solves importadas.`,
      });
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: `Falha na importação: ${err?.message || 'Arquivo corrompido ou formato inválido.'}`,
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-cube-surface2 border border-cube-border rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scaleUp">
        <div className="flex items-center justify-between pb-3 border-b border-cube-border">
          <h3 className="text-lg font-bold text-white">Exportar & Importar Dados</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-cube-textMuted hover:text-white hover:bg-cube-surface3"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Mensagem de status */}
          {importStatus && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                importStatus.success
                  ? 'bg-cube-green/10 border-cube-green/30 text-cube-green'
                  : 'bg-cube-red/10 border-cube-red/30 text-cube-red'
              }`}
            >
              {importStatus.success ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}

          {/* Seção Exportar */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-cube-textDim mb-2">
              Exportar
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportJson}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-cube-surface1 hover:bg-cube-surface3 border border-cube-border text-xs font-semibold text-white transition-colors"
              >
                <Download className="w-4 h-4 text-cube-cyan" />
                <span>Backup JSON</span>
              </button>

              <button
                onClick={handleExportCsv}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-cube-surface1 hover:bg-cube-surface3 border border-cube-border text-xs font-semibold text-white transition-colors"
              >
                <FileText className="w-4 h-4 text-cube-cyan" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Seção Importar */}
          <div className="pt-3 border-t border-cube-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cube-textDim mb-2">
              Importar Backup ou csTimer
            </h4>
            <p className="text-xs text-cube-textMuted mb-3">
              Suporta arquivos de backup <strong>CubeLab (.json)</strong> e exportações do <strong>csTimer</strong>.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,.txt"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-cube-surface1 hover:bg-cube-cyan hover:text-cube-bg border border-cube-border text-xs font-bold text-cube-cyan transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Selecionar Arquivo para Importar</span>
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end pt-3 border-t border-cube-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-cube-surface3 hover:bg-cube-surface1 text-white"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
