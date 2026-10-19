# ALGORITHM SOURCES — CubeLab 3x3

## Metodologia de Curadoria

Todos os algoritmos incluídos na biblioteca do CubeLab foram selecionados com base nos seguintes critérios:

1. **Popularidade na comunidade**: Rankings baseados em dados de uso real no SpeedCubeDB e fóruns do SpeedSolving.
2. **Validação matemática**: Cada algoritmo é simulado no modelo de 54 facelets via `npm run validate:algs` e deve resolver o caso correspondente (103 testes, 79 casos).
3. **Fontes primárias verificadas**: Apenas URLs reais e acessíveis, sem geração de links fictícios.
4. **Contagem HTM exata**: Movimentos de face = 1, fatias (M, E, S) = 2, rotações (x, y, z) = 0.

---

## Fontes Principais

### J Perm (jperm.net)
- **URL**: https://jperm.net/algs/pll
- **URL OLL**: https://jperm.net/algs/oll
- **URL F2L**: https://jperm.net/algs/f2l
- **URL Iniciante**: https://jperm.net/3x3
- Dylan Wang (J Perm) é uma das referências mais respeitadas da comunidade speedcubing. Seus algoritmos são usados por campeões mundiais e são consistentemente ranqueados como os mais ergonômicos e rápidos.
- Acessado: outubro de 2026

### SpeedCubeDB (speedcubedb.com)
- **URL PLL**: https://speedcubedb.com/a/3x3/PLL
- **URL OLL**: https://speedcubedb.com/a/3x3/OLL
- **URL F2L**: https://speedcubedb.com/a/3x3/F2L
- Banco de dados comunitário com rankings de popularidade baseados em uso real por speedcubers intermediários e avançados. Excelente para identificar algoritmos alternativos populares.
- Acessado: outubro de 2026

### CubeSkills (cubeskills.com)
- **URL**: https://cubeskills.com
- Plataforma de Felix Zemdegs (múltiplo campeão mundial). Cursos e algoritmos recomendados para speedcubers de alto nível.
- Acessado: outubro de 2026

### SpeedSolving Wiki
- **URL PLL**: https://www.speedsolving.com/wiki/index.php/PLL
- **URL OLL**: https://www.speedsolving.com/wiki/index.php/OLL
- Wiki colaborativa da maior comunidade de speedcubing do mundo. Referência histórica e técnica para nomenclatura padrão (A-Perm, T-Perm, etc.).
- Acessado: outubro de 2026

---

## Conjuntos de Algoritmos

### PLL — Permutation Last Layer (`cfop-pll.json`)
- **Casos**: 21 (Ua, Ub, H, Z, Aa, Ab, E, F, Ga, Gb, Gc, Gd, Ja, Jb, Na, Nb, Ra, Rb, T, V, Y)
- **Validação**: Cada algoritmo é testado com todas as combinações de pré-AUF (U/U'/U2), pós-AUF e rotações de cubo y/y'/y2 — `isSolvedAnyOrientation()` deve retornar `true`.
- **Fontes primárias**: J Perm, SpeedCubeDB, SpeedSolving Wiki

### 2-Look PLL (`2look-pll.json`)
- **Casos**: 6 (Ua, Ub, Z, H, Aa, Ja — subconjunto de PLL para iniciantes/intermediários)
- **Objetivo**: Resolver PLL em 2 passos máximos
- **Fontes**: J Perm, SpeedCubeDB

### OLL — Orientation Last Layer (`cfop-oll.json`)
- **Casos**: 57 (conjunto completo OLL 1-57)
- **Validação**: Algoritmo deve orientar todos os 9 adesivos da face U, preservar F2L (camadas L e D intactas).
- **Fontes primárias**: J Perm, SpeedCubeDB, SpeedSolving Wiki
- **Grupos**: Ponto, Linha, Ângulo, T-Shape, Cruz, Cantos, P-Shape, C-Shape, W-Shape, S-Shape, Peixe, L-Shape, Setas

### 2-Look OLL (`2look-oll.json`)
- **Casos**: 9 (subconjunto para resolver OLL em 2 passos: orientar arestas + orientar cantos)
- **Objetivo**: Método mais eficiente para intermediários
- **Fontes**: J Perm, SpeedCubeDB

### F2L — First Two Layers (`cfop-f2l.json`)
- **Casos**: 41 (casos básicos e avançados de inserção de pares)
- **Validação**: Verificação de notação válida (F2L usa intuição; os algoritmos são sequências de referência, não o único caminho)
- **Fontes**: J Perm, SpeedCubeDB
- **Grupos**: Pares Básicos, Pares Separados, Cantos Orientados Errados, Arestas Orientadas Erradas, Casos Especiais

### Método Iniciante (`beginner.json`)
- **Casos**: 10 (passos do método de camadas: Cruz Branca, Cantos 1ª camada, Arestas 2ª camada, OLL Básico, PLL Básico)
- **Objetivo**: Guia passo a passo para iniciantes aprenderem a resolver o cubo
- **Fontes**: J Perm (jperm.net/3x3), CuboVelocidade

---

## Notas Técnicas

### Contagem HTM (Half Turn Metric)
Padrão oficial WCA para contar movimentos:
- Rotações de face (R, U, F, L, D, B, R', U2, etc.) = **1 movimento**
- Fatias centrais (M, E, S e suas variantes) = **2 movimentos** (equivalente a dois giros de face)
- Rotações do cubo inteiro (x, y, z) = **0 movimentos** (não afetam o estado do cubo)
- Wide moves (Rw, Uw, r, u) = **1 movimento** (move 2 camadas, mas conta como 1 HTM)

### Nomenclatura
- Algoritmos em notação WCA padrão.
- Apóstrofo (`'`) indica sentido anti-horário.
- `2` indica meia volta (180°).

### Validação Automática
Execute `npm run validate:algs` para re-validar todos os algoritmos a qualquer momento.
O script usa o motor de grupo puro de 54 facelets (`CubeState.ts`) sem dependências externas.
