class Job {
    constructor(id, name, produces = {}, consumes = {}, limits = {}) {
        this.name = name
        this.produces = produces
        this.consumes = consumes
        this.stores = limits
        this.shouldUnlock = () => temp.oasis.jobs[id].max > 0
        this.shouldShow = () => true
        this.tooltip = (() => {
            let tooltip = []
            if (Object.keys(this.stores).length > 0)
                tooltip.push(`Storage: ${Object.entries(this.stores).map(([resource, amount]) => `${formatWhole(amount)} ${resources[resource].name}`).join(', ')}`)
            if (Object.keys(this.produces).length > 0)
                tooltip.push(`Production: ${Object.entries(this.produces).map(([resource, amount]) => `${formatWhole(amount)} ${resources[resource].name}`).join(', ')}`)
            if (Object.keys(this.consumes).length > 0)
                tooltip.push(`Consumption: ${Object.entries(this.consumes).map(([resource, amount]) => `${formatWhole(amount)} ${resources[resource].name}`).join(', ')}`)
            return tooltip.join('<br>')
        })()
        this.outdoors = false
    }

    workAmount() {
        let max = Number.MAX_SAFE_INTEGER
        for ([resource, amount] of Object.entries(this.consumes)) {
            let available = player.oasis.resources[resource].amount
            let workable = Math.floor(available / (amount))
            if (workable < max)
                max = workable
        }
        for ([resource, amount] of Object.entries(this.produces)) {
            let freeSpace = player.oasis.resources[resource].max - player.oasis.resources[resource].amount
            let workable = Math.ceil(freeSpace / (amount))
            if (workable < max)
                max = workable
        }
        return max
    }

    getWork(workers) {
        let production = {}

        let workAmount = Math.min(this.workAmount(), workers)
        for ([resource, amount] of Object.entries(this.consumes))
            production[resource] = (production[resource] ?? 0) - (amount * workAmount)
        for ([resource, amount] of Object.entries(this.produces))
            production[resource] = (production[resource] ?? 0) + (amount * workAmount)

        if (this.outdoors && player.oasis.time.year >= 10 && temp.oasis.inStorm)
            for (resource in production)
                production[resource] = ~~(production[resource]/2)

        return production
    }

    setShouldUnlock(shouldUnlock) { this.shouldUnlock = shouldUnlock; return this }
    setShouldShow(shouldShow) { this.shouldShow = shouldShow; return this }
    setTooltip(tooltip) { this.tooltip = tooltip; return this }
    setOutdoors() { this.outdoors = true; return this }
    setPlural(plural) { this.plural = plural; return this }
}

const jobs = {
    builder: new Job('builder', "Builder").setTooltip('Brings 1 resource per day to building sites<br>Will help with sand removal duties'),
    forager: new Job('forager', "Forager", {'food': 2}).setShouldShow(() => temp.oasis.jobs.forager.max > 0).setOutdoors(),
    scavenger: new Job('scavenger', "Scavenger", {'wood': 1}).setShouldShow(() => temp.oasis.jobs.scavenger.max > 0).setOutdoors(),
    knapper: new Job('knapper', "Knapper", {'sandstone': 1}).setShouldShow(() => temp.oasis.jobs.knapper.max > 0).setOutdoors(),
    farmer: new Job('farmer', "Farmer", {'food': 4}).setOutdoors(),
    logger: new Job('logger', "Logger", {'wood': 2}).setOutdoors(),
    miner: new Job('miner', "Miner", {'sandstone': 2}).setOutdoors(),
    metalMiner: new Job('metalMiner', "Deep Miner", {'metal': 1}).setOutdoors(),
    crafter: new Job('crafter', "Crafter", {'stoneTools': 1}, {'wood': 1, 'sandstone': 1}),
    smith: new Job('smith', "Blacksmith", {'metalTools': 1}, {'wood': 1, 'metal': 1}),
    elder: new Job('elder', "Elder", {'research': 1}).setShouldShow(() => !hasResearch('stars')),
    saltFarmer: new Job('saltFarmer', "Salt Farmer", {'salt': 1}).setOutdoors(),
    camelFarmer: new Job('camelFarmer', "Herdsman", {}, {'food': 1}, {'camels': 10}).setPlural("Herdsmen"),
    astrologist: new Job('astrologist', "Astrologist", {'research': 3}).setShouldShow(() => hasResearch('stars')),
    sweeper: new Job('sweeper', "Sweeper", {'sand': 1}).setTooltip('Removes 1 foot of sand per day'),
    shoveler: new Job('shoveler', "Shoveler", {'sand': 5}).setTooltip('Removes 5 feet of sand per day'),
}