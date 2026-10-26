import cloneDeep from "lodash/cloneDeep";

export function splitGenes(isolate, splitList, sortByGeneName) {

  return splitList.map((geneNames) => {
    const newIsolate = cloneDeep(isolate);

    newIsolate.genes = geneNames.reduce((acc, geneName) => {
      if (geneName in isolate.genes) {
        acc[geneName] = isolate.genes[geneName];
      }
      return acc;
    }, {});

    geneNames = Object.keys(newIsolate.genes).sort(sortByGeneName);
    newIsolate.IsolateID = `${isolate.IsolateID}_${geneNames.join('_')}`;

    return newIsolate;
  }).filter((isolate) => Object.keys(isolate.genes).length > 0);
}
