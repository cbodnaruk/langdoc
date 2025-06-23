const workerpool = require('workerpool')
const fs = require('fs/promises')
const { parse } = require('path')

function readObjWrapper(wobj, fullData, reducedData) {

    let separators = ["-"]

    let parsedTexts = []
    function readObj(obj, lastobj = {}) {

        let object = {}
        for (const [key, value] of Object.entries(obj)) {
            object[key] = value
            if (key == "_attributes" && value.guid) {
                if (!value.class) {
                    object = readObj(fullData.get(value.guid), obj)
                }
            } else if (value.objsur) {
                if (Array.isArray(value.objsur)) {
                    for (let o in object[key].objsur) {
                        let newObj = readObj(value.objsur[o], obj)
                        object[key].objsur[o] = newObj
                    }
                } else {
                    object[key].objsur = readObj(value.objsur, obj)
                }
            }
        }
        return object
    }

    const parseText = (text) => {

        let textID = text._attributes.guid
        let stText = text.Contents.objsur
        let output = []
        if (!Array.isArray(stText.Paragraphs.objsur)) stText.Paragraphs.objsur = [stText.Paragraphs.objsur]
        for (let para of stText.Paragraphs.objsur) {
            if (!para.Contents) continue
            // Create line object to add to
            let line = {}

            // Set text line
            try {
                line.line = para.Contents.Str.Run._text
            } catch (err) {
                console.error(err);

            }
            let segment = para.Segments.objsur

            line.translation = (Array.isArray(segment.FreeTranslation.AStr)) ? segment.FreeTranslation.AStr.find((s) => s._attributes.ws == 'en').Run._text : segment.FreeTranslation.AStr.Run._text
            let form = ''
            let words = []
            let morphs = []
            line.timestamp = segment.BeginTimeOffset.Uni._text
            line.duration = parseInt(segment.EndTimeOffset.Uni._text) - parseInt(segment.BeginTimeOffset.Uni._text)
            line.speaker = segment.Speaker.objsur.Name.AUni._text


            let glossForm
            if (Array.isArray(segment.Analyses.objsur)) {
                for (let a in segment.Analyses.objsur) {
                    glossForm = false
                    readGlossing(segment.Analyses.objsur[parseInt(a)], a)
                }
            } else {
                readGlossing(segment.Analyses.objsur, 0)
            }

            function readGlossing(wordform, a) {
                let wfiGloss = null
                let nextWordform = (parseInt(a) != segment.Analyses.objsur.length - 1) ? segment.Analyses.objsur[parseInt(a) + 1] : false
                //if the class is WfiGloss, then find its parent
                if (wordform._attributes.class == "WfiGloss") {
                    // Step up the tree twice
                    wfiGloss = wordform.Form.AUni.find((s) => s._attributes.ws == 'en')._text
                    let wfiAnalysis = reducedData.WfiAnalysis.find(s => s._attributes.guid == wordform._attributes.ownerguid)
                    glossForm = wfiAnalysis
                    let wfiWordform = reducedData.WfiWordform.find(s => s._attributes.guid == wfiAnalysis._attributes.ownerguid)
                    wordform = readObj(wfiWordform)
                }
                if (wordform._attributes.class == "WfiWordform") {


                    form += wordform.Form.AUni._text
                    morph_obj = { form: wordform.Form.AUni._text }

                    //find the senses
                    if (wordform.Analyses) {
                        let analysis = ''
                        //Check if this wordform has multiple words (MorphBundles) for some reason
                        if (Array.isArray(wordform.Analyses.objsur)) {
                            
                        } else {
                            if (Array.isArray(wordform.Analyses.objsur.MorphBundles.objsur)){
                                console.log("AAAA");
                                
                            }
                        }

                        let meaning = ''
                        if (glossForm) {

                            meaning = reducedData.LexSense.find(s=>getGlossId(s))._attributes.guid
                            function getGlossId(s){
                                if (s.Gloss){
                                if (Array.isArray(s.Gloss.AUni)) {
                                        if (s.Gloss.AUni.find(t=>t._attributes.ws == 'en')._text == wfiGloss) return true
                                    } else { 
                                        if (s.Gloss.AUni._text == wfiGloss) return true
                                    }
                                } 
                                return false
                                  
                            }
                        } else {
                            try {
                                if (Array.isArray(wordform.Analyses.objsur)) {
                                    meaning = wordform.Analyses.objsur.find((e) => e.MorphBundles.objsur.Sense??e.MorphBundles.objsur[0].Sense).MorphBundles.objsur.Sense.objsur._attributes.guid
                                } else {

                                    meaning = wordform.Analyses.objsur.MorphBundles.objsur.Sense.objsur._attributes.guid

                                }
                            } catch (err) {
                                meaning = null
                            }

                        }
                        morph_obj.id = meaning
                    }

                    //add to list
                    morphs.push(morph_obj)
                    //Check if the next symbol is a separator (default '-')
                    let continueWord = (!!nextWordform)
                    if (continueWord) if (nextWordform._attributes.class == "PunctuationForm") continueWord = (separators.includes(nextWordform.Form.Str.Run._text))
                    else continueWord = false
                    if (!continueWord) {
                        //end the word
                        words.push({ form: form, morphs: morphs })
                        morphs = []
                        form = ''
                    }
                }

            }

            if (morphs.length > 0) {
                //Push any remaining forms that got missed (eg due to trailing punctuation)
                words.push({ form: form, morphs: morphs })
            }
            line.words = words
            output.push(line)
        }
        parsedTexts.push({ name: text.Name.AUni._text, text: output })
        let header = { timeUnits: 'milliseconds' }
        header.media = []
        let mediaList = text.MediaFiles?.objsur.MediaURIs.objsur
        let mimetypes = { wav: "audio/x-wav", mp4: "video/mp4" }
        if (!Array.isArray(mediaList)) mediaList = [mediaList]
        mediaList.forEach((m) => {
            header.media.push({ url: m.MediaURI.Uni._text, mimetype: mimetypes[m.MediaURI.Uni._text.split('.').at(-1).toLowerCase()] })
        })

        header.date = new Date(text.DateModified._attributes.val).toISOString()
        let jsonstr = JSON.stringify({ header: header, body: output })
        fs.writeFile(`./data/texts/${text.Name.AUni._text}.json`, jsonstr).catch((err) => {
            console.error(err);
        })
        return output
    }
    let text = readObj(wobj)
    let fullOutput = { text: parseText(text) }
    return fullOutput
}
workerpool.worker({
    readObj: readObjWrapper
})

