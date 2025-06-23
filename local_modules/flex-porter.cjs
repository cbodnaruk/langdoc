const xml = require('xml-js')
const fs = require('fs/promises')
const path = require('path')
const { Worker } = require('worker_threads')
const workerpool = require('workerpool')
const { ipcMain } = require('electron')
const { error, time } = require('console')

exports.import = async (flexpath, window) => {

    await backupOpenProject()

    let flexfile = await fs.readFile(flexpath, 'utf-8')

    window.webContents.send('progress-update', "Converting XML to JS.")

    let flexdata = xml.xml2js(flexfile, { compact: true }).languageproject.rt
    window.webContents.send('progress-update', "Filtering lexicon data.")

    let classFilter = ['Text',
        'StText',
        'StTxtPara',
        'Segment',
        'WfiGloss',
        'WfiWordform',
        'WfiAnalysis',
        'PartOfSpeech',
        'CmAgentEvaluation',
        'WfiMorphBundle',
        'MoStemAllomorph',
        'MoMorphType',
        'MoStemMsa',
        'LexSense',
        'CmMediaURI',
        'Note',
        'CmPerson',
        'MoAffixAllomorph',
        'MoUnclassifiedAffixMsa',
        'CmMediaContainer',
        'MoDerivAffMsa',
        'PunctuationForm',
        'MoInflAffMsa',
        'LexEntryInflType',
        'LexEntryType',
        'PhEnvironment']


    flexfile = null

    const classes = [
        "MoStemAllomorph",
        "MoAffixAllomorph",
        "LexSense",
        "LexEntry",
        "LexEntryRef",
        "MoStemMsa",
        "MoInflAffMsa",
        "MoDerivStepMsa",
        "MoDerivAffMsa",
        "MoUnclassifiedAffixMsa",
        "PartOfSpeech",
        "WfiWordform",
        "Segment",
        "WfiAnalysis",
        "StText",
        "StTxtPara",
        "Text",
        "PunctuationForm",
        "Gl"
    ]
    let combinedData = []
    let reducedData = {}
    for (let c of classes) {
        reducedData[c] = []
    }
    for (let item of flexdata) {
        let iclass = item._attributes.class
        if (classes.includes(iclass)) {
            reducedData[iclass].push(item)
            combinedData.push(item)
        }
    }

    reducedData.MoMorphSynAnalysis = [
        ...reducedData.MoStemMsa,
        ...reducedData.MoInflAffMsa,
        ...reducedData.MoDerivStepMsa,
        ...reducedData.MoDerivAffMsa,
        ...reducedData.MoUnclassifiedAffixMsa]

    //Filter out unneeded classes
    flexdata = flexdata.filter((d) => classFilter.includes(d._attributes.class))


    console.time('map')
    // Create hash map
    const flexHashMap = new Map()
    for (let rt of flexdata) {
        flexHashMap.set(rt._attributes.guid, rt)
    }
    console.timeEnd('map')

    window.webContents.send('progress-update', "Filtered data.")

    readDict()
    window.webContents.send('progress-update', "Reading dictionary.")

    // Resolves all the links into a single massive object for each text, running down the chain
    let linkedData = structuredClone(reducedData.Text)
    let numTexts = linkedData.length
    const pool = workerpool.pool(__dirname + '/flex-reader.js', { maxWorkers: 1 })
    window.webContents.send('progress-update', "Beginning text conversion.")


    let readTexts = 0
    let readArray = []
    let startedTexts = 0
    for (let text of linkedData) {
        startedTexts++

        pool
            .exec('readObj', [text, flexHashMap, reducedData])
            .then((result) => {
                readTexts++
                console.log(`Converted text ${readTexts} of ${numTexts}: ${text.Name.AUni._text}`);
                window.webContents.send('progress-update', `Converted text ${readTexts} of ${numTexts}: ${text.Name.AUni._text}`)
                readArray.push(result.text)

                if (readTexts == numTexts) {
                    window.webContents.send('progress-update', `Done`)
                }


            })
            .catch(function (err) {
                console.error(err);
            })
    }

    function readDict() {
        window.webContents.send('progress-update', "Starting on Dictionary")
        //Dictionary
        let flexdict = []
        let numEntries = reducedData.LexEntry.length
        let parsedEntries = 0
        for (let item of reducedData.LexEntry) {
            let complexVariant = false
            if (item.EntryRefs && !item.Senses) {
                parseComplexVariant(item)
            } else {
                readEntry(item)
            }
            parsedEntries++

            function parseComplexVariant(entry) {
                let refs = (Array.isArray(entry.EntryRefs.objsur)) ? entry.EntryRefs.objsur : [entry.EntryRefs.objsur]
                for (let ref of refs) {
                    let lexEntryRef = reducedData.LexEntryRef.find((s) => s._attributes.guid == ref._attributes.guid)
                    let componentRefs = lexEntryRef.ComponentLexemes?.objsur ?? lexEntryRef.PrimaryLexemes?.objsur
                    if (componentRefs) {
                        if (!Array.isArray(componentRefs)) componentRefs = [componentRefs]
                        let entries = componentRefs.map(r => reducedData.LexEntry.find(s => s._attributes.guid == r._attributes.guid))
                        for (let e of entries) {
                            if (e&&!e.EntryRefs) {
                                readEntry(e)
                            } else if (e) {
                                parseComplexVariant(e)
                            }
                        }
                    }
                }
            }

            function readEntry(entry) {

                let guid = entry._attributes.guid
                let sense = reducedData.LexSense.find((s) => s._attributes.ownerguid == guid)
                let allomorph = [...reducedData.MoStemAllomorph, ...reducedData.MoAffixAllomorph].find((s) => s._attributes.ownerguid == guid)
                let msa = reducedData.MoMorphSynAnalysis.find((s) => s._attributes.ownerguid == guid)
                let pos = true
                let word = { lexical: true }
                if (msa.PartOfSpeech) {
                    word.pos = getEnglish(reducedData.PartOfSpeech.find((s) => s._attributes.guid == msa.PartOfSpeech.objsur._attributes.guid).Abbreviation.AUni)
                    if (!['adj', 'n', 'v', 'adv'].includes(word.pos)) {
                        word.lexical = false
                    }
                } else {
                    pos = false
                }



                try {
                    word.id = sense._attributes.guid
                } catch {
                    console.error(error);

                }
                if (sense.Gloss) {
                    word.gloss = getEnglish(sense.Gloss.AUni)
                } else {
                    word.gloss = ''

                }

                try {
                    word.form = getEnglish(allomorph.Form.AUni)
                } catch (error) {
                    console.error(error);

                }

                flexdict.push(word)
            }
            window.webContents.send('progress-update', `Parsed word ${parsedEntries} or ${numEntries}`)
        }

        fs.writeFile('./data/dictionary.json', JSON.stringify(flexdict), 'utf8')

    }




}
function getEnglish(x) {
    if (Array.isArray(x)) {
        return x.find((y) => y._attributes.ws == 'en')._text
    } else {
        return x._text
    }
}
class Line {
    words = [];
    line;
    speaker;
    translation;
    timestamp;
    constructor(parameters) {
        this.speaker = parameters.speaker;
        this.translation = parameters.translation;
        let split = parameters.line.split(' ')
        for (let i of split) {
            if (i != "") this.words.push(new Word(i))
        }
        this.line = parameters.line
        this.timestamp = parameters.timestamp
    }
}

class Morph {
    form;
    id;
    constructor(form) {
        this.form = form
    }
}

class Word {
    form;
    morphs = [];
    constructor(form) {
        this.form = form
        let split = form.split('-')
        for (let i in split) {
            this.morphs.push(new Morph(split[i]))
        }
    }
}

class Morpheme {
    form;
    gloss;
    pos;
    binding;
    notes;
    id;
    constructor(parameters) {
        this.id = parameters.id;
        this.form = parameters.form;
        this.gloss = parameters.gloss;
        this.pos = parameters.pos;
        // prefix, suffix etc
        this.binding = parameters.binding ?? "free";
        this.notes = parameters.notes;
    }
}

async function backupOpenProject() {
    await fs.cp('./data', './backup', { recursive: true, force: true })
    await fs.rm('./data/texts', { recursive: true })
    await fs.mkdir('./data/texts')
}