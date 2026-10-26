import gql from 'graphql-tag';

export default `
    query align($sequences: [UnalignedSequenceInput]!) {
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
            }
        }
    }
`;
