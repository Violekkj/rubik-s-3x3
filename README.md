# CubeLab 3x3 Speedcubing PWA

> Cronômetro WCA, estatísticas avançadas e biblioteca de algoritmos CFOP para o Cubo Mágico 3×3 — Progressive Web App offline-first.

[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tests](https://img.shields.io/badge/testes-103%20passando-22c55e)](tests/)
[![Algoritmos](https://img.shields.io/badge/algoritmos-144%20validados-06b6d4)](src/data/algorithms/)

---

## ✨ Funcionalidades

### ⏱️ Cronômetro WCA
- Tempo de inspeção de 15s com alertas de voz (pt-BR) e bipes aos 8s e 12s
- Penalidades automáticas: **+2** (15–17s) e **DNF** (≥17s) — Regra WCA A3
- Suporte a teclado (Espaço) e toque (touch-action: manipulation)
- Edição manual de tempo e scramble pós-solve

### 🎲 Scramble Profissional
- Integração com [`cubing/scramble`](https://github.com/cubing/cubing.js) (TNoodle random-state WCA)
- Buffer de 3 scrambles pré-carregados
- Visualização 2D planificada em cruz (U-L-F-R-B-D) com adesivos vibrantes

### 📊 Histórico & Sessões
- Persistência offline com **Dexie.js (IndexedDB)**
- Tabela com ordenação, busca, filtros e seleção múltipla
- Exportação/importação JSON, CSV e suporte a backup do **csTimer**

### 👤 Perfil & PBs
- PBs de Single, Ao5 e Ao12 com data e botão "Ver solves"
- Tabela **Atual vs Melhor**: Single, Ao5, Ao12, Ao30, Ao50 e Ao100
- Chips dos últimos 20 tempos

### 📈 Estatísticas
- Tempo total resolvendo (formato `Xh YYmin ZZs`)
- Histograma de distribuição de tempos (Recharts)
- Gráfico de evolução de médias
- Heatmap de consistência (84 dias)

### 📚 Biblioteca de Algoritmos CFOP (destaque)
| Conjunto | Casos | Validação |
|---|---|---|
| PLL | 21 | ✅ simulação + AUF + rotações y |
| 2-Look PLL | 6 | ✅ simulação |
| OLL | 57 | ✅ simulação + AUF |
| 2-Look OLL | 9 | ✅ simulação |
| F2L | 41 | ✅ notação |
| Método Iniciante | 10 | ✅ notação |

- Diagrama 2D SVG de cada caso (modo LL e Cruz completa)
- Copiar notação, espelhar LR, marcar favorito
- Ciclo de status de aprendizado: Não aprendi → Aprendendo → Sei → Dominado
- Modo **Treino Flashcards** com auto-avaliação
- Busca, filtros por status e grupo morfológico
- Guia de notação WCA embutido (R/U/F, ', 2, w, M/E/S, x/y/z, AUF)

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | Vite 6 + React 18 + TypeScript 5 (strict) |
| Estilização | Tailwind CSS 4 + Design tokens HSL customizados |
| Estado | Zustand 5 |
| Banco de dados | Dexie.js (IndexedDB, offline-first) |
| Scramble | `@nissy-dev/nx-ts-lib` / `cubing/scramble` (WCA TNoodle) |
| Gráficos | Recharts |
| Testes | Vitest (103 testes) |
| PWA | `vite-plugin-pwa` + Workbox |
| Ícones | Lucide React |

---

## 🚀 Como executar

### Pré-requisitos
- Node.js ≥ 20
- npm ≥ 10

```bash
# Instalar dependências
npm install

# Desenvolvimento local (http://localhost:5173)
npm run dev

# Executar testes unitários
npm test

# Validar todos os algoritmos matematicamente
npm run validate:algs

# Build de produção PWA
npm run build
```

---

## 🗂️ Arquitetura do Projeto

```
src/
├── core/
│   ├── cube/           # Modelo puro de 54 facelets + MoveParser
│   │   ├── CubeState.ts       # Grupo de 54 facelets com álgebra de grupo
│   │   ├── moveParser.ts      # Parser WCA, inversão, espelho LR
│   │   └── types.ts
│   ├── timer/          # Máquina de estados do cronômetro WCA
│   └── stats/          # Cálculo de médias WCA (Ao5, Ao12, Ao30, Ao50, Ao100)
│
├── data/
│   ├── algorithms/     # Datasets JSON curados + validador + tipos
│   └── db.ts           # Schema Dexie (solves, sessions, settings)
│
├── features/
│   ├── timer/          # TimerDisplay, CubeNetView, PostSolveToolbar, modais
│   ├── history/        # SolveHistoryTable, SolveDetailModal, ExportImportModal
│   ├── profile/        # ProfileView com PBs e tabela Atual vs Melhor
│   ├── stats/          # StatsView com Recharts e heatmap
│   └── algorithms/     # AlgorithmsView, AlgCaseCard, AlgCaseNetView,
│                       # AlgSetSelector, TrainingFlashcards
│
├── hooks/              # useAudioCues (Web Audio API + SpeechSynthesis pt-BR)
├── stores/             # Zustand: timerStore, sessionStore, solveStore,
│                       # settingsStore, algProgressStore
└── styles/             # designTokens.css, index.css
```

---

## 🧪 Testes

```
tests/
├── core/
│   ├── cubeState.test.ts       # Álgebra de grupos: X⁴=I, X·X'=I, Sune, T-Perm, Superflip
│   ├── timerStateMachine.test.ts  # FSM: todas as transições e penalidades WCA
│   ├── averageCalculator.test.ts  # Médias aparadas WCA com DNF e +2
│   └── algValidator.test.ts    # 79 casos de algoritmos validados matematicamente
```

**Total: 103 testes | 4 suítes | 0 falhas**

---

## 📖 Documentação Adicional

- [`docs/ALGORITHM_SOURCES.md`](docs/ALGORITHM_SOURCES.md) — Fontes, metodologia e notas técnicas de todos os algoritmos

---

## 📜 Licença

MIT — Uso livre para fins educacionais e pessoais.

---

*Construído com ❤️ para a comunidade brasileira de speedcubing.*
