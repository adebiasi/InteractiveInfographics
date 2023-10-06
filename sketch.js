let cities = [];
let populations = [];
let maxPopulation;
let visualMode;
let cols, rows;
let cellWidth, cellHeight;
let regionList = [];
let colorAlpha = 0.1;
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


    if (visualMode == 1 || visualMode == 2) {
        let countryColor = colorList[4];
        fill(color(countryColor[0], countryColor[1], countryColor[2], 100));
        tint(255, 128);
        for (let i = 0; i < cities.length; i++) {
            let country = cities[i];
            if (visualMode == 1) {
                ellipse(country.x, country.y, country.radius * 2, country.radius * 2);
            } else {
                let flagWidth = country.edge*1.3;
                let flagHeight = country.edge/1.3;
                image(country.img_flag, country.x - flagWidth / 2, country.y - flagHeight / 2, flagWidth, flagHeight);
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
        cities = data;//data.slice(0, numCities);
        for (let i = 0; i < cities.length; i++) {
            let country = cities[i];
            let img_flag = loadImage(country.flags.png);

            country.img_flag = img_flag;
            country.radius = sqrt(country.area/PI)/40;
            country.edge = sqrt(country.area)/40;
            country.x = map(country.latlng[1], -180, 180, 0, width);
            country.y = map(country.latlng[0], -90, 90, height, 0);



                // map(city.radius, 0, maxRadius, 0, 100);

            if (!regionList.includes(country.region)) {
                regionList.push(country.region);
            }

            let populationsSize = country.population / populationGroupSize;
            for (let i = 0; i < populationsSize; i++) {
                let population = new Population(country.latlng, country.edge,country.radius,  country.region);
                population.countryIndex = i;
                population.countryPopSize = populationsSize;
                populations.push(population);
            }
        }

        populations.sort(function (a, b) {
            let nomeA = a.region.toUpperCase();
            let nomeB = b.region.toUpperCase();
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
        }

        console.log("num points: " + populations.length);
    });

}

class Population {
    constructor(latlng, edge, radius, region) {
        // this.x_center = map(latlng[1], -180, 180, 0, width);
        // this.y_center = map(latlng[0], -90, 90, height, 0);
        [this.x_center, this.y_center] = SpatialOperations.toMap(latlng)

        this.angle = random(TWO_PI);
        this.edge = edge;

        this.geoX = this.x_center + cos(this.angle) * random(0, radius);
        this.geoY = this.y_center + sin(this.angle) * random(0, radius);
        this.resetGeoPosition();
        this.region = region;
        //this.velocita = 20;
        this.changingVisualMode = false;
        let regIndex = regionList.indexOf(this.region);
        this.color = colorList[regIndex];
    }

    resetGeoPosition() {
        this.x = this.geoX;
        this.y = this.geoY;
    }

    draw() {

        if (visualMode == 1) {
            fill(color(this.color[0], this.color[1], this.color[2], 100));
            noStroke();
            ellipse(this.x, this.y, geoSize2, geoSize2);
        } else if (visualMode == 0 || visualMode == 2) {
            fill(color(this.color[0], this.color[1], this.color[2], 150));
            if (this.changingVisualMode) {
                noStroke();
            } else {
                stroke(color(255, 255, 255, 100));
            }
            if (visualMode == 0) {
                rect(this.x, this.y, cellWidth, cellHeight);
            } else {
                // rect(this.x - this.edge / 2, this.y - this.edge / 2+3*geoSize, geoSize, geoSize);
                rect(this.x, this.y , geoSize, geoSize);

            }
        }

    }

    update() {

        if (visualMode == 1) {

            if (this.changingVisualMode) {
                [this.x, this.y] = SpatialOperations.moveToTarget(createVector(this.x, this.y), createVector(this.geoX, this.geoY), 25);
                if (this.geoX == this.x && this.geoY == this.y) {
                    this.changingVisualMode = false;
                }
            } else {

                [this.x, this.y] = SpatialOperations.praceToSpiral(this.countryIndex, this.countryPopSize, createVector(this.x_center, this.y_center), this.radius);
                /*
                let xOffset = random(-1, 1);
                let yOffset = random(-1, 1);
                let new_x = this.x + xOffset;
                let new_y = this.y + yOffset;

                let distanceFromCenter = dist(this.x_center, this.y_center, new_x, new_y);
                if (distanceFromCenter < this.size) {
                    this.x = new_x;
                    this.y = new_y;
                }*/
            }
        } else if (visualMode == 0) {
            let [newX, newY] = SpatialOperations.toGrid(this.globalIndex, cols, rows, cellWidth, cellHeight)

            if (this.changingVisualMode) {
                [this.x, this.y] = SpatialOperations.moveToTarget(createVector(this.x, this.y), createVector(newX, newY), 45);
                if (this.geoX == this.x && this.geoY == this.y) {
                    this.changingVisualMode = false;
                }
            } else {
                this.x = newX;
                this.y = newY;
            }
        } else if (visualMode == 2) {
            // let [newX, newY] = SpatialOperations.toGrid(this.countryIndex, smallCols, smallRows, this.edge / smallCols, this.edge / smallRows, this.x_center, this.y_center)

            let flagWidth = this.edge*1.3;
            let flagHeight = this.edge/1.3;
            let [newX, newY] = SpatialOperations.toGrid(this.countryIndex, smallCols, smallRows, flagWidth / smallCols, flagHeight / smallRows, this.x_center+flagWidth/2, this.y_center+(flagHeight/2), true)
            // let [newX, newY] = SpatialOperations.toGrid(this.countryIndex, smallCols, smallRows, flagWidth / smallCols, flagHeight / smallRows, this.x_center-flagWidth/2, this.y_center-(flagHeight/2), false)

            if (this.changingVisualMode) {
                [this.x, this.y] = SpatialOperations.moveToTarget(createVector(this.x, this.y), createVector(newX, newY), 25);
                if (this.geoX == this.x && this.geoY == this.y) {
                    this.changingVisualMode = false;
                }
            } else {
                this.x = newX;
                this.y = newY;
            }
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