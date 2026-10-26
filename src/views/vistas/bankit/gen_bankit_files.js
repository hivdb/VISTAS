import {virusToFullName} from "../viruses";

export default function genBankItFiles(
    isolates, descriptions, buildNote, AdjustIsolateGene,
    sortByGeneName, DRM_GENE_FULLNAME
  ) {

  isolates = mapDescription(isolates, descriptions);

  isolates = isolates.reduce((acc, isolate) => {
    return [...acc, ...AdjustIsolateGene(isolate)];
  }, []);

  const sequences = [];
  const features = [];

  // console.log(isolates);

  isolates.sort(sortByGeneName).forEach((isolate) => {
    const description = getIsolateDescHeader(isolate, buildNote);

    if (!description) {
      return;
    }

    sequences.push({
      header: `>${isolate.IsolateID} ${description}`,
      sequence: isolate.GenBankSeq,
      Isolate: isolate.IsolateID
    });

    features.push(...updateFeatureTable(isolate, sortByGeneName, DRM_GENE_FULLNAME));
    return;
  });

  return [sequences, features];
}

function mapDescription(isolates, descriptions) {

  descriptions = descriptions.reduce((group, item) => {
    const {IsolateID} = item;
    group[IsolateID] = item;
    return group;
  }, {});

  isolates.forEach((iso) => {
    iso.description = descriptions[iso.IsolateID];
  });

  return isolates;
}


function getIsolateDescHeader(isolate, buildNote) {

  const mod = isolate.description;

  if (!mod) {
    return null;
  }

  // TODO, modify before this function, after merge editTable module
  if (mod['Source'] === 'PBMC') {
    mod['Source'] = 'Peripheral blood mononuclear cells';
  }

  mod['Organism'] = (mod.Organism in virusToFullName) ? virusToFullName[mod.Organism] : mod.Organism;

  let description = {
    'Collection_date': formatDate(mod['Year']),
    Country: mod['Country'],
    Organism: mod.Organism,
    Host: mod.Host,
    Isolate: isolate.IsolateID,
    'Isolation Source': mod['Source']
  };

  const subtypeKeys = ['Genotype', 'Subtype', 'Group'];
  subtypeKeys.forEach((key) => {
    if (key in mod) {
      description[key] = mod[key] || isolate.subtype;
    }
  });

  if (mod.CloneID) {
    description.Clone = mod.CloneID;
  }

  const note = buildNote(mod);
  if (note) {
    description.note = note;
  }

  let descList = [];

  Object.entries(description).forEach(
    ([key, value]) => {
      descList.push(`[${key}=${value}]`);
    }
  );

  return descList.join(' ');
}


function formatDate(collectDate) {
  if (collectDate.length === 4) {
    return collectDate;
  }

  const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = collectDate.match(regex);
  let year = match[1];
  let month = match[2] - 1;
  let day = match[3];

  let date = new Date(year, month, day);
  day = String(date.getDate()).padStart(2, '0');
  month = date.toLocaleString('default', {month: 'short'});
  year = date.getFullYear();
  return `${day}-${month}-${year}`;
}


function updateFeatureTable(isolate, sortByGeneName, DRM_GENE_FULLNAME) {
  const feature = [`>Feature ${isolate.IsolateID}`];
  const isolateSeqLength = isolate.GenBankSeq.length;

  Object.keys(isolate.genes).sort(sortByGeneName)
    .forEach((geneName, idx) => {
      const gene = isolate.genes[geneName];

      if (gene.missing) {
        feature.push(...featureAssemblyGaps(gene.adjustedNATailing));
        return;
      }

      if (gene.ignoreFeature) {
        return;
      }

      if (!isolate.use_full_genome) {
        feature.push(...featureGene(gene, isolateSeqLength));
      }

      if (gene.alignment.AdjustedfirstNA) {
        feature.push(...featureGaps(gene));
      }

      if (isNonFunctional(gene)) {
        feature.push(...featureNonFunctional(gene, isolateSeqLength, DRM_GENE_FULLNAME));
      } else {
        feature.push(...featureCDs(gene, isolateSeqLength, DRM_GENE_FULLNAME));
      }

      if (
        gene.NAgaps_tailing_exists &&
        (!isolate.near_full_length) &&
        (idx < (Object.keys(isolate.genes).length - 1))) {
        feature.push(...featureAssemblyGaps(gene.adjustedNATailing));
      }

    });

  feature.push('');

  return feature;
}

function featureGene(gene, isolateSeqLength) {
  const feature = [];
  if (gene.alignment.firstNA > gene.alignment.lastNA) {
    feature.push([
      `${gene.alignment.AdjustedfirstNA || gene.alignment.firstNA}`,
      `${isolateSeqLength}`,
      'gene'
    ].join('\t'));
    feature.push([
      `1`,
      `${gene.alignment.AdjustedlastNA || gene.alignment.lastNA}`,
    ].join('\t'));
  } else {
    feature.push([
      `<${gene.alignment.AdjustedfirstNA || gene.alignment.firstNA}`,
      `>${gene.alignment.AdjustedlastNA || gene.alignment.lastNA}`,
      'gene'
    ].join('\t'));
  }

  feature.push([
    '',
    '',
    '',
    'gene',
    gene.geneName
  ].join('\t'));

  return feature;
}


function featureGaps(gene) {
  const feature = [];

  let gapList = gene.AdjustedNAgaps || [];

  gapList = gapList
    .slice()
    .sort((a, b) => a[0] - b[0])
    .reduce((merged, [start, stop, gapL]) => {
      const lastGap = merged[merged.length - 1];

      if (lastGap && lastGap[1] + 1 === start) {
        lastGap[1] = stop;
        lastGap[2] += gapL;
      } else {
        merged.push([start, stop, gapL]);
      }

      return merged;
    }, []);

  gapList.map(([start, stop, gapL]) => {
    feature.push([
      `${start}`,
      `${stop}`,
      'gap'
    ].join('\t'));

    feature.push([
      '',
      '',
      '',
      'estimated_length',
      `${gapL}`
    ].join('\t'));

    return null;
  });

  return feature;
}

function featureAssemblyGaps(tailing_gap) {
  const feature = [];

  const [start, stop, gapL] = tailing_gap;

  feature.push([
    `<${start}`,
    `>${stop}`,
    'misc_feature'
  ].join('\t'));

  feature.push([
    '',
    '',
    '',
    'note',
    `gap, estimated length, ${gapL} base pairs`
  ].join('\t'));

  return feature;
}


function isNonFunctional(gene) {
  if (gene.stops.length > 0 || (!gene.alignment.translatable)) {
    return true;
  } else {
    return false;
  }
}

function featureNonFunctional(gene, isolateSeqLength, DRM_GENE_FULLNAME) {
  const feature = [];
  if (gene.alignment.firstNA > gene.alignment.lastNA) {
    feature.push([
      `${gene.alignment.AdjustedfirstNA || gene.alignment.firstNA}`,
      `${isolateSeqLength}`,
      'misc_feature'
    ].join('\t'));
    feature.push([
      `1`,
      `${gene.alignment.AdjustedlastNA || gene.alignment.lastNA}`,
    ].join('\t'));
  } else {
    feature.push([
      `<${gene.alignment.AdjustedfirstNA || gene.alignment.firstNA}`,
      `>${gene.alignment.AdjustedlastNA || gene.alignment.lastNA}`,
      'misc_feature'
    ].join('\t'));
  }

  const productName = (gene.geneName in DRM_GENE_FULLNAME) ? DRM_GENE_FULLNAME[gene.geneName] : gene.geneName;
  feature.push([
    '',
    '',
    '',
    'note',
    (`nonfunctional ${productName}` +
      ` due to mutation;`)
  ].join('\t'));

  return feature;
}


function featureCDs(gene, isolateSeqLength, DRM_GENE_FULLNAME) {

  const feature = [];

  if (gene.alignment.firstNA > gene.alignment.lastNA) {
    // For loop genome
    feature.push([
      `${gene.alignment.AdjustedfirstNA || gene.alignment.firstNA}`,
      `${isolateSeqLength}`,
      'CDS'
    ].join('\t'));
    feature.push([
      `1`,
      `${gene.alignment.AdjustedlastNA || gene.alignment.lastNA}`,
    ].join('\t'));
  } else {
    feature.push([
      `<${gene.alignment.AdjustedfirstNA || gene.alignment.firstNA}`,
      `>${gene.alignment.AdjustedlastNA || gene.alignment.lastNA}`,
      'CDS'
    ].join('\t'));
  }


  feature.push([
    '',
    '',
    '',
    'gene',
    gene.geneName
  ].join('\t'));

  const numHeadingDel = gene.alignment['aligned_NA_heading'];
  const start = gene.alignment['aligned_NA_heading_pos'] - numHeadingDel;

  feature.push([
    '', '', '', 'codon_start', `${start}`
  ].join('\t'));

  const productName = (gene.geneName in DRM_GENE_FULLNAME) ? DRM_GENE_FULLNAME[gene.geneName] : gene.geneName;

  feature.push([
    '', '', '', 'product', productName
  ].join('\t'));

  feature.push([
    '', '', '', 'transl_table', '1'
  ].join('\t'));

  return feature;
}
