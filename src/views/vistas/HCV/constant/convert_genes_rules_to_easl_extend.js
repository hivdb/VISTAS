const fs = require('fs');
const path = require('path');

const defaultInputPath = path.resolve(__dirname, 'genes_rules_20260521.csv');
const defaultOutputPath = path.resolve(__dirname, 'genes_drm_easl_extend.json');

const inputPath = path.resolve(process.argv[2] || defaultInputPath);
const outputPath = path.resolve(process.argv[3] || defaultOutputPath);

function parseCsvLine(line, expectedColumns) {
  const columns = line.replace(/\r$/, '').split(',');
  if (columns.length !== expectedColumns) {
    throw new Error(
      `Expected ${expectedColumns} columns but found ${columns.length}: ${line}`
    );
  }
  return columns;
}

function convertCsvToJson(csvText) {
  const lines = csvText.split('\n').filter((line) => line.trim() !== '');
  if (lines.length === 0) {
    throw new Error('Input CSV is empty.');
  }

  const header = parseCsvLine(lines[0], 9);
  const expectedHeader = [
    'method',
    'gene',
    'drug_class',
    'subtype',
    'position',
    'EASL Ref',
    'GenBank Ref',
    'Consensus',
    'mutations',
  ];

  if (header.join('|') !== expectedHeader.join('|')) {
    throw new Error(`Unexpected CSV header: ${header.join(',')}`);
  }

  const result = {};

  for (const line of lines.slice(1)) {
    const [, gene, , subtype, position, , , , mutations] = parseCsvLine(line, 9);
    const subtypeKey = `${gene}_${subtype}`;

    if (!result[subtypeKey]) {
      result[subtypeKey] = {};
    }

    result[subtypeKey][position] = mutations;
  }

  return result;
}

function main() {
  const csvText = fs.readFileSync(inputPath, 'utf8');
  const result = convertCsvToJson(csvText);
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);

  console.log(
    `Wrote ${Object.keys(result).length} subtype entries from ${path.basename(inputPath)} to ${path.basename(outputPath)}`
  );
}

main();
