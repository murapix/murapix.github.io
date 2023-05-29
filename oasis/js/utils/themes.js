// ************ Themes ************
var colors = {
    1: "#ffffff",//Branch color 1
    2: "#bfbfbf",//Branch color 2
    3: "#7f7f7f",//Branch color 3
    color: "#dfdfdf",
    points: "#ffffff",
    locked: "#bf8f8f",
    background: "#0f0f0f",
    background_tooltip: "rgba(0, 0, 0, 0.75)",
}
function changeTheme() {
    document.body.style.setProperty('--background', colors["background"]);
    document.body.style.setProperty('--background_tooltip', colors["background_tooltip"]);
    document.body.style.setProperty('--color', colors["color"]);
    document.body.style.setProperty('--points', colors["points"]);
    document.body.style.setProperty("--locked", colors["locked"]);
}