const { app, BrowserWindow, ipcMain, Menu, MenuItem, dialog, shell, Tray, crashReporter } = require('electron')
const fs = require('fs/promises')
const { parse } = require('csv-parse/sync')
const path = require('path')
const pm = require('./local_modules/project-manager.cjs')
const flex = require('./local_modules/flex-porter.cjs')
const elan = require('./local_modules/elan-porter.cjs')
const cldf = require('./local_modules/cldf-porter.cjs')
const media = require('./local_modules/audio-snippets.cjs')
const { type } = require('os')

const appName = "LingBook"

let tray = null

let win
let projectFile = null
let settings
const template = [
    {
        role: 'fileMenu',
        submenu: [
            {label: 'Save project',
                click: saveProject,
                accelerator: 'CmdOrCtrl+S',
            },
            {
                label: 'Open project...',
                click: openProject,
                accelerator: 'CmdOrCtrl+O',
            },
            {
                label: 'Import FLEx project...',
                click: importFlex
            },
            {type: 'separator'},
            {
                label:'Project settings...',
                click: openProjectSettings
            },
            {label: 'Export project to CLDF...',
            click: cldf.export},
            {
                role: 'quit'
            }
        ]
    },
    {
        role: 'editMenu'
    },
    {
        role: 'viewMenu',
        submenu: [
            {
                label: 'Lexicon',
                type: 'checkbox',
                checked: true,
                click: setVisibility
            },
            {
                label: 'Text List',
                type: 'checkbox',
                checked: true,
                click: setVisibility
            },
            {
                label: 'Video',
                type: 'checkbox',
                checked: false,
                click: setVisibility
            },
            {type: 'separator'},
            {role: 'toggleDevTools'},
            {role: 'reload'}
        ]
    },
    {
        label: 'Texts',
        submenu: [{
            label: 'Import from ELAN...',
            click: importElan
        },{
            type: 'separator'
        },
        {label: 'Copy format',submenu:[
        {label: 'Copy lines as text',
            type: 'radio',
            click: changeClipboard
        },
        {label: 'Copy lines as table',
            type: 'radio',
            click: changeClipboard
        },
        {label: 'Copy lines as gb4e/LaTeX',
            type: 'radio',
            click: changeClipboard
        }]},
        {type: 'separator'}

    ]
    }
]

const ensureDataFolderExists = async () => {
    try {
        await fs.access('data');
    } catch (err) {
        if (err.code === 'ENOENT') {
            await fs.mkdir('data');
            await fs.mkdir('data/texts')
            await fs.writeFile('data/dictionary.json','[]')
        } else {
            throw err;
        }
    }
};

ensureDataFolderExists();


Menu.setApplicationMenu(Menu.buildFromTemplate(template))

const createWindow = () => {
    win = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            spellcheck: false
        }
    })
    win.maximize()

    ipcMain.on('save-dictionary', (event, dict) => {
        fs.writeFile('data/dictionary.json', JSON.stringify(dict))
    })

    ipcMain.handle('load-text-list', loadTextList)

    ipcMain.on('load-text-from-file', (event, file) => {
        console.log("Loading file", file);
        pm.openFile = file
        fs.readFile(`data/texts/${file}.json`, 'utf-8').then(data => {
            pm.openData = JSON.parse(data)
            showFile(JSON.parse(data).body)
            
        })

    })
    ipcMain.on('edit-text', (event, edit) => {
        switch (edit.type) {
            case "morpheme_id":
                pm.openData.body[edit.line].words[edit.word].morphs[edit.morpheme].id = edit.val;
                break;
            case "full-save":
                pm.openData.body = edit.fullData;
                for (let line of pm.openData.body){
                    for (let word of line.words){
                        for (let index in word.morphs){
                            if (word.morphs[index].form == "") word.morphs.splice(index,1)

                        }
                    }
                }
                break;
            case "word":
                pm.openData.body[edit.line].words[edit.wordIndex].morphs[edit.morphIndex].form = edit.val
                pm.openData.body[edit.line].words[edit.wordIndex].form = pm.openData.body[edit.line].line.split(' ')[edit.wordIndex]

            default:
                pm.openData.body[edit.line][edit.type] = edit.val;
                break;
        }

        fs.writeFile(`./data/texts/${pm.openFile}.json`, JSON.stringify(pm.openData))
    })

    ipcMain.on('inspect', (e, loc) => {
        win.webContents.inspectElement(loc.x, loc.y)
    })
    win.loadFile('index.html')

}


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

console.log(app.getPath('crashDumps'))
crashReporter.start({ submitURL: '', uploadToServer: false })

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

app.whenReady().then(async () => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
    

})

async function loadTextList() {
    const dir = fs.readdir('data/texts').then(async (dir) => {
        let files = []
        for (let i in dir) {
            let file = await fs.open(`data/texts/${dir[i]}`)
            let stats = await file.stat()
            files.push({ id: i, fileName: dir[i], size: stats.size, created: stats.birthtimeMs, modified: stats.mtimeMs })
            file.close()
        }

        return files
    })
    return dir

}

async function showFile(lines) {
    win.webContents.send('show-file', lines)
    let menu = Menu.buildFromTemplate(template)

    if (pm.openData.header.media){

    win.webContents.send('load-media',await media.load(pm.openData.header.media[0].url),pm.openData.header.media[0].timeOrigin??0)
    
    

    let mediaMenu = new MenuItem({label: 'Media', submenu:[]})
    for (let media of pm.openData.header.media){
        let mediaItem = new MenuItem({label: path.basename(media.url), click: ()=>{win.webContents.send('load-media',media.url,media.timeOrigin)},type: 'radio',checked: (media.url == pm.openData.header.media[0].url)})
        mediaMenu.submenu.append(mediaItem)
    }
    menu.append(mediaMenu)
}
    Menu.setApplicationMenu(menu)
}

function saveProject(){
    if (projectFile){
        pm.saveProject(projectFile).then(()=>{
            console.log("File saved successfully")
        })
    } else {
       let path = dialog.showSaveDialogSync({title:"Save Project",filters:[{name:`${appName} Project`,extensions:["lbproj"]}]})
       if (path){
        pm.saveProject(path).then(()=>{
            console.log("File saved successfully")
        })}
    }
}

function openProject(){
try {
        let path = dialog.showOpenDialogSync({title:"Open Project",filters:[{name:`${appName} Project`,extensions:["lbproj"]}]})
        if (path){projectFile = path
        pm.openProject(path[0]).then(()=>{
            win.reload()
        })}
} catch (error) {
    console.log(error);
    
    
}}

let projectSettings
async function openProjectSettings(){


    projectSettings = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'project-settings/project-settings-preload.js'),
            spellcheck: false
        },
        maximizable:false
    })
    projectSettings.setMenuBarVisibility(false)
    projectSettings.loadFile('project-settings/project-settings.html')

}

ipcMain.handle('get-glottolog-data', async () => {
    const glottologData = await fetch(`https://raw.githubusercontent.com/glottolog/glottolog-cldf/master/cldf/languages.csv`)
    const glottologDataText = await glottologData.text()
    return glottologDataText
})

ipcMain.handle('lookup-glottocode', async (event, glottocode) => {
    let glottologData
    try {
        glottologData = await fetch(`https://raw.githubusercontent.com/glottolog/glottolog-cldf/master/cldf/languages.csv`)
    } catch (err) {
        throw new Error('Failed to fetch Glottolog data: ' + err.message)
        return false
    }
    const glottologDataText = await glottologData.text()
    
    const rows = glottologDataText.split('\n')
    const language = rows.find(row => row.split(',')[0] === glottocode)
    if (language) {
        const languageData = {
            name: language.split(',')[1],
            glottocode: glottocode,
            latitude: language.split(',')[3],
            longitude: language.split(',')[4],
            macroarea: language.split(',')[2]
        }
        return languageData
    }
})

ipcMain.handle('lookup-language-name', async (event, languageName) => {
    let glottologData
    try {
        glottologData = await fetch(`https://raw.githubusercontent.com/glottolog/glottolog-cldf/master/cldf/languages.csv`)
    } catch (err) {
        return false
    }
    let altNames
    try {
        altNames = await fetch(`https://raw.githubusercontent.com/glottolog/glottolog-cldf/master/cldf/names.csv`)
    } catch (err) {
        return false
    }
    const glottologDataText = await glottologData.text()
    const altNamesText = await altNames.text()
    const rows = glottologDataText.split('\n')
    const altRows = altNamesText.split('\n')
    let possibleGlottocodes = new Set([])
    for (let r of altRows){
        if (r.split(',')[2] && r.split(',')[2].toLowerCase().includes(languageName.toLowerCase())){
            possibleGlottocodes.add(r.split(',')[1])
        }
    }

    let possibleGlottologData = []
    for (let glottocode of possibleGlottocodes){
        const language = rows.find(row => row.split(',')[0] === glottocode)
        if (language){
            possibleGlottologData.push({
                name: language.split(',')[1],
                glottocode: glottocode,
                latitude: language.split(',')[3],
                longitude: language.split(',')[4],
                macroarea: language.split(',')[2]
            })
        }
    }
    return possibleGlottologData
})

ipcMain.on('save-settings',(e, rsettings)=>{
    console.log(rsettings)
    settings = JSON.parse(rsettings)
    fs.writeFile('data/project-settings.json',rsettings)
    if (projectSettings) projectSettings.close()
})

ipcMain.handle('get-settings',async (e)=>{
    let data
    try {
        data = await fs.readFile('data/project-settings.json', 'utf-8')
        settings = JSON.parse(data)
    } catch (err) {
        if (err.code === 'ENOENT') {
            data = JSON.stringify({})
        } else {
            throw err
        }
    }
    return data
})

ipcMain.on('open-glottolog', e => {
    if (settings) {
        shell.openExternal(`https://glottolog.org/resource/languoid/id/${settings.glottocode}`)
    }
})

ipcMain.on('toggle-varieties', (e, val) => {
    if (val) {
        settings.varietiesEnabled = true
    } else {
        settings.varietiesEnabled = false
    }
})

function importFlex(){
    
    let save = (projectFile) ? 2 : dialog.showMessageBoxSync(win,{
        type: 'question',
        buttons: ['Cancel','Don\'t Save','Save'],
        defaultId: 0,
        title: 'Save Current Project',
        message: 'Do you wish to save your current project before you continue?',
        detail: 'Importing a FLEx project will close your current project. Unsaved changes will be LOST.',


    })
    if (save == 2) {
        saveProject()
    }
    if (save != 0){
    const project = dialog.showOpenDialogSync({filters:[{name:'FLEx Project',extensions:['fwdata']}]})
    if (project) flex.import(project[0],win)}
}

async function importElan(){
    const data = await elan.import()
    pm.openData = data
    showFile(data.body)
            
}

function setVisibility(e){
    win.webContents.send('set-visibility',e.checked,e.label)
}

function changeClipboard(e){
    formats = {'Copy lines as text':new ClipboardFormat('text','text/html'),'Copy lines as gb4e/LaTeX':new ClipboardFormat('gb4e','text/plain'),'Copy lines as table': new ClipboardFormat('table','text/html')}
    settings.copyFormat = formats[e.label]
    win.webContents.send('change-clipboard',settings.copyFormat)
}
class ClipboardFormat {
    formatter;
    type;
    constructor(formatter, type){
        this.formatter = formatter;
        this.type = type;
    }
}