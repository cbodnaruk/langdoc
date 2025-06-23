document.addEventListener('contextmenu',(e)=>{
    window.electronAPI.inspect({x:e.x,y:e.y})
})