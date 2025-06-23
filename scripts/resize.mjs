var resize
var dragStart
var dragging = false
var border = null
window.addEventListener('load', async ()=>{
    resize = document.querySelectorAll('.resize')
    resize.forEach((elem)=>{
        elem.addEventListener('mousedown', startResize)
        
    })
})

export function startResize(e){
    border = e.target
    dragStart = [e.x, e.y]
    document.addEventListener('mousemove', resizeElement)
    document.addEventListener('mouseup', stopResize)
    dragging = true
}

function stopResize(e){
    document.removeEventListener('mousemove', resizeElement)
    document.removeEventListener('mouseup', stopResize)
    dragging = false
}

function resizeElement(e){
    let sign = (border.classList.contains('neg')) ? -1 : 1
    let parent = border.parentElement
    if (border.classList.contains('rx')){
        let parentWidth = parent.offsetWidth
        let delta = e.x - dragStart[0]
        parent.style.width = `${parentWidth + delta * sign}px`
        dragStart = [e.x, e.y]
    } else if (border.classList.contains('ry')){
        let parentHeight = parent.offsetHeight
        let delta = dragStart[1] - e.y
        parent.style.height = `${parentHeight + delta * sign}px`
        dragStart = [e.x, e.y]
    }

}

export function startMove(e){
    dragStart = [e.x, e.y]
    document.addEventListener('mousemove', moveElement)
    document.addEventListener('mouseup', stopMove)
    dragging = true
}
function stopMove(e){
    document.removeEventListener('mousemove', moveElement)
    document.removeEventListener('mouseup', stopMove)
    dragging = false
}
function moveElement(e){
    let parent = e.target.parentElement
    let deltaX = e.x - dragStart[0]
    let deltaY = e.y - dragStart[1]
    parent.style.left = `${parent.offsetLeft + deltaX}px`
    parent.style.top = `${parent.offsetTop + deltaY}px`
    dragStart = [e.x, e.y]
}