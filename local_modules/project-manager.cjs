const fs = require('fs/promises')
const JSZip = require('jszip')
const pathjs = require('path')

exports.path = ""

exports.openFile = ""
exports.openData = {}

exports.openProject = async (path) =>{
    let rootpath = pathjs.resolve(__dirname,'../')

    exports.path = path

    const file = await fs.readFile(path)

    let zip = new JSZip()
    try {
        zip = await JSZip.loadAsync(file)

    } catch(err) {
        console.log(err)}


    try {
        await fs.rm(pathjs.join(rootpath,'/data'),{recursive: true})
    } catch(err) {
        console.log(err)
    }

    try {
        await fs.mkdir(pathjs.join(rootpath,'/data'))
        zip.forEach( async (relPath,file)=>{
            if (!file.dir){
                let text = await file.async("text")
                fs.writeFile(pathjs.join(rootpath,'/data',file.name),text)
            } else {
                await fs.mkdir(pathjs.join(rootpath,'/data',file.name))
            }
        })


    } catch(err) {
        console.log(err)
    }


    //reload everything
    return true

}

exports.saveProject = async (path) =>{
    console.log(pathjs.resolve(__dirname,'../data'))
    const dir = await fs.readdir(pathjs.resolve(__dirname,'../data'))
    const texts = await fs.readdir(pathjs.resolve(__dirname,'../data/texts'))
    const zip = new JSZip()

    for (const file of dir){
        console.log(pathjs.resolve(__dirname,'../data/' + file))
        if (file.split('.').length > 1){
            const data = await fs.readFile(pathjs.resolve(__dirname,'../data/' + file),'utf8')
            zip.file(file,data)
        }

    }
    let textdir = zip.folder('texts')
    for (const file of texts){
        const data = fs.readFile(pathjs.resolve(__dirname,'../data/texts/'+file),'utf8')
        textdir.file(file,data)
    }

    const out = await zip.generateAsync({type:"nodebuffer"})

    return fs.writeFile(path,out)
}