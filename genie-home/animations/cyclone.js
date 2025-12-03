export function teleportEffect(){
    document.body.classList.add("cyclone");
    setTimeout(()=>document.body.classList.remove("cyclone"),800);
}

