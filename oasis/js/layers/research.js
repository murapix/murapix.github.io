class Research {
    constructor(title, type, display, tooltip, cost) {
        this.title = title
        this.type = type
        this.display = display
        this.tooltip = tooltip
        this.cost = cost
    }

    withPos(row, col) { this.pos = [row, col]; return this }
    withPrereqs(...prereqs) { this.prerequisites = prereqs; return this }

    addToQueue() {
        if (player.research.researched.includes(this.id) || player.research.queue.includes(this.id)) return
        this.prerequisites?.forEach(id => layers.research.research[id].addToQueue())
        player.research.queue.push(this.id)
    }
    removeFromQueue() {
        let researchIndex = player.research.queue.indexOf(this.id)
        if (researchIndex < 0) return
        player.research.queue.splice(researchIndex, 1)
        while (researchIndex < player.research.queue.length) {
            let research = player.research.queue[researchIndex]
            let data = temp.research.research[research]
            if (data.prerequisites && data.prerequisites.find(id => !player.research.queue.includes(id) && !player.research.researched.includes(id)))
                player.research.queue.splice(researchIndex, 1)
            else researchIndex++
        }
    }
}

class AgricultureResearch extends Research { constructor(title, display, tooltip, cost) { super(title, 'Agriculture', display, tooltip, cost) } }
class ConstructionResearch extends Research { constructor(title, display, tooltip, cost) { super(title, 'Construction', display, tooltip, cost) } }
class ExplorationResearch extends Research { constructor(title, display, tooltip, cost) { super(title, 'Exploration', display, tooltip, cost) } }
class UniqueResearch extends Research { constructor(title, display, tooltip, cost) { super(title, '', display, tooltip, cost) } }

addLayer("research", {
    type: "none",

    row: 0,
    position: 1,
    color: "#ffffff",
    
    startData() {
        let startData  = {
            unlocked: false,
            points: 0,
            progress: 0,
            researched: [],
            queue: []
        }
        return startData
    },

    update() {
        if (temp.oasis.production.research > 0) player.research.unlocked = true
        player.research.points += temp.oasis.production.research

        if (player.research.queue.length > 0) {
            let cost = temp.research.research[player.research.queue[0]].cost
            let type = temp.research.research[player.research.queue[0]].type
            let remProgress = cost - player.research.progress
            let progressChange = Math.min(remProgress, temp.oasis.production.research*2*temp.research.bonuses[type], player.research.points*temp.research.bonuses[type])
            let pointChange = Math.ceil(progressChange/temp.research.bonuses[type])
            player.research.progress += progressChange
            player.research.points -= pointChange
            if (player.research.progress >= cost) {
                player.research.researched.push(player.research.queue.shift())
                player.research.progress = 0
            }
        }
        else {
            player.research.progress = 0
        }
    },

    bonuses() {
        let bonuses = { Agriculture: 1, Construction: 1, Exploration: 1 }
        for (let [building, count] of Object.entries(temp.oasis.ruinedBuildings))
            bonuses[ruinedBuildings[building].type] += ruinedBuildings[building].bonus*count
        return bonuses
    },

    research: {
        saltPool: new AgricultureResearch('Evaporation Pools', buildings.saltPool.display, `The heat and insects ruin food quickly<br>Maybe some salt can be drawn from the oasis to help with preservation<br>Unlocks the ${buildings.saltPool.name}`, 30)
                        .withPos(0, 1),
        farm: new AgricultureResearch('Agriculture', buildings.basicFarm.display, `Careful cultivation of the fertile land around the oasis<br>should allow for more food for the tribe<br>Unlocks the ${buildings.basicFarm.name}`, 30)
                        .withPos(0,3),
        canal: new ConstructionResearch('Canals', buildings.canal.display, `The land around the oasis is rich and wet,<br>but the sands are greedy and dry<br>Unlocks the ${buildings.canal.name}`, 120)
                        .withPos(1,2)
                        .withPrereqs('saltPool'),
        travel: new ExplorationResearch('Expeditions', '', 'Ruins full of treasure dot the land, waiting only for someone to take them<br>Unlocks Expeditions', 600)
                        .withPos(2,0)
                        .withPrereqs('saltPool'),
        walls: new ConstructionResearch('Construction', buildings.smallWall.display, `The sandstorms are disruptive and dangerous, the people need protection<br>Unlocks the ${buildings.smallWall.name}`, 450)
                        .withPos(2,2)
                        .withPrereqs('canal'),
        cactusFarm: new AgricultureResearch('Desert Farming', buildings.cactusFarm.display, `While the sparse cacti don't seem to need much,<br>it may be possible to grow more with some dedicated work<br>Unlocks the ${buildings.cactusFarm.name}`, 300)
                        .withPos(2,3)
                        .withPrereqs('canal', 'farm'),
        mine: new ConstructionResearch('Mining', buildings.mine.display, `Better construction allows for deeper and more stable mines<br>Unlocks the ${buildings.mine.name}`, 8100)
                        .withPos(3,0)
                        .withPrereqs('travel', 'walls'),
        lookout: new ConstructionResearch('Expansion', buildings.lookoutTower.display, `With the oasis becoming cluttered,<br>it's time to look for arable land beyond the oasis valley<br>Unlocks the ${buildings.lookoutTower.name}`, 9000)
                        .withPos(3,1)
                        .withPrereqs('travel', 'walls'),
        storage: new ConstructionResearch('Engineering', buildings.mediumWarehouse.display, `Better building techniques allow for larger and more spacious structures<br>Unlocks the ${buildings.mediumWarehouse.name}`, 7500)
                        .withPos(3,2)
                        .withPrereqs('walls'),
        stars: new ExplorationResearch('Astrology', '', `The portents of the stars hold the secrets of the world<br>Upgrades ${jobs.elder.name}s to ${jobs.astrologist.name}s`, 7000)
                        .withPos(3,3)
                        .withPrereqs('walls'),
        smelting: new ConstructionResearch('Metalurgy', buildings.smelter.display, `Raw ores from beneath the earth require processing to be truly useful<br>Unlocks the ${buildings.smelter.name}`, 25000)
                        .withPos(4,0)
                        .withPrereqs('mine'),
        camels: new AgricultureResearch('Animal Husbandry', buildings.camelFarm.display, `Raising and breeding camels will allow larger<br>and further expeditions into the desert<br>Unlocks the ${buildings.camelFarm.name}`, 24000)
                        .withPos(4,1)
                        .withPrereqs('lookout'),
        village: new ConstructionResearch('Community', buildings.village.display, `The community is the key to survival<br>Unlocks the ${buildings.village.name}`, 30000)
                        .withPos(4,2)
                        .withPrereqs('storage', 'lookout'),
        writing: new ExplorationResearch('Writing', '', 'To leave behind a legacy of knowledge, you must write it down<br>Unlocks Monuments (soon™)', 36000)
                        .withPos(4,3)
                        .withPrereqs('stars'),
    },

    tabFormat: () => {
        let format = [
            "blank",
            ["display-text", `Research Points: ${formatWhole(player.research.points)}`],
            "blank",
            'researchScreen',
            "blank"
        ]
        if (Math.max(...Object.values(temp.research.bonuses)) > 1) {
            format.push(...[
                ["display-text", 'Archaeological Research Bonus:'],
                ["display-text", `Agriculture: ${formatWhole(temp.research.bonuses.Agriculture*100)}%`],
                ["display-text", `Construction: ${formatWhole(temp.research.bonuses.Construction*100)}%`],
                ["display-text", `Exploration: ${formatWhole(temp.research.bonuses.Exploration*100)}%`]
            ])
        }
        return format
    }
})

function linkResearchIDs() {
    for (research in layers.research.research) {
        layers.research.research[research].id = research
    }
}

function clickResearch(id) {
    if (!player.research.unlocked || tmp.research.deactivated) return
    if (player.research.queue.indexOf(id) >= 0)
        run(layers.research.research[id].removeFromQueue, layers.research.research[id])
    else
        run(layers.research.research[id].addToQueue, layers.research.research[id])
}

function hasResearch(id) {
    return player.research.researched.includes(id)
}

function loadResearchVue() {
    Vue.component('research', {
        props: ['layer', 'data'],
        computed: {
            researched() { return player.research.researched.includes(this.data) },
            prerequisitesResearched() {
                if (this.researched) return true
                return (layers.research.research[this.data].prerequisites?.filter(prereq => !player.research.researched.includes(prereq)).length ?? 0) === 0
            },
            inQueue() { return player.research.queue.includes(this.data) },
            progress() { return player.research.queue[0] === this.data ? (player.research.progress / temp.research.research[this.data].cost) : 0 },
            index() { return player.research.queue.indexOf(this.data) }
        },
        template: `
            <button :class="{ researchContainer: true, tooltipBox: true, can: !researched, researchable: (prerequisitesResearched && !researched), notResearchable: !prerequisitesResearched, researched: researched }"
                    :style="[index === 0 ? { 'background-image': 'linear-gradient(to right, #0000ff40 '+(progress*100-5)+'%, #0f0f0f '+(progress*100+5)+'%)' } : {}]"
                    v-on:click="clickResearch(data)" :id='"research-" + layer + "-" + data'>
                <div>
                    <div :class="{ researchDisplay: true, researched: researched }" v-html="run(layers.research.research[data].display, layers.research.research[data])"></div>
                    <div class="researchType">{{temp.research.research[data].type}}</div>
                    <div v-if="!researched && player.research.queue[0] !== data" class="progressDisplay">{{formatWhole(temp.research.research[data].cost)}}</div>
                    <div v-else-if="!researched && player.research.queue[0] === data" class="progressDisplay">{{formatWhole(player.research.progress)}}/{{formatWhole(temp.research.research[data].cost)}}</div>
                    <div v-if="index >= 0" class="queueIndex">{{index+1}}</div>
                    <div class="researchName">{{tmp.research.research[data].title}}</div>
                </div>
                <tooltip v-if="tmp.research.research[data].tooltip" :text="tmp.research.research[data].tooltip"></tooltip>
            </button>
            `
    })

    Vue.component('researchScreen', {
        props: ['layer'],
        data() {
            return { blankWidth: 100 }
        },
        computed: {
            size() { return Object.values(layers.research.research).map(research => research.pos).reduce(([x1, y1], [x2, y2]) => [Math.max(x1, x2), Math.max(y1, y2)]).map(i => i+1) },
            rows() { return this.size[1] },
            cols() { return this.size[0] },
            grid() {
                let grid = new Array(this.rows).fill().map(() => new Array(this.cols*2+1).fill(''))
                for (research in layers.research.research) {
                    let [col, row] = layers.research.research[research].pos
                    grid[row][col*2+1] = research
                }
                return grid
            },
            lines() {
                let lines = []
                let dependents = {}
                for (research in layers.research.research) {
                    dependents[research] = []
                    if (layers.research.research[research].prerequisites)
                        for (prereq of layers.research.research[research].prerequisites)
                            dependents[prereq].push(research)
                }
                for (research in layers.research.research) {
                    let splitX = Math.min(...dependents[research].map(dep => layers.research.research[dep].pos[0]))*(300+this.blankWidth)+this.blankWidth/2
                    let color = player.research.researched.includes(research) ? 'white' : 'grey'
                    for (dep of dependents[research]) {
                        let startX = (layers.research.research[research].pos[0]+1)*(300+this.blankWidth)
                        let startY = layers.research.research[research].pos[1]*50+25
                        let endX = (layers.research.research[dep].pos[0])*(300+this.blankWidth)+this.blankWidth
                        let endY = layers.research.research[dep].pos[1]*50+25
                        if (startY === endY) {
                            lines.push([color, `M ${startX},${startY} H ${endX}`])
                        }
                        else {
                            let arcStartX = splitX-10
                            let arcDir = (startY < endY ? 10 : -10)
                            let arcStartY = endY - arcDir
                            let arcStartClockwise = (startY < endY ? 1 : 0)
                            let arcEndClockwise = (startY < endY ? 0 : 1)

                            lines.push([color, `M ${startX},${startY} H ${arcStartX} a 10,10 0 0,${arcStartClockwise} 10,${arcDir} V ${arcStartY} a 10,10 0 0,${arcEndClockwise} 10,${arcDir} H ${endX}`])
                        }
                    }
                }
                return lines
            }
        },
        template: `
        <div :style="'height: '+(rows*51+150)+'px'" class="researchTableDiv">
            <blank :data="'30px'"></blank>
            <svg :width="(cols*(300+blankWidth)-blankWidth)" :height="(rows*51)">
                <g v-for="line in lines" fill="none" stroke-width="4" stroke-linecap="round">
                    <path :stroke="line[0]" :d="line[1]" />
                </g>
            </svg>
            <div :style="'margin-top: -'+(rows*51+2)+'px'">
                <table class="researchTable">
                    <tr v-for="row in grid">
                        <td v-for="val in row">
                            <research v-if="val && typeof val === 'string'" :layer="layer" :data="val"></research>
                            <blank v-else :layer="layer" :data="[blankWidth+'px', '50px']"></blank>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="researchFade" :style="{'margin-top': -(rows*51)+'px', height: (rows*51)+'px'}" />
        </div>
        `
    })
}