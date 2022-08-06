import { MUSICNNLABELS, THRESHOLD } from './audioclassifier.js'

function getPredictionsWithLabel(preds) {
    let predictions = []

    for (let segment in preds) {
        const obj = {}
        MUSICNNLABELS.forEach((element, index) => {
            if (preds[segment][index] > THRESHOLD) {
                obj[element] = preds[segment][index]
            }
        })
        predictions.push(obj)
    }
    return predictions
}

function calculateAveragePred(input) {
    const numberLabels = Object.keys(input)
    for (let label of numberLabels) {
        input[label]['average'] = input[label]['average'] / input[label]['repeats']
    }
    return input
}

function getPredictionsGrouped(labelpreds) {

    let predObj = {}

    for (let i = 0; i < labelpreds.length; i++) {

        const numberLabelsFrame = Object.keys(labelpreds[i])

        for (let j = 0; j < numberLabelsFrame.length; j++) {

            const prop = numberLabelsFrame[j]
            const percent = labelpreds[i][prop]            
            const prop_key = prop.replace(/\s/g, '')   

            if (!predObj[prop_key]) {

                predObj[prop_key] = {
                    'label': prop,
                    'max_perc': percent,
                    'average': percent,
                    'min_perc': percent,
                    'repeats': 1
                }

            } else {
                
                predObj[prop_key]['repeats'] += 1
                predObj[prop_key]['average'] = (predObj[prop_key]['average'] + percent)
                if (percent < predObj[prop_key]['min_perc']) {
                    predObj[prop_key]['min_perc'] = percent
                }
                if (percent > predObj[prop_key]['max_perc']) {
                    predObj[prop_key]['max_perc'] = percent
                }
            }
        }
    }
    return predObj
}

export default function getFinalPredResult(analysis) {

    const labelsPreds = getPredictionsWithLabel(analysis)

    const resultPrev = getPredictionsGrouped(labelsPreds)

    const resultFinal = calculateAveragePred(resultPrev)

    return resultFinal
}
