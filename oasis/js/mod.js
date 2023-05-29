let modInfo = {
    name: "Oasis",
    id: "igm-2022-oasis",
    author: "Escapee",
    modFiles: ["tree.js",
               "layers/oasis.js",
               "layers/research.js",
               "layers/expedition.js"
    ],

    discordName: "Escapee",
    discordLink: "",
    initialStartPoints: new Decimal (0) // Used for hard resets and new players
}

// Set your version in num and name
let VERSION = {
    num: "1.0",
    name: "Oasis",
}

let changelog = `
    <h1>Changelog:</h1>
    <br><br>
    <h3>v1.0 - Oasis</h3>
    <br>- Added expeditions
    <br>- Added ruination
    <br>- Some color changes
    <br>- Research categories (and bonuses)
    <br>- Backend modifications for lategame research effects
    <br>- Filled out content for all remaining researches
    <br><br>
    <h3>v0.3 - Sand</h3>
    <br>- Added tooltips to jobs and research
    <br>- Added sandstorms and sand management
    <br>- Several small changes and additions to other systems
    <br><br>
    <h3>v0.2 - Stars</h3>
    <br>- Fixed a few bugs
    <br>- Reworked progression
    <br>- Added the research system
    <br><br>
    <h3>v0.1 - Spring</h3>
    <br>- Created initial content framework
    <br>- Initial visual design settings
    <br>- Ripped out obviously useless TMT code
`

let winText = `Congratulations! You have reached the end and beaten this game, but for now...`

// If you add new functions anywhere inside of a layer, and those functions have an effect when called, add them here.
// (The ones here are examples, all official functions are already taken care of)
var doNotCallTheseFunctionsEveryTick = ["blowUpEverything"]

// Calculate points/sec!
function getPointGen() {
    return decimalZero
}

// You can add non-layer related variables that should to into "player" and be saved here, along with default values
function addedPlayerData() { return {
    gameSpeed: 0,
    lastUpdate: 0,
    started: false
}}

// Display extra things at the top of the page
var displayThings = [
]

// Determines when the game "ends"
function isEndgame() {
    return player.points.gte(new Decimal("e280000000"))
}



// Less important things beyond this point!

// Style for the background, can be a function
var backgroundStyle = {

}

// Use this if you need to undo inflation from an older version. If the version is older than the version that fixed the issue,
// you can cap their current resources with this.
function fixOldSave(oldVersion){
}