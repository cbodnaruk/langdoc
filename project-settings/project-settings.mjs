import *  as L from '../node_modules/leaflet/dist/leaflet-src.esm.js'
import { LanguageVarietyList, LanguageVariety } from './project-settings-components.mjs'

const languageNameInput = document.getElementById('language-name')
const languageCodeInput = document.getElementById('language-code')
const languageNameSearchButton = document.getElementById('language-name-search')
const languageCodeSearchButton = document.getElementById('language-code-search')
const saveButton = document.getElementById('save-button')
const settingsReference = { name: languageNameInput, glottocode: languageCodeInput }
let settings = {
    name: '',
    glottocode: '',
    latitude: 0,
    longitude: 0,
    varietiesEnabled: false,
    varieties: []
}

languageCodeSearchButton.addEventListener('click', async (e) => {
    if (document.body.querySelector('.error')) document.body.querySelector('.error').remove()
    const glottocode = languageCodeInput.value
    if (glottocode) {
        const glottologData = await window.electronAPI.lookupGlottocode(glottocode)
        if (glottologData) {
            languageNameInput.value = glottologData.name
            for (const [key, val] of Object.entries(glottologData)) {
                settings[key] = val
            }
            updateMap(settings.latitude, settings.longitude)
        } else {
            const error = document.createElement("span")
            error.classList.add('error')
            error.textContent = "No language found with that glottocode or unable to connect to Glottolog"
            e.target.parentElement.append(error)
        }
    }
})

languageNameSearchButton.addEventListener('click', async (e) => {
    if (document.body.querySelector('.error')) document.body.querySelector('.error').remove()
    const languageName = languageNameInput.value

    if (languageName) {
        const glottocodeListWrapper = document.createElement('div')
        glottocodeListWrapper.classList.add("loader")
        languageNameInput.parentElement.appendChild(glottocodeListWrapper)
        const glottologDatas = await window.electronAPI.lookupLanguageName(languageName)
        if (glottologDatas === false) {
            const error = document.createElement("span")
            error.classList.add('error')
            error.textContent = "Unable to connect to Glottolog"
            e.target.parentElement.append(error)
        } else {

            if (document.querySelector('.glottocode-list-wrapper')) {
                document.querySelector('.glottocode-list-wrapper').remove()
            }

            // Create a list of glottocodes for the user to select from
            glottocodeListWrapper.classList.remove('loader')
            glottocodeListWrapper.classList.add('glottocode-list-wrapper')
            const glottocodeList = document.createElement('select')
            glottocodeList.id = 'glottocode-list'

            const option1 = document.createElement('option')
            option1.value = ''
            option1.textContent = "Select result:"
            glottocodeList.appendChild(option1)
            for (let glottologData of glottologDatas) {
                const option = document.createElement('option')
                option.value = JSON.stringify(glottologData)
                option.textContent = `${glottologData.glottocode} (aka ${glottologData.name})`
                glottocodeList.appendChild(option)
            }
            glottocodeListWrapper.appendChild(glottocodeList)

            const glottocodeListConfirm = document.createElement('button')
            glottocodeListConfirm.textContent = "Confirm"
            glottocodeListWrapper.appendChild(glottocodeListConfirm)

            glottocodeListConfirm.addEventListener('click', async (e) => {
                e.target.parentElement.remove()
            })

            glottocodeList.addEventListener('change', e => {
                if (e.target.value != "") {
                    const languageData = JSON.parse(e.currentTarget.value)
                    languageCodeInput.value = languageData.glottocode
                    for (const [key, val] of Object.entries(languageData)) {
                        settings[key] = val
                    }
                    settings.name = languageNameInput.value
                    updateMap(settings.latitude, settings.longitude)
                    if (document.body.querySelector('.error')) document.body.querySelector('.error').remove()
                }
            })
        }
    }
})

languageNameInput.addEventListener('input', (e) => {
    settings.name = languageNameInput.value
})

saveButton.addEventListener('click', (e) => {
    window.electronAPI.saveSettings(JSON.stringify(settings))
})
var map
function updateMap(lat, long) {
    if (document.getElementById("map").children.length == 0) {
        map = L.map('map', { zoomControl: false }).setView([lat, long], 5);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        var marker = L.marker([lat, long]).addTo(map);
    } else {
        map.setView([lat, long], 5);
        var marker = L.marker([lat, long]).addTo(map);
    }
}

window.electronAPI.getSettings().then(s => {
    settings = JSON.parse(s)
    if (settings.latitude) {
        updateMap(settings.latitude, settings.longitude)
        languageNameInput.value = settings.name
        languageCodeInput.value = settings.glottocode
    }
    if (settings.varietiesEnabled) {
        document.getElementById('variety-editor').style.display = 'flex'
        document.getElementById('enable-varieties').checked = true
    }
    const list = LanguageVarietyList(settings.varieties)
    document.querySelector('#variety-editor').appendChild(list)

    document.querySelector('.language-variety-add').addEventListener('click', addVariety)
    let deletes = document.querySelectorAll('.language-variety-delete')
    for (let d of deletes) {
        d.addEventListener('click', deleteVariety)
    }
    let adds = document.querySelectorAll('.language-variety-name, .language-variety-short-name')
    for (let a of adds) {
        a.addEventListener('input', editVariety)
    }

})

function deleteVariety(e){
    settings.varieties.splice(settings.varieties.indexOf(settings.varieties.find(v => v.id == e.target.parentElement.id.split('-')[1])), 1)
    e.target.parentElement.remove()
}
function addVariety(e){
    let newVariety = LanguageVariety({ name: ' ', shortName: ' ', id: (settings.varieties.length > 0) ? settings.varieties[settings.varieties.length - 1].id + 1 : 1 })
    e.target.before(newVariety)
    newVariety.querySelector('.language-variety-delete').addEventListener('click', deleteVariety)
    newVariety.querySelectorAll('.language-variety-name, .language-variety-short-name').forEach(a => a.addEventListener('input', editVariety))
    settings.varieties.push({ name: ' ', shortName: ' ', id: (settings.varieties.length > 0) ? settings.varieties[settings.varieties.length - 1].id + 1 : 1 })
}

function editVariety(e){
    let type = e.target.getAttribute('fieldtype')
    settings.varieties.find(v => v.id == e.target.parentElement.id.split('-')[1])[type] = e.target.textContent
}

document.getElementById('open-glottolog').addEventListener('click', e => {
    window.electronAPI.openGlottolog()
})

document.getElementById('enable-varieties').addEventListener('click', e => {
    window.electronAPI.toggleVarieties(e.checked)
    if (e.target.checked) {
        document.querySelector('#variety-editor').style.display = 'flex'
        settings.varietiesEnabled = true
    } else {
        document.querySelector('#variety-editor').style.display = 'none'
        settings.varietiesEnabled = false
    }

})

document.addEventListener('visibilitychange',e=>window.electronAPI.saveSettings(JSON.stringify(settings)))