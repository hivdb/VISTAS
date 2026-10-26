export const REPORT_FOLDER = 'Alignment_before_frameshift_correction';
export const FINAL_REPORT_FOLDER = 'Frameshift_stop_codon_report';

const CODON_SLOT = 4;
const RULER_STEP = 10;

const STYLE = `
  body {
    margin: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #1f2328;
    background: #fff;
  }
  h1 { font-size: 1.4rem; }
  h2 { font-size: 1.1rem; margin-top: 2rem; }
  .legend span { margin-right: 1rem; }
  table.report { border-collapse: collapse; font-size: 0.9rem; }
  table.report th, table.report td {
    border: 1px solid #d0d7de;
    padding: 4px 8px;
    text-align: left;
    vertical-align: top;
  }
  table.report th { background: #f6f8fa; }
  .scroll { overflow-x: auto; border: 1px solid #d0d7de; }
  table.aln { border-collapse: collapse; }
  table.aln td, table.aln th {
    font-family: Menlo, Consolas, monospace;
    font-size: 12px;
    white-space: pre;
    padding: 1px 8px 1px 0;
    font-weight: normal;
    text-align: left;
  }
  table.aln .id {
    position: sticky;
    left: 0;
    background: #fff;
    padding: 1px 8px;
    border-right: 1px solid #d0d7de;
  }
  table.aln tr:target .id { background: #fff8c5; }
  .ruler { color: #57606a; }
  .uncovered { color: #afb8c1; }
  .fs { background: #ffd8b5; }
  .stop { background: #ffc1c0; }
  .fs.stop { background: #e5a3ff; }
`;

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getRowAnchor(index) {
  return `isolate-${index + 1}`;
}

function makeRuler(geneLength) {
  let ruler = '';
  for (let pos = 1; pos <= geneLength; pos += 1) {
    const label = (pos === 1 || pos % RULER_STEP === 0) ? String(pos) : '';
    ruler += label.padEnd(CODON_SLOT);
  }
  return ruler;
}

// Render one sequence codon by codon, highlighting frameshift and stop codon
// positions and dimming the region outside the aligned range.
function makeAlignmentLine({
  alignedNAs, firstAA, lastAA, frameShifts, stopCodons
}) {
  const fsByPos = frameShifts.reduce((acc, fs) => {
    acc[fs.position] = [...(acc[fs.position] || []), fs.text];
    return acc;
  }, {});
  const stopByPos = stopCodons.reduce((acc, stop) => {
    acc[stop.position] = [...(acc[stop.position] || []), stop.text];
    return acc;
  }, {});

  const numCodons = alignedNAs.length / 3;
  const parts = [];
  for (let pos = 1; pos <= numCodons; pos += 1) {
    const codon = alignedNAs.slice(pos * 3 - 3, pos * 3);
    const classes = [];
    const titles = [];
    if (pos < firstAA || pos > lastAA) {
      classes.push('uncovered');
    }
    if (fsByPos[pos]) {
      classes.push('fs');
      titles.push(`Frameshift: ${fsByPos[pos].join(', ')}`);
    }
    if (stopByPos[pos]) {
      classes.push('stop');
      titles.push(`Stop codon: ${stopByPos[pos].join(', ')}`);
    }
    titles.unshift(`Codon ${pos}`);
    parts.push(
      classes.length > 0 ?
        `<span class="${classes.join(' ')}" title="${escapeHTML(
          titles.join('; ')
        )}">${codon}</span>` :
        codon
    );
  }
  return parts.join(' ');
}

const REPORT_TYPES = {
  initial: {
    title: 'alignment before frameshift correction',
    note: `Codon and frameshift insertions are not shown in the alignment;
    inserted bases are listed in the Frameshifts column.`
  },
  final: {
    title: 'frameshift and stop codon report',
    note: `The alignment and report are after frameshift correction:
    frameshift insertions are removed and frameshift deletions are filled
    with N, so no frameshifts are expected.
    Codon insertions are not shown in the alignment.`
  }
};

// Min and max DRM position per gene, e.g. {NS3: [36, 175]}.
export function getDRMRanges(drmList) {
  return Object.entries(drmList).reduce((acc, [gene, drms]) => {
    const positions = Object.keys(drms).map(Number);
    acc[gene] = [Math.min(...positions), Math.max(...positions)];
    return acc;
  }, {});
}

// "Yes"/"No" when the row has frameshifts, blank otherwise.
function getFrameshiftInDRMRange(frameShifts, [start, end]) {
  if (frameShifts.length === 0) {
    return '';
  }
  return frameShifts.some(
    ({position}) => position >= start && position <= end
  ) ? 'Yes' : 'No';
}

export function makeGeneReportHTML(
  gene, rows, type = 'initial', drmRange = null
) {
  const {title, note} = REPORT_TYPES[type];
  const geneLength = Math.max(...rows.map((row) => row.alignedNAs.length / 3));
  const withIssues = rows.filter(
    (row) => row.frameShifts.length > 0 || row.stopCodons.length > 0
  ).length;

  const joinField = (items, key) => escapeHTML(
    items.map((item) => item[key]).join(', ')
  );
  const reportRows = rows.map((row, index) => `
      <tr>
        <td>
          <a href="#${getRowAnchor(index)}">${escapeHTML(row.IsolateID)}</a>
        </td>
        <td>${row.firstAA}-${row.lastAA}</td>
        <td>${joinField(row.frameShifts, 'position')}</td>
        <td>${joinField(row.frameShifts, 'text')}</td>${drmRange ? `
        <td>${getFrameshiftInDRMRange(row.frameShifts, drmRange)}</td>` : ''}
        <td>${joinField(row.stopCodons, 'position')}</td>
        <td>${joinField(row.stopCodons, 'text')}</td>
      </tr>`).join('');

  const alignmentRows = rows.map((row, index) => `
      <tr id="${getRowAnchor(index)}">
        <th class="id">${escapeHTML(row.IsolateID)}</th>
        <td>${makeAlignmentLine(row)}</td>
      </tr>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHTML(gene)} ${title}</title>
<style>${STYLE}</style>
</head>
<body>
  <h1>${escapeHTML(gene)}: ${title}</h1>
  <p>
    ${rows.length} sequence(s); ${withIssues} with frameshifts or stop codons.
    Positions are amino acid positions in the ${escapeHTML(gene)} reference.
    ${note}
  </p>

  <h2>Report</h2>
  <table class="report">
    <thead>
      <tr>
        <th>IsolateID</th>
        <th>AA range</th>
        <th>Frameshift positions (AA)</th>
        <th>Frameshifts</th>${drmRange ? `
        <th>Frameshift in DRM range (AA ${drmRange[0]}-${drmRange[1]})</th>` : ''}
        <th>Stop codon positions (AA)</th>
        <th>Stop codons</th>
      </tr>
    </thead>
    <tbody>${reportRows}
    </tbody>
  </table>

  <h2>Alignment</h2>
  <p class="legend">
    <span class="fs">&nbsp;NNN&nbsp;</span>frameshift
    <span class="stop">&nbsp;NNN&nbsp;</span>stop codon
    <span class="uncovered">---</span>not covered
  </p>
  <div class="scroll">
    <table class="aln">
      <thead>
        <tr>
          <th class="id">Position</th>
          <th class="ruler">${makeRuler(geneLength)}</th>
        </tr>
      </thead>
      <tbody>${alignmentRows}
      </tbody>
    </table>
  </div>
</body>
</html>
`;
}

// Group per-gene Sierra alignments stored in `field` by gene, keeping only
// genes that are part of the final isolate.
export function groupGeneAlignmentsByGene(isolates, field) {
  return isolates.reduce((acc, isolate) => {
    (isolate[field] || []).forEach((geneAlignment) => {
      if (!(geneAlignment.gene in (isolate.genes || {}))) {
        return;
      }
      acc[geneAlignment.gene] = acc[geneAlignment.gene] || [];
      acc[geneAlignment.gene].push({
        IsolateID: isolate.IsolateID,
        ...geneAlignment
      });
    });
    return acc;
  }, {});
}

function makeGeneReportFiles(isolates, field, type, folder, drmRanges) {
  const byGene = groupGeneAlignmentsByGene(isolates, field);

  return Object.entries(byGene).map(([gene, rows]) => ({
    folder,
    fileName: `${gene}.html`,
    mediaType: 'text/html',
    data: makeGeneReportHTML(gene, rows, type, drmRanges[gene] || null)
  }));
}

export function makeInitialAlignmentFiles(isolates, drmRanges = {}) {
  // Step 1 zips these alone, so the zip's own folder is the report folder.
  const field = 'initialGeneAlignments';
  return makeGeneReportFiles(isolates, field, 'initial', undefined, drmRanges);
}

export function makeFinalReportFiles(isolates, drmRanges = {}) {
  const field = 'finalGeneAlignments';
  const folder = FINAL_REPORT_FOLDER;
  return makeGeneReportFiles(isolates, field, 'final', folder, drmRanges);
}
