import * as d3 from "d3";
import * as topojson from "topojson";
import Randomer from "./Randomer";


function drawMainSvg(container, viewBoxWidth, viewBoxHeight) {
    return d3.select(container)
        .append("svg")
        .attr("class", "svg")
        //.attr("width", "100%")
        //.attr("height", "100%")
        .attr("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`)
}

export default function MapWidget(container) {
    let self = this;
    this.width = 800;
    this.height = 450;

    this.cities = [];
    this.routes = [];

    this.projection = d3.geoAlbers()
        .center([49, 32])
        .rotate([-2, 2, -27])
        .parallels([42, 52])
        .translate([this.width / 2, this.height / 2])
        .scale(2800);

    this.fromCity = null;

    this.svg = drawMainSvg(container, this.width, this.height);

    this.path = d3.geoPath()
        .projection(this.projection);


    self.svg
        .append("image")
        .attr("x", 10)
        .attr("y", 10)
        .attr("width", 743 / 25)
        .attr("height", 200 / 25)
        .attr("xlink:href", "images/train.svg");


    d3.json("json/ua.json", function (error, ua) {
        if (error) {
            return console.error(error);
        }

        // draw map
        let mapOutlines = topojson.feature(ua, ua.objects.subunits);
        self.svg.selectAll(".subunit")
            .data(mapOutlines.features)
            .enter().append("path")
            .attr("class", d => `subunit ${d.id}`)
            .attr("d", self.path);


        //draw cities and city labels
        let citiesOutline = topojson.feature(ua, ua.objects.places);
        self.cities = citiesOutline.features.map(d => {
            return {
                name: d.properties.name,
                coordinates: d.geometry.coordinates
            };
        });

        let voronoi = d3.voronoi().size([self.width, self.height])(self.cities.map(d => self.projection(d.coordinates)));
        self.svg
            .append("g")
            .attr("id", "city-voronoi")
            .selectAll("path")
            .data(voronoi.polygons())
            .enter().append("path")
            .attr("class", "city-voronoi")
            .attr("d", d=> `M${d.join("L")}Z`);
        self.svg.append("g").attr("id", "city-labels")
            .selectAll(".city-label")
            .data(citiesOutline.features)
            .enter().append("text")
            .attr("class", "city-label")
            .attr("transform", d => `translate( ${self.projection(d.geometry.coordinates)} )`)
            .attr("dy", ".3em")
            .text(function (d) {
                return d.properties.name;
            });
        self.svg.append("g").attr("id", "city-circles")
            .selectAll(".city")
            .data(citiesOutline.features)
            .enter()
            .append("circle")
            .attr("transform", d => `translate( ${self.projection(d.geometry.coordinates)} )`)
            .attr("r", 3)
            .attr("name", d => d.properties.name)
            .attr("class", "city");
        d3.forceSimulation(citiesOutline.features)
            .force("x", d3.forceX(6).strength(2))
            .force("y", d3.forceY(4).strength(2))
            .on("tick", () => {
                self.svg.selectAll(".city-label")
                    .attr("x", d => d.x)
                    .attr("y", d => d.y);
            });


        self.svg.selectAll(".city")
            .on("click", d => {
                let node = d3.select(this);

                if (!self.fromCity) {
                    self.fromCity = d.properties.name;
                    self.svg.select(`.city[name=${self.fromCity}]`)
                        .classed("selected", true);
                    return;
                }

                if (self.fromCity === d.properties.name) {

                    self.svg.select(`.city[name=${self.fromCity}]`)
                        .classed("selected", false);
                    self.fromCity = null;
                    return;
                }


                let linkLine = {
                    type: "LineString",
                    coordinates: [self.cities.find(e=> e.name === self.fromCity).coordinates, self.cities.find(e=> e.name === d.properties.name).coordinates]
                };

                self.routes.push({
                    source: self.fromCity,
                    target: d.properties.name,
                    distance: d3.geoDistance(self.cities.find(e=> e.name === self.fromCity).coordinates, d.geometry.coordinates)
                });

                // draw link
                self.svg
                    .append("path")
                    .datum(linkLine)
                    .attr("d", self.path)
                    .attr("class", "link");

                self.svg.select(`.city[name=${self.fromCity}]`)
                    .classed("selected", false);
                self.fromCity = null;
            });

        // generate routes
        // self.generateRoutes(citiesOutline);

        console.log();

        self.svg.append("g").attr("id", "city-all-links").selectAll(`.city-all-links`)
            .data(voronoi.links())
            .enter().append("line")
            .attr("class", "city-all-links")
            .attr("x1", d => d.source[0])
            .attr("y1", d => d.source[1])
            .attr("x2", d => d.target[0])
            .attr("y2", d => d.target[1]);

        self.buildLink("Київ", "Полтава", 3);
    });
}

MapWidget.prototype.buildLink = function (nameA, nameB, count) {
    let self = this;
    let cityA = self.cities.find(e=> e.name === nameA);
    let cityB = self.cities.find(e=> e.name === nameB);

    let origin = [cityA.coordinates[0], cityA.coordinates[1]];
    let destination = [cityB.coordinates[0], cityB.coordinates[1]];

    let xD = (cityB.coordinates[0] - cityA.coordinates[0]) / (count + 1);
    let yD = (cityB.coordinates[1] - cityA.coordinates[1]) / (count + 1);

    let connectionCoords = [];
    for (let i = 0; i < count; i++) {
        let cCoords = [cityA.coordinates[0] + (i + 1) * xD, cityA.coordinates[1] + (i + 1) * yD];
        connectionCoords.push(cCoords);
    }
    connectionCoords = connectionCoords.map(d => self.projection(d));

    let connections = [];
    // -1 === origin
    // count === destination
    for (let i = 0; i <= count; i++) {
        connections.push({
            source: i - 1,
            target: i
        });
    }

    let connectionsSelection = self.svg.selectAll(`.city-manual-links-route[name=${nameA}${nameB}]`)
        .data(connections)
        .enter().append("line")
        .attr("class", "city-manual-links-route")
        .attr("name", `${nameA}${nameB}`);


    let cityManualLinkSimulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.index));

    cityManualLinkSimulation
        .nodes(connections)
        .on("tick", () => {
            connectionsSelection
                .attr("x1", d => d.source === -1 ? self.projection(origin)[0] : connectionCoords[d.source][0])
                .attr("y1", d => d.source === -1 ? self.projection(origin)[1] : connectionCoords[d.source][1])
                .attr("x2", d => d.target === count ? self.projection(destination)[0] : connectionCoords[d.target][0])
                .attr("y2", d => d.target === count ? self.projection(destination)[1] : connectionCoords[d.target][1]);
        });

    self.svg.selectAll(`.city-manual-links[name=${nameA}${nameB}]`)
        .data(connectionCoords)
        .enter().append("circle")
        .attr("class", "city-manual-links")
        .attr("name", `${nameA}${nameB}`)
        .attr("cx", d => d[0])
        .attr("cy", d => d[1])
        .attr("r", d => 3)
        .call(d3.drag()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded));

    // drag functions
    function dragStarted(d) {
        d3.select(this).raise().classed("selected", true);
        cityManualLinkSimulation.alphaTarget(0.3).restart();
    }

    function dragEnded(d) {
        d3.select(this).classed("selected", false);
    }

    function dragged(d) {
        d3.select(this)
            .attr("cx", d[0] = d3.event.x)
            .attr("cy", d[1] = d3.event.y);
        cityManualLinkSimulation.alphaTarget(0);
    }
};

function drawTrain() {
    /*
     let nameA = "Київ";
     let nameB = "Полтава";

     let trainWidth = 743 / 22;
     let trainHeight = 200 / 22;


     let nodeA = self.svg.select(`.city[name=${nameA}]`);
     let nodeB = self.svg.select(`.city[name=${nameB}]`);

     let cityA = self.cities.find(e=> e.name === nameA);
     let cityB = self.cities.find(e=> e.name === nameB);

     let count = 3;

     let xD = (cityB.coordinates[0] - cityA.coordinates[0]) / (count + 1);
     let yD = (cityB.coordinates[1] - cityA.coordinates[1]) / (count + 1);

     let coords = [];
     for (let i = 0; i< count; i++) {
     coords.push([cityA.coordinates[0] + (i + 1) * xD, cityA.coordinates[1] + (i + 1) * yD]);
     }
     coords = coords.map(d => self.projection(d));



     var angleDeg = Math.atan2(cityA.coordinates[1] - cityB.coordinates[1], cityA.coordinates[0] - cityB.coordinates[0]) * 180 / Math.PI;

     self.svg.selectAll(".route-trains")
     .data(coords)
     .enter().append("image")
     .attr("class", "route-trains")
     .attr("x", d => d[0] -trainWidth/2)
     .attr("y", d => d[1] - trainHeight /2)
     .attr("transform", d=> `rotate(${180-angleDeg}, ${d[0]}, ${d[1]})`)
     .attr("width", trainWidth)
     .attr("height", trainHeight)
     .attr("xlink:href", "images/train.svg");
     */
}

let lengthRandomer = new Randomer([5, 25, 25, 10, 10, 10, 10, 5]);
const maxLinks = 5;
let cityLinksRandomer = new Randomer([16, 23, 33, 23, 5]);

MapWidget.prototype.generateRoutes = function (citiesOutline) {
    let cityLinks = {
        /*
         maxNumberOfLinks: Number
         linkedTo: array[cityLink]
         */
    };

    // generate max number of routes per city
    this.cities.forEach(d=> {
        cityLinks[d.name] = {
            maxNumberOfLinks: cityLinksRandomer.pRandom(),
            linkedTo: []
        };
    });

    // generate routes
    this.cities.forEach((d, idx) => {
        let currentCityLink = cityLinks[d.name];

        if (currentCityLink.linkedTo.length >= currentCityLink.maxNumberOfLinks) {
            // already generated maximum routes
            return;
        }
        let to = getClosestNotLinkedCity(d, this.cities, cityLinks);
        this.routes.push({
            source: d.name,
            target: to.name,
            distance: d3.geoDistance(d.coordinates, to.coordinates)
        });

        currentCityLink.linkedTo.push(to.name);
        cityLinks[to.name].linkedTo.push(d.name);
    });

    // draw routes
    let linkLines = this.routes.map((d, i) => {
        return {
            type: "LineString",
            coordinates: [this.cities.find(e=> e.name === d.source).coordinates, this.cities.find(e=> e.name === d.target).coordinates],
            id: `link-line-${i}`
        };
    });
    let link = this.svg.selectAll(".link")
        .data(linkLines)
        .enter().append("path")
        .attr("d", this.path)
        .attr("id", d => d.id)
        .attr("class", "link");

};

function getClosestNotLinkedCity(current, allCities, links) {
    let filtered = allCities
        .filter(d => current.name !== d.name)
        .filter(d => !links[current.name].linkedTo.includes(d.name))
        .filter(d => !links[d.name].linkedTo.includes(current.name));

    let closest = getClosestCities(current, filtered);
    return closest[closest.length - 1];
}
function getRandomNotLinkedCity(excludes, allCities /* excludes - index in array allCities */) {
    let idx = lengthRandomer.random(0, allCities.length - 1);
    if (excludes.includes(idx)) {
        excludes.push(idx);
        return getRandomNotLinkedCity(excludes);
    }
    return allCities[idx];
}
function getClosestCities(current, allCities) {
    let arr = allCities.slice(0);
    arr.sort((a, b) => d3.geoDistance(current.coordinates, b.coordinates) - d3.geoDistance(current.coordinates, a.coordinates));

    return arr;
}