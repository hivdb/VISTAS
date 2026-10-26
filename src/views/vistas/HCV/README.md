# HCV sequence processing and export

This document describes the HCV workflow after a user uploads a FASTA file and submits it for processing.

## Entry point

The upload flow starts in `step1.js`.

### `handleUploadSeq` in `step1.js`

- Reads the uploaded file from the file input.
- Verifies the file looks like text or gzip input.
- Uses `readFile(...)` to load the file contents.
- Trims the content and checks that it starts with `#` or `>`.
- Calls `appendUUIDToFastaHeaders(...)`.
- Calls `parseFasta(rawSequence, 'userinput', false)`.

### `appendUUIDToFastaHeaders` in `step1.js`

- Rewrites every FASTA header line.
- Appends a generated UUID-like suffix to the header text.
- This makes each uploaded sequence header unique inside the current session.

### `parseFasta` in `../fasta.js`

- Splits raw FASTA text into entries.
- Extracts `header`, `sequence`, and `size` for each record.
- Skips comment lines starting with `#`.
- Can mark duplicate headers with `-conflictN`, but upload flow disables that behavior by passing `false` as the third argument.

## Submit gate

The expensive downstream logic does not start on upload alone. It starts only after submit.

### `onSubmit` in `step1.js`

- Verifies at least one sequence exists.
- Checks whether any parsed header contains `conflict`.
- If validation fails, shows an alert and stops.
- If an `alignmentKey` already exists, reuses it and calls `onCompleteDownload(...)`.
- Otherwise continues into the processing flow.

### `ProcessSequence` render path in `step1.js`

- `ProcessSequence` from `process_seq.js` triggers the main sequence-processing pipeline after submit succeeds.

## Main processing pipeline

The main processing flow is implemented in `process_seq.js`.

### `Process` in `process_seq.js`

- React component that receives `sequences`, `onComplete`, and `mode`.
- Runs the internal async function `fetchData()`.

### `fetchData` inside `Process` in `process_seq.js`

- Processes uploaded sequences in batches of 20.
- Uses the Stanford HCV GraphQL endpoint at `https://hivdb.stanford.edu/hcv/graphql`.
- Performs alignment first, then validation, then isolate merge, then genotyping and DRM updates.
- Saves the final report through `BigData.save(...)`.
- Calls `onComplete(key)` when done.

## Alignment stage

### Alignment request from `process_seq.js`

- Calls `alignWithFrameshiftCorrection(...)`, which sends each batch to the HCV GraphQL alignment query in `query.graphql.js` through `Alignment(...)` in `../alignment/align.js`.
- Returns raw alignment and sequence analysis data.

### Frameshift correction (single Sierra alignment)

- Requests Sierra's per-gene `frameShifts`, `alignedNAs`, and `prettyPairwise` fields, and aligns each batch with Sierra only once.
- For genes with frameshifts, maps `prettyPairwise.alignedNAsLine` back onto the input sequence base by base (Sierra's `firstNA`/`lastNA` are not always exact), then:
  - removes frameshift-inserted bases (live Sierra leaves them out of `alignedNAsLine`);
  - fills bases missing from a partial codon with `N`;
  - keeps whole deleted codons (`---`) as deletions and keeps regular in-frame codon insertions.
- Rewrites the Sierra result to match the corrected sequence (sequence, gene `firstNA`/`lastNA`, `alignedNAsLine`, empty `frameShifts`), so the report, features and GenBank sequences all come from the same alignment.
- A gene whose codons cannot be mapped, or that overlaps another corrected gene, is left uncorrected and keeps its frameshifts.
- Keeps `originalSeq`, `correctedSeq`, and `frameshiftCorrections` in the saved report.
- Keeps each gene's initial alignment as `initialGeneAlignments`. Step 2 offers a separate `Alignment_before_frameshift_correction.zip` download, with one `<gene>.html` per gene: a report of frameshift and stop codon AA positions by IsolateID, and the alignment with codons placed by reference position (codon and frameshift insertions omitted).
- Keeps each gene's final alignment as `finalGeneAlignments`. The Step 2 GenBank zip includes a `Frameshift_stop_codon_report` folder with one `<gene>.html` per gene: frameshift and stop codon AA positions by IsolateID after correction (frameshifts are expected to be 0), and the alignment after frameshift correction.

### `getAlignmentReport` call in `process_seq.js`

- Converts raw alignment output into the report structure used by the GenBank flow.
- Organizes data by isolate and gene.
- Applies the NS3 length filter so very short NS3 fragments are excluded.

### `attachSequenceAnalysisToReport` in `process_seq.js`

- Maps `viewer.sequenceAnalysis` results by header.
- Attaches the matching `sequenceAnalysis` object onto each report entry.
- This attached object is later used for genotyping and DRM extraction.

## Validation stage

### `validateGeneExist` in `../alignment/validate.js`

- Checks whether at least one required DRM gene exists in the aligned result.
- If none are found, shows an alert and returns `false`.

### `validateNoConflict` in `../alignment/validate.js`

- Normalizes each isolate ID to the first token before the first space.
- Groups aligned results by `isolate + gene`.
- Detects duplicate copies of the same gene for the same isolate.
- If duplicates exist, shows an alert and returns `false`.

## Merge stage

### `mergeIsolates` in `process_seq.js`

- Groups report rows by normalized isolate ID.
- Merges multiple gene fragments belonging to the same isolate into one report entry.
- Copies gene data from all matching rows into the main isolate.
- Merges `subtype` and `strain` values using the most common non-`unknown` value.
- Calls `mergeSequenceAnalysis(...)` to combine aligned gene sequences.
- Clears `originalSeq` and `correctedSeq` after merge. This is intentional: merged isolates should no longer carry a single full sequence, and downstream logic should treat them as non-full-length.

### `mergeSequenceAnalysis` in `process_seq.js`

- Combines `alignedGeneSequences` from all rows belonging to the same isolate.
- Keeps only one sequence per gene name.
- Writes the merged list back to `mainIso.sequenceAnalysis`.

## Genotyping stage

The genotyping flow is implemented in `genotyping.js`.

### `genotyping` in `genotyping.js`

- Builds one synthetic partial sequence per isolate.
- Uses only the relevant HCV genotyping regions.
- Fills missing regions with placeholder `.` characters.
- Calls `Alignment(...)` again, this time with `genotyping.graphql.js`.
- Converts the returned subtype/strain result into a lookup table.
- Updates each isolate report entry with:
  - `subtype`
  - `strain`
  - `genotype`

### `getSimpleGeneInfo` in `genotyping.js`

- Extracts a minimal subtype/strain summary from the genotyping API response.
- Returns one simplified record per isolate.

## DRM update stage

After genotyping, the code updates drug resistance mutation fields for each gene.

### `update_DRM_EASL` in `process_seq.js`

- Used when mode is `easl` or `easl-extend`.
- Iterates through each report entry.
- Calls `getStrictGeneDRMs(...)`.
- Writes the resulting DRM string into `reportEntry.genes[gene].DRMs`.

### `update_DRM` in `process_seq.js`

- Used for the non-EASL path.
- Iterates through each report entry.
- Calls `getGeneDRMs(...)`.
- Writes the resulting DRM string into `reportEntry.genes[gene].DRMs`.

### `getStrictGeneDRMs` in `process_seq.js`

- Uses genotype-specific strict DRM lookup tables.
- Calculates gene DRMs only for the genotype/subtype-specific positions that are defined.

### `getGeneDRMs` in `process_seq.js`

- Uses the general DRM lookup tables.
- Reads amino acid changes from aligned gene data.
- Applies special-case handling for selected NS3 and NS5A positions.
- Builds the final DRM string per gene.

### `getGroupedPrettyPairwiseMutations` in `process_seq.js`

- Reads the pretty pairwise alignment lines.
- Groups amino acid changes by position.
- Produces normalized mutation objects with:
  - `position`
  - `mutAA`
  - `fallbackRefAA`

### `getReferenceSequence` in `process_seq.js`

- Chooses the genotype/subtype-specific amino acid reference sequence from `genes-refs-consensus.json`.

### `getReferenceAA` in `process_seq.js`

- Returns the expected reference amino acid at a position.
- Falls back to the pretty pairwise reference residue when a subtype-specific reference is unavailable.

## Save and handoff to Step 2

### `BigData.clear` and `BigData.save` in `process_seq.js`

- Clears previously stored large payloads.
- Saves the final processed alignment report.
- Returns a storage key for later retrieval.

### `onComplete` in `step1.js`

- Receives the saved `alignmentKey` from `ProcessSequence`.
- Otherwise stores `alignmentKey` and calls `onCompleteDownload(...)`.

### `onCompleteDownload` in `step1.js`

- Loads alignments from `BigData.load(alignmentKey)`.
- Calls `generateEditableTable(...)` from `editableTable.js`.
- Builds the downloadable CSV table for Step 2.
- Saves the table through `BigData.save(...)`.
- Downloads `DescriptiveData_<organism>_<date>.csv`.
- Navigates the user to `step2`.

## High-N trimming in export

Before generating BankIt output, `trimHighNRateEdgeTwice(...)` in `adjust_isolate_gene.js` may trim ambiguous bases and long-`N` edge regions from the exported sequence.

Simple rule:

- remove terminal ambiguous bases, where ambiguous means `N` or any non-`ATGC` base
- examine the first 10 bases at the end being processed
- if more than 50% are ambiguous, trim through the last ambiguous base
- then examine the first 50 bases
- if more than 30% are ambiguous, trim through the last ambiguous base
- repeat until that end passes these checks
- apply the same procedure to the opposite end
- consider runs of at least 11 consecutive `N` bases near either end, trimming through an anchor run when it is at least as long as the flanking sequence; runs of at least 50 `N` bases take priority as anchors
- repeat terminal trimming and long-`N` trimming in the order implemented by `trimHighNRateEdgeTwice(...)`
- after trimming, reject the sequence from BankIt export if more than 50% of the remaining bases are still ambiguous overall

## Short execution order

1. `handleUploadSeq` in `step1.js`
2. `appendUUIDToFastaHeaders` in `step1.js`
3. `parseFasta` in `../fasta.js`
4. `onSubmit` in `step1.js`
5. `Process` / `fetchData` in `process_seq.js`
6. `alignWithFrameshiftCorrection` from `../alignment/frameshift_correction.js`
7. `getAlignmentReport` in `process_seq.js`
8. `attachSequenceAnalysisToReport` in `process_seq.js`
9. `validateGeneExist` in `../alignment/validate.js`
10. `validateNoConflict` in `../alignment/validate.js`
11. `mergeIsolates` in `process_seq.js`
12. `genotyping` in `genotyping.js`
13. `update_DRM_EASL` or `update_DRM` in `process_seq.js`
14. `BigData.save` in `process_seq.js`
15. `onComplete` in `step1.js`
16. `onCompleteDownload` in `step1.js`
17. `generateEditableTable` in `editableTable.js`
18. CSV download and route to `step2`
