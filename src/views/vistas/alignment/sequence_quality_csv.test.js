import {generateEditableTable as generateHIVTable} from '../HIV/editableTable';
import {generateEditableTable as generateHBVTable} from '../HBV/editableTable';
import {generateEditableTable as generateHCVTable} from '../HCV/editableTable';
import {makeCSV} from '../download';
import {csvParse} from '../../../utils/csv';

jest.mock('icosa/utils/download', () => ({makeZip: jest.fn()}), {virtual: true});

test.each([
  ['HIV', generateHIVTable],
  ['HBV', generateHBVTable],
  ['HCV', generateHCVTable]
])('%s descriptive data CSV contains the sequence quality columns', (virus, generateTable) => {
  const geneName = virus === 'HCV' ? 'NS3' : 'RT';
  const isolate = {
    IsolateID: 'sample',
    genes: {
      [geneName]: {
        alignment: {gene_AA_range: '1-2'},
        DRMs: {RTI: []},
        stops: 'W2*'
      }
    },
    subtype: '1a',
    genotype: '1a',
    inputAmbiguityCounts: {nCount: 2, otherAmbiguousCount: 1},
    initialGeneAlignments: []
  };
  const description = {
    organism: virus,
    cloneMethod: 'None',
    seqMethod: 'Sanger',
    country: 'USA',
    isolateDate: '2026',
    isolationSource: 'plasma'
  };
  const [row] = csvParse(makeCSV(generateTable([isolate], {}, description)) + '\n');

  expect(row['Frameshift positions']).toBe('');
  expect(row.Stops).toBe(`${geneName}: W2*\n`);
  expect(row).not.toHaveProperty('Stop codon positions (AA before correction)');
  expect(row['N nucleotide count']).toBe('2');
  expect(row['Non-N ambiguous nucleotide count']).toBe('1');
  expect(row['AA positions with N']).toBe('');
  expect(row).not.toHaveProperty('Critical warning');
});
