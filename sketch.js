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
let changingVisualMode;
let canvas;
let myMap;

// Lets put all our map options in a single object
const options = {
    lat: 0,
    lng: 0,
    zoom: 0,
    style: "http://{s}.tile.osm.org/{z}/{x}/{y}.png"
}

function setup() {
    canvas = createCanvas(1800, 1200);
    visualMode = 1;
    cols = 100;
    rows = 100;
    smallCols = 40;
    smallRows = 20;
    cellWidth = 15;
    cellHeight = 15;
    geoSize = 3;
    geoSize2 = 7;
    const mappa = new Mappa('Leaflet');
    // Create a tile map with the options declared
    myMap = mappa.tileMap(options);
    myMap.overlay(canvas);
    loadData();
}

let loadedData = false;
let firstDraw = true;

function draw() {


    if (loadedData) {

        for (let i = 0; i < countries.length; i++) {
            countries[i].updateGeoPosition();
        }

        for (let i = 0; i < populations.length; i++) {
            populations[i].updateGeoPositions();
        }

        // if (changingVisualMode || firstDraw) {

        let currChangingVisualMode = false
        for (let i = 0; i < populations.length; i++) {
            populations[i].updateCurrPos();
            currChangingVisualMode = currChangingVisualMode || populations[i].changingVisualMode;
        }


        changingVisualMode = currChangingVisualMode;
        firstDraw = false;
        // }
        console.log("draw")
        clear();
        if (visualMode == VISUALIZATION_REGION_GRIDS || visualMode == VISUALIZATION_REGION_SPIRALS) {
            let countryColor = colorList[4];
            fill(color(countryColor[0], countryColor[1], countryColor[2], 100));
            tint(255, 128);
            for (let i = 0; i < countries.length; i++) {
                countries[i].draw(visualMode);
            }
            tint(255);
        }

        for (let i = 0; i < populations.length; i++) {
            populations[i].draw();
        }
        // if (currChangingVisualMode || !loadedData) {
        // } else {
        //     noLoop()
        // }
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

            if (!regionList.includes(currData.region)) {
                regionList.push(currData.region);
            }

            let country = new Country(currData.area, currData.flags.png, currData.latlng, currData.region)

            countries.push(country);


            let populationsSize = currData.population / populationGroupSize;
            for (let j = 0; j < populationsSize; j++) {
                let population = new Population(j, i, populationsSize);

                populations.push(population);
            }
        }

        populations.sort(function (a, b) {
            let nomeA = countries[a.countryIndex].region.toUpperCase();
            let nomeB = countries[b.countryIndex].region.toUpperCase();
            if (nomeA < nomeB) {
                return -1;
            }
            if (nomeA > nomeB) {
                return 1;
            }
            return 0;
        });

        for (let i = 0; i < populations.length; i++) {
            populations[i].globalIndex = i;
            populations[i].calculatePositions();
        }
        loadedData = true;
        console.log("num points: " + populations.length);
    });

}

class Country {
    constructor(area, flagImagePath, latlng, region) {
        this.img_flag = loadImage(flagImagePath);
        this.radius = sqrt(area / PI) / 40;

        this.latlng = (latlng);

        this.region = region;
        this.regionColor = colorList[regionList.indexOf(region)];

        let edge = sqrt(area) / 40;
        this.flagWidth = edge * 1.3;
        this.flagHeight = edge / 1.3;
    }

    draw(visualMode) {
        if (visualMode == VISUALIZATION_REGION_SPIRALS) {
            ellipse(this.geoPos.x, this.geoPos.y, this.radius * 2, this.radius * 2);
        } else {
            image(this.img_flag, this.geoPos.x - this.flagWidth / 2, this.geoPos.y - this.flagHeight / 2, this.flagWidth, this.flagHeight);
        }
    }


    updateGeoPosition() {
        let geoPos = myMap.latLngToPixel(this.latlng[0], this.latlng[1]);
        this.geoPos = createVector(geoPos.x, geoPos.y);
    }
}

class Population {
    constructor(i, countryIndex, populationsSize) {

        this.changingVisualMode = false;
        this.countryIndex = countryIndex;
        this.color = countries[countryIndex].regionColor;

        this.countryPopIndex = i;
        this.countryPopSize = populationsSize;
    }

    calculatePositions() {

        this.targetPositions = [];
        this.spiralPos = SpatialOperations.placeToSpiral(this.countryPopIndex, this.countryPopSize, null, countries[this.countryIndex].radius);
        this.smallGridPos = SpatialOperations.toGrid(this.countryPopIndex, smallCols, smallRows, countries[this.countryIndex].flagWidth / smallCols, countries[this.countryIndex].flagHeight / smallRows, countries[this.countryIndex].flagWidth / 2, (countries[this.countryIndex].flagHeight / 2), true)
        this.globalGridPos = SpatialOperations.toGrid(this.globalIndex, cols, rows, cellWidth, cellHeight);
        this.targetPositions[VISUALIZATION_GLOBAL_GRID] = this.globalGridPos;

    }

    updateGeoPositions() {

        let countryPos = countries[this.countryIndex].geoPos;
        let geoSpiralPos = p5.Vector.add(countryPos, this.spiralPos);
        this.targetPositions[VISUALIZATION_REGION_SPIRALS] = geoSpiralPos;

        let geoSmallGridPos = p5.Vector.add(countryPos, this.smallGridPos)
        this.targetPositions[VISUALIZATION_REGION_GRIDS] = geoSmallGridPos;

    }

    draw() {

        switch (visualMode) {
            case VISUALIZATION_REGION_SPIRALS:
                fill(color(this.color[0], this.color[1], this.color[2], 100));
                noStroke();
                ellipse(this.currPos.x, this.currPos.y, geoSize2, geoSize2);
                break;
            case VISUALIZATION_GLOBAL_GRID:
                fill(color(this.color[0], this.color[1], this.color[2], 150));
                if (this.changingVisualMode) {
                    noStroke();
                } else {
                    stroke(color(255, 255, 255, 100));
                }
                rect(this.currPos.x, this.currPos.y, cellWidth, cellHeight);
                break;
            case VISUALIZATION_REGION_GRIDS:
                fill(color(this.color[0], this.color[1], this.color[2], 150));
                if (this.changingVisualMode) {
                    noStroke();
                } else {
                    stroke(color(255, 255, 255, 100));
                }
                rect(this.currPos.x, this.currPos.y, geoSize, geoSize);
                break;
        }

    }

    updateCurrPos() {
        let targetPos = this.targetPositions[visualMode].copy();

        if (this.changingVisualMode) {
            if (this.currPos == null) {
                this.currPos = targetPos;
            }
            this.currPos = SpatialOperations.moveToTarget(this.currPos, targetPos, 75);
            if (this.currPos.x == targetPos.x && this.currPos.y == targetPos.y) {
                this.changingVisualMode = false;
            }
        } else {
            this.currPos = targetPos;
        }
    }

}

setTargetPos()
{

}

function mousePressed() {

}

function keyPressed() {
    if (key === 'R' || key === 'r') {
        saveGif('mySketch', 4);
    }
    if (keyCode === 32) {
        visualMode = (visualMode + 1) % 3;

        changingVisualMode = true;
        // redraw()
        // loop()
        console.log("visualMode:" + visualMode);

        for (let i = 0; i < populations.length; i++) {
            let population = populations[i];
            population.changingVisualMode = true;
        }
    }
}