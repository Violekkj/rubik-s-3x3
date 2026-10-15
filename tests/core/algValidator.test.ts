import { describe, it, expect } from 'vitest';
import pllCases from '../../src/data/algorithms/cfop-pll.json';
import twoLookPllCases from '../../src/data/algorithms/2look-pll.json';
import twoLookOllCases from '../../src/data/algorithms/2look-oll.json';
import ollCases from '../../src/data/algorithms/cfop-oll.json';
import f2lCases from '../../src/data/algorithms/cfop-f2l.json';
import beginnerCases from '../../src/data/algorithms/beginner.json';
import { AlgValidator } from '../../src/data/algorithms/validator';
import { AlgorithmCase } from '../../src/data/algorithms/types';

function runTestSuiteForSet(setName: string, cases: AlgorithmCase[]) {
  describe(`AlgValidator — ${setName} (${cases.length} Casos)`, () => {
    for (const item of cases) {
      describe(`Caso: ${item.name} (${item.id})`, () => {
        const reports = AlgValidator.validateCase(item);

        for (let i = 0; i < reports.length; i++) {
          const report = reports[i];
          it(`Alg #${i + 1} (${item.algs[i].label}) deve ter notação e HTM válidos e resolver o caso`, () => {
            if (!report.isValid) {
              console.error(`Falha no caso ${report.caseId}: ${report.error}`);
            }
            expect(report.isValid, `Erro no algoritmo ${report.algNotation}: ${report.error}`).toBe(true);
            expect(report.actualHTM).toBe(report.expectedHTM);
          });
        }
      });
    }
  });
}

runTestSuiteForSet('PLL Oficial', pllCases as AlgorithmCase[]);
runTestSuiteForSet('2-Look PLL', twoLookPllCases as AlgorithmCase[]);
runTestSuiteForSet('2-Look OLL', twoLookOllCases as AlgorithmCase[]);
runTestSuiteForSet('OLL CFOP', ollCases as AlgorithmCase[]);
runTestSuiteForSet('F2L CFOP', f2lCases as AlgorithmCase[]);
runTestSuiteForSet('Método Iniciante', beginnerCases as AlgorithmCase[]);
