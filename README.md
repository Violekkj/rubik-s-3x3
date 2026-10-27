# CubeLab 3x3 Speedcubing PWA

> Cronômetro WCA profissional, estatísticas analíticas, novo Perfil personalizável e biblioteca de algoritmos para o Cubo Mágico 3×3 — Progressive Web App offline-first.

[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tests](https://img.shields.io/badge/testes-113%20passando-22c55e)](tests/)
[![Algoritmos](https://img.shields.io/badge/algoritmos-144%20validados-06b6d4)](src/data/algorithms/)

---

## 🚀 Como Iniciar

### Opção 1: No Windows (1 Clique)
Basta dar **dois cliques** no arquivo:
```
⚡ Abrir-CubeLab.bat
```
Ele instalará as dependências caso necessário, iniciará o servidor local e abrirá o CubeLab automaticamente no seu navegador padrão (`http://127.0.0.1:5173/`).

> **Nota sobre o `index.html` local:** Como o CubeLab é uma aplicação PWA com banco de dados local (IndexedDB) e Web Workers para scrambles oficiais, os navegadores modernos (Brave, Chrome, Edge) bloqueiam módulos e armazenamento quando abertos via `file:///`. O iniciador `Abrir-CubeLab.bat` contorna isso perfeitamente criando um servidor local seguro.

### Opção 2: Via Terminal
```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Ou compilar e rodar a versão de produção
npm run build
npm run preview
```
Abra no navegador em `http://127.0.0.1:5173/`.

---

## ✨ O que há de novo na Rodada 2

### 1. 🎯 Modo Foco / Tela Cheia
- **Botão de saída permanente:** Botão de 36px no canto superior direito com tooltip e `aria-label`, translúcido durante a solve para evitar toques acidentais, reabilitado assim que o cronômetro para.
- **Sincronização com tecla ESC e Fullscreen API:** Monitoramento do evento `fullscreenchange` do navegador. Sair do modo foco nunca interrompe ou cancela uma tentativa em andamento.
- **Fallback para iOS/Safari:** Modo pseudo-tela cheia via CSS (`position: fixed; inset: 0`).

### 2. ⏱️ Cronômetro e HUD Compactos
- **Tipografia fluida:** Cronômetro redimensionado com `clamp(3rem, 8vw, 5rem)` no modo normal e até `clamp(4rem, 14vw, 9rem)` no modo foco.
- **Opção de tamanho:** Em Configurações, selecione entre Pequeno (0.75x), Médio (1.0x) e Grande (1.3x).
- **HUD do Scramble ultra-compacto (≤ 64px):** Botões de ação em formato ícone 28×28px (anterior, copiar, novo, editar) alinhados em linha única.
- **Preview 2D planificado colapsável:** Largura padrão de ~220px com botão de alternância suave.
- **Design sem rolagem vertical:** Em telas 1366×768 e 1440×900, a página inteira do cronômetro (scramble, timer, ao5/ao12, preview e últimas 5-8 solves) cabe sem qualquer scroll.

### 3. 🔔 Inspeção WCA Calibrada
- **Voz removida:** Eliminação completa da Web Speech API em prol de bipes sonoros de alta precisão.
- **Sincronização 100% com o display:** Contador regressivo de 15s (`ceil(restante / 1000)`). Bipes disparados no momento exato em que a tela exibe **8** (t=7000ms decorridos) e **2** (t=13000ms decorridos).
- **Áudio Web Audio API puro:** Oscilador senoidal a 880 Hz, 120 ms de duração, fade-in/out de 15 ms anti-estalo e controle de volume (padrão 25%) com botão de teste nas Configurações.
- **Penalidades automáticas WCA:**
  - Aos 15s decorridos: visor exibe "+2" em vermelho e a tentativa é registrada com penalidade `plus2`.
  - Aos 17s decorridos: visor exibe "DNF", inspeção é encerrada e a tentativa é registrada como `auto-DNF`, exibindo toast com botão "Desfazer".

### 4. 🛑 Parada Estável Sem Reinício Acidental
- Timer encerra a tentativa, salva uma única solve e permanece no estado `idle`.
- **Lockout de parada de 300ms:** O `keyup` ou `pointerup` do gesto que parou o cronômetro é descartado por tracking de evento, impedindo início falso da próxima inspeção.

### 5. 🧩 Algoritmos com Topo Amarelo e Cards Responsivos
- **Orientação de resolução:** Topo 100% AMARELO em todos os diagramas (PLL, OLL, 2-Look, Iniciante).
- **12 barrinhas laterais para PLL:** Reprodução fiel dos adesivos laterais da última camada correspondentes a cada caso.
- **OLL e F2L dedicados:** OLL com amarelo nas peças orientadas e cinza escuro nas demais; F2L com vista isométrica destacando o par/slot.
- **Cards sem cortes:** Container queries (`container-type: inline-size`), rodapé com `flex-wrap`, botões compactos 32×32px e botão de alternativas inline em acordeão sem corte de texto ou botões.

### 6. 👤 Novo Perfil Personalizável (100% Offline via IndexedDB)
- **Banner e Avatar:** Banner na proporção 3:1 e Avatar circular com anel de destaque. Recorte de imagem client-side (Avatar 512×512, Banner 1500×500, WebP q=0.85) com respeito à orientação EXIF.
- **Informações completas:** Nickname (2–24 caracteres válidos), bio (até 280 caracteres com contador), país com bandeira, método, cubo principal, data de início ("cubando desde"), link oficial da WCA ID (`^\d{4}[A-Z]{4}\d{2}$`), links sociais (YouTube, Instagram, TikTok, Discord, Website) e cor de destaque customizável.
- **PBs Editáveis:** Cards de Single, Ao5, Ao12 e Ao50/Ao100 com seletor Automático / Manual / O melhor dos dois.
- **Outros Eventos:** Registro manual para 2x2, 4x4, 5x5, 6x6, 7x7, OH, BLD, Megaminx, Pyraminx, Skewb, Square-1, Clock, FMC e Multi-Blind.
- **Metas e Conquistas:** Metas com barra de progresso automática e badges de conquistas (primeira solve, marcos de quantidade, marcas de tempo, dominância de algoritmos).
- **Exportação do Cartão:** Geração em 1 clique de imagem PNG em alta resolução (1200×630) do perfil para compartilhamento em redes sociais.
- **Backup Completo:** Exportação e restauração JSON contendo perfil, configurações, sessões, solves e imagens comprimidas em Base64.

---

## 🧪 Testes Automatizados

```bash
# Executar todos os 113 testes unitários
npm test

# Executar validação matemática de todos os algoritmos
npm run validate:algs

# Compilar para produção e verificar tipos
npm run build
```

---

## 📄 Licença
Distribuído sob a licença MIT. Algoritmos e padrões baseados nos regulamentos oficiais da [World Cube Association (WCA)](https://www.worldcubeassociation.org/regulations/).
