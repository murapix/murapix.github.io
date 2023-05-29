// ************ Options ************

let options = {}

function getStartOptions() {
    return {
        autosave: true,
        newGameConfirmation: true
    }
}

function toggleOpt(name) {
    options[name] = !options[name];
}
function changeTreeQuality() {
    document.body.style.setProperty('--hqProperty1', "4px solid");
    document.body.style.setProperty('--hqProperty2a', "-4px -4px 4px rgba(0, 0, 0, 0) inset");
    document.body.style.setProperty('--hqProperty2b', "");
    document.body.style.setProperty('--hqProperty3', "none");
}
function toggleAuto(toggle) {
    Vue.set(player[toggle[0]], [toggle[1]], !player[toggle[0]][toggle[1]]);
}