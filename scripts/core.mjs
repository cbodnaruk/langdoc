
    window.electronAPI.setVisibility((val, label) => {
        const labels = {
            Lexicon: 'dictionary-wrapper',
            'Text List': 'text-manager-wrapper',
            Video: 'video-wrapper'
        }
        document.getElementById(labels[label]).style.display = (val)?"flex":"none";

    }
    )
    window.electronAPI.progressUpdate((text)=>{
        let progress = document.getElementById("progress")
        progress.textContent = text
        progress.style.display = 'block'
        if (text == 'Done'){
            progress.style.display == 'none'
        }
    })

    