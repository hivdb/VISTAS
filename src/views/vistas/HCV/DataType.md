# HCV Report Data Types

This file summarizes internal HCV report objects and core decision rules for DRM and feature generation. It is not a dictionary for the user-edited descriptive-data CSV.

## 1. Per-isolate report object

This is the main processed object after sequence analysis is attached and genotyping is applied.

```js
{
  IsolateID,
  originalSeq,
  correctedSeq,
  frameshiftCorrections,
  initialGeneAlignments,
  finalGeneAlignments,
  inputAmbiguityCounts,
  virus,
  subtype,
  strain,
  genotype,
  genes,
  sequenceAnalysis
}
```

Fields:

- `IsolateID`: isolate identifier
- `originalSeq`: original nucleotide sequence; cleared when multiple gene records are merged into one isolate
- `correctedSeq`: nucleotide sequence after local frameshift correction of the Sierra alignment; also cleared for merged isolates
- `frameshiftCorrections`: audit details from the initial Sierra alignment
- `initialGeneAlignments`: per-gene initial (pre-correction) alignment in reference coordinates, with frameshifts and stop codons
- `finalGeneAlignments`: same shape as `initialGeneAlignments`, from the corrected alignment
- `inputAmbiguityCounts`: counts of ambiguous bases in the uploaded sequence
- `virus`: virus name
- `subtype`: subtype
- `strain`: strain display text
- `genotype`: genotype derived after genotyping
- `genes`: per-gene report objects keyed by gene name
- `sequenceAnalysis`: attached raw analysis object

## 2. `genes` object

```js
{
  [geneName]: PerGeneReportObject
}
```

Typical keys are `NS3`, `NS5A_NTD`, and `NS5B`.

## 3. Per-gene report object

```js
{
  geneName,
  geneOrder,
  mutations,
  DRMs,
  insertions,
  deletions,
  gaps,
  NAgaps_tailing,
  NAgaps_tailing_exists,
  AAgaps,
  NAgaps,
  stops,
  alignment
}
```

Important fields:

- `geneName`: gene name
- `mutations`: comma-separated mutation summary
- `DRMs`: final DRM string for the gene
- `insertions`: insertion summary
- `deletions`: comma-separated deleted amino-acid positions
- `AAgaps`: amino-acid gap blocks as `[start, stop, length]`
- `NAgaps`: nucleotide gap blocks as `[start, stop, length]`
- `gaps`: display version of `AAgaps`
- `NAgaps_tailing`: trailing nucleotide gap block
- `NAgaps_tailing_exists`: whether trailing gap exists
- `stops`: comma-separated stop-codon mutation summary
- `alignment`: nested alignment object

Gap rules:

- `deletions` comes from deletion mutations in the aligned gene.
- Consecutive deleted amino-acid positions are grouped into one gap block.
- `AAgaps` stores those amino-acid gap blocks.
- `NAgaps` converts each amino-acid gap block into nucleotide coordinates.
- `gaps` is just the display string version.
- `NAgaps_tailing` is the trailing uncovered region after the last aligned amino acid.

## 4. Nested alignment object

```js
{
  gene_AA_length,
  gene_NA_length,
  start_AA_pos,
  start_NA_pos,
  stop_AA_pos,
  stop_NA_pos,
  gene_AA_range,
  translatable,
  untrans_reason,
  trimmed_NA,
  aligned_NA,
  aligned_NA_heading,
  aligned_NA_heading_pos,
  aligned_NA_tailing,
  aligned_NA_tailing_pos,
  geneCut,
  firstNA,
  lastNA
}
```

Important rules:

- `gene_AA_length` comes from the reference gene length.
- `gene_NA_length = gene_AA_length * 3`.
- `geneCut` is the original sequence slice from `firstNA` to `lastNA`.
- `trimmed_NA` is the cleaned aligned nucleotide sequence for the gene.
- `start_*` and `stop_*` fields come from the aligned amino-acid positions.
- `aligned_NA` pads `trimmed_NA` to the full reference gene length.
- `translatable` is `0` when codon alignment is invalid or gap lengths break translation, and `1` otherwise.

## 5. DRM decision rules

There are two paths.

### General DRM rules

A mutation is called a DRM if either of these is true:

- it matches a hard-coded special rule
- it matches the general DRM lookup table for that gene and position

Special hard-coded rules exist mainly for:

- `NS3`: positions `36`, `56`, `80`, `166`, `168`, `175`
- `NS5A_NTD`: positions `24`, `28`, `30`, `31`, `58`, `93`

General lookup rules:

- if any residue in `mutAA` matches the lookup table at that position, call a DRM
- if `mutAA === "-"` and mode is not default and the lookup includes `refAA`, call a DRM
- if `mutAA === "Del"` and the lookup includes `#`, call a DRM

### EASL DRM rules

A mutation is called a DRM only if it matches the strict genotype-specific lookup table for that gene.

Rules:

- genotype is derived from subtype or strain
- the lookup key is built from gene name plus genotype
- if no strict table exists for that gene and genotype, no DRM is called
- deletion rule still uses `Del` plus `#`

### DRM output

Called DRMs are:

- formatted like `Q80K` or `D168Del`
- deduplicated
- sorted by position
- joined into the final `DRMs` string

## 6. Feature table calculation rules

Before features are created, the isolate may be adjusted:

- `NS5A_NTD` and `NS5A_CTD` can be merged into `NS5A`
- near-full-length sequences can be kept as one full sequence
- small DRM-gene submissions can be split into per-gene BankIt sequences
- adjusted coordinates and adjusted gaps are calculated for BankIt output

Per gene, feature generation follows these rules:

- if `gene.missing`, emit only an assembly-gap feature
- if `gene.ignoreFeature`, emit nothing
- if not full-genome mode, emit a `gene` feature
- if adjusted gaps exist, emit `gap` features
- if the gene has stop codons or is not translatable, emit a nonfunctional `misc_feature`
- otherwise emit a `CDS` feature
- if there is a trailing gap between genes in a non-near-full-length submission, emit an assembly-gap feature

Main feature types:

- `gene`: basic gene interval
- `gap`: internal estimated gap
- `CDS`: functional coding region
- `misc_feature`: nonfunctional gene or assembly gap

Full-genome rule:

- if the isolate is treated as full genome and all major genes are present, it can collapse into one `polyprotein` feature context instead of separate DRM-gene features
