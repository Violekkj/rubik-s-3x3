import { UserProfileRecord } from '../../data/db';

export async function exportProfileCardPng(
  profile: UserProfileRecord,
  avatarImgUrl: string | null,
  bannerImgUrl: string | null,
  stats: {
    totalSolves: number;
    totalTimeFormatted: string;
    bestSingleDisplay: string;
    bestAo5Display: string;
    bestAo12Display: string;
  }
): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630; // Aspect ratio clássico para compartilhamento 1200x630
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Fundo Geral
  ctx.fillStyle = '#0b0f19';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Banner Superior (altura 240px)
  if (bannerImgUrl) {
    try {
      const bannerImg = await loadImage(bannerImgUrl);
      ctx.drawImage(bannerImg, 0, 0, 1200, 240);
    } catch {
      drawGradientBanner(ctx);
    }
  } else {
    drawGradientBanner(ctx);
  }

  // Gradiente escuro sobre o banner
  const bannerGrad = ctx.createLinearGradient(0, 120, 0, 240);
  bannerGrad.addColorStop(0, 'rgba(11, 15, 25, 0)');
  bannerGrad.addColorStop(1, 'rgba(11, 15, 25, 1)');
  ctx.fillStyle = bannerGrad;
  ctx.fillRect(0, 120, 1200, 120);

  // 3. Avatar Circular com Anel de Borda (centro em x=140, y=240, raio=80)
  ctx.save();
  ctx.beginPath();
  ctx.arc(140, 240, 84, 0, Math.PI * 2);
  ctx.fillStyle = '#0b0f19';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = profile.accentColor || '#06b6d4';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(140, 240, 80, 0, Math.PI * 2);
  ctx.clip();

  if (avatarImgUrl) {
    try {
      const avatarImg = await loadImage(avatarImgUrl);
      ctx.drawImage(avatarImg, 60, 160, 160, 160);
    } catch {
      drawFallbackAvatar(ctx, profile.nick);
    }
  } else {
    drawFallbackAvatar(ctx, profile.nick);
  }
  ctx.restore();

  // 4. Nick e Nome
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Inter, sans-serif';
  ctx.fillText(`@${profile.nick}`, 250, 280);

  if (profile.name) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 20px Inter, sans-serif';
    ctx.fillText(profile.name, 250, 312);
  }

  // Bio
  if (profile.bio) {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'normal 18px Inter, sans-serif';
    const lines = wrapText(ctx, profile.bio, 900);
    lines.slice(0, 2).forEach((line, i) => {
      ctx.fillText(line, 80, 380 + i * 26);
    });
  }

  // 5. Grid de Cards de Destaque dos PBs (Single, Ao5, Ao12)
  const pbs = [
    { label: 'SINGLE PB', value: stats.bestSingleDisplay, color: '#06b6d4' },
    { label: 'AO5 PB', value: stats.bestAo5Display, color: '#3b82f6' },
    { label: 'AO12 PB', value: stats.bestAo12Display, color: '#10b981' },
    { label: 'TOTAL SOLVES', value: String(stats.totalSolves), color: '#f59e0b' },
  ];

  const cardW = 240;
  const cardH = 110;
  const startX = 80;
  const startY = 460;
  const gap = 24;

  pbs.forEach((pb, i) => {
    const x = startX + i * (cardW + gap);
    const y = startY;

    // Card background
    ctx.fillStyle = '#161e2e';
    ctx.beginPath();
    ctx.roundRect(x, y, cardW, cardH, 16);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(pb.label, x + 20, y + 36);

    // Value
    ctx.fillStyle = pb.color;
    ctx.font = 'bold 32px monospace';
    ctx.fillText(pb.value, x + 20, y + 80);
  });

  // Marca d'água CubeLab
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.fillText('CubeLab 3x3 Speedcubing PWA', 80, 600);

  // Trigger Download
  const link = document.createElement('a');
  link.download = `cubelab-${profile.nick}-profile.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function drawGradientBanner(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, 1200, 240);
  grad.addColorStop(0, '#0284c7');
  grad.addColorStop(0.5, '#4338ca');
  grad.addColorStop(1, '#312e81');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 240);
}

function drawFallbackAvatar(ctx: CanvasRenderingContext2D, nick: string) {
  const grad = ctx.createLinearGradient(60, 160, 220, 320);
  grad.addColorStop(0, '#06b6d4');
  grad.addColorStop(1, '#3b82f6');
  ctx.fillStyle = grad;
  ctx.fillRect(60, 160, 160, 160);

  ctx.fillStyle = '#0b0f19';
  ctx.font = 'extrabold 64px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(nick.charAt(0).toUpperCase() || 'C', 140, 240);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}
