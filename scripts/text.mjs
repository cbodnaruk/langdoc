import { FileList, GlossLine } from './components.mjs'
import { initEditor } from './glossEditor.mjs'

import { ClipboardFormat, getElementIndex, Line } from './classes.mjs'

var textManager
export var openText
window.addEventListener('load', async () => {

    textManager = document.querySelector('#text-manager')
    loadTexts()


})
let settings = null
async function loadTexts() {
    settings = JSON.parse(await window.electronAPI.getSettings())
    window.electronAPI.getTextList().then((list) => {
        document.getElementById('text-loader').remove()
        const files = FileList(list)
        files.id = 'text-list'
        textManager.append(files)
        files.addEventListener('click', openTextFromMenu)
    })
    const loader = document.createElement('span')
    loader.classList.add('loader')
    loader.id = 'text-loader'
    textManager.append(loader)
}

function openTextFromMenu(e) {

    document.getElementById('text-editor').innerHTML = ''
    if (e.target.classList.contains('file-name')) {
        window.electronAPI.loadTextFromFile(e.target.textContent)
    } else {
        window.electronAPI.loadTextFromFile(e.target.children[0].textContent)
    }

}


window.electronAPI.showFile((lines) => {
    openText = lines
    const textEditor = document.getElementById('text-editor')

    for (let line of lines) {
        const newLine = GlossLine(line, settings)
        textEditor.append(newLine)
        newLine.children[1].addEventListener('mouseenter', highlightLine)
        newLine.querySelector('.copy-button').addEventListener('click', copyLine)
        newLine.querySelector('.play-button').addEventListener('click', playMedia)


    }
    initEditor()
})

function highlightLine(e) {
    e.target.addEventListener('mouseleave', unhighlightLine)
    e.target.parentElement.classList.add('hovered-line')
}

function unhighlightLine(e) {
    e.target.removeEventListener('mouseleave', unhighlightLine)
    e.target.parentElement.classList.remove('hovered-line')
}

function copyLine(e) {
    const type = settings.copyFormat.type
    const line = copyFormatters[settings.copyFormat.formatter](e)

    const formattedLine = new Blob([line], { type: type })
    navigator.clipboard.write([new ClipboardItem({ [type]: formattedLine })])
    const notification = document.createElement('div')
    notification.classList.add('notification')
    notification.textContent = 'Copied!'
    e.target.append(notification)
    setTimeout(() => notification.remove(), 1000)

}

function playMedia(e) {
    const id = getElementIndex(e.target.closest('.text-line-wrapper'))
    const media = document.getElementById('media')
    if (e.target.textContent == 'play_arrow') {
        media.currentTime = (parseInt(openText[id].timestamp) + parseInt(media.getAttribute('offset'))) / 1000
        media.play()
        setTimeout(() => {
            media.pause()
            e.target.textContent = 'play_arrow'
        }, openText[id].duration + 200)
        e.target.textContent = 'pause'
    } else {
        media.pause()
        e.target.textContent = 'play_arrow'
    }
}

//Clipboard formatters
window.electronAPI.changeClipboard((format) => {
    settings.copyFormat = format
    window.electronAPI.saveSettings(JSON.stringify(settings))
})

const copyFormatters = {
    text: (e) => {
        const lineBreak = '<br>'
        const gl1 = `<span style="font-style:italic">${e.target.parentElement.parentElement.children[0].children[0].textContent}</span>`
        const glossItems = e.target.parentElement.parentElement.children[0].children[1].children
        let gl2 = '<span>'
        let gl3 = '<span>'
        for (let item of glossItems) {
            gl2 += item.children[0].innerHTML + '\t'
            let gl3Pre = item.querySelector('.dropdown-display')
            let smallCaps = (gl3Pre.classList.contains('small-caps'))
            gl3 += `<span ${(smallCaps) ? 'style="font-variant: small-caps"' : ''}>${gl3Pre.textContent}</span>` + '\t'
        }
        gl2 += '</span>'
        gl3 += '</span>'
        const glt = `<span>${e.target.parentElement.parentElement.children[0].children[2].textContent}</span>`
        const variety = (e.target.parentElement.parentElement.children[1].value != 'default') ? settings.varieties.find(o => o.id == e.target.parentElement.parentElement.children[1].value) : { name: '' }
        const varietyText = (settings.varietiesEnabled) ? `, ${variety.name}` : ''
        const meta = `<span>${e.target.parentElement.parentElement.children[0].children[3].textContent + varietyText}</span>`
        const line = gl1 + lineBreak + gl2 + lineBreak + gl3 + lineBreak + glt + lineBreak + meta
        return line
    },
    gb4e: (e) => {
        const linebreak = '\n'
        const gl1 = `\\glll ${e.target.parentElement.parentElement.children[0].children[0].textContent} \\\\`
        const glossItems = e.target.parentElement.parentElement.children[0].children[1].children
        let gl2 = ''
        let gl3 = ''
        for (let item of glossItems) {
            gl2 += item.children[0].textContent + ' '
            let gl3Pre = item.querySelector('.dropdown-display')
            let smallCaps = (gl3Pre.classList.contains('small-caps'))
            gl3 += `${(smallCaps) ? '\\textsc{' : ''}${gl3Pre.textContent}${(smallCaps) ? '}' : ''}` + ' '
        }
        gl2 += '\\\\'
        gl3 += '\\\\'
        const glt = `\\glt ${e.target.parentElement.parentElement.children[0].children[2].textContent} \\\\`
        const variety = (e.target.parentElement.parentElement.children[1].value != 'default') ? settings.varieties.find(o => o.id == e.target.parentElement.parentElement.children[1].value) : { name: '' }
        const varietyText = (settings.varietiesEnabled) ? `, ${variety.name}` : ''
        const meta = `(${e.target.parentElement.parentElement.children[0].children[3].textContent + varietyText}) \\\\`
        const line = gl1 + linebreak + gl2 + linebreak + gl3 + linebreak + glt + linebreak + meta
        return line
    },
    table: (e) => {
        const table = document.createElement('table')
        const row1 = table.insertRow()
        const row2 = table.insertRow()
        const row3 = table.insertRow()
        const row4 = table.insertRow()
        const row5 = table.insertRow()
        const glossItems = e.target.parentElement.parentElement.children[0].children[1].children
        const colSpan = glossItems.length

        const gl1Cell = row1.insertCell()
        gl1Cell.colSpan = colSpan
        gl1Cell.innerHTML = `<i>${e.target.parentElement.parentElement.children[0].children[0].textContent}</i>`

        
        for (let item of glossItems) {
            const gl2Cell = row2.insertCell()
            gl2Cell.innerHTML = item.children[0].innerHTML
            const gl3Cell = row3.insertCell()
            let gl3Pre = item.querySelector('.dropdown-display')
            let smallCaps = (gl3Pre.classList.contains('small-caps'))
            gl3Cell.innerHTML = `<span ${(smallCaps) ? 'style="font-variant: small-caps"' : ''}>${gl3Pre.textContent}</span>`
        }

        const gltCell = row4.insertCell()
        gltCell.colSpan = colSpan
        gltCell.innerHTML = e.target.parentElement.parentElement.children[0].children[2].textContent

        const variety = (e.target.parentElement.parentElement.children[1].value != 'default') ? settings.varieties.find(o => o.id == e.target.parentElement.parentElement.children[1].value) : { name: '' }
        const varietyText = (settings.varietiesEnabled) ? `, ${variety.name}` : ''
        const metaCell = row5.insertCell()
        metaCell.colSpan = colSpan
        metaCell.innerHTML = e.target.parentElement.parentElement.children[0].children[3].textContent + varietyText

        return table.outerHTML

    }
}