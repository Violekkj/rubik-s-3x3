# Changelog — CubeLab 3x3

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

## [2.0.0] - Rodada 2: Correções de UX/Bugs e Novo Perfil Personalizável

### 🎯 Modo Foco / Tela Cheia
- Adicionado botão permanente de saída no canto superior direito (36px, ícone Minimize/X, tooltip "Sair (Esc)").
- Botão fica translúcido e não responde a cliques durante a solve (`isTimerRunning`), evitando toques acidentais.
- Tecla ESC sai da tela cheia sem interromper solve em andamento, sincronizada com o evento nativo `fullscreenchange`.
- Fallback em CSS fixo (`position: fixed; inset: 0`) para iOS e navegadores sem suporte à Fullscreen API.

### ⏱️ Cronômetro e HUD Compactos
- Cronômetro redimensionado com `clamp(3rem, 8vw, 5rem)` normal e até `clamp(4rem, 14vw, 9rem)` no modo foco.
- Adicionada configuração de escala do cronômetro: Pequeno (0.75x), Médio (1.0x) e Grande (1.3x).
- Scramble HUD compactado para ≤ 64px, botões 28×28px em linha única.
- Visualização do cubo 2D colapsável (~220px).
- Encaixe sem rolagem vertical em telas 1366×768 e 1440×900.

### 🔔 Inspeção WCA e Áudio
- Removido completamente o uso da Web Speech API (`speechSynthesis`).
- Bipes do Web Audio (880 Hz senoidal com fade de 15ms) perfeitamente alinhados aos números exibidos no contador regressivo: 8 (t=7000ms) e 2 (t=13000ms).
- Slider de volume (0 a 100%, padrão 25%) com botão de teste nas Configurações.
- Penalidade automática de +2 ao atingir 15,000s decorridos.
- DNF automático ao atingir 17,000s decorridos com toast informativo e ação de "Desfazer".

### 🛑 Ciclo de Solve
- Solucionado reinício automático acidental: lockout de 300ms ignorando eventos de liberação da tecla/toque que parou o timer.
- Limpeza rigorosa do estado e timers de inspeção ao salvar tentativa.

### 🧩 Diagramas e Cards de Algoritmos
- Topo 100% AMARELO em todos os casos (PLL, OLL, 2-Look, Iniciante).
- 12 barrinhas laterais com cores reais da última camada para todos os casos de PLL, correspondentes à referência visual.
- OLL com topo amarelo para peças orientadas e cinza escuro para desorientadas; F2L com projeção isométrica.
- Cards responsivos sem cortes usando `container-type: inline-size` e rodapé em `flex-wrap`.
- Botão "Ver N algs" em acordeão inline retrátil, exibindo cada variação com HTM, cópia e pré-visualização.
- Texto de reconhecimento com truncamento em 2 linhas e botão "ver mais".

### 👤 Novo Perfil Personalizável
- Banner (3:1) e Avatar circular sobreposto com anel de destaque.
- Recorte de imagens client-side com canvas (Avatar 512×512, Banner 1500×500) em formato WebP comprimido (q=0.85) e orientação EXIF.
- Nickname validado, bio de 280 caracteres, país, método, cubo principal, ano de início.
- WCA ID com validação regex e link oficial para o site da WCA.
- Links para redes sociais com `rel="noopener noreferrer"`.
- PBs de Single, Ao5, Ao12 e Ao50/Ao100 com alternância entre Automático, Manual e Melhor.
- Seção "Outros Eventos" para registro manual de categorias oficiais adicionais.
- Metas com barra de progresso e conquistas/badges automáticas.
- Exportação do Cartão do Perfil como imagem PNG em alta resolução (1200×630).
- Backup e Restauração JSON com inclusão das fotos do perfil em Base64.

### 💻 Abertura Local no Windows
- Criado `Abrir-CubeLab.bat` para inicialização com 1 clique no Windows com abertura automática do navegador.
- Adicionada tela de ajuda responsiva em `index.html` caso o arquivo seja aberto diretamente via `file:///`.

---

## [1.0.0] - Rodada 1: Lançamento Inicial
- Cronômetro WCA com inspeção.
- Scramble profissional com cubing.js.
- Persistência com Dexie.js (IndexedDB).
- Estatísticas analíticas e gráficos Recharts.
- Biblioteca de algoritmos CFOP com 144 casos.
