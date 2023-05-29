class Action {
    constructor(name) {
        this.name = name
        this.canRun = () => true
        this.requirementText = ''
        this.stateCheck = () => !player.oasis.map[player.oasis.selectedTile]?.action && temp.oasis.resources.people.max > 0
        this.unlocked = () => true
    }

    setCanRun(requirementText, canRun) { this.requirementText = requirementText; this.canRun = canRun; return this }
    setUnlocked(unlocked) { this.unlocked = unlocked; return this }

    static createActionGroup(baseTiles, tiers, buildText, upgradeText, requirementData) {
        let newActions = {}
        tiers.forEach(([building, costs, unlockCheck], tier) => {
            let buildingName = buildings[building].name
            let vowel = 'AEIOU'.includes(buildingName[0])
            let buildName = `${buildText} ${vowel ? 'an' : 'a'} ${buildingName}`
            let upgradeName = `${upgradeText} ${vowel ? 'an' : 'a'} ${buildingName}`

            // build straight to building
            let buildActionName = `build_${building}`
            let buildCosts = {...costs}
            for (let i = 0; i < tier; i++) {
                for (let [resource, amount] of Object.entries(tiers[i][1])) {
                    buildCosts[resource] = (buildCosts[resource] ?? 0) + amount
                }
            }
            
            newActions[buildActionName] = new BuildAction(buildName, building)
            newActions[buildActionName].cost = {...buildCosts}
            if (requirementData) newActions[buildActionName].setCanRun(...requirementData)
            if (unlockCheck) newActions[buildActionName].setUnlocked(unlockCheck)
            for (let baseTile of baseTiles) buildings[baseTile].upgrades.push(buildActionName)

            // upgrade from lower tiers to tier
            for (let i = 0; i < tier; i++) {
                let upgradeActionName = `upgrade_${building}_${tiers[i][0]}`
                for (let [resource, amount] of Object.entries(tiers[i][1])) {
                    buildCosts[resource] -= amount
                    if (buildCosts[resource] <= 0) delete buildCosts[resource]
                }
                newActions[upgradeActionName] = new BuildAction(upgradeName, building)
                newActions[upgradeActionName].cost = {...buildCosts}
                if (requirementData) newActions[upgradeActionName].setCanRun(...requirementData)
                if (unlockCheck) newActions[upgradeActionName].setUnlocked(unlockCheck)
                buildings[tiers[i][0]].upgrades.push(upgradeActionName)
            }
        })

        for(let [name, action] of Object.entries(newActions)) {
            actions[name] = action
        }
    }
}

class BuildAction extends Action {
    constructor(name, building) {
        super(name)
        this.building = building
        this.cost = {}
    }

    costs(resource, amount) { this.cost[resource] = (this.cost[resource] ?? 0) + amount; return this }
}

class DemolishAction extends Action {
    constructor(name, building = '') {
        super(name)
        this.building = building
        this.provide = {}
    }

    getOutputBuilding() { return this.building ? this.building : ((temp.oasis.countResourcesAroundSelected?.[1]?.water ?? 0) - (temp.oasis.countResourcesAroundSelected?.[0]?.water ?? 0)) > 0 ? 'soil' : 'sand' }
    provides(resource, amount) { this.provide[resource] = amount; return this }
}

const actions = {
    buildFreeCampsite: new BuildAction("Settle", "campsite").setCanRun("Must be within 2 tiles of Water", () => (temp.oasis.countResourcesAroundSelected?.[2]?.water ?? 0) > 0),
    buildLoggingCamp: new BuildAction("Set up logging operations", "loggingCamp").costs('stoneTools', 10).setUnlocked(() => player.oasis.resources.stoneTools.unlocked),
    buildCactusFarm: new BuildAction("Plant a Cactus Farm", "cactusFarm").costs('stoneTools', 10).setCanRun("Must be within 2 tiles of Water", () => (temp.oasis.countResourcesAroundSelected?.[2]?.water ?? 0) > 0).setUnlocked(() => hasResearch('cactusFarm')),
    buildLookoutTower: new BuildAction("Build a Lookout Tower", "lookoutTower").setCanRun("Must be adjacent to at least two sources of Civilization", () => (temp.oasis.countResourcesAroundSelected?.[1]?.civilization ?? 0) > 1).costs('stoneTools', 30).costs('sandstone', 200).costs('wood', 150).setUnlocked(() => hasResearch('lookout')),
    buildCamelFarm: new BuildAction("Build a Camel Pen", "camelFarm").costs('stoneTools', 10).costs('wood', 60).setCanRun("Must be within 2 tiles of Civilization", () => (temp.oasis.countResourcesAroundSelected?.[2]?.civilization ?? 0) > 0).setUnlocked(() => hasResearch('camels')),
    buildSmelter: new BuildAction("Build a Smithy", "smelter").costs('stoneTools', 50).costs('sandstone', 200).costs('wood', 50).setCanRun("Must be within 2 tiles of Civilization", () => (temp.oasis.countResourcesAroundSelected?.[2]?.civilization ?? 0) > 0).setUnlocked(() => hasResearch('smelting')),
}

function initActions() {
    Action.createActionGroup(['sand', 'soil'],
                    [
                        ['campsite', {'food': 10, 'wood': 5}],
                        ['encampment', {'food': 15, 'wood': 15, 'sandstone': 20}, () => player.oasis.resources.sandstone.unlocked],
                        ['settlement', {'food': 30, 'wood': 80, 'sandstone': 120}, () => temp.oasis.buildings.encampment > 0 || temp.oasis.buildings.settlement > 0 || hasResearch('village')],
                        ['village', {'food': 60, 'wood': 150, 'sandstone': 300}, () => hasResearch('village')]
                    ],
                    'Build', 'Upgrade to',
                    ["Must be within 2 tiles of Water", () => (temp.oasis.countResourcesAroundSelected?.[2]?.water ?? 0) > 0])

    Action.createActionGroup(['soil'],
                    [
                        ['basicFarm', {'stoneTools': 30, 'labor': 30}, () => hasResearch('farm')],
                    ],
                    'Plow', 'Plow',
                    ["Must be adjacent to Water", () => (temp.oasis.countResourcesAroundSelected?.[1]?.water ?? 0) > 0])
    Action.createActionGroup(['soil'],
                    [
                        ['canal', {'wood': 30, 'sandstone': 60, 'labor': 30}, () => hasResearch('canal')],
                    ],
                    'Dig', 'Plow',
                    ["Must be adjacent to Water", () => (temp.oasis.countResourcesAroundSelected?.[1]?.water ?? 0) > 0])

    Action.createActionGroup(['sand'],
                    [
                        ['sandPit', {'labor': 20, 'wood': 10}],
                        ['quarry', {'labor': 40, 'stoneTools': 20}, () => player.oasis.resources.stoneTools.unlocked],
                        ['mine', {'labor': 90, 'wood': 30, 'stoneTools': 60, 'metal': 15}, () => hasResearch('mine')]
                    ],
                    'Dig out', 'Dig out',
                    ["Must be within 2 tiles of Civilization", () => (temp.oasis.countResourcesAroundSelected?.[2]?.civilization ?? 0) > 0])
    
    Action.createActionGroup(['soil'],
                    [
                        ['saltPool', {'sandstone': 120, 'labor': 30}, () => hasResearch('saltPool')]
                    ],
                    'Flatten out', 'Flatten out',
                    ["Must be adjacent to Water", () => (temp.oasis.countResourcesAroundSelected?.[1]?.water ?? 0) > 0])
    Action.createActionGroup(['sand', 'soil'],
                    [
                        ['smallWarehouse', {'stoneTools': 5, 'sandstone': 30}, () => temp.oasis.buildings.settlement > 0 || temp.oasis.buildings.village > 0 || hasResearch('storage')],
                        ['mediumWarehouse', {'stoneTools': 20, 'sandstone': 90, 'wood': 30}, () => hasResearch('storage')]
                    ],
                    'Build', 'Upgrade to',
                    ["Must be within 2 tiles of Civilization", () => (temp.oasis.countResourcesAroundSelected?.[2]?.civilization ?? 0) > 0])
    Action.createActionGroup(['sand', 'soil'],
                    [
                        ['smallWall', {'labor': 10, 'wood': 20}, () => hasResearch('walls')],
                        ['mediumWall', {'labor': 30, 'metal': 20, 'sandstone': 40}, () => hasResearch('bigWalls')]
                    ],
                    'Build', 'Upgrade to',
                    ["Must be within 2 tiles of Civilization", () => (temp.oasis.countResourcesAroundSelected?.[2]?.civilization ?? 0) > 0])
    
    actions.buildFreeCampsite.stateCheck = () => !(player.oasis.map[player.oasis.selectedTile]?.action ?? true) && temp.oasis.resources.people.max <= 0
}