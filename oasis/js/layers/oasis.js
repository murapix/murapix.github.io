const baseVision = 4
const maxVision = 12

const baseSize = 2*baseVision+1
const maxSize = 2*maxVision+1
const center = ((maxSize+1)*100 + (maxSize+1))/2
const freshOasis = function() {
    let grid = {}
    let distances = new Array(maxVision+1).fill().map(u => ([]))
    for (let row = 1; row <= maxSize; row++) {
        for (let col = 1; col <= maxSize; col++) {
            let distance = Math.max(Math.abs(row-(maxVision+1)), Math.abs(col-(maxVision+1)))
            distances[distance].push(row*100+col)
            grid[row*100+col] = {
                building: 'sand',
                progress: {},
                action: '',
                sand: 0,
                ruined: ''
            }
        }
    }
    distances[0].forEach(id => grid[id].building = 'oasis')
    distances[1].sort(() => 0.5 - Math.random()).forEach((id, index) => grid[id].building = index < 3 ? 'tree' : 'soil')
    distances[2].sort(() => 0.5 - Math.random()).forEach((id, index) => grid[id].building = index < 3 ? 'cactus' : 'sand')
    distances[3].sort(() => 0.5 - Math.random()).forEach((id, index) => grid[id].building = index < 3 ? 'cactus' : 'sand')
    distances[4].sort(() => 0.5 - Math.random()).forEach((id, index) => grid[id].building = index < 4 ? 'cactus' : 'sand')
    distances[5].sort(() => 0.5 - Math.random()).forEach((id, index) => grid[id].building = index < 4 ? 'cactus' : 'sand')
    distances[6].sort(() => 0.5 - Math.random()).forEach((id, index) => grid[id].building = index < 4 ? 'cactus' : 'sand')
    distances[7].sort(() => 0.5 - Math.random()).forEach((id, index) => grid[id].building = index < 5 ? 'cactus' : 'sand')
    distances[8].sort(() => 0.5 - Math.random()).forEach((id, index) => grid[id].building = index < 5 ? 'cactus' : 'sand')
    distances[9].sort(() => 0.5 - Math.random()).forEach((id, index) => grid[id].building = index < 4 ? 'cactus' : 'sand')
    distances[10].sort(() => 0.5 - Math.random()).forEach((id, index) => grid[id].building = index < 3 ? 'cactus' : 'sand')
    distances[11].sort(() => 0.5 - Math.random()).forEach((id, index) => grid[id].building = index < 2 ? 'cactus' : 'sand')
    distances[12].sort(() => 0.5 - Math.random()).forEach((id, index) => grid[id].building = index < 1 ? 'cactus' : 'sand')

    return grid
}

addLayer("oasis", {
    type: "none",

    row: 0,
    position: 0,
    color: "#f6d7b0",
    
    startData() {
        let startData = {
            unlocked: true,
            unemployed: 0,
            resources: {},
            jobs: {},
            time: { day: 1, month: 1, year: 1 },
            previousPopulation: 0,
            map: freshOasis(),
            firstTick: 1,
            stormDirection: Math.floor(Math.random()*4)
        }
        for ([resource, data] of Object.entries(resources)) {
            startData.resources[resource] = {
                unlocked: data.unlocked ?? false,
                amount: data.initialAmount ?? 0
            }
        }
        for ([job, data] of Object.entries(jobs)) {
            startData.jobs[job] = {
                unlocked: false,
                amount: 0
            }
        }
        startData.jobs.forager.amount = 3
        return startData
    },

    update() {
        if (!player.started || (player.oasis.resources.people.amount + player.expedition.onExpedition.people) <= 0) player.gameSpeed = 0
        if (temp.oasis.buildings.campsite > 0) player.started = true

        { // Update time
            player.oasis.time.day++
            if (player.oasis.time.day > 30) {
                player.oasis.time.day -= 30
                player.oasis.time.month++
            }
            if (player.oasis.time.month > 12) {
                player.oasis.time.month -= 12
                player.oasis.time.year++
            }
            if (player.oasis.time.month === 7 && player.oasis.time.day === 1) {
                player.oasis.stormDirection = Math.floor(Math.random()*4)
            }
        }

        { // Update resources
            let resources = player.oasis.resources

            for ([resource, data] of Object.entries(temp.oasis.resources)) {
                if (data.unlocked) resources[resource].unlocked = true
            }

            for ([resource, amount] of Object.entries(temp.oasis.production)) {
                let change = clamp(amount, -resources[resource].amount, temp.oasis.resources[resource].max - resources[resource].amount)
                resources[resource].amount += change
                if (resource === 'people')
                    player.oasis.unemployed += change
            }
        }
        
        let freeBuilders = player.oasis.jobs.builder.amount
        { // Update build projects
            let builderCount = freeBuilders
            let buildProjects = []
            for (let row = 1; row <= maxSize; row++) {
                for (let col = 1; col <= maxSize; col++) {
                    if (player.oasis.map[row*100+col].action) {
                        buildProjects.push(row*100+col)
                    }
                }
            }
            let buildersPerProject = ~~(builderCount / buildProjects.length)
            let remainingBuilders = builderCount % buildProjects.length
            let builderCounts = []
            for (let i = 1; i <= buildProjects.length; i++) {
                builderCounts.push(buildersPerProject + (i <= remainingBuilders ? 1 : 0))
            }

            for (let i = 0; i < buildProjects.length; i++) {
                if (player.oasis.map[buildProjects[i]].sand > 0) {
                    let sandRemoved = Math.min(player.oasis.map[buildProjects[i]].sand, builderCounts[i])
                    player.oasis.map[buildProjects[i]].sand -= sandRemoved
                    builderCounts[i] -= sandRemoved
                }
                for ([resource, amount] of Object.entries(player.oasis.map[buildProjects[i]].progress)) {
                    if (resource === 'labor') continue
                    if (builderCounts[i] === 0) break
                    let resourceAmount = player.oasis.resources[resource].amount
                    let usableAmount = Math.min(resourceAmount, builderCounts[i], amount)
                    player.oasis.map[buildProjects[i]].progress[resource] -= usableAmount
                    player.oasis.resources[resource].amount -= usableAmount
                    builderCounts[i] -= usableAmount
                }
                if (builderCounts[i] > 0 && (player.oasis.map[buildProjects[i]].progress.labor ?? 0) > 0) {
                    let usableAmount = Math.min(player.oasis.map[buildProjects[i]].progress.labor, builderCounts[i])
                    player.oasis.map[buildProjects[i]].progress.labor -= usableAmount
                    builderCounts[i] -= usableAmount
                }
                if (Object.values(player.oasis.map[buildProjects[i]].progress).filter(amount => amount > 0).length === 0) {
                    player.oasis.map[buildProjects[i]].building = actions[player.oasis.map[buildProjects[i]].action].building
                    player.oasis.map[buildProjects[i]].action = ''
                    player.oasis.map[buildProjects[i]].progress = {}
                }
                if(builderCounts[i] > 0) {
                    if (i < buildProjects.length - 1) builderCounts[i+1] += builderCounts[i]
                    else freeBuilders = builderCounts[i]
                }
            }
        }

        { // Update sand/soil
            for (let row = 1; row <= maxSize; row++) {
                for (let col = 1; col <= maxSize; col++) {
                    let loc = row*100+col
                    if (buildings[player.oasis.map[loc].building].dried) {
                        player.oasis.map[loc].building = buildings[player.oasis.map[loc].building].dried
                    }
                }
            }
            let waterLocs = [center]
            while (waterLocs.length > 0) {
                let waterLoc = waterLocs.shift()
                let tileData = player.oasis.map[waterLoc]
                if (tileData.sand <= buildings[tileData.building].sandLimit) {
                    for (let adjacent of [waterLoc-101, waterLoc-100, waterLoc-99, waterLoc-1, waterLoc+1, waterLoc+99, waterLoc+100, waterLoc+101]) {
                        if (!player.oasis.map[adjacent]) continue
                        let adjacentData = player.oasis.map[adjacent]
                        if (buildings[adjacentData.building].wet) {
                            adjacentData.building = buildings[adjacentData.building].wet
                            if (buildings[adjacentData.building].provided.includes('water'))
                                waterLocs.push(adjacent)
                        }
                    }
                }
            }
        }

        { // Update unlocks
            for ([resource, data] of Object.entries(temp.oasis.resources))
                if (data.unlocked) player.oasis.resources[resource].unlocked = true
            for ([job, data] of Object.entries(temp.oasis.jobs))
                if (data.unlocked) player.oasis.jobs[job].unlocked = true
        }

        { // Update sandstorms
            if (player.oasis.time.month <= temp.oasis.stormLength.months && player.oasis.time.day <= temp.oasis.stormLength.days) {
                let positions = new Array(temp.oasis.grid.size**2)
                let index = 0
                for (let row = 1; row <= temp.oasis.grid.size; row++) {
                    for (let col = 1; col <= temp.oasis.grid.size; col++) {
                        positions[index++] = row*100+col + temp.oasis.grid.hiddenRings*101
                    }
                }

                let sandTotal = temp.oasis.stormStrength * (temp.oasis.grid.size**2) / 30
                if (sandTotal >= temp.oasis.grid.size**2) {
                    let sandAmount = ~~(sandTotal / temp.oasis.grid.size**2)
                    sandTotal -= sandAmount * temp.oasis.grid.size**2
                    switch (player.oasis.stormDirection) { // from 'north', 'east', 'south', 'west'
                        case 0: {
                            for (let col = 1; col <= temp.oasis.grid.size; col++) {
                                let heightRows = {}
                                for (let row = 1; row <= temp.oasis.grid.size; row++) {
                                    let loc = row*100+col + temp.oasis.grid.hiddenRings*101
                                    let building = player.oasis.map[loc].building
                                    let tileSand = sandAmount
                                    for ([heightRow, height] of Object.entries(heightRows).map(([k,v]) => [Number(k),v])) {
                                        if (tileSand === 0) break
                                        if (row - heightRow <= height) {
                                            let heightLoc = heightRow*100+col + temp.oasis.grid.hiddenRings*101
                                            let tileAmount = Math.min(tileSand, buildings[building].sandLimit+1 - player.oasis.map[heightLoc].sand)
                                            player.oasis.map[heightLoc].sand += tileAmount
                                            tileSand -= tileAmount
                                        }
                                    }
                                    player.oasis.map[loc].sand += tileSand
                                    if (buildings[building].height > 0)
                                        heightRows[row] = buildings[building].height
                                }
                            }
                            break
                        }
                        case 1: {
                            for (let row = 1; row <= temp.oasis.grid.size; row++) {
                                let heightRows = {}
                                for (let col = temp.oasis.grid.size; col >= 1; col--) {
                                    let loc = row*100+col + temp.oasis.grid.hiddenRings*101
                                    let building = player.oasis.map[loc].building
                                    let tileSand = sandAmount
                                    for ([heightCol, height] of Object.entries(heightRows).map(([k,v]) => [Number(k),v])) {
                                        if (tileSand === 0) break
                                        if (heightCol - col <= height) {
                                            let heightLoc = row*100+heightCol + temp.oasis.grid.hiddenRings*101
                                            let tileAmount = Math.min(tileSand, buildings[building].sandLimit+1 - player.oasis.map[heightLoc].sand)
                                            player.oasis.map[heightLoc].sand += tileAmount
                                            tileSand -= tileAmount
                                        }
                                    }
                                    player.oasis.map[loc].sand += tileSand
                                    if (buildings[building].height > 0)
                                        heightRows[col] = buildings[building].height
                                }
                            }
                            break
                        }
                        case 2: {
                            for (let col = 1; col <= temp.oasis.grid.size; col++) {
                                let heightRows = {}
                                for (let row = temp.oasis.grid.size; row >= 1; row--) {
                                    let loc = row*100+col + temp.oasis.grid.hiddenRings*101
                                    let building = player.oasis.map[loc].building
                                    let tileSand = sandAmount
                                    for ([heightRow, height] of Object.entries(heightRows).map(([k,v]) => [Number(k),v])) {
                                        if (tileSand === 0) break
                                        if (heightRow - row <= height) {
                                            let heightLoc = heightRow*100+col + temp.oasis.grid.hiddenRings*101
                                            let tileAmount = Math.min(tileSand, buildings[building].sandLimit+1 - player.oasis.map[heightLoc].sand)
                                            player.oasis.map[heightLoc].sand += tileAmount
                                            tileSand -= tileAmount
                                        }
                                    }
                                    player.oasis.map[loc].sand += tileSand
                                    if (buildings[building].height > 0)
                                        heightRows[row] = buildings[building].height
                                }
                            }
                            break
                        }
                        case 3: {
                            for (let row = 1; row <= temp.oasis.grid.size; row++) {
                                let heightRows = {}
                                for (let col = 1; col <= temp.oasis.grid.size; col++) {
                                    let loc = row*100+col + temp.oasis.grid.hiddenRings*101
                                    let building = player.oasis.map[loc].building
                                    let tileSand = sandAmount
                                    for ([heightCol, height] of Object.entries(heightRows).map(([k,v]) => [Number(k),v])) {
                                        if (tileSand === 0) break
                                        if (col - heightCol <= height) {
                                            let heightLoc = row*100+heightCol + temp.oasis.grid.hiddenRings*101
                                            let tileAmount = Math.min(tileSand, buildings[building].sandLimit+1 - player.oasis.map[heightLoc].sand)
                                            player.oasis.map[heightLoc].sand += tileAmount
                                            tileSand -= tileAmount
                                        }
                                    }
                                    player.oasis.map[loc].sand += tileSand
                                    if (buildings[building].height > 0)
                                        heightRows[col] = buildings[building].height
                                }
                            }
                            break
                        }
                    }
                }
                let clearTileCount = temp.oasis.grid.size**2 - sandTotal
                let toFill = []
                while (positions.length > clearTileCount)
                    toFill.push(positions.splice(Math.floor(Math.random() * positions.length), 1)[0])
                sandLoop: for (let loc of toFill) {
                    let locRow = ~~(loc/100)
                    let locCol = loc%100
                    switch (player.oasis.stormDirection) { // from 'north', 'east', 'south', 'west'
                        case 0: {
                            for (let row = 1; row <= locRow; row++) {
                                let heightLoc = row*100+locCol + temp.oasis.grid.hiddenRings*101
                                if (locRow - row <= buildings[player.oasis.map[heightLoc].building].height && player.oasis.map[heightLoc].sand <= buildings[player.oasis.map[heightLoc].building].sandLimit) {
                                    player.oasis.map[heightLoc].sand++
                                    continue sandLoop
                                }
                            }
                            break
                        }
                        case 1: {
                            for (let col = temp.oasis.grid.size; col >= locCol; col--) {
                                let heightLoc = locRow*100+col + temp.oasis.grid.hiddenRings*101
                                if (col - locCol <= buildings[player.oasis.map[heightLoc].building].height && player.oasis.map[heightLoc].sand <= buildings[player.oasis.map[heightLoc].building].sandLimit) {
                                    player.oasis.map[heightLoc].sand++
                                    continue sandLoop
                                }
                            }
                            break
                        }
                        case 2: {
                            for (let row = temp.oasis.grid.size; row >= locRow; row--) {
                                let heightLoc = row*100+locCol + temp.oasis.grid.hiddenRings*101
                                if (row - locRow <= buildings[player.oasis.map[heightLoc].building].height && player.oasis.map[heightLoc].sand <= buildings[player.oasis.map[heightLoc].building].sandLimit) {
                                    player.oasis.map[heightLoc].sand++
                                    continue sandLoop
                                }
                            }
                            break
                        }
                        case 3: {
                            for (let col = 1; col <= locCol; col++) {
                                let heightLoc = locRow*100+col + temp.oasis.grid.hiddenRings*101
                                if (locCol - col <= buildings[player.oasis.map[heightLoc].building].height && player.oasis.map[heightLoc].sand <= buildings[player.oasis.map[heightLoc].building].sandLimit) {
                                    player.oasis.map[heightLoc].sand++
                                    continue sandLoop
                                }
                            }
                            break
                        }
                    }
                    player.oasis.map[loc + temp.oasis.grid.hiddenRings*101].sand++
                }
            }

            if (temp.oasis.production.sand + ~~(freeBuilders/5) > 0) {
                let sandBuildings = {
                    importantBuried: [],
                    buried: [],
                    oasis: [],
                    buildings: [],
                    blockers: [],
                    terrain: []
                }
                for (let row = 1; row <= temp.oasis.grid.size; row++) {
                    for (let col = 1; col <= temp.oasis.grid.size; col++) {
                        let loc = row*100+col + temp.oasis.grid.hiddenRings*101
                        if (player.oasis.map[loc].sand <= 0) continue
                        let building = player.oasis.map[loc].building
                        if (Object.keys(buildings[building].jobs).length > 0) {
                            if (player.oasis.map[loc].sand > buildings[building].sandLimit) sandBuildings.importantBuried.push(loc)
                            else sandBuildings.buildings.push(loc)
                        }
                        else if (building === 'oasis') sandBuildings.oasis.push(loc)
                        else if (['sand', 'soil'].includes(building)) sandBuildings.terrain.push(loc)
                        else if (['wall'].includes(building)) sandBuildings.blockers.push(loc)
                        else if (player.oasis.map[loc].sand > buildings[building].sandLimit) sandBuildings.buried.push(loc)
                        else sandBuildings.buildings.push(loc)
                    }
                }

                let sandRemoval = temp.oasis.production.sand + ~~(freeBuilders/5)
                while (sandRemoval > 0) {
                    let start = sandRemoval
                    if (sandBuildings.importantBuried.length > 0)
                        sandRemoval = removeSand(sandBuildings.importantBuried, sandRemoval)
                    else if (sandBuildings.buried.length > 0)
                        sandRemoval = removeSand(sandBuildings.buried, sandRemoval)
                    else if (sandBuildings.oasis.length > 0)
                        sandRemoval = removeSand(sandBuildings.oasis, sandRemoval)
                    else if (sandBuildings.buildings.length > 0)
                        sandRemoval = removeSand(sandBuildings.buildings, sandRemoval)
                    else if (sandBuildings.blockers.length > 0)
                        sandRemoval = removeSand(sandBuildings.blockers, sandRemoval)
                    else if (sandBuildings.terrain.length > 0)
                        sandRemoval = removeSand(sandBuildings.terrain, sandRemoval)
                    if (sandRemoval = start) break
                }
            }
        }
    },

    stormLength() {
        if (player.oasis.time.year < 4) return { months: 0, days: 0 }
        let duration = (player.oasis.time.year-2)
        duration = Math.min(duration, 12)
        return { months: ~~(duration/2), days: duration%2 ? 15 : 30 }
    },
    inStorm() {
        if (player.oasis.time.year < 4) return false
        if (player.oasis.time.month < temp.oasis.stormLength.months) return true
        return player.oasis.time.month === temp.oasis.stormLength.months && player.oasis.time.day <= temp.oasis.stormLength.days
    },
    stormStrength() {
        if (player.oasis.time.year <= 3) return 0
        return (player.oasis.time.year-3)**1.2
    },
    stormDescription() {
        let stormDirection = ['north', 'east', 'south', 'west'][player.oasis.stormDirection]

        const descriptions = [
            () => 'The skies are clear. A light breeze blows over the oasis',
            () => `A strong breeze has picked up sand from the ${stormDirection}, casting shade over the oasis`,
            () => `Winds from the ${stormDirection} blow sand over the oasis`,
            () => `A dust storm hangs over the oasis, blotting out the sun and bringing sand in from the ${stormDirection}`,
            () => `Dust and sand swirl in the air, carried by strong winds from the ${stormDirection}`,
            () => `A sandstorm rages in the oasis, sands from the ${stormDirection} whipping through the air`,
            () => `Fierce winds blow from the ${stormDirection}, flinging sand at whatever is in their path`,
            () => `The sun is blocked by clouds of dust and sand, the ${stormDirection}ern squall tossing anything and everything into the air`,
            () => `Day has become night as the winds from the ${stormDirection} pick up anything not nailed down`,
            () => `Extreme winds rip through the oasis from the ${stormDirection}, bringing death and destruction to all in their way`
        ]
        if (player.oasis.time.year < 4) return descriptions[0]()
        if (temp.oasis.inStorm) {
            if (player.oasis.time.year <= descriptions.length*3) return descriptions[~~((player.oasis.time.year-1)/3)]()
            return descriptions[descriptions.length-1]()
        }

        let predictionTime = 0
        let predictionStrength = player.oasis.jobs.astrologist.amount
        if (predictionStrength >= 1024) predictionTime = 6
        else if (predictionStrength >= 256) predictionTime = 5
        else if (predictionStrength >= 64) predictionTime = 4
        else if (predictionStrength >= 16) predictionTime = 3
        else if (predictionStrength >= 4) predictionTime = 2
        else if (predictionStrength >= 1) predictionTime = 1

        if (player.oasis.time.month === 7 && predictionTime >= 6) return `One storm just passed, but cold winds already blow from the ${stormDirection}`
        if (player.oasis.time.month === 8 && predictionTime >= 5) return `Weather patterns point to another storm brewing to the ${stormDirection}`
        if (player.oasis.time.month === 9 && predictionTime >= 4) return ``
        if (player.oasis.time.month === 10 && predictionTime >= 3) return ``
        if (player.oasis.time.month === 11 && predictionTime >= 2) return `The elders can feel it in their bones, a storm brews to the ${stormDirection}`
        if (player.oasis.time.month === 12 && predictionTime >= 1) return `Dark clouds loom over the ${stormDirection}ern horizon`

        return 'The skies are clear'
    },

    grid: {
        size: () => {
            let size = baseSize
            if (temp.oasis.buildings.lookoutTower > 0) size += 6
            return size
        },
        hiddenRings: () => (maxSize - temp.oasis.grid.size) / 2,
        rows: () => temp.oasis.grid.size, maxRows: maxSize,
        cols: () => temp.oasis.grid.size, maxCols: maxSize,
        getStartData(id) { return '' },
        getUnlocked(id) { return true },
        getCanClick(data, id) { return true },
        onClick(data, id) {
            id += temp.oasis.grid.hiddenRings*101
            if (player.oasis.selectedTile == id) player.oasis.selectedTile = 0
            else player.oasis.selectedTile = id
        },
        getDisplay(data, id) { return buildings[player.oasis.map[id+temp.oasis.grid.hiddenRings*101].building].display },
        getStyle(data, id) {
            id += temp.oasis.grid.hiddenRings*101
            let style = {}
            if (id == player.oasis.selectedTile) style.border = '1px solid #888888'
            else if (player.oasis.map[id].action) style.border = '1px solid #f6d7b0'
            else style.border = 'none'

            let sandBorder = 0
            if (player.oasis.map[id].sand > buildings[player.oasis.map[id].building].sandLimit) sandBorder = 50
            else if (player.oasis.map[id].sand > buildings[player.oasis.map[id].building].sandLimit * 0.5) sandBorder = 25
            if (sandBorder > 0) style['background-image'] = `linear-gradient(to top, #f6d7b0${sandBorder === 25 ? '80' : ''} ${sandBorder}%, #00000000 ${sandBorder}%)`

            return style
        }
    },

    bars: {},
    resources: function(){
        let resourceData = {}
        for ([resource, data] of Object.entries(resources)) {
            let consumes = data.consumes
            let produces = data.produces
            resourceData[resource] = {
                max: 0,
                id: resource,
                name: data.name,
                unlocked: data.shouldUnlock ?? false,
                consumed: consumes ? function() { return Object.fromEntries(Object.entries(consumes).map(([resource, amount]) => [resource, amount*player.oasis.resources[this.id].amount])) } : {},
                produced: produces ? function() { return Object.fromEntries(Object.entries(produces).map(([resource, amount]) => [resource, amount*player.oasis.resources[this.id].amount])) } : {}
            }
        }
        return resourceData
    }(),
    countStorage() {
        let storage = Object.fromEntries(Object.keys(temp.oasis.resources).map(resource => [resource, 0]))
        for ([building, count] of Object.entries(temp.oasis.buildings)) {
            for ([resource, amount] of Object.entries(buildings[building].storage)) {
                storage[resource] = (storage[resource] ?? 0) + amount*count
            }
        }
        for ([job, data] of Object.entries(player.oasis.jobs)) {
            if (!jobs[job].stores) continue
            for ([resource, amount] of Object.entries(jobs[job].stores)) {
                storage[resource] = (storage[resource] ?? 0) + amount*data.amount
            }
        }
        for (resource in temp.oasis.resources)
            storage[resource] = Math.max(resources[resource].baseStorage ?? 0, storage[resource] ?? 0)
        for ([resource, amount] of Object.entries(storage)) {
            layers.oasis.resources[resource].max = amount
            temp.oasis.resources[resource].max = amount
        }
    },
    countResourcesAroundSelected() {
        if (player.oasis.map[player.oasis.selectedTile]) {
            let selectedRow = ~~(player.oasis.selectedTile/100)
            let selectedCol = player.oasis.selectedTile%100
            let distances = new Array(maxSize).fill().map(u => ({}))

            for (let row = 1; row <= maxSize; row++) {
                for(let col = 1; col <= maxSize; col++) {
                    let distance = Math.max(Math.abs(row-selectedRow), Math.abs(col-selectedCol))
                    for (resource of buildings[player.oasis.map[row*100+col].building].provided) {
                        distances[distance][resource] = (distances[distance][resource] ?? 0) + 1
                    }
                }
            }
            for (let distance = 0; distance < distances.length-1; distance++) {
                for ([resource, amount] of Object.entries(distances[distance])) {
                    distances[distance+1][resource] = (distances[distance+1][resource] ?? 0) + amount
                }
            }

            return distances
        }
    },

    clickables: {},
    jobs: function() {
        let jobData = {}
        for ([job, data] of Object.entries(jobs)) {
            jobData[job] = {
                max: Number.MAX_SAFE_INTEGER,
                name: data.name,
                unlocked: data.shouldUnlock ?? false,
                shown: data.shouldShow ?? true
            }
        }
        return jobData
    }(),
    countJobs() {
        // Count available jobs
        let jobs = Object.fromEntries(Object.entries(temp.oasis.jobs).map(entry => [entry[0], 0]))
        for (let job in jobs) { jobs[job] = 0 }

        for ([building, count] of Object.entries(temp.oasis.buildings)) {
            for ([job, amount] of Object.entries(buildings[building].jobs)) {
                jobs[job] = (jobs[job] ?? 0) + amount*count
            }
        }
        for([job, amount] of Object.entries(jobs)) {
            layers.oasis.jobs[job].max = amount
            temp.oasis.jobs[job].max = amount
        }
        // Factor in job upgrades
        if (hasResearch('stars')) {
            temp.oasis.jobs.astrologist.max = temp.oasis.jobs.elder.max
            temp.oasis.jobs.elder.max = 0
            player.oasis.jobs.astrologist.amount += player.oasis.jobs.elder.amount
            player.oasis.jobs.elder.amount = 0
        }
        // Remove workers from over-maxed jobs
        if (temp.oasis.buildings) {
            for ([job, data] of Object.entries(player.oasis.jobs)) {
                if (temp.oasis.jobs[job].max < data.amount) {
                    player.oasis.unemployed -= temp.oasis.jobs[job].max - data.amount
                    data.amount = temp.oasis.jobs[job].max
                }
            }
        }
        if (player.oasis.unemployed < 0) {
            Object.values(player.oasis.jobs).reverse().forEach(data => {
                if (player.oasis.unemployed >= 0) return
                if (data.amount >= -player.oasis.unemployed) {
                    data.amount += player.oasis.unemployed
                    player.oasis.unemployed = 0
                }
                else {
                    player.oasis.unemployed += data.amount
                    data.amount = 0
                }
            })
        }
    },

    buildings() {
        let buildingCounts = {}
        let min = player.oasis.firstTick ? 1 : temp.oasis.grid.hiddenRings+1
        let max = player.oasis.firstTick ? maxSize : maxSize - temp.oasis.grid.hiddenRings
        for (let row = min; row <= max; row++) {
            for (let col = min; col <= max; col++) {
                let building = player.oasis.map[row*100+col].building
                if (player.oasis.map[row*100+col].sand > buildings[building].sandLimit) {
                    if (buildings[buildings[building].buried])
                        buildingCounts[buildings[building].buried] = (buildingCounts[buildings[building].buried] ?? 0) + 1
                }
                else buildingCounts[building] = (buildingCounts[building] ?? 0) + 1
            }
        }
        if (player.oasis.firstTick === 1) player.oasis.firstTick++
        else delete player.oasis.firstTick
        return buildingCounts
    },
    ruinedBuildings() {
        let buildingCounts = {}
        let min = player.oasis.firstTick ? 1 : temp.oasis.grid.hiddenRings+1
        let max = player.oasis.firstTick ? maxSize : maxSize - temp.oasis.grid.hiddenRings
        for (let row = min; row <= max; row++) {
            for (let col = min; col <= max; col++) {
                let building = player.oasis.map[row*100+col].ruined
                if (!building) continue
                buildingCounts[building] = (buildingCounts[building] ?? 0) + 1
            }
        }
        if (player.oasis.firstTick === 1) player.oasis.firstTick++
        else delete player.oasis.firstTick
        return buildingCounts
    },
    production() {
        let production = {}

        for (data of Object.values(temp.oasis.resources)) {
            for ([resource, amount] of Object.entries(data.consumed)) {
                production[resource] = (production[resource] ?? 0) - amount
            }
        }

        for ([job, data] of Object.entries(player.oasis.jobs)) {
            for ([resource, amount] of Object.entries(jobs[job].getWork(data.amount))) {
                production[resource] = (production[resource] ?? 0) + amount
            }
        }

        for (data of Object.values(temp.oasis.resources)) {
            let productionRatios = []
            for ([resource, amount] of Object.entries(data.produced)) {
                if (amount > 0) {
                    if (player.oasis.resources[resource].amount >= temp.oasis.resources[resource].max) productionRatios.push(0)
                    else productionRatios.push((temp.oasis.resources[resource].max - player.oasis.resources[resource].amount) / amount)
                }
                else if (amount < 0) {
                    productionRatios.push(player.oasis.resources[resource].amount / -amount)
                }
                else productionRatios.push(0)
            }
            let productionRatio = Math.min(1, ...productionRatios)
            for ([resource, amount] of Object.entries(data.produced)) {
                production[resource] = (production[resource] ?? 0) + ~~(amount*productionRatio)
            }
        }

        if ((production.food ?? 0) < -player.oasis.resources.food.amount) {
            production.driedFood = production.food + player.oasis.resources.food.amount
            production.food -= player.oasis.resources.food.amount
        }
        if ((production.food ?? 0) + (production.driedFood ?? 0) < 0) {
            if ((player.oasis.resources.food.amount ?? 0) + (player.oasis.resources.driedFood.amount ?? 0) === 0) {
                production.people = Math.floor(production.food/30)
            }
        }
        else {
            if (player.oasis.time.day === 1) player.oasis.previousPopulation = player.oasis.resources.people.amount
            if (player.oasis.resources.people.amount < temp.oasis.resources.people.max - player.expedition.onExpedition.people) {
                if (player.oasis.previousPopulatoin > 60)
                    production.people = Math.min(~~(player.oasis.previousPopulation/60), temp.oasis.resources.people.max - player.expedition.onExpedition.people - player.oasis.resources.people.amount)
                else if (player.oasis.time.day <= player.oasis.previousPopulation/2)
                    production.people = Math.min(1, temp.oasis.resources.people.max - player.expedition.onExpedition.people - player.oasis.resources.people.amount)
            }
        }

        return production
    },

    tabFormat: () => {
        let oasisHeight = temp.oasis.grid.size*24 + 34
        let resourceHeight = Object.values(player.oasis.resources).filter(data => data.unlocked).length*33 + 34
        let jobsHeight = Object.values(player.oasis.jobs).filter(data => data.unlocked).length*21 + 51
        let lineHeight = `${Math.max(oasisHeight, resourceHeight, jobsHeight)}px`
        let oasisScale = `scale(${player.started ? 1 : 0}, 1)`
        let tabFormat = [
            "blank",
            ["oasis-row", [
                ["column", [
                    ["display-text", "Resources"],
                    "blank",
                    ["resource-grid", ["people", "camels", "food", "driedFood", "wood", "sandstone", "salt", "metal", "stoneTools", "metalTools" ]]
                ], {'width': '275px', 'transform-origin': 'right', 'transform': oasisScale, 'transition': 'transform 0.5s !important'}],
                ["blank", ['20px', '20px']],
                ["v-line", lineHeight, {'transform-origin': 'right', 'transform': oasisScale}],
                ["blank", ['20px', '20px']],    
                ["column", [
                    ["display-text", `${player.started ? 'Map' : 'Your people look for a place to settle down'}`],
                    "blank",
                    "grid"
                ]],
                ["blank", ['20px', '20px']],
                ["v-line", lineHeight, {'transform-origin': 'left', 'transform': oasisScale}],
                ["blank", ['20px', '20px']],
                ["column", [
                    ["display-text", "Jobs"],
                    "blank",
                    ["job-grid", ["builder", "forager", "scavenger", "knapper", "farmer", "camelFarmer", "logger", "miner", "metalMiner", "saltFarmer", "crafter", "smith", "elder", "astrologist", "sweeper", "shoveler"]]
                ], {'width': '275px', 'transform-origin': 'left', 'transform': oasisScale, 'transition': 'transform 0.5s !important'}]
            ]],
            "blank"
        ]

        if (player.oasis.map[player.oasis.selectedTile]) {
            let building = player.oasis.map[player.oasis.selectedTile].building
            let ruined = player.oasis.map[player.oasis.selectedTile].ruined

            let toDisplay = [`<h2>${buildings[player.oasis.map[player.oasis.selectedTile].building].name}</h2>`,
                             buildings[building].description]
            if (ruined && ['sand', 'soil', 'tree', 'cactus'].includes(building)) toDisplay.push(ruinedBuildings[ruined].description)
            let provided = buildings[building].provided
            if (provided.length > 0) toDisplay.push(`Provides a source of ${provided.map(resource => terrainResources[resource].name).join(', ')}`)
            let stored = buildings[building].storage
            if (Object.keys(stored).length > 0) toDisplay.push(`Contains space for ${Object.entries(stored).map(([resource, amount]) => `${formatWhole(amount)} ${resources[resource].name}`).join(', ')}`)
            let buildingJobs = buildings[building].jobs
            if (Object.keys(buildingJobs).length > 0) toDisplay.push(`Supports ${Object.entries(buildingJobs).map(([job, amount]) => `${formatWhole(amount)} ${amount === 1 ? jobs[job].name : (jobs[job].plural ?? `${jobs[job].name}s`)}`).join(', ')}`)
            if (buildings[building].height > 0) toDisplay.push(`Blocks sand from reaching up to ${buildings[building].height} tiles behind it`)
            if (buildings[building].sandLimit >= Number.MAX_SAFE_INTEGER);
            else if (buildings[building].sandLimit > 0) toDisplay.push(`Can function under ${formatWhole(buildings[building].sandLimit+1)} feet of sand`)
            else toDisplay.push('Unusable when buried under sand')
            if (player.oasis.map[player.oasis.selectedTile].sand > 0) toDisplay.push(`Currently buried under ${formatWhole(player.oasis.map[player.oasis.selectedTile].sand)} ${player.oasis.map[player.oasis.selectedTile].sand === 1 ? 'foot' : 'feet'} of sand`)
            if (player.oasis.map[player.oasis.selectedTile].action) {
                toDisplay.push('<br>',
                               `In Progress: ${actions[player.oasis.map[player.oasis.selectedTile].action].name}`,
                               'Remaining Resources:')
                for ([resource, amount] of Object.entries(player.oasis.map[player.oasis.selectedTile].progress)) {
                    if (amount > 0) toDisplay.push(`${resources[resource].name}: ${formatWhole(amount)}`)
                }
            }
            tabFormat.push(...(toDisplay.map(line => ["display-text", line])), "blank")

            let actionList = new Set()
            for (let action of buildings[building].upgrades) {
                if (temp.oasis.clickables[action].unlocked) {
                    actionList.add(action)
                }
            }
            actionList = [...actionList]
            if (buildings[building].demolish) {
                actionList.push(buildings[building].demolish)
            }
            for (let i = 0; i < actionList.length; i += 5) {
                tabFormat.push(["row", actionList.slice(i, i+5).map(action => ["clickable", action])])
            }
            tabFormat.push(["clickable", "cancelBuild"])
            tabFormat.push(["blank", ['20px', '200px']])
        }

        return tabFormat
    }
})

function removeSand(list, amount) {
    let removed = Math.min(player.oasis.map[list[0]].sand, amount)
    player.oasis.map[list[0]].sand -= removed
    amount -= removed
    if (player.oasis.map[list[0]].sand <= 0)
        list.shift()
    return amount
}

function createResourceBars(bars) {
    for (resource in layers.oasis.resources) {
        bars[resource] = {
            direction: RIGHT,
            width: 100,
            height: 20,
            progress() { return player.oasis.resources[this.id].amount / temp.oasis.resources[this.id].max },
            display() { return `${formatWhole(player.oasis.resources[this.id].amount)}/${formatWhole(temp.oasis.resources[this.id].max)}` },
            fillStyle() { return { 'background-color': resources[this.id].color ?? '#0000ff' } }
        }
    }
}

function createJobButtons(clickables) {
    for (job in layers.oasis.jobs) {
        clickables[`${job}-up`] = {
            display: `+`,
            canClick() { return player.oasis.jobs[this.job].amount < temp.oasis.jobs[this.job].max && player.oasis.unemployed > 0 },
            onClick() {
                let increment = 0
                switch (shiftDown + 2*ctrlDown) {
                    case 0: increment = 1; break
                    case 1: increment = 5; break
                    case 2: increment = 25; break
                    case 3: increment = Number.MAX_SAFE_INTEGER; break
                }
                increment = Math.min(increment, temp.oasis.jobs[this.job].max - player.oasis.jobs[this.job].amount, player.oasis.unemployed)
                player.oasis.jobs[this.job].amount += increment
                player.oasis.unemployed -= increment
            },
            style: {
                'width': '20px',
                'min-height': '20px',
            },
            job: job
        }
        clickables[`${job}-down`] = {
            display: `-`,
            canClick() { return player.oasis.jobs[this.job].amount > 0 },
            onClick() {
                let increment = 0
                switch (shiftDown + 2*ctrlDown) {
                    case 0: increment = 1; break
                    case 1: increment = 5; break
                    case 2: increment = 25; break
                    case 3: increment = Number.MAX_SAFE_INTEGER; break
                }
                increment = Math.min(increment, player.oasis.jobs[this.job].amount)
                player.oasis.jobs[this.job].amount -= increment
                player.oasis.unemployed += increment
            },
            style: {
                'width': '20px',
                'min-height': '20px',
            },
            job: job
        }
    }
}

function createActionButtons(clickables) {
    for (action in actions) {
        if (actions[action] instanceof BuildAction) {
            clickables[action] = {
                title() { return `<b>${actions[this.action].name}<br>${buildings[actions[this.action].building].display}</b>` },
                display: '',
                unlocked() { return actions[this.action].stateCheck() && actions[this.action].unlocked() },
                canClick() { return actions[this.action].stateCheck() && actions[this.action].canRun() },
                onClick() {
                    player.oasis.map[player.oasis.selectedTile].action = this.action
                    player.oasis.map[player.oasis.selectedTile].progress = {...actions[this.action].cost}
                },
                tooltip() {
                    let building = buildings[actions[this.action].building]
                    let toDisplay = [`<h2>${building.name}</h2>`,
                                     building.description]
                    let provided = building.provided
                    if (provided.length > 0) toDisplay.push(`Provides a source of ${provided.map(resource => terrainResources[resource].name).join(', ')}`)
                    let stored = building.storage
                    if (Object.keys(stored).length > 0) toDisplay.push(`Contains space for ${Object.entries(stored).filter(([resource]) => player.oasis.resources[resource].unlocked).map(([resource, amount]) => `${formatWhole(amount)} ${resources[resource].name}`).join(', ')}`)
                    let buildingJobs = building.jobs
                    if (Object.keys(buildingJobs).length > 0) toDisplay.push(`Supports ${Object.entries(buildingJobs).map(([job, amount]) => `${formatWhole(amount)} ${amount === 1 ? jobs[job].name : (jobs[job].plural ?? `${jobs[job].name}s`)}`).join(', ')}`)
                    if (building.height > 0) toDisplay.push(`Blocks sand from reaching up to ${building.height} tiles behind it`)
                    if (building.sandLimit >= Number.MAX_SAFE_INTEGER);
                    else if (building.sandLimit > 0) toDisplay.push(`Can function under ${formatWhole(building.sandLimit+1)} feet of sand`)
                    else toDisplay.push('Unusable when buried under sand')
                    if (!temp.oasis.clickables[this.id].canClick) toDisplay.push(`<br>${colored(actions[this.action].requirementText, '#dd0000', 'h3')}`)

                    if (Object.keys(actions[this.action].cost).length > 0) {
                        toDisplay.push('<br>Will Require:')
                        for ([resource, amount] of Object.entries(actions[this.action].cost)) {
                            if (amount > 0) toDisplay.push(`${resources[resource].name}: ${formatWhole(amount)}`)
                        }
                    }

                    return toDisplay.join('<br>')
                },
                style() { return {
                        'background-color': '#000000',
                        'color': '#ffffff',
                        'border': temp.oasis.clickables[this.id].canClick ? '2px solid #f6d7b0' : '2px solid #888888',
                        'margin': '0px 10px'
                    }
                },
                action: action
            }
        }
        else if (actions[action] instanceof DemolishAction) {
            clickables[action] = {
                title() { return `<b>${actions[this.action].name}<br>${buildings[actions[this.action].getOutputBuilding()].display}</b>` },
                display: '',
                unlocked() { return actions[this.action].stateCheck() && actions[this.action].unlocked() },
                canClick() { return actions[this.action].stateCheck() && actions[this.action].canRun() },
                onClick() {
                    player.oasis.map[player.oasis.selectedTile].action = ''
                    player.oasis.map[player.oasis.selectedTile].progress = {}
                    player.oasis.map[player.oasis.selectedTile].building = actions[this.action].getOutputBuilding()
                },
                tooltip() {
                    let building = buildings[actions[this.action].getOutputBuilding()]
                    let toDisplay = [`<h2>${building.name}</h2>`,
                                     building.description]
                    let provided = building.provided
                    if (provided.length > 0) toDisplay.push(`Provides a source of ${provided.map(resource => terrainResources[resource].name).join(', ')}`)
                    let buildingJobs = building.jobs
                    if (Object.keys(buildingJobs).length > 0) toDisplay.push(`Supports ${Object.entries(buildingJobs).map(entry => `${formatWhole(entry[1])} ${amount === 1 ? jobs[job].name : (jobs[job].plural ?? `${jobs[job].name}s`)}`).join(', ')}`)
                    if (!temp.oasis.clickables[this.id].canClick) toDisplay.push(`<br>${colored(actions[this.action].requirementText, '#880000', 'span')}`)
                    return toDisplay.join('<br>')
                },
                style() { return {
                        'background-color': '#000000',
                        'color': '#ffffff',
                        'border': temp.oasis.clickables[this.id].canClick ? '2px solid #ffa430' : '2px solid #888888',
                        'margin': '0px 10px'
                    }
                },
                action: action
            }
        }
    }

    clickables.buildFreeCampsite.onClick = () => {
        player.oasis.map[player.oasis.selectedTile].action = ''
        player.oasis.map[player.oasis.selectedTile].progress = {}
        player.oasis.map[player.oasis.selectedTile].building = 'campsite'
        player.started = true
        player.gameSpeed = 1
    }

    clickables.cancelBuild = {
        title: 'Cancel Construction',
        display: 'Spent resources will be lost',
        unlocked() { return Boolean(player.oasis.map[player.oasis.selectedTile]?.action) },
        canClick() { return Boolean(player.oasis.map[player.oasis.selectedTile]?.action) },
        onClick() {
            player.oasis.map[player.oasis.selectedTile].action = ''
            player.oasis.map[player.oasis.selectedTile].progress = {}
        },
        style() { return {
            'background-color': '#000000',
            'color': '#ffffff',
            'border': temp.oasis.clickables[this.id].canClick ? '2px solid #ffa430' : '2px solid #888888',
            'margin': '0px 10px'
        } }
    }
}

function loadOasisVue() {
    Vue.component('oasis-row', {
        props: ['layer', 'data'],
        computed: {
            key() {return this.$vnode.key}
        },
        template: `
        <div class="upgTable instant">
            <div class="upgRow">
                <div v-for="(item, index) in data" style="margin-top: 0">
                    <div v-if="!Array.isArray(item)" v-bind:is="item" :layer= "layer" v-bind:style="tmp[layer].componentStyles[item]" :key="key + '-' + index"></div>
                    <div v-else-if="item.length==3" v-bind:style="[tmp[layer].componentStyles[item[0]], (item[2] ? item[2] : {})]" v-bind:is="item[0]" :layer= "layer" :data= "item[1]" :key="key + '-' + index"></div>
                    <div v-else-if="item.length==2" v-bind:is="item[0]" :layer= "layer" :data= "item[1]" v-bind:style="tmp[layer].componentStyles[item[0]]" :key="key + '-' + index"></div>
                </div>
            </div>
        </div>
        `
    })

    Vue.component('resource-grid', {
        props: ['layer', 'data'],
        computed: {
            key() { return this.$vnode.key },
            unlocked() { return this.data.filter(resource => player.oasis.resources[resource].unlocked) }
        },
        template: `
        <table class="resourceTable">
            <tr v-for="resource in unlocked">
                <td style='text-align: left'><display-text :layer="layer" :data="temp.oasis.resources[resource].name"></display-text></td>
                <td><blank :layer="layer" :data="['20px', '17px']"></blank></td>
                <td><bar :layer="layer" :data="resource"></bar></td>
                <td><blank :layer="layer" :data="['20px', '17px']"></blank></td>
                <td style='text-align: right'><display-text :layer="layer" :data="(temp.oasis.production[resource] ?? 0) + '/day'"></display-text></td>
            </tr>
        </table>
        `
    })

    Vue.component('job-grid', {
        props: ['layer', 'data'],
        computed: {
            key() { return this.$vnode.key },
            unlocked() { return this.data.filter(job => player.oasis.jobs[job].unlocked && temp.oasis.jobs[job].shown) }
        },
        template: `
        <table>
            <tr>
                <td style='text-align: left'><display-text :layer="layer" :data="'Unemployed'"></display-text></td>
                <td><blank :layer="layer" :data="['20px', '17px']"></blank></td>
                <td><blank :layer="layer" :data="['20px', '17px']"></blank></td>
                <td style='text-align: right'><display-text :layer="layer" :data="formatWhole(player.oasis.unemployed)+'/'+formatWhole(player.oasis.resources.people.amount)"></display-text></td>
            </tr>
            <tr v-for="job in unlocked">
                <td>
                    <div class="tooltipBox opaqueTooltip" style='text-align: left'>
                        {{temp.oasis.jobs[job].name}}
                        <tooltip v-if="jobs[job].tooltip" v-html="jobs[job].tooltip" class="opaque"></tooltip>
                    </div>
                </td>
                <td><blank :layer="layer" :data="['20px', '17px']"></blank></td>
                <td><clickable :layer="layer" :data="job+'-up'"></clickable></td>
                <td style='text-align: right'><display-text :layer="layer" :data="formatWhole(player.oasis.jobs[job].amount)+'/'+formatWhole(temp.oasis.jobs[job].max)"></display-text></td>
                <td><clickable :layer="layer" :data="job+'-down'"></clickable></td>
            </tr>
        </table>
        `
    })
}