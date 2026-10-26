import easlDrmList from './genes_drm_easl.json';
import easlExtendDrmList from './genes_drm_easl_extend.json';

export const DRM_GENES = [
  'NS3',
  'NS5A_NTD',
  'NS5B'
];

export const DRM_GENE_FULLNAME = {
  'CORE': 'core protein',
  'E1': 'envelope protein E1',
  'E2': 'envelope protein E2',
  'P7': 'protein p7',
  'NS2': 'nonstructural protein NS2',
  'NS3': 'protease/helicase protein NS3',
  'NS4A': 'nonstructural protein NS4A',
  'NS4B': 'nonstructural protein NS4B',
  'NS5A': 'nonstructural protein NS5A',
  'NS5A_NTD': 'nonstructural protein NS5A N-terminal domain',
  'NS5A_CTD': 'nonstructural protein NS5A C-terminal domain',
  'NS5B': 'RNA-dependent RNA polymerase NS5B',
  'F': 'protein F'
};

export const GENES2DRUGCLASSES = {
  'NS3': ['NS3_I'],
  'NS5A_NTD': ['NS5A_I'],
  'NS5B': [
    'NI',
    'NNI'
  ]
};

const NS5B_1a_DRMs = {
  159: 'F',
  282: 'GRT',
  320: 'IFV',
  321: 'A',
};

const NS5B_1b_DRMs = {
  159: 'F',
  282: 'GRT',
  316: 'FHN',
  321: 'I',
};

const NS5B_2_DRMs = {
  159: 'F',
  282: 'GRT',
};

const NS5B_3_DRMs = {
  150: 'V',
  159: 'F',
  206: 'E',
  282: 'GRT',
  321: 'A'
};

const NS5B_4_DRMs = {
  282: 'CGRT',
  321: 'A',
};

const NS5B_5_DRMs = {
  282: 'GRT',
};

const NS5B_6_DRMs = {
  282: 'GRT',
};


const NS5A_1a_DRMs = {
  24: 'EQRT',
  26: 'E',
  28: 'AGSTV',
  29: 'R',
  30: 'CDEGHKLNRTY#',
  31: 'IFMPV',
  32: 'LS#',
  38: 'F',
  58: 'CDLPR',
  92: 'KT',
  93: 'CFHLNRSTW'
};

const NS5A_1b_DRMs = {
  24: 'K',
  28: 'AMT',
  29: 'S#',
  30: 'GHPQS',
  31: 'FIMVW',
  32: 'FLS#',
  58: 'ADLSRT',
  62: 'D',
  92: 'EKTV',
  93: 'CHNRST'
};

const NS5A_2_DRMs = {
  24: 'AS',
  28: 'CS',
  29: 'S',
  30: 'HS',
  31: 'IMV',
  92: 'RSTW',
  93: 'FNH'
};

const NS5A_3_DRMs = {
  24: 'F',
  28: 'TK',
  30: 'DEKS',
  31: 'FIMPV',
  62: 'L',
  92: 'K',
  93: 'HNS'
};

const NS5A_4_DRMs = {
  28: 'MSTV',
  30: 'FGHRS',
  31: 'IV',
  58: 'APS',
  93: 'CHNSRW'
};

const NS5A_5_DRMs = {
  28: 'I',
  30: 'H',
  31: 'FIV',
  32: 'L',
};

const NS5A_6_DRMs = {
  24: 'H',
  28: 'AILMTV',
  30: 'EHNS',
  31: 'IMV',
  32: 'ALQRS',
  58: 'AGHNS',
  92: 'T',
  93: 'AHNS'
};

const NS3_1a_DRMs = {
  36: 'ACFGLM',
  41: 'R',
  43: 'ILSV',
  54: 'AS',
  55: 'I',
  56: 'H',
  80: 'KLR',
  122: 'GNR',
  155: 'GIKMQSTVW',
  156: 'GPSTV',
  158: 'I',
  168: 'ACEFGHIKLNQRTVY',
  170: 'TV',
};

const NS3_1b_DRMs = {
  36: 'ACGLM',
  41: 'R',
  43: 'ISV',
  54: 'ACGS',
  55: 'A',
  56: 'HLF',
  80: 'HKLR',
  122: 'ADGINRT',
  155: 'CGIKLQMSTW',
  156: 'GPSTV',
  158: 'I',
  168: 'ACEFGHIKLNQTVY',
  170: 'ALT',
  175: 'L'
};

const NS3_2_DRMs = {
  43: 'V',
  55: 'AI',
  56: 'HF',
  156: 'LMTV',
  168: 'AEFGHNSTVY',
};

const NS3_3_DRMs = {
  41: 'K',
  56: 'H',
  80: 'KR',
  155: 'K',
  156: 'GPTV',
  166: 'STY',
  168: 'HKLR'
};

const NS3_4_DRMs = {
  41: 'R',
  56: 'H',
  80: 'R',
  155: 'CK',
  156: 'GHKLSTV',
  168: 'AEGHTV',
};

const NS3_5_DRMs = {
  155: 'K',
  156: 'TV',
  168: 'AEHKRVY'
};

const NS3_6_DRMs = {
  36: 'I',
  41: 'KR',
  56: 'H',
  80: 'KQ',
  122: 'T',
  156: 'TV',
  168: 'AEGHVY',
  170: 'V',
};

const combineDRMsByPosition = (...drmLists) => {
  const combined = {};
  for (const drmList of drmLists) {
    for (const [position, aas] of Object.entries(drmList)) {
      combined[position] = [...new Set(`${combined[position] || ''}${aas}`.split(''))]
        .sort()
        .join('');
    }
  }
  return combined;
};

const NS5B_DRMs = combineDRMsByPosition(
  NS5B_1a_DRMs,
  NS5B_1b_DRMs,
  NS5B_2_DRMs,
  NS5B_3_DRMs,
  NS5B_4_DRMs,
  NS5B_5_DRMs,
  NS5B_6_DRMs
);

const NS5B_1_DRMs = combineDRMsByPosition(
  NS5B_1a_DRMs,
  NS5B_1b_DRMs
);

const NS5A_DRMs = combineDRMsByPosition(
  NS5A_1a_DRMs,
  NS5A_1b_DRMs,
  NS5A_2_DRMs,
  NS5A_3_DRMs,
  NS5A_4_DRMs,
  NS5A_5_DRMs,
  NS5A_6_DRMs
);

const NS5A_1_DRMs = combineDRMsByPosition(
  NS5A_1a_DRMs,
  NS5A_1b_DRMs
);

const NS3_1_DRMs = combineDRMsByPosition(
  NS3_1a_DRMs,
  NS3_1b_DRMs
);

const NS3_DRMs = combineDRMsByPosition(
  NS3_1a_DRMs,
  NS3_1b_DRMs,
  NS3_2_DRMs,
  NS3_3_DRMs,
  NS3_4_DRMs,
  NS3_5_DRMs,
  NS3_6_DRMs
);

export const DRM_LIST = {
  NS3: NS3_DRMs,
  NS5A_NTD: NS5A_DRMs,
  NS5B: NS5B_DRMs
};


export const EASL_DRM_LIST = easlDrmList;

export const EASL_EXTEND_DRM_LIST = easlExtendDrmList;
