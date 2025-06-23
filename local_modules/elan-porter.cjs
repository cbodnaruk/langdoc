const xml = require('xml-js')
const fs = require('fs/promises')
const { dialog, ipcMain, BrowserWindow } = require('electron')
const path = require('path')
const { log } = require('console')

exports.import = async function () {
    classes = await import('../scripts/classes.mjs')
    const file = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'ELAN annotation file', extensions: ['eaf'] }] })
    if (file.canceled) return
    const data = await fs.readFile(file.filePaths[0], 'utf-8')

    // New EAF parser
    // read xml to js object
    const eaf = xml.xml2js(data, { compact: true }).ANNOTATION_DOCUMENT
    // write test file for debugging
    await fs.writeFile('test.json', JSON.stringify(eaf))

    // get the header information
    const header = {
        timeUnits: eaf.HEADER._attributes.TIME_UNITS,
        date: eaf._attributes.DATE,
        media: []
    }
    if (Array.isArray(eaf.HEADER.MEDIA_DESCRIPTOR)) {
        for (let media of eaf.HEADER.MEDIA_DESCRIPTOR) {
            header.media.push({ url: media._attributes.MEDIA_URL, mimetype: media._attributes.MIME_TYPE, timeOrigin: media._attributes.TIME_ORIGIN })
        }
    } else {
        let media = eaf.HEADER.MEDIA_DESCRIPTOR
        header.media.push({ url: media._attributes.MEDIA_URL, mimetype: media._attributes.MIME_TYPE, timeOrigin: media._attributes.TIME_ORIGIN })
    }

    let lines = []

    // get tiers: Need to add user selection to identify text and translation tiers.
    let rawTiers = []
    let tiers = []
    eaf.TIER.forEach(element => {
        rawTiers.push(element._attributes.TIER_ID)

    });

    //show dialog to assign internal types to each tier (one text, one translation)
    console.log(rawTiers);
    exports.showDialog(rawTiers)
    // wait for user to select tiers
    ipcMain.on('return-tier-data', (event, sdata) => {

        //work out which tiers the user wants to use from their selection so it can be projected across multiple speakers

        console.log(sdata);
        let data = JSON.parse(sdata)

        for (let s in data.text) {
            for (let tier of eaf.TIER) {
                if (tier._attributes.TIER_ID == data.text[s]) {
                    let translationTier = eaf.TIER.find(t => t._attributes.PARENT_REF == tier._attributes.TIER_ID && t._attributes.TIER_ID == data.translation[s])
                    tiers.push({ text: tier, translation: translationTier })
                }
            }
        }
        // get "lines" from the annotations per tier
        let spkr = 0
        for (let tier of tiers) {
            let speaker = tier.text._attributes.PARTICIPANT ?? `Speaker-${spkr + 1}`
            if (Array.isArray(tier.text.ANNOTATION)) {
            for (let annotation of tier.text.ANNOTATION) {
                let id = annotation.ALIGNABLE_ANNOTATION._attributes.ANNOTATION_ID
                let val = annotation.ALIGNABLE_ANNOTATION.ANNOTATION_VALUE
                let line = (val._text) ? val._text : "_"
                let timestamp = eaf.TIME_ORDER.TIME_SLOT.find(t => t._attributes.TIME_SLOT_ID == annotation.ALIGNABLE_ANNOTATION._attributes.TIME_SLOT_REF1)._attributes.TIME_VALUE
                let duration = eaf.TIME_ORDER.TIME_SLOT.find(t => t._attributes.TIME_SLOT_ID == annotation.ALIGNABLE_ANNOTATION._attributes.TIME_SLOT_REF2)._attributes.TIME_VALUE - timestamp
                let translationTier = tier.translation.ANNOTATION.find(a => a.REF_ANNOTATION._attributes.ANNOTATION_REF == id)
                let translation = (translationTier) ? translationTier.REF_ANNOTATION.ANNOTATION_VALUE._text : "_"
                lines.push(new classes.Line({ line: line, translation: translation, speaker: speaker, timestamp: timestamp, duration: duration }))
            }}
            else {
                let annotation = tier.text.ANNOTATION
                let id = annotation.ALIGNABLE_ANNOTATION._attributes.ANNOTATION_ID
                let val = annotation.ALIGNABLE_ANNOTATION.ANNOTATION_VALUE
                let line = (val._text) ? val._text : "_"
                let timestamp = eaf.TIME_ORDER.TIME_SLOT.find(t => t._attributes.TIME_SLOT_ID == annotation.ALIGNABLE_ANNOTATION._attributes.TIME_SLOT_REF1)._attributes.TIME_VALUE
                let duration = eaf.TIME_ORDER.TIME_SLOT.find(t => t._attributes.TIME_SLOT_ID == annotation.ALIGNABLE_ANNOTATION._attributes.TIME_SLOT_REF2)._attributes.TIME_VALUE - timestamp
                let translationTier = tier.translation.ANNOTATION
                let translation = (translationTier) ? translationTier.REF_ANNOTATION.ANNOTATION_VALUE._text : "_"
                lines.push(new classes.Line({ line: line, translation: translation, speaker: speaker, timestamp: timestamp, duration: duration }))
            }
            spkr++
        }
        lines.sort((a, b) => a.timestamp - b.timestamp);
        fs.writeFile(`./data/texts/${path.basename(file.filePaths[0]).split('.')[0]}.json`, JSON.stringify({ header: header, body: lines }))
        tierDialog.close()

    })
    return { header: header, body: lines }

}
let tierDialog = null
exports.showDialog = function (tiers) {
    tierDialog = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(path.resolve(__dirname, '..'), '/elan-dialog/elan-dialog-preload.js'),
            spellcheck: false
        },
        maximizable: false
    })
    tierDialog.setMenuBarVisibility(false)
    tierDialog.loadFile('elan-dialog/elan-dialog.html')
    tierDialog.webContents.on('did-finish-load', () => {
        tierDialog.webContents.send('give-tier-data', tiers)
    })
    tierDialog.on('close', () => {
        tierDialog = null
    })


}
