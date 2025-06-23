import { DictionaryList, EditBox, TabbedEditBox } from './components.mjs'
import { startResize } from './resize.mjs'
import { Morpheme, Allomorph } from './classes.mjs'
import { glossFill } from './glossEditor.mjs'
var dictionaryUI
export var dict
var morph
//load dictionary items to list
window.addEventListener('load', async () => {
    dictionaryUI = document.querySelector('#dictionary')
    await loadDictionary()

    // open item in edit view
    const dictionaryList = document.querySelectorAll('.dictionary-item')
    dictionaryList.forEach((item) => {
        item.addEventListener('click', editMorpheme)
    })

    //add new morpheme
    const addMorpheme = document.querySelector('#dictionary-add')
    addMorpheme.addEventListener('click', newMorpheme)


    //search boxes
    let searchBoxes = document.querySelectorAll('.search-box')
    searchBoxes.forEach((box) => {
        box.addEventListener('input', searchDictionary)
    })
    
})

function editMorpheme(e) {

    morph = dict.find((element) => element.id == e.currentTarget.getAttribute('morph-id'))

    showEditBox(morph)


}

async function showEditBox(morph) {
    //get settings here
    const settings = JSON.parse(await window.electronAPI.getSettings())
    const editBox = (settings.varietiesEnabled) ? TabbedEditBox(morph,settings) : EditBox(morph,settings)
    if (document.querySelector('#edit-box')) {
        document.querySelector('#edit-box').remove()
    }
    editBox.addEventListener('input', saveMorpheme)
    dictionaryUI.append(editBox)
    document.querySelector('#edit-box').addEventListener('mousedown', startResize)
}

export function newMorpheme(form = '') {
    if (typeof form != "string") form = ''
    const newMorpheme = new Morpheme({ id: nextID(dict), form: form, gloss: '', pos: '', notes: '' })
    dict.push(newMorpheme)
    morph = newMorpheme
    const list = DictionaryList(dict)

    if (dictionaryUI.querySelectorAll('.dictionary-item').length > 0) {
        dictionaryUI.querySelector('#dictionary-list').remove()
    }

    dictionaryUI.append(list)

    const dictionaryList = document.querySelectorAll('.dictionary-item')
    dictionaryList.forEach((item) => {
        item.addEventListener('click', editMorpheme)
    })

    saveDictionary()
    showEditBox(newMorpheme)
    return newMorpheme
}

function saveMorpheme(e) {
    const emorph = document.querySelector(`#morph-${morph.id}`)
    var save = true
    switch (e.target.id) {
        case 'edit-form':
            let val = e.target.value
            if (val.length > 0) {
                e.target.style.backgroundColor = ''
                emorph.querySelector('.dictionary-form').textContent = val
                dict.find(o => o.id == morph.id).form = e.target.value
            } else {
                e.target.setAttribute('placeholder', 'Form cannot be empty')
                e.target.style.backgroundColor = '#f99'
                save = false
            }
            break
        case 'edit-pos':
            let posVal = e.target.value
            if (posVal.length > 0) {
                e.target.style.backgroundColor = ''
                emorph.querySelector('.dictionary-pos').textContent = posVal
                dict.find(o => o.id == morph.id).pos = posVal
                updateDropdown(morph.id)
            } else {
                e.target.setAttribute('placeholder', 'POS cannot be empty')
                e.target.style.backgroundColor = '#f99'
                save = false
            }
            break
        case 'edit-gloss':
            let glossVal = e.target.value
            if (glossVal.length > 0) {
                e.target.style.backgroundColor = ''
                emorph.querySelector('.dictionary-gloss').textContent = glossVal
                dict.find(o => o.id == morph.id).gloss = glossVal
                updateDropdown(morph.id)
                glossFill(document.querySelectorAll('.morpheme-gloss'))
            } else {
                e.target.setAttribute('placeholder', 'Gloss cannot be empty')
                e.target.style.backgroundColor = '#f99'
                save = false
            }
            break
        case 'edit-lexical':
            let lexVal = e.target.checked
            dict.find(o => o.id == morph.id).lexical = lexVal
            if (lexVal) {
                emorph.querySelector('.dictionary-gloss').classList.remove('small-caps')
                emorph.querySelector('.dictionary-gloss').textContent = `'${emorph.querySelector('.dictionary-gloss').textContent}'`
            } else {
                emorph.querySelector('.dictionary-gloss').classList.add('small-caps')
                emorph.querySelector('.dictionary-gloss').textContent = emorph.querySelector('.dictionary-gloss').textContent.slice(1,-1)
            }
            glossFill(document.querySelectorAll('.morpheme-gloss'))
            break
        default:
            if (e.target.id.includes('allomorph-form-')){
                let id = e.target.id.split('-')[2]
                let val = e.target.value
                let allomorphList = dict.find(o => o.id == morph.id).allomorphs

                if (val.length > 0) {
                    if (id == "blank"){
                        id = nextID(dict.find(o => o.id == morph.id).allomorphs)
                        e.target.id = `allomorph-form-${id}`
                        allomorphList.push(new Allomorph(id,val))
    
                        const blankAllomorph = document.createElement('div')
                        blankAllomorph.classList.add('allomorph-wrapper')
                        const form = document.createElement('input')
                        form.id = `allomorph-form-blank`
                        blankAllomorph.append(form)
                        document.querySelector('.allomorphs-box').append(blankAllomorph)
    
                    }
                   allomorphList.find(a => a.id == id).form = val
                    
                } else {
                    let allomorph = allomorphList.find(o => o.id == id)
                    allomorphList.splice(allomorphList.indexOf(allomorph), 1)
                    document.querySelector(`#allomorph-form-${id}`).parentElement.remove()

                }
            }
    }
    if (save) saveDictionary()
}

async function loadDictionary() {
    const response = await fetch('data/dictionary.json')
    let predict = await response.json()
    dict = []
    if (predict.length == 0){
        predict.push(new Morpheme({id:0,form:'',gloss:'language',pos:'n',lexical:true}))
    }
    
    for (let d of predict){
        dict.push(new Morpheme(d))
    }
    const list = DictionaryList(dict)

    if (dictionaryUI.querySelectorAll('.dictionary-item').length > 0) {
        dictionaryUI.querySelector('#dictionary-list').remove()
    }
    dictionaryUI.append(list)
}

function saveDictionary() {
    window.electronAPI.saveDictionary(dict)
}

function searchDictionary(e) {
    let search = e.target.value
    let results = dict.filter((m) => (e.target.id == "dictionary-form-search") ? m.form.includes(search) : m.gloss.includes(search))
    const list = DictionaryList(results)

    if (dictionaryUI.querySelectorAll('.dictionary-item').length > 0) {
        dictionaryUI.querySelector('#dictionary-list').remove()
    }
    dictionaryUI.append(list)
}

function updateDropdown(id){
    const drops = document.querySelectorAll(`.opt-${id}`)
    for (let item of drops){
        item.children[3].textContent = morph.gloss
        item.children[1].textContent = morph.pos
        if (item.classList.contains('active')){
            item.parentElement.previousSibling.textContent = morph.gloss
        }
    }
}

function nextID(dict){
    if (dict.length == 0) return 1
    return Math.max(...dict.map(o=>o.id)) + 1
}