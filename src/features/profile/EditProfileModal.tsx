import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Check,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { UserProfileRecord } from '../../data/db';
import { useProfileStore } from '../../stores/profileStore';
import { ImageProcessor } from './imageProcessor';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COUNTRIES = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
  { code: 'ES', name: 'Espanha', flag: '🇪🇸' },
  { code: 'FR', name: 'França', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemanha', flag: '🇩🇪' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CO', name: 'Colômbia', flag: '🇨🇴' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'JP', name: 'Japão', flag: '🇯🇵' },
  { code: 'AU', name: 'Austrália', flag: '🇦🇺' },
  { code: 'OTHER', name: 'Outro', flag: '🌍' },
];

const PRESET_GRADIENTS = [
  { id: 'cyan-blue', label: 'Ciano & Azul', class: 'from-cyan-600 via-blue-700 to-indigo-900' },
  { id: 'purple-pink', label: 'Roxo & Magenta', class: 'from-purple-700 via-pink-700 to-rose-900' },
  { id: 'emerald-teal', label: 'Esmeralda & Verde', class: 'from-emerald-600 via-teal-700 to-slate-900' },
  { id: 'sunset-orange', label: 'Sunset & Laranja', class: 'from-amber-600 via-orange-600 to-red-800' },
  { id: 'midnight-dark', label: 'Carbon & Noite', class: 'from-slate-800 via-slate-900 to-black' },
];

const ACCENT_COLORS = [
  { hex: '#06b6d4', name: 'Ciano' },
  { hex: '#3b82f6', name: 'Azul' },
  { hex: '#10b981', name: 'Esmeralda' },
  { hex: '#8b5cf6', name: 'Violeta' },
  { hex: '#f59e0b', name: 'Âmbar' },
  { hex: '#f43f5e', name: 'Rosa' },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    profile,
    avatarUrl,
    bannerUrl,
    updateProfile,
    setAvatarBlob,
    setBannerBlob,
  } = useProfileStore();

  const [form, setForm] = useState<UserProfileRecord>({ ...profile });
  const [nickError, setNickError] = useState<string | null>(null);
  const [wcaError, setWcaError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Estados locais para recorte de avatar e banner
  const [avatarZoom] = useState(1);
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(profile.avatarBlob || null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(avatarUrl);

  const [pendingBannerBlob, setPendingBannerBlob] = useState<Blob | null>(profile.bannerBlob || null);
  const [pendingBannerPreview, setPendingBannerPreview] = useState<string | null>(bannerUrl);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setForm({ ...profile });
      setPendingAvatarBlob(profile.avatarBlob || null);
      setPendingAvatarPreview(avatarUrl);
      setPendingBannerBlob(profile.bannerBlob || null);
      setPendingBannerPreview(bannerUrl);
      setNickError(null);
      setWcaError(null);
      setImageError(null);
    }
  }, [isOpen, profile, avatarUrl, bannerUrl]);

  if (!isOpen) return null;

  // Validação do Nickname
  const handleNickChange = (val: string) => {
    const clean = val.replace(/\s+/g, '');
    setForm(prev => ({ ...prev, nick: clean }));

    if (clean.length < 2 || clean.length > 24) {
      setNickError('O nick deve ter entre 2 e 24 caracteres.');
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(clean)) {
      setNickError('Apenas letras, números, sublinhado (_), hífen (-) e ponto (.).');
    } else {
      setNickError(null);
    }
  };

  // Validação do WCA ID
  const handleWcaChange = (val: string) => {
    const clean = val.toUpperCase().trim();
    setForm(prev => ({ ...prev, wcaId: clean }));

    if (clean && !/^\d{4}[A-Z]{4}\d{2}$/.test(clean)) {
      setWcaError('Formato inválido. Exemplo: 2023SILV01 (4 dígitos, 4 letras, 2 dígitos).');
    } else {
      setWcaError(null);
    }
  };

  // Upload do Avatar
  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = ImageProcessor.validateFile(file);
    if (!validation.valid) {
      setImageError(validation.error || 'Arquivo de imagem inválido.');
      return;
    }

    try {
      setImageError(null);
      const processedBlob = await ImageProcessor.processImage(file, 512, 512, {
        x: 0,
        y: 0,
        zoom: avatarZoom,
      });
      setPendingAvatarBlob(processedBlob);
      if (pendingAvatarPreview && pendingAvatarPreview !== avatarUrl) {
        URL.revokeObjectURL(pendingAvatarPreview);
      }
      setPendingAvatarPreview(URL.createObjectURL(processedBlob));
    } catch (err) {
      setImageError('Erro ao processar imagem do avatar.');
    }
  };

  // Upload do Banner
  const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = ImageProcessor.validateFile(file);
    if (!validation.valid) {
      setImageError(validation.error || 'Arquivo de imagem inválido.');
      return;
    }

    try {
      setImageError(null);
      const processedBlob = await ImageProcessor.processImage(file, 1500, 500);
      setPendingBannerBlob(processedBlob);
      if (pendingBannerPreview && pendingBannerPreview !== bannerUrl) {
        URL.revokeObjectURL(pendingBannerPreview);
      }
      setPendingBannerPreview(URL.createObjectURL(processedBlob));
    } catch (err) {
      setImageError('Erro ao processar imagem do banner.');
    }
  };

  const handleRemoveAvatar = () => {
    setPendingAvatarBlob(null);
    if (pendingAvatarPreview && pendingAvatarPreview !== avatarUrl) {
      URL.revokeObjectURL(pendingAvatarPreview);
    }
    setPendingAvatarPreview(null);
  };

  const handleRemoveBanner = () => {
    setPendingBannerBlob(null);
    if (pendingBannerPreview && pendingBannerPreview !== bannerUrl) {
      URL.revokeObjectURL(pendingBannerPreview);
    }
    setPendingBannerPreview(null);
  };

  const handleSave = async () => {
    if (nickError || wcaError) return;
    if (!form.nick.trim()) {
      setNickError('O nickname é obrigatório.');
      return;
    }

    // Salva blobs no store
    if (pendingAvatarBlob !== profile.avatarBlob) {
      await setAvatarBlob(pendingAvatarBlob);
    }
    if (pendingBannerBlob !== profile.bannerBlob) {
      await setBannerBlob(pendingBannerBlob);
    }

    await updateProfile({
      nick: form.nick.trim(),
      name: form.name?.trim() || '',
      bio: form.bio?.trim() || '',
      country: form.country || 'BR',
      city: form.city?.trim() || '',
      method: form.method || 'CFOP',
      mainCube: form.mainCube?.trim() || '',
      cubingSince: form.cubingSince || '',
      wcaId: form.wcaId?.trim() || '',
      socialLinks: form.socialLinks,
      accentColor: form.accentColor,
      bannerGradient: form.bannerGradient,
    });

    onClose();
  };

  const remainingBioChars = 280 - (form.bio?.length || 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-0 md:p-4 overflow-y-auto">
      <div className="bg-cube-surface2 border border-cube-border w-full max-w-2xl h-full md:h-auto md:max-h-[90vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scaleUp">
        {/* Top Header com Botão Fechar */}
        <div className="flex items-center justify-between p-4 border-b border-cube-border bg-cube-surface1/80 backdrop-blur-md flex-shrink-0">
          <h2 className="text-base font-extrabold text-white">Editar Perfil</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-cube-textMuted hover:text-white hover:bg-cube-surface2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {imageError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/40 border border-red-700/60 text-red-200 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{imageError}</span>
            </div>
          )}

          {/* Pré-visualização ao vivo do Banner e Avatar */}
          <div>
            <label className="block text-xs font-bold text-cube-textDim uppercase tracking-wider mb-2">
              Banner & Foto de Perfil (Pré-visualização ao Vivo)
            </label>
            <div className="relative rounded-2xl overflow-hidden border border-cube-border shadow-md">
              {/* Banner Area (3:1) */}
              <div
                className={`w-full h-32 md:h-44 relative bg-cover bg-center ${
                  !pendingBannerPreview ? `bg-gradient-to-r ${form.bannerGradient || 'from-cyan-600 to-blue-800'}` : ''
                }`}
                style={pendingBannerPreview ? { backgroundImage: `url(${pendingBannerPreview})` } : {}}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                {/* Botões de Ação do Banner */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold border border-white/20 transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Trocar Banner</span>
                  </button>
                  {pendingBannerPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveBanner}
                      title="Remover banner personalizado"
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-white text-xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleBannerFile}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Avatar Sobreposto */}
              <div className="absolute -bottom-2 left-4 md:left-6 flex items-end gap-3 z-10">
                <div className="relative group">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-cube-surface2 overflow-hidden bg-cube-surface1 shadow-xl flex items-center justify-center">
                    {pendingAvatarPreview ? (
                      <img
                        src={pendingAvatarPreview}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-cube-cyan to-blue-600 flex items-center justify-center text-cube-bg font-extrabold text-2xl">
                        {form.nick?.charAt(0).toUpperCase() || 'C'}
                      </div>
                    )}
                  </div>

                  {/* Botão de upload sobre o avatar */}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    title="Trocar foto de perfil"
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="text-xs font-semibold text-cube-cyan hover:underline"
                    >
                      Trocar foto
                    </button>
                    {pendingAvatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Galeria de Gradientes para Banner (quando sem foto) */}
            {!pendingBannerPreview && (
              <div className="mt-3">
                <span className="text-[11px] text-cube-textDim block mb-1.5">
                  Ou escolha um padrão gradiente:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_GRADIENTS.map(grad => (
                    <button
                      key={grad.id}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, bannerGradient: grad.class }))}
                      className={`h-7 px-3 rounded-lg text-[10px] font-bold text-white bg-gradient-to-r ${grad.class} border transition-all ${
                        form.bannerGradient === grad.class
                          ? 'border-white scale-105 shadow-md'
                          : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                    >
                      {grad.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Campos Principais: Nick e Nome */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-cube-textDim mb-1">
                Nickname <span className="text-cube-red">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-cube-textDim text-sm font-semibold">@</span>
                <input
                  type="text"
                  value={form.nick}
                  onChange={e => handleNickChange(e.target.value)}
                  placeholder="speedcuber"
                  maxLength={24}
                  className="w-full bg-cube-surface1 border border-cube-border rounded-xl pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cube-cyan"
                />
              </div>
              {nickError && (
                <p className="text-[11px] text-red-400 mt-1">{nickError}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-cube-textDim mb-1">
                Nome Completo (Opcional)
              </label>
              <input
                type="text"
                value={form.name || ''}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Lucas Silva"
                className="w-full bg-cube-surface1 border border-cube-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cube-cyan"
              />
            </div>
          </div>

          {/* Bio com Contador de Caracteres */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-cube-textDim">Bio</label>
              <span className={`text-[11px] ${remainingBioChars < 20 ? 'text-orange-400' : 'text-cube-textDim'}`}>
                {remainingBioChars} restantes
              </span>
            </div>
            <textarea
              rows={3}
              value={form.bio || ''}
              onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
              maxLength={280}
              placeholder="Fale um pouco sobre sua jornada no speedcubing..."
              className="w-full bg-cube-surface1 border border-cube-border rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cube-cyan resize-none leading-relaxed"
            />
          </div>

          {/* País, Cidade, Método e Cubo Principal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-cube-textDim mb-1">País</label>
              <select
                value={form.country || 'BR'}
                onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))}
                className="w-full bg-cube-surface1 border border-cube-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cube-cyan"
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-cube-textDim mb-1">Cidade</label>
              <input
                type="text"
                value={form.city || ''}
                onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Ex: São Paulo"
                className="w-full bg-cube-surface1 border border-cube-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cube-cyan"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cube-textDim mb-1">Método Principal</label>
              <select
                value={form.method || 'CFOP'}
                onChange={e => setForm(prev => ({ ...prev, method: e.target.value }))}
                className="w-full bg-cube-surface1 border border-cube-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cube-cyan"
              >
                <option value="CFOP">CFOP (Fridrich)</option>
                <option value="Roux">Roux</option>
                <option value="ZZ">ZZ</option>
                <option value="Petrus">Petrus</option>
                <option value="Iniciante">Método Básico / Em Camadas</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-cube-textDim mb-1">Cubo Principal (Main)</label>
              <input
                type="text"
                value={form.mainCube || ''}
                onChange={e => setForm(prev => ({ ...prev, mainCube: e.target.value }))}
                placeholder="Ex: MoYu RS3M V5 Ball-Core"
                className="w-full bg-cube-surface1 border border-cube-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cube-cyan"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cube-textDim mb-1">Cubando desde</label>
              <input
                type="month"
                value={form.cubingSince || ''}
                onChange={e => setForm(prev => ({ ...prev, cubingSince: e.target.value }))}
                className="w-full bg-cube-surface1 border border-cube-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cube-cyan"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cube-textDim mb-1">
                WCA ID (Opcional)
              </label>
              <input
                type="text"
                value={form.wcaId || ''}
                onChange={e => handleWcaChange(e.target.value)}
                placeholder="Ex: 2023SILV01"
                maxLength={10}
                className="w-full bg-cube-surface1 border border-cube-border rounded-xl px-3 py-2 text-sm font-mono uppercase text-white focus:outline-none focus:border-cube-cyan"
              />
              {wcaError && (
                <p className="text-[11px] text-red-400 mt-1">{wcaError}</p>
              )}
            </div>
          </div>

          {/* Links Sociais */}
          <div className="pt-3 border-t border-cube-border">
            <label className="block text-xs font-bold text-cube-textDim uppercase tracking-wider mb-2">
              Redes Sociais
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-cube-textDim block mb-1">YouTube URL:</span>
                <input
                  type="url"
                  value={form.socialLinks?.youtube || ''}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, youtube: e.target.value },
                    }))
                  }
                  placeholder="https://youtube.com/@seucanal"
                  className="w-full bg-cube-surface1 border border-cube-border rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <span className="text-cube-textDim block mb-1">Instagram URL:</span>
                <input
                  type="url"
                  value={form.socialLinks?.instagram || ''}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, instagram: e.target.value },
                    }))
                  }
                  placeholder="https://instagram.com/seuperfil"
                  className="w-full bg-cube-surface1 border border-cube-border rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <span className="text-cube-textDim block mb-1">Discord:</span>
                <input
                  type="text"
                  value={form.socialLinks?.discord || ''}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, discord: e.target.value },
                    }))
                  }
                  placeholder="Username ou tag"
                  className="w-full bg-cube-surface1 border border-cube-border rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <span className="text-cube-textDim block mb-1">Website / Linktree:</span>
                <input
                  type="url"
                  value={form.socialLinks?.website || ''}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, website: e.target.value },
                    }))
                  }
                  placeholder="https://seusite.com"
                  className="w-full bg-cube-surface1 border border-cube-border rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Cor de Destaque */}
          <div className="pt-3 border-t border-cube-border">
            <label className="block text-xs font-bold text-cube-textDim uppercase tracking-wider mb-2">
              Cor de Destaque do Perfil
            </label>
            <div className="flex items-center gap-3">
              {ACCENT_COLORS.map(col => (
                <button
                  key={col.hex}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, accentColor: col.hex }))}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: col.hex }}
                  title={col.name}
                >
                  {form.accentColor === col.hex && <Check className="w-4 h-4 text-black stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé com Salvar e Cancelar */}
        <div className="p-4 border-t border-cube-border bg-cube-surface1/90 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-cube-textMuted hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!!nickError || !!wcaError}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-cube-cyan text-cube-bg hover:bg-cube-cyanGlow disabled:opacity-50 transition-all shadow-lg shadow-cube-cyanGlow/20"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};
