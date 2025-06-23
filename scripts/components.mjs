import { Word, getElementIndex, Variation } from "./classes.mjs"
import { openText } from "./text.mjs"
import { glossFill } from "./glossEditor.mjs"
import * as UI from "./ui.js"

export const DictionaryList = (dict) => {
    const list = document.createElement('div')
    list.id = 'dictionary-list'

    const list1 = UI.create({
        type: 'div',
        id: 'dictionary-list'
    })

    let items = []
    let items1 = []
    for (let m of dict) {

        const item1 = UI.create({
            type: 'div',
            id: `morph-${m.id}`,
            classList: 'dictionary-item'
        })

        const form1 = UI.create({
            type: 'div',
            id: `form-${m.id}`,
            classList: 'dictionary-form'
        })

        const pos1 = UI.create({
            type: 'span',
            id: `pos-${m.id}`,
            classList: 'dictionary-pos'
        })

        const gloss1 = UI.create({
            type: 'span',
            id: `gloss-${m.id}`,
            classList: (!m.lexical) ? 'dictionary-gloss small-caps':'dictionary-gloss',
            text: (m.lexical) ? `'${m.gloss}'` : m.gloss
        })
        item1.add(form1,pos1,gloss1).attribute['morph-id'] = m.id

        items1.push(item1)

        const item = document.createElement('div')
        item.classList.add('dictionary-item')
        item.id = `morph-${m.id}`

        const form = document.createElement('span')
        form.classList.add('dictionary-form')
        form.textContent = m.form

        const pos = document.createElement('span')
        pos.classList.add('dictionary-pos')
        pos.textContent = m.pos

        const gloss = document.createElement('span')
        gloss.classList.add('dictionary-gloss')
        gloss.textContent = (m.lexical) ? `'${m.gloss}'` : m.gloss
        if (!m.lexical) gloss.classList.add('small-caps')

        item.append(form, pos, gloss)
        item.setAttribute('morph-id', m.id)
        items.push(item)
    }

    list1.add(items1)
    list.append(...items)
    return list
}

export const TabbedEditBox = (word, settings) => {

    if (settings.varietiesEnabled) {
        const tabWrapper = document.createElement('div')
        tabWrapper.classList.add('varieties-tab-wrapper')
        let tabs = []
        let boxes = []
        const dtab = document.createElement('div')
        dtab.classList.add('variety-tab', 'active-variety-tab')
        dtab.textContent = "Default"
        dtab.id = `tab-default`
        tabs.push(dtab)
        const dbox = document.createElement('div')
        dbox.classList.add('variety-box', 'active-variety-box')
        dbox.id = `box-default`
        dbox.append(EditBox(word))
        boxes.push(dbox)
        for (let v of settings.varieties) {
            const tab = document.createElement('div')
            tab.classList.add('variety-tab')
            tab.textContent = v.shortName
            tab.id = `tab-${v.id}`
            tabs.push(tab)
            const box = document.createElement('div')
            box.classList.add('variety-box')
            box.id = `box-${v.id}`
            box.append(EditBox(word, settings, v))
            boxes.push(box)
        }

        for (let tab of tabs) {
            tab.addEventListener('click', (e) => {
                const id = e.target.id.split('-')[1]
                const allTabs = document.querySelectorAll('.variety-tab')
                const allBoxes = document.querySelectorAll('.variety-box')
                for (let t of allTabs) {
                    t.classList.remove('active-variety-tab')
                }
                for (let b of allBoxes) {
                    b.classList.remove('active-variety-box')
                }
                e.target.classList.add('active-variety-tab')
                document.getElementById(`box-${id}`).classList.add('active-variety-box')
            })
        }

        const tabBar = document.createElement('div')
        tabBar.classList.add('variety-tab-bar')
        tabBar.append(...tabs)
        const tabContainer = document.createElement('div')
        tabContainer.classList.add('variety-tab-container')
        tabContainer.append(...boxes)
        tabWrapper.append(tabBar, tabContainer)
        return tabWrapper
    } else {
        return EditBox(word)
    }


}

export const EditBox = (word, settings = false, variety = false) => {


    const editWrapper = document.createElement('div')
    editWrapper.id = 'edit-box-wrapper'
    const editBox = document.createElement('div')
    editBox.id = 'edit-box'

    editWrapper.appendChild(editBox)
    const editResize = document.createElement('div')
    editResize.classList.add('resize', 'ry')
    editResize.id = 'edit-resize'
    // editBox.append(editResize)
    const exitWrapper = document.createElement('div')
    exitWrapper.classList.add('edit-wrapper')
    const exit = document.createElement('div')
    exit.classList.add('exit')
    exit.textContent = 'X'


    exit.addEventListener('click', (e) => {
        let wrap = e.target.closest('.varieties-tab-wrapper')
        if (e.target.closest('.varieties-tab-wrapper')) {
            const box = e.target.closest('.varieties-tab-wrapper')
            box.remove()
        } else {
            editWrapper.remove()
        }
        editWrapper.remove()
    })

    exitWrapper.append(document.createElement('div'), exit)

    let variation = { form: "", allomorphs: [] }
    if (variety) {
        if (word.variations.find(o => o.variety == variety.id)) {
            variation = word.variations.find(o => o.variety == variety.id)
        }
    }


    const fields = [
        { id: 'form', label: 'Form', type: 'input', value: (variety) ? variation.form : word.form },
        { id: 'allomorphs', label: 'Allomorphs', type: 'element', value: AllomorphEditor((variety) ? variation.allomorphs : word.allomorphs) },
        { id: 'pos', label: 'Part of Speech', type: 'input', value: word.pos },
        { id: 'gloss', label: 'Gloss', type: 'input', value: word.gloss },
        { id: 'binding', label: 'Position', type: 'input', value: word.binding },
        { id: 'lexical', label: 'Lexical?', type: 'input', inputType: 'checkbox', value: word.lexical },
        { id: 'notes', label: 'Notes', type: 'textarea', value: word.notes }
    ]

    const wrappers = fields.map(field => {
        const wrapper = document.createElement('div')
        wrapper.classList.add('edit-wrapper')
        var input = null
        if (field.case === undefined || field.case) {
            if (field.type == 'element') {
                input = field.value
            } else {
                input = document.createElement(field.type)
                input.value = field.value
                if (field.inputType) {
                    input.setAttribute('type', field.inputType)
                    if (field.inputType == 'checkbox' && field.value) {
                        input.setAttribute("checked", true)

                    }
                }
                input.id = `edit-${field.id}`
                input.value = field.value
            }
            const label = document.createElement('label')
            label.textContent = field.label
            label.htmlFor = `edit-${field.id}`

            wrapper.append(label, input)
        }
        return wrapper
    })



    editBox.append(exitWrapper, ...wrappers)


    return editWrapper
}

export const AllomorphEditor = (allomorphs) => {
    const showAllomorphs = document.createElement('button')
    showAllomorphs.classList.add('show-allomorphs', 'icon')
    showAllomorphs.textContent = 'top_panel_open'

    showAllomorphs.addEventListener('click', (e) => {
        const box = e.target.nextSibling
        if (e.target.textContent == "top_panel_open") {
            box.classList.add('allomorph-open')
            e.target.textContent = "top_panel_close"
        } else {
            box.classList.remove('allomorph-open')
            e.target.textContent = 'top_panel_open'
        }
    })

    const allomorphsBox = document.createElement('div')
    allomorphsBox.classList.add('allomorphs-box')
    for (let v of allomorphs) {
        const allomorph = document.createElement('div')
        allomorph.classList.add('allomorph-wrapper')

        const form = document.createElement('input')
        form.id = `allomorph-form-${v.id}`
        form.value = v.form

        allomorph.append(form)
        allomorphsBox.append(allomorph)
    }

    const blankAllomorph = document.createElement('div')
    blankAllomorph.classList.add('allomorph-wrapper')
    const form = document.createElement('input')
    form.id = `allomorph-form-blank`
    blankAllomorph.append(form)
    allomorphsBox.append(blankAllomorph)

    const wrapper = document.createElement('div')
    wrapper.classList.add('allomorph-editor-wrapper')

    // allomorphsBox.addEventListener('input', editAllomorph)


    wrapper.append(showAllomorphs, allomorphsBox)
    return wrapper
}

export const FileList = (files) => {
    const list = document.createElement('div')
    list.id = 'file-list'
    let items = []
    for (let f of files) {
        const item = document.createElement('div')
        item.classList.add('file-item')
        item.id = `file-${f.id}`

        const name = document.createElement('span')
        name.classList.add('file-name')
        name.textContent = f.fileName.split('.')[0]

        const date = document.createElement('span')
        date.classList.add('file-date', 'clear')
        const created = new Date(f.created)
        console.log(f.created);

        date.textContent = `${created.getFullYear()}/${created.getMonth()}/${created.getDate()}`

        item.append(name, date)
        item.setAttribute('file-id', f.id)
        items.push(item)
    }

    list.append(...items)
    return list
}

export const GlossLine = (line, settings = false) => {
    const wrapper = document.createElement('div')
    wrapper.classList.add('text-line-wrapper')

    const rline = document.createElement('div')
    rline.classList.add('text-line')

    const rtext = document.createElement('div')
    rtext.classList.add('gl-1')
    rtext.setAttribute('contenteditable', true)
    rtext.textContent = line.line
    rline.append(rtext)

    const rint = document.createElement('div')
    rint.classList.add('gl-2-wrapper')
    for (let word of line.words) {
        const rword = GlossItem(word)
        rint.append(rword)
    }
    rline.append(rint)

    const rtrans = document.createElement('div')
    rtrans.textContent = line.translation
    rtrans.classList.add('gl-t')
    rtrans.setAttribute('contenteditable', true)
    rline.append(rtrans)

    const rmeta = document.createElement('div')
    rmeta.classList.add('gl-meta')
    rmeta.textContent = `${line.speaker} :: ${(line.timestamp)?(line.timestamp.includes(':')) ? line.timestamp : new Date(parseInt(line.timestamp)).toISOString().slice(11, 19):''}`
    rline.append(rmeta)
    wrapper.append(rline)
    // Variety interface


    if (settings.varietiesEnabled) {
        wrapper.append(VarietyInterface(settings.varieties, line.variety))
    }




    const buttons = document.createElement('div')
    buttons.classList.add('text-line-buttons')

    const copyButton = document.createElement('div')
    copyButton.classList.add('copy-button', 'icon')
    copyButton.textContent = 'content_copy'
    buttons.append(copyButton)

    const playButton = document.createElement('div')
    playButton.classList.add('play-button', 'icon')
    playButton.textContent = 'play_arrow'
    buttons.append(playButton)

    wrapper.append(buttons)
    return wrapper
}

const VarietyInterface = (varieties, variety) => {
    const varietyInterface = document.createElement('select')
    varietyInterface.classList.add('text-variety-interface')
    const defaultOption = document.createElement('option')
    defaultOption.textContent = "Default"
    defaultOption.value = "default"
    defaultOption.selected = (variety == "default")
    varietyInterface.append(defaultOption)
    for (let v of varieties) {
        const option = document.createElement('option')
        option.textContent = v.shortName
        option.value = v.id
        option.selected = (variety == v.id)
        varietyInterface.append(option)
    }
    
    varietyInterface.addEventListener('change', (e) => {
        const id = e.target.value
        const line = e.target.closest('.text-line-wrapper')
        const lineIndex = getElementIndex(line)
        openText[lineIndex].variety = id
        window.electronAPI.editText({ type: "full-save", fullData: openText })
    })

    return varietyInterface
}

export const GlossItem = (form) => {
    const item = document.createElement('span')
    const dash = document.createElement('span')
    dash.textContent = '-'

    item.classList.add('gloss-item')
    const gl2 = document.createElement('span')
    for (let subform of form.morphs) {
        const dash = document.createElement('span')
        dash.textContent = '-'
        const subgl2 = document.createElement('span')
        subgl2.textContent = subform.form
        subgl2.classList.add('morpheme-form')
        subgl2.setAttribute('contenteditable', true)
        gl2.append(subgl2, dash)
    }
    gl2.lastElementChild.remove()
    item.append(gl2)
    const gl3 = document.createElement('span')
    gl3.classList.add('flex')
    for (let subform of form.morphs) {
        const dash = document.createElement('span')
        dash.style.paddingLeft = "3px"
        dash.style.paddingRight = "3px"
        dash.textContent = ' - '
        const subgl3 = document.createElement('span')
        subgl3.textContent = subform.id ?? ""
        subgl3.classList.add('morpheme-gloss')
        gl3.append(subgl3, dash)

    }
    gl3.lastElementChild.remove()
    item.append(gl3)

    const divider = document.createElement('div')
    divider.classList.add('gloss-item-divider')
    const dividerButton = document.createElement('span')
    dividerButton.classList.add('divider-button')
    divider.append(dividerButton)
    divider.addEventListener('click', (e) => {
        const newWord = new Word("word")
        const glossItem = GlossItem(newWord)
        e.target.closest('.gloss-item').after(glossItem)
        openText[getElementIndex(e.target.closest('.text-line-wrapper'))].words.splice(getElementIndex(e.target.closest('.gloss-item')) + 1, 0, newWord)
        window.electronAPI.editText({ type: "full-save", fullData: openText })
        glossFill([glossItem.querySelector(".morpheme-gloss")])
    })
    item.append(divider)

    return item
}

export const MorphemeDropdown = (matches, form, saved) => {
    const wrapper = document.createElement('div')
    wrapper.classList.add('dropdown-wrapper')
    const display = document.createElement('div')
    const options = document.createElement('div')
    options.classList.add('morpheme-dropdown-list')

    if (saved.length > 0) display.textContent = saved
    else display.textContent = (matches[0]) ? matches[0].gloss : "--"

    for (let item of matches) {
        options.append(MorphemeDropdownItem(item, (saved == item.gloss)))
    }

    options.append(MorphemeDropdownItem({ form: form }, false, true))



    if (matches[0] && !matches[0].lexical) display.classList.add('small-caps')
    display.classList.add('dropdown-display')
    options.classList.add('morpheme-dropdown-list')
    wrapper.append(display, options)


    display.addEventListener('click', showDropdown)
    function showDropdown(e) {
        e.target.nextSibling.classList.remove('morpheme-dropdown-list')
        e.target.nextSibling.classList.add('show', 'morpheme-dropdown-list')
        display.addEventListener('mouseleave', addCloseListener)
        function addCloseListener(e) {
            document.addEventListener('click', hideDropdown)
            display.removeEventListener('mouseleave', addCloseListener)
        }
        function hideDropdown(e) {
            if (!e.target.classList.contains('morpheme-dropdown-item')) {
                if (e.target.classList.contains('dropdown-display')) {
                    let list = document.querySelectorAll('.morpheme-dropdown-list.show')
                    for (let i of list) {
                        if (i != e.target.nextSibling) i.classList.remove('show')
                    }

                } else {
                    if (document.querySelector('.morpheme-dropdown-list.show')) document.querySelector('.morpheme-dropdown-list.show').classList.remove('show')
                }
            }
            document.removeEventListener('click', hideDropdown)
        }
    }

    return wrapper

}

export const MorphemeDropdownItem = (item, active = false, final = false) => {
    const wrapper = document.createElement('div')
    wrapper.classList.add('morpheme-dropdown-item', `opt-${item.id}`)
    const form = document.createElement('div')
    form.textContent = item.form
    form.style.fontStyle = 'italic'

    const pos = document.createElement('div')
    pos.textContent = item.pos ?? ""
    pos.classList.add('clear')
    const binding = document.createElement('div')
    binding.textContent = item.binding ?? ""

    const gloss = document.createElement('div')
    if (item.gloss) {
        if (item.lexical) {
            gloss.textContent = `'${item.gloss}'`
        } else {
            gloss.textContent = item.gloss
            gloss.classList.add('small-caps')
        }
    } else gloss.textContent = (final) ? "Define new" : "??"


    wrapper.append(form, pos, binding, gloss)
    for (let elem of wrapper.children) {
        elem.classList.add('clear')
    }
    wrapper.addEventListener('click', (e) => {
        wrapper.parentElement.classList.remove('show')
    })

    if (active) wrapper.classList.add('active')

    return wrapper
}

export const LanguageVarietyList = (varieties) => {
    const list = document.createElement('div')
    list.id = 'language-variety-list'

    for (let v of varieties) {

        list.append(LanguageVariety(v))
    }
    const addButton = document.createElement('button')
    addButton.classList.add('language-variety-add', 'icon')
    addButton.textContent = 'add'

    list.append(addButton)

    return list
}

export const LanguageVariety = (v) => {
    const item = document.createElement('div')
    item.classList.add('language-variety-item')

    const name = document.createElement('span')
    name.setAttribute('contenteditable', true)
    name.classList.add('language-variety-name')
    name.textContent = v.name

    if (v.shortName) {
        const shortName = document.createElement('span')
        shortName.setAttribute('contenteditable', true)
        shortName.classList.add('language-variety-short-name')
        shortName.textContent = v.shortName
    }

    const deleteButton = document.createElement('button')
    deleteButton.classList.add('language-variety-delete', 'icon')
    deleteButton.textContent = 'delete_forever'
    deleteButton.addEventListener('click', (e) => {
        window.electronAPI.deleteVariety(v.id)
        e.target.parentElement.remove()
    })

    item.id = `variety-${v.id}`
    item.append(name, shortName, deleteButton)

    return item

}