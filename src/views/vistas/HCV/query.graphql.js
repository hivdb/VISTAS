import gql from 'graphql-tag';

export default `
    query align($sequences: [UnalignedSequenceInput]!, $geneNames: [EnumGene]) {
        viewer {
            currentVersion {
                text,
                publishDate
                },
            sequenceAnalysis(sequences: $sequences) {
                inputSequence {
                    header
                    SHA512
                    sequence
                }
                bestMatchingSubtype {
                    displayWithoutDistance
                }
                strain {
                    name
                    display
                }
                validationResults {
                    level
                    message
                }
                DRMs: mutations(filterOptions: [DRM]) {
                    gene {
                      name,
                      drugClasses { name }
                    },
                    shortText
                }
                alignedGeneSequences(includeGenes: $geneNames) {
                    gene {
                        name
                        length
                    },
                    firstAA,
                    lastAA,
                    firstNA,
                    lastNA,
                    alignedNAs,
                    frameShifts {
                        position
                        isInsertion
                        isDeletion
                        size
                        NAs
                        text
                    },
                    mutations {
                        position
                        AAs
                        isInsertion
                        isDeletion
                        insertedNAs
                        isUnusual
                        isSDRM
                        isDRM
                        primaryType
                        hasStop
                        shortText
                        isApobecMutation
                        isAmbiguous
                    },
                    # adjustedAlignedNAs, does not contain insertion
                    # adjustedAlignedAAs,
                    prettyPairwise {
                        positionLine,
                        refAALine,
                        alignedNAsLine,
                        mutationLine
                    },
                }
            }
        }
    }
`;
