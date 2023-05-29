var layoutInfo = {
    startTab: "none",
    startNavTab: "tree-tab",
    showTree: true
}

addLayer("tree-tab", {
    clickables: {
        pause: {
            display: '||',
            canClick() { return player.gameSpeed != 0 },
            onClick() { player.gameSpeed = 0 },
            style: { 'width': '40px', 'min-height': '20px' }
        },
        play: {
            display: '▶',
            canClick() { return player.gameSpeed != 1 },
            onClick() { if (player.started && (player.oasis.resources.people.amount + player.expedition.onExpedition.people) > 0) player.gameSpeed = 1 },
            style: { 'width': '40px', 'min-height': '20px' }
        },
        fast: {
            display: '▶▶',
            canClick() { return player.gameSpeed != 2 },
            onClick() { if (player.started && (player.oasis.resources.people.amount + player.expedition.onExpedition.people) > 0) player.gameSpeed = 2 },
            style: { 'width': '40px', 'min-height': '20px' }
        },
        fastest: {
            display: '▶▶▶',
            canClick() { return player.gameSpeed != 3 },
            onClick() { if (player.started && (player.oasis.resources.people.amount + player.expedition.onExpedition.people) > 0) player.gameSpeed = 3 },
            style: { 'width': '40px', 'min-height': '20px' }
        },
        newGame: {
            display: '<h3>Let the sands sweep away the past,<br>build anew on the remains of the old</h3>',
            canClick() { return true },
            onClick() {
                if (options.newGameConfirmation) {
                    if (confirm("Are you sure you want to start a new game?\nYour prior progress will provide a research bonus in your next run"))
                        ruin()
                }
                else ruin()
            },
            style: {
                'width': '325px',
                'min-height': '51px'
            }
        }
    },
    
    tabFormat: () => {
        if (!player.started || (player.started && (player.oasis.resources.people.amount + player.expedition.onExpedition.people) > 0))
            return  [
                        "blank",
                        ["row", [
                            ["display-text", `Year: ${player.oasis.time.year}`, {'margin': '0px 4px'}],
                            ["display-text", `Month: ${player.oasis.time.month}`, {'margin': '0px 4px'}],
                            ["display-text", `Day: ${player.oasis.time.day}`, {'margin': '0px 4px'}]
                        ]],
                        ["display-text", temp.oasis.stormDescription],
                        ["display-text", player.oasis.time.year >= 10 && temp.oasis.inStorm ? 'The ongoing storm causes outdoor activities to be reduced by 50%' : '<br>'],
                        "blank",
                        ['microtabs', 'game']
                    ]
        else return [
            "blank",
            ["clickable", "newGame"],
            "blank",
            ['microtabs', 'game'],
            "blank",
            "end-results",
        ]
    },
    microtabs: {
        game: {
            "The Oasis": {
                embedLayer: "oasis"
            },
            "Research": {
                unlocked() { return player.research.unlocked },
                embedLayer: "research"
            },
            "Expeditions": {
                unlocked() { return player.expedition.unlocked },
                embedLayer: "expedition"
            }
        }
    },
    previousTab: "",
    leftTab: true,
})

function ruin() {
    let oldWorld = player.oasis.map
    let newWorld = getStartPlayer()
    player.oasis = newWorld.oasis
    player.research = newWorld.research
    player.expedition = newWorld.expedition
    Object.entries(addedPlayerData()).forEach(([key, value]) => player[key] = value)
    player.subtabs["tree-tab"].game = 'The Oasis'
    
    console.log('ruining')

    let oldWorldBuildings = {}
    for (let loc in oldWorld) {
        let oldWorldBuilding = oldWorld[loc].building
        if (buildings[oldWorldBuilding].ruined) {
            let ruined = buildings[oldWorldBuilding].ruined
            if (!oldWorldBuildings[ruined])
                oldWorldBuildings[ruined] = []
            oldWorldBuildings[ruined].push(loc)
        }
    }
    for (let ruined in oldWorldBuildings) {
        let locations = oldWorldBuildings[ruined].sort(() => 0.5 - Math.random())
        for (let i = 0; i < Math.ceil(locations.length/2); i++) {
            player.oasis.map[locations[i]].ruined = ruined
        }
    }
}