import { dict, newMorpheme } from "./dictionary.mjs";
import { MorphemeDropdown, MorphemeDropdownItem, GlossItem } from "./components.mjs";
import { openText } from "./text.mjs";
import { getElementIndex, Morph } from "./classes.mjs";
export function initEditor() {
    enableEditing()
}


function enableEditing() {
    const gl1Coll = document.querySelectorAll(".gl-1")
    const glTColl = document.querySelectorAll('.gl-t')
    const morphemeFormColl = document.querySelectorAll('.morpheme-form')
    const morphemeGlossColl = document.querySelectorAll('.morpheme-gloss')

    for (let line of gl1Coll) {
        line.addEventListener('input', editTarget)

    }
    for (let line of glTColl) {
        line.addEventListener('input', editTarget)
    }

    for (let line of morphemeFormColl) {
        line.addEventListener('input', editTarget)
    }

    glossFill(morphemeGlossColl)


}



function editTarget(e) {
    let edit = {}
    edit.line = getElementIndex(e.target.closest('.text-line-wrapper'))

    // Handle line editing
    if (e.target.classList.contains('gl-1')) {
        edit.type = "line"
        edit.val = e.target.textContent
        openText[edit.line][edit.type] = edit.val

        // Handle translation editing
    } else if (e.target.classList.contains('gl-t')) {
        edit.type = "translation"
        edit.val = e.target.textContent
        openText[edit.line][edit.type] = edit.val

        // Handle morpheme form editing
    } else if (e.target.classList.contains('morpheme-form')) {
        edit.type = "word"
        edit.val = e.target.textContent
        let morphs = edit.val.split('-')
        edit.wordIndex = getElementIndex(e.target.closest('.gloss-item'))
        edit.morphIndex = Math.floor(getElementIndex(e.target.closest('.morpheme-form')) / 2)

        // Check if the morpheme was totally deleted (unless it is first)
        if (edit.val === "") {
            edit.type = "full-save"
            if (getElementIndex(e.target) != 0) {
                // Remove the morpheme from the object
                openText[edit.line].words[edit.wordIndex].morphs.splice(edit.morphIndex, 1)

                // Remove it from the DOM
                const itemIndex = getElementIndex(e.target)
                e.target.closest('.gloss-item').children[1].children[itemIndex].remove()
                if (itemIndex > 0) e.target.parentElement.parentElement.children[1].children[itemIndex - 1].remove()
                if (itemIndex > 0) e.target.previousSibling.remove()
                e.target.previousSibling.focus()
                moveCursorToEnd(e.target.previousSibling)
                e.target.remove()

                // Check if this was the last morpheme in the word
            } else if (openText[edit.line].words[edit.wordIndex].morphs.length == 1) {
                openText[edit.line].words.splice(edit.wordIndex, 1)
                e.target.closest('.gloss-item').remove()
            }

            // Check if new morpheme is added
        } else if (openText[edit.line].words[edit.wordIndex].morphs.length < (morphs.length + e.target.closest('.gloss-item').querySelectorAll('.morpheme-form').length - 1)) {
            edit.type = "full-save"
            let caretPosition = document.getSelection().focusOffset - (edit.val.match(/-/g) || []).length

            // Build array of all existing morpheme lengths
            let morphemeLengths = []
            for (let m in openText[edit.line].words[edit.wordIndex].morphs) {
                let index = (m == 0) ? 0 : morphemeLengths[morphemeLengths.length - 1] + 1
                for (let c = 0; c < openText[edit.line].words[edit.wordIndex].morphs[m].form.length; c++) {
                    morphemeLengths.push(index)
                }
            }
            let currentMorpheme = openText[edit.line].words[edit.wordIndex].morphs[morphemeLengths[caretPosition]]
            let morphemePos = 0
            for (let l = 0; l < caretPosition; l++) if (morphemeLengths[l] == morphemeLengths[caretPosition]) morphemePos++

            // If it is placed inside a morpheme, separate it into two
            if (caretPosition < edit.val.length - 1) {
                let splitMorphemes = [currentMorpheme.form.substring(0, caretPosition), currentMorpheme.form.substring(caretPosition)]
                currentMorpheme.form = splitMorphemes[0]
                openText[edit.line].words[edit.wordIndex].morphs.splice(edit.morphIndex + 1, 0, new Morph(splitMorphemes[1]))
            } else {
                // If not, add the new morpheme
                openText[edit.line].words[edit.wordIndex].morphs.splice(edit.morphIndex + 1, 0, new Morph(' '))
            }

            // Reload the gloss item
            const reloadGlossItem = GlossItem(openText[edit.line].words[edit.wordIndex])
            const glossItem = e.target.closest('.gloss-item')
            glossItem.innerHTML = reloadGlossItem.innerHTML

            const morphemeFormColl = glossItem.querySelectorAll('.morpheme-form')
            for (let line of morphemeFormColl) {
                line.addEventListener('input', editTarget)
            }

            glossFill(glossItem.querySelectorAll('.morpheme-gloss'))
            glossItem.children[0].children[(edit.morphIndex + 1) * 2].focus()

        } else {
            openText[edit.line].words[edit.wordIndex].morphs[edit.morphIndex].form = edit.val
            const glossItem = e.target.closest('.gloss-item')
            glossFill(glossItem.querySelectorAll('.morpheme-gloss'))
        }
    }

    edit.fullData = openText
    window.electronAPI.editText(edit)
}

export async function glossFill(coll) {
    let settings = await window.electronAPI.getSettings()
    for (let m of coll) {
        const i = getElementIndex(m)
        const form = m.parentElement.parentElement.children[0].children[i].textContent
        const variety = (settings.varietiesEnabled) ? m.closest('.text-line-wrapper').querySelector('.text-variety-interface').value : 'default'
        const numForms = m.parentElement.children.length
        const savedID = m.textContent
        // TODO: check which variety line is part of and check that form specifically
        let matches = dict.filter((entry) => entry.form == form || entry.allomorphs.some((a) => a.form == form))
        if (settings.varietiesEnabled) {
            let varietyMatches = dict.filter(entry => entry.variations.some(v => v.form == form && v.variety == variety))
            if (varietyMatches.length > 0) {
                matches.push(...varietyMatches)
            }
        }
        // TODO: Global settings to disable this
        // if (numForms == 1){
        //     matches = matches.filter((entry)=>entry.binding == 'root')
        // }

        const saved = (Number.isInteger(savedID)) ? dict.find((element) => element.id == savedID).gloss : ""

        const select = MorphemeDropdown(matches, form, saved)

        m.innerHTML = ""
        m.append(select)



    }
    for (let item of document.querySelectorAll('.morpheme-dropdown-item')) {
        item.addEventListener('click', changeGloss)
    }

}

function changeGloss(e) {
    const selection = e.target
    const id = selection.id.split('-')[1]
    const morpheme = selection.closest('.morpheme-gloss')
    if (selection.children[3].textContent == "Define new") {
        const newMorph = newMorpheme(selection.children[0].textContent)
        setMorpheme(morpheme, newMorph.id)
        selection.insertAdjacentElement('beforebegin', MorphemeDropdownItem(newMorph, true))
    } else if (!selection.classList.contains('active')) {
        setMorpheme(morpheme, id)
        morpheme.querySelector('.dropdown-display').textContent = selection.children[3].textContent
        try {
            selection.parentElement.querySelector('.active').classList.remove('active')
        } catch (error) {

        }
        selection.classList.add('active')
    }
}


function setMorpheme(morpheme, id) {
    const morphIndex = getElementIndex(morpheme) / 2
    const wordIndex = getElementIndex(morpheme.closest('.gloss-item'))
    const lineIndex = getElementIndex(morpheme.closest('.text-line-wrapper'))



    openText[lineIndex].words[wordIndex].morphs[morphIndex].id = id
    const edit = { type: "morpheme_id", val: id, line: lineIndex, word: wordIndex, morpheme: morphIndex }
    window.electronAPI.editText(edit)

}

const moveCursorToEnd = (contentEle) => {
    const range = document.createRange();
    const selection = window.getSelection();
    range.setStart(contentEle, contentEle.childNodes.length);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
};