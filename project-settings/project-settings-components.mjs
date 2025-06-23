export const LanguageVarietyList = (varieties) => {
    const list = document.createElement('div')
    list.id = 'language-variety-list'

    for (let v of varieties){

        list.append(LanguageVariety(v))
    }
    const addButton = document.createElement('button')
    addButton.classList.add('language-variety-add','icon')
    addButton.textContent = 'add'

    list.append(addButton)

    return list
}

export const LanguageVariety = (v) =>{
    const item = document.createElement('div')
    item.classList.add('language-variety-item')

    const name = document.createElement('span')
    name.setAttribute('contenteditable', true)
    name.setAttribute('fieldType', 'name')
    name.classList.add('language-variety-name')
    name.textContent = v.name


    const shortName = document.createElement('span')
    shortName.setAttribute('contenteditable', true)
    shortName.classList.add('language-variety-short-name')
    shortName.setAttribute('fieldType', 'shortName')
    if (v.shortName){

    shortName.textContent = v.shortName
    }

    const deleteButton = document.createElement('button')
    deleteButton.classList.add('language-variety-delete','icon')
    deleteButton.textContent = 'delete_forever'


    item.id = `variety-${v.id}`
    item.append(name, shortName, deleteButton)
    return item

}