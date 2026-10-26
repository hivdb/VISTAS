export const virusToFullName = {
    'HIV1': 'Human Immunodeficiency virus 1',
    'HIV2': 'Human Immunodeficiency virus 2',
    'HBV': 'Hepatitis B virus',
    'HCV': 'Orthohepacivirus hominis',
};


function swapKeyValue(obj) {
    var result = {};
    for (const key in obj) {
        result[obj[key]] = key;
    }
    return result;
}

export const virusToShortName = swapKeyValue(virusToFullName);
