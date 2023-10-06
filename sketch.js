let countries = [];
let populations = [];
let maxPopulation;
let visualMode;
let cols, rows;
let cellWidth, cellHeight;
let regionList = [];

// TODO create VisualSettings to insert visual variables
let colorList = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 255, 0],
    [255, 165, 0],
    [128, 0, 128],
    [255, 192, 203],
    [255, 255, 255],
    [0, 0, 0],
    [128, 128, 128],
    [165, 42, 42],
    [0, 255, 255],
    [0, 255, 0],
    [255, 215, 0],
    [192, 192, 192],
    [0, 0, 139],
    [0, 100, 0],
    [139, 0, 0],
    [169, 169, 169],
    [64, 224, 208]
];

let populationGroupSize = 1000000;
const VISUALIZATION_GLOBAL_GRID = 0;
const VISUALIZATION_REGION_GRIDS = 1;
const VISUALIZATION_REGION_SPIRALS = 2;

function setup() {
    createCanvas(1800, 1200);
    loadData();
    visualMode = 1;
    cols = 100;
    rows = 100;
    smallCols = 40;
    smallRows = 20;
    cellWidth = 15;
    cellHeight = 15;
    geoSize = 3;
    geoSize2 = 7;
}

function draw() {
    background(220);

    //TODO use switch case
    if (visualMode == VISUALIZATION_REGION_GRIDS || visualMode == VISUALIZATION_REGION_SPIRALS) {
        let countryColor = colorList[4];
        fill(color(countryColor[0], countryColor[1], countryColor[2], 100));
        tint(255, 128);
        for (let i = 0; i < countries.length; i++) {

            //TODO create draw() in Country
            let country = countries[i];
            if (visualMode == VISUALIZATION_REGION_SPIRALS) {
                ellipse(country.geoPos.x, country.geoPos.y, country.radius * 2, country.radius * 2);
            } else {
                image(country.img_flag, country.geoPos.x - country.flagWidth / 2, country.geoPos.y - country.flagHeight / 2, country.flagWidth, country.flagHeight);
            }
            //text(city.name, city.x + 15, city.y);
        }
        tint(255);
    }

    for (let i = 0; i < populations.length; i++) {
        populations[i].update();
        populations[i].draw();
    }
}

function loadData() {
    let url =
        'https://restcountries.com/v3.1/all';
    loadJSON(url, function (data) {
        // Ordina le città per popolazione in ordine decrescente
        data.sort((a, b) => b.population - a.population);
        maxPopulation = data[0].population;
        data.sort((a, b) => b.area - a.area);
        maxArea = data[0].area;
        maxRadius = sqrt(data[0].area);
        // countries = data;//data.slice(0, numCities);
        for (let i = 0; i < data.length; i++) {
            let currData = data[i];
            let country = new Country(currData.area, currData.flags.png, currData.latlng, currData.region)

            countries.push(country);

            if (!regionList.includes(currData.region)) {
                regionList.push(currData.region);
            }

            let populationsSize = currData.population / populationGroupSize;
            for (let i = 0; i < populationsSize; i++) {
                let population = new Population(i, country, populationsSize);

                populations.push(population);
            }
        }

        populations.sort(function (a, b) {
            let nomeA = a.country.region.toUpperCase();
            let nomeB = b.country.region.toUpperCase();
            if (nomeA < nomeB) {
                return -1;
            }
            if (nomeA > nomeB) {
                return 1;
            }
            return 0;
        });

        for (let i = 0; i < populations.length; i++) {
            let population = populations[i];
            population.globalIndex = i;
            population.calculatePositions();
        }

        console.log("num points: " + populations.length);
    });

}

class Country {
    constructor(area, flagImagePath, latlng, region) {
        this.img_flag = loadImage(flagImagePath);
        this.radius = sqrt(area / PI) / 40;

        this.geoPos = SpatialOperations.toMap(latlng);
        this.region = region;

        let edge = sqrt(area) / 40;
        this.flagWidth = edge * 1.3;
        this.flagHeight = edge / 1.3;
    }
}

class Population {
    constructor(i, country, populationsSize) {

        this.country = country
        this.changingVisualMode = false;

        //TODO move to Country
        let regIndex = regionList.indexOf(this.country.region);
        this.color = colorList[regIndex];

        this.countryIndex = i;
        this.countryPopSize = populationsSize;
        //TODO REMOVE
        this.geoCenterPos = country.geoPos;
    }

    calculatePositions() {
        let angle = random(TWO_PI);
        this.geoPos = createVector(this.geoCenterPos.x + cos(angle) * random(0, this.country.radius), this.geoCenterPos.y + sin(angle) * random(0, this.country.radius));

        this.spiralPos = SpatialOperations.placeToSpiral(this.countryIndex, this.countryPopSize, this.geoCenterPos, this.country.radius);
        this.smallGridPos = SpatialOperations.toGrid(this.countryIndex, smallCols, smallRows, this.country.flagWidth / smallCols, this.country.flagHeight / smallRows, this.geoCenterPos.x + this.country.flagWidth / 2, this.geoCenterPos.y + (this.country.flagHeight / 2), true)
        this.globalGridPos = SpatialOperations.toGrid(this.globalIndex, cols, rows, cellWidth, cellHeight);
    }

    draw() {

        //TODO use switch case
        if (visualMode == VISUALIZATION_REGION_SPIRALS) {
            fill(color(this.color[0], this.color[1], this.color[2], 100));
            noStroke();
            ellipse(this.currPos.x, this.currPos.y, geoSize2, geoSize2);
        } else if (visualMode == VISUALIZATION_GLOBAL_GRID || visualMode == VISUALIZATION_REGION_GRIDS) {
            fill(color(this.color[0], this.color[1], this.color[2], 150));
            if (this.changingVisualMode) {
                noStroke();
            } else {
                stroke(color(255, 255, 255, 100));
            }
            if (visualMode == VISUALIZATION_GLOBAL_GRID) {
                rect(this.currPos.x, this.currPos.y, cellWidth, cellHeight);
            } else {
                rect(this.currPos.x, this.currPos.y, geoSize, geoSize);
            }
        }

    }

    update() {
        let targetPos;

        switch (visualMode) {
            case VISUALIZATION_REGION_SPIRALS:
                targetPos = this.spiralPos.copy();
                break
            case VISUALIZATION_GLOBAL_GRID:
                targetPos = this.globalGridPos.copy();
                break
            case VISUALIZATION_REGION_GRIDS:
                targetPos = this.smallGridPos.copy();
                break
        }

        if (this.changingVisualMode) {
            this.currPos = SpatialOperations.moveToTarget(this.currPos, targetPos, 25);
            if (this.currPos == targetPos) {
                this.changingVisualMode = false;
            }
        } else {
            this.currPos = targetPos;
        }


    }

}

function mousePressed() {
    visualMode = (visualMode + 1) % 3;

    changingVisualMode = true;
    console.log("visualMode:" + visualMode);

    for (let i = 0; i < populations.length; i++) {
        let population = populations[i];
        population.changingVisualMode = true;
    }
}