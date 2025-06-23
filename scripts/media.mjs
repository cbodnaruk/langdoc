import { startMove } from "./resize.mjs";
window.electronAPI.loadMedia((file,offset)=>{
    if(file){

                const media = document.createElement('video')
                // let url = URL.createObjectURL(new File(file, 'media'))	  
                media.src = file;
                media.controls = false;
                media.autoplay = false;
                media.id = 'media'
                media.setAttribute('offset',offset)
                let wrapper = document.getElementById('video-wrapper')
                wrapper.innerHTML = ''
                wrapper.addEventListener('mousedown',startMove)
                wrapper.appendChild(media)


}})

