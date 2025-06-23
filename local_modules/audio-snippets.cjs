const {ipcMain, dialog} = require('electron');
const fs = require('fs/promises');
const pm = require('./project-manager.cjs')
exports.snipAudioFile = (file)=>{
    
    let audioBuffer = decodeFileAudioData(file);


    
    // audio.js can create an AudioBuffer with the whole file. When a request is recieved for the audio via IPC (on load or on demand depending on speed), the start time and duration are converted to samples by multiplying by AudioBuffer.sampleRate, and the required parts of the array are sent back (via TypedArray.slice()).

    // Also still need to allow users to add audio (can't easily bring it from ELAN I think.)
}

async function decodeFileAudioData(file) {
    const audio = await import('audio-decode')
    let audioBuffer = await audio.decoders(file)
    return audioBuffer;
  }

  exports.load =  async (path)=>{
    path = path.replace('file:///','')
    try {
        let data = await fs.access(path)
        // let blob = new Blob(data);
        return path;
    } catch (error) {
        console.log(error);
        const usr = await dialog.showMessageBox({message:'File not found',type:'error',detail:`The media file ${path} does not appear to exist. Locate the file?`,buttons:["Locate","Cancel"]})
        if (usr.response == 0){
            let res = await dialog.showOpenDialog({properties:['openFile']})
            if (!res.canceled){
                const save = await dialog.showMessageBox({message:'Save new file path?',type:'question',buttons:['Yes','No']})
                if (save.response == 0){
                savePath(path,res.filePaths[0])
                return exports.load(res.filePaths[0])
                // set the path to the new file
                
            }}
        }
        return false
    }
    

  }


    async function savePath(oldPath,newPath){
        let media = pm.openData.header.media.find(m=>m.url == "file:///"+oldPath)
        media.url = "file:///"+newPath
        fs.writeFile(`./data/texts/${pm.openFile}.json`,JSON.stringify(pm.openData))
    }