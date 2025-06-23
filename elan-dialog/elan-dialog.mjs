window.electronAPI.onTierDataReceived(data=>{
    tiers = data
    showOptions(data)
})

let tiers
let textTiers = []
let translationTiers = []
function showOptions(types,speakers=[]){
    document.querySelector('.tiers').innerHTML = ''
    let typeList = document.createElement('div')

    const listHeadings = document.createElement('div')
    listHeadings.classList.add('list-headings')
    const textHeading = document.createElement('div')
    textHeading.classList.add('text-heading')
    textHeading.innerText = 'Tier Name'

    let optionHeadings = []
    for (let i = 0; i<numberOfSpeakers; i++){
        optionHeadings.push(...OptionsHeadings(i))
    }
    listHeadings.append(textHeading, ...optionHeadings)

    typeList.append(listHeadings)
    if (Array.isArray(types)){
        for (let type of types){
            typeList.append(Tier(type))
        }
    }
    typeList.classList.add('tier-list')
    typeList.id = 'tier-list'
    document.querySelector('.tiers').append(typeList)
    const submitButton = document.createElement('button')
    submitButton.innerText = 'Save' 
    submitButton.classList.add('submit-button')
    submitButton.addEventListener('click', () => {
        if (textTiers.length == numberOfSpeakers && translationTiers.length == numberOfSpeakers){
            let dataObject = {text: textTiers, translation: translationTiers}
            window.electronAPI.sendTierData(JSON.stringify(dataObject))
        } else {
            alert('Please select a text and translation tier.')
        }
    })
    document.querySelector('.tiers').append(submitButton)

}

function OptionsHeadings(i){
    let participant = i+1
    const textOptionHeading = document.createElement('div')
    textOptionHeading.classList.add('text-option-heading','option-heading')
    textOptionHeading.innerText = `Text-${i+1}`
    const translationOptionHeading = document.createElement('div')
    translationOptionHeading.classList.add('translation-option-heading','option-heading')
    translationOptionHeading.innerText = `Translation-${i+1}`

    return [textOptionHeading, translationOptionHeading]
}

function Tier(type){
    let tierName = type
    const tierDiv = document.createElement('div')
    tierDiv.classList.add('tier')
    const tierNameDiv = document.createElement('div')
    tierNameDiv.classList.add('tier-name')
    tierNameDiv.innerText = tierName

    let tierOptions = []
    for (let i = 0; i<numberOfSpeakers; i++){
        tierOptions.push(...Options(tierName,i))
    }


    tierDiv.append(tierNameDiv, ...tierOptions)
    return tierDiv
}

function Options(tierName,i){
    const tierTextOption = document.createElement('input')
    tierTextOption.type = 'radio'
    tierTextOption.name = `tier-text-${i}`
    tierTextOption.value = tierName

    const tierTranslationOption = document.createElement('input')
    tierTranslationOption.type = 'radio'
    tierTranslationOption.name =  `tier-translation-${i}`
    tierTranslationOption.value = tierName
    tierTextOption.id = `text-${i}-${tierName}`
    tierTranslationOption.id = `translation-${i}-${tierName}`
    tierTextOption.classList.add('tier-option')
    tierTranslationOption.classList.add('tier-option')
    tierTextOption.addEventListener('change', changeSelection)
    tierTranslationOption.addEventListener('change', changeSelection)
    return [tierTextOption, tierTranslationOption]  
}

function changeSelection(e){
    let selected = e.target.value
    let selectedType = e.target.id.split('-')[0]
    let selectedSpeaker = e.target.id.split('-')[1]
    if (selectedType == 'text'){
        textTiers[selectedSpeaker] = selected
    } else if (selectedType == 'translation') {
        translationTiers[selectedSpeaker] = selected
    }
}


const speakerNumberInput = document.getElementById('number-of-speakers')
let numberOfSpeakers = 1
speakerNumberInput.addEventListener('change', (e) => {
    numberOfSpeakers = e.target.value
    showOptions(tiers)
})