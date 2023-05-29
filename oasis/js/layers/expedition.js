class Expedition {
    constructor(duration, people, camels) {
        this.startDate = {...player.oasis.time}
        this.duration = {...duration}
        this.timeLeft = {...duration}
        this.people = people
        this.camels = camels
        this.weights = {
            wood: 18,
            sandstone: 18,
            salt: 9,
            driedFood: 3,
            metal: 0,
            camels: hasResearch('camels') ? 6 : 0,
            people: 0
        }
        this.resources = { wood: 0, sandstone: 0, salt: 0, driedFood: 0, metal: 0, people: 0 }
        this.resourceCount = 0
    }

    tick() {
        this.timeLeft.days--
        if (this.timeLeft.days < 0) {
            this.timeLeft.days = 29
            this.timeLeft.months--
            this.weights.metal++
            if (this.weights.camels > 0) this.weights.camels--
            
            if (this.timeLeft.months < 0) {
                this.timeLeft.months = 11
                this.timeLeft.years--
                this.weights.people++
            }

            if (this.resourceCount < this.people*10 + this.camels*50) {
                let cumulativeWeight = 0
                let cumulativeWeights = []
                for (let [resource, weight] of Object.entries(this.weights)) {
                    if (weight <= 0) continue
                    cumulativeWeight += weight
                    cumulativeWeights.push([resource, cumulativeWeight])
                }

                let pickupAmount = Math.min(this.people*10, this.people*10 + this.camels*50 - this.resourceCount)
                for (let i = 0; i < pickupAmount; i++) {
                    let r = Math.random() * cumulativeWeight
                    for (let weight of cumulativeWeights) {
                        if (r < weight[1]) {
                            this.resources[weight[0]]++
                            this.resourceCount++
                            break
                        }
                    }
                }
            }
        }

    }

    shouldReturn() {
        return this.timeLeft.years <= 0 && this.timeLeft.months <= 0 && this.timeLeft.days <= 0
    }

    onReturn() {
        player.expedition.pastExpeditions.unshift({
            people: this.people,
            camels: this.camels,
            startDate: {...this.startDate},
            duration: {...this.duration},
            resources: {...this.resources},
        })
        if (player.expedition.pastExpeditions.length > 5) player.expedition.pastExpeditions.pop()
        
        for (let [resource, amount] of Object.entries(this.resources))
            player.oasis.resources[resource].amount += amount
        player.oasis.unemployed += this.people + (this.resources.people ?? 0)
        player.oasis.resources.people.amount += this.people + (this.resources.people ?? 0)
        player.oasis.resources.camels.amount += this.camels + (this.resources.camels ?? 0)
        player.expedition.onExpedition.people -= this.people
        player.expedition.onExpedition.camels -= this.camels
    }
}

addLayer("expedition", {
    type: "none",

    row: 0,
    position: 2,
    color: '#f6d7b0',

    startData() {
        return {
            unlocked: false,
            expeditions: [],
            pastExpeditions: [],
            onExpedition: {
                people: 0,
                camels: 0
            },
            numPeople: 0,
            numCamels: 0,
            numYears: 0,
            numMonths: 0
        }
    },

    update() {
        if (hasResearch('travel')) player.expedition.unlocked = true

        if (player.expedition.numPeople > player.oasis.resources.people.amount) player.expedition.numPeople = player.oasis.resources.people.amount
        if (player.expedition.numCamels > player.oasis.resources.camels.amount) player.expedition.numCamels = player.oasis.resources.camels.amount

        let toReturn = []
        player.expedition.expeditions.forEach((expedition, index) => {
            expedition.tick()
            if (expedition.shouldReturn()) {
                expedition.onReturn()
                toReturn.push(index)
            }
        })
        player.expedition.expeditions = player.expedition.expeditions.filter((_, index) => !toReturn.includes(index))
    },

    clickables: {
        'people-up': createExpeditionClickable({
            display: '+',
            canClick() { return player.expedition.numPeople < player.oasis.resources.people.amount - player.expedition.onExpedition.people },
            limit() { return player.oasis.resources.people.amount - player.expedition.onExpedition.people - player.expedition.numPeople },
            onClick(increment) { player.expedition.numPeople += increment }
        }),
        'people-down': createExpeditionClickable({
            display: '-',
            canClick() { return player.expedition.numPeople > 0 },
            limit() { return player.expedition.numPeople },
            onClick(increment) { player.expedition.numPeople -= increment }
        }),
        'camels-up': createExpeditionClickable({
            display: '+',
            canClick() { return player.expedition.numCamels < player.oasis.resources.camels.amount - player.expedition.onExpedition.camels },
            limit() { return player.oasis.resources.camels.amount - player.expedition.onExpedition.camels - player.expedition.numCamels },
            onClick(increment) { player.expedition.numCamels += increment }
        }),
        'camels-down': createExpeditionClickable({
            display: '-',
            canClick() { return player.expedition.numCamels > 0 },
            limit() { return player.expedition.numCamels },
            onClick(increment) { player.expedition.numCamels -= increment }
        }),
        'years-up': createExpeditionClickable({
            display: '+',
            canClick: true,
            limit() { return 100 },
            onClick(increment) { player.expedition.numYears += increment }
        }),
        'years-down': createExpeditionClickable({
            display: '-',
            canClick() { return player.expedition.numYears > 0 },
            limit() { return player.expedition.numYears },
            onClick(increment) { player.expedition.numYears -= increment }
        }),
        'months-up': createExpeditionClickable({
            display: '+',
            canClick: true,
            limit() { return 11 - player.expedition.numMonths },
            onClick(increment) {
                if (player.expedition.numMonths === 11) {
                    player.expedition.numMonths = 0
                    player.expedition.numYears++
                }
                else player.expedition.numMonths += increment
            }
        }),
        'months-down': createExpeditionClickable({
            display: '-',
            canClick() { return player.expedition.numMonths > 0 || player.expedition.numYears > 0 },
            limit() { return player.expedition.numMonths },
            onClick(increment) {
                if (player.expedition.numMonths === 0 && player.expedition.numYears > 0) {
                    player.expedition.numMonths = 11
                    player.expedition.numYears--
                }
                else player.expedition.numMonths -= increment
            }
        }),
        'send': {
            title: 'Embark',
            display: '',
            canClick() { return player.expedition.numPeople > 0
                            && (player.expedition.numYears > 0 || player.expedition.numMonths > 0)
                            && player.oasis.resources.driedFood.amount >= foodCost()
                            && player.oasis.unemployed >= player.expedition.numPeople },
            onClick() {
                player.oasis.resources.driedFood.amount -= foodCost()
                player.oasis.unemployed -= player.expedition.numPeople
                player.oasis.resources.people.amount -= player.expedition.numPeople
                player.oasis.resources.camels.amount -= player.expedition.numCamels
                player.expedition.onExpedition.people += player.expedition.numPeople
                player.expedition.onExpedition.camels += player.expedition.numCamels
                player.expedition.expeditions.push(new Expedition({years: player.expedition.numYears, months: player.expedition.numMonths, days: 0}, player.expedition.numPeople, player.expedition.numCamels))
            },
            tooltip() {
                let lines = []
                if (player.oasis.unemployed < player.expedition.numPeople) lines.push(`Not enough free people to send, requires ${player.expedition.numPeople - player.oasis.unemployed} more unemployed`)
                if (player.oasis.resources.driedFood.amount < foodCost()) lines.push(`Not enough ${resources.driedFood.name} to send, requires ${foodCost() - player.oasis.resources.driedFood.amount} more`)
                return lines.join('<br>')
            },
            style: {
                'min-height': '50px'
            }
        }
    },

    tabFormat: [
        "blank",
        ["row", [
            "send-selector",
            "blank",
            ["v-line", "34px"],
            "blank",
            "requirement-counter",
            "blank",
            ["v-line", "34px"],
            "blank",
            "duration-selector"
        ]],
        "blank",
        ["clickable", "send"],
        "expedition-list",
        "past-expeditions",
    ]
})

function createExpeditionClickable(data) {
    return {
        display: data.display,
        canClick: data.canClick,
        onClick() {
            let increment = 0
            switch (shiftDown + 2*ctrlDown) {
                case 0: increment = 1; break
                case 1: increment = 5; break
                case 2: increment = 25; break
                case 3: increment = Number.MAX_SAFE_INTEGER; break
            }
            increment = Math.min(increment, run(data.limit, this))
            run(data.onClick, this, increment)
        },
        style: {
            'width': '20px',
            'min-height': '20px',
        }
    }
}

function foodCost() {
    return player.expedition.numPeople * (player.expedition.numYears*12 + player.expedition.numMonths) * 30
}

function loadExpeditionVue() {
    Vue.component('send-selector', {
        props: ['layer'],
        computed: {
            resources() {
                return {
                    people: 'People',
                    camels: 'Camels'
                }
            },
            unlockedResources() {
                return Object.fromEntries(Object.entries(this.resources).filter(([resource, _]) => player.oasis.resources[resource].unlocked))
            }
        },
        template: `
        <table style="width: 200px">
            <tr v-for="(name, resource) in unlockedResources">
                <td style="text-align: right">{{name+':'}}</td>
                <td><blank></blank></td>
                <td><clickable :layer="layer" :data="resource+'-up'"></clickable></td>
                <td><display-text :layer="layer" :data="player.expedition['num'+name]+'/'+player.oasis.resources[resource].amount"></display-text></td>
                <td><clickable :layer="layer" :data="resource+'-down'"></clickable></td>
            </tr>
        </table>
        `
    })

    Vue.component('requirement-counter', {
        props: ['layer'],
        computed: {
            people() {
                let text = `Sending ${player.expedition.numPeople} ${player.expedition.numPeople > 1 ? 'people' : 'person'}`
                if (player.expedition.numCamels > 0) text += ` and ${player.expedition.numCamels} camel${player.expedition.numCamels > 1 ? 's' : ''}`
                return text
            },
            duration() {
                let text = []
                if (player.expedition.numYears > 0) text.push(`${player.expedition.numYears} year${player.expedition.numYears > 1 ? 's' : ''}`)
                if (player.expedition.numMonths > 0) text.push(`${player.expedition.numMonths} month${player.expedition.numMonths > 1 ? 's' : ''}`)
                return text.length > 1 ? text.join(' and ') : text[0]
            },
        },
        template: `
        <div style="width: 500px">
            <display-text v-if="player.expedition.numPeople <= 0" data="An expedition requires at least one person!"></display-text>
            <display-text v-else-if="player.expedition.numYears <= 0 && player.expedition.numMonths <= 0" data="An expedition must take at least one month!"></display-text>
            <div v-else>
                <display-text :layer="layer" :data="people+' for '+duration"></display-text>
                <display-text :layer="layer" :data="'will require '+foodCost()+' dried food'"></display-text>
                <display-text :layer="layer" :data="'Current Dried Food: '+player.oasis.resources.driedFood.amount"></display-text>
            </div>
        </div>
        `
    })

    Vue.component('duration-selector', {
        props: ['layer'],
        computed: {
            times() {
                return {
                    years: 'Years',
                    months: 'Months'
                }
            }
        },
        template: `
        <table style="width: 200px">
            <tr v-for="(name, time) in times">
                <td style="text-align: right">{{name+':'}}</td>
                <td><blank></td>
                <td><clickable :layer="layer" :data="time+'-up'"></clickable></td>
                <td><display-text :layer="layer" :data="player.expedition['num'+name]"></display-text></td>
                <td><clickable :layer="layer" :data="time+'-down'"></clickable></td>
            </tr>
        </table>
        `
    })

    Vue.component('expedition-list', {
        props: ['layer'],
        template: `
        <div>
            <div v-if="player.expedition.expeditions.length > 0">
                <blank></blank>
                <h3>Current Expeditions</h3>
            </div>
            <blank></blank>
            <div v-for="expedition in player.expedition.expeditions">
                <expedition :layer="layer" :data="expedition"></expedition>
            </div>
        </div>
        `
    })

    Vue.component('expedition', {
        props: ['layer', 'data'],
        computed: {
            numPeople() {
                return `${this.data.people} people${this.data.camels > 0 ? ` and ${this.data.camels} camels` : ''}`
            },
            startDate() {
                return `${this.data.startDate.year}/${this.data.startDate.month}/${this.data.startDate.day}`
            },
            timeLeft() {
                let display = []
                if (this.data.timeLeft.years > 0) display.push(`${this.data.timeLeft.years} years`)
                if (this.data.timeLeft.months > 0) display.push(`${this.data.timeLeft.months} months`)
                if (this.data.timeLeft.days > 0) display.push(`${this.data.timeLeft.days} days`)
                return display.join(', ')
            },
            text() {
                return `${this.numPeople} were sent out on ${this.startDate} and are returning in ${this.timeLeft}`
            }
        },
        template: `
        <div>{{text}}</div>
        `
    })

    Vue.component('past-expeditions', {
        props: ['layer'],
        template: `
        <div>
            <div v-if="player.expedition.pastExpeditions.length > 0">
                <blank></blank>
                <h3>Past Expeditions</h3>
            </div>
            <blank></blank>
            <div v-for="expedition in player.expedition.pastExpeditions">
                <past-expedition :layer="layer" :data="expedition"></past-expedition>
            </div>
        </div>
        `
    })

    Vue.component('past-expedition', {
        props: ['layer', 'data'],
        computed: {
            numPeople() {
                return `${this.data.people} people${this.data.camels > 0 ? ` and ${this.data.camels} camels` : ''}`
            },
            startDate() {
                return `${this.data.startDate.year}/${this.data.startDate.month}/${this.data.startDate.day}`
            },
            duration() {
                let display = []
                if (this.data.duration.years > 0) display.push(`${this.data.duration.years} years`)
                if (this.data.duration.months > 0) display.push(`${this.data.duration.months} months`)
                if (this.data.duration.days > 0) display.push(`${this.data.duration.days} days`)
                return display.join(', ')
            },
            resources() {
                let display = []
                for (let [resource, amount] of Object.entries(this.data.resources))
                    if (amount > 0) display.push(`${amount} ${resource}`)
                return display.join(', ')
            },
            text() {
                return `${this.numPeople} were sent out on ${this.startDate} for ${this.duration} and returned with ${this.resources}`
            }
        },
        template: `
        <div>{{text}}</div>
        `
    })
}