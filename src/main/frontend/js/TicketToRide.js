import * as d3 from "d3";
import * as topojson from "topojson";
import Randomer from "./Randomer";
import Exporter from 'd3-save-svg';

const maxLinks = 5;
let cityLinksRandomer = new Randomer([16, 23, 33, 23, 5]);
let routeCounter = 0;
let colors = ["firebrick", "whitesmoke", "olivedrab", "teal", "darkslategrey", "gold", "mediumpurple"];
const train = {
    width: 26,
    height: 8
};

function angleRad(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
}

export default function TicketToRide(container) {
    let self = this;
    this.width = 620;
    this.height = 400;

    this.cities = [];
    this.distanceScale = null;
    this.cityVeronoi = null;

    this.projection = d3.geoAlbers()
        .center([49, 32])
        .rotate([-7.8, 4, -32])
        .parallels([42, 52])
        .translate([this.width / 2, this.height / 2])
        .scale(2780);

    this.fromCity = null;

    let svg = d3.select(container)
        .append("svg")
        .attr("id", "ticket-to-ride")
        //.attr("width", "100%")
        //.attr("height", "100%")
        .attr("viewBox", `0 0 ${this.width} ${this.height}`);

    svg.append("defs")
        .append("style")
        .attr("type", "text/css")
        .html(`@font-face {
                  font-family: "Yava Font";
                  src: url('./fonts/yava-trains-font.woff');
               }`);

    svg.append("defs")
        .append("pattern")
        .attr("id", "background")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", this.width)
        .attr("height", this.height)
        .append("image")
        .attr("xlink:href", "./images/bg-04.jpg")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", this.width)
        .attr("height", this.height);


    this.svg = svg.append("g");

    function zoomed() {
        self.svg.attr("transform", d3.event.transform);
    }

    let zoom = d3.zoom()
        .scaleExtent([1, 10])
        .on("zoom", zoomed);
    this.svg.call(zoom);

    this.path = d3.geoPath().projection(this.projection);

    d3.select("#menu-hide-links")
        .on("click.map", () => {
            if (d3.select("#menu-hide-links").text() === "Hide links") {
                d3.select("#menu-hide-links").text("Show links");
                d3.selectAll(".city-links").classed("hidden", true);
                d3.selectAll(".city-route").classed("hidden", true);
            } else {
                d3.select("#menu-hide-links").text("Hide links");
                d3.selectAll(".city-links").classed("hidden", false);
                d3.selectAll(".city-route").classed("hidden", false);
            }
        });

    d3.select("#menu-hide-voronoi")
        .on("click.map", () => {
            if (d3.select("#menu-hide-voronoi").text() === "Hide grid") {
                d3.select("#menu-hide-voronoi").text("Show grid");
                d3.selectAll(".city-all-links").classed("hidden", true);
                d3.selectAll(".city-voronoi").classed("hidden", true);
            } else {
                d3.select("#menu-hide-voronoi").text("Hide grid");
                d3.selectAll(".city-all-links").classed("hidden", false);
                d3.selectAll(".city-voronoi").classed("hidden", false);
            }

        });

    d3.select("#menu-generate-routes")
        .on("click.map", () => {
            self.generateRandomRoutes();
        });

    d3.select("#export").on("click", () => {
        let cfg = {
            filename: 'TicketToRide',
        };
        Exporter.embedRasterImages(d3.select('#ticket-to-ride').node());

        setTimeout(() => {
            //let rasterizing finish
            Exporter.save(d3.select('#ticket-to-ride').node(), cfg);
        }, 2000);

    });

    d3.json("json/ua.json", function (error, ua) {
        if (error) {
            return console.error(error);
        }

        // draw map
        let mapOutlines = topojson.feature(ua, ua.objects.subunits);
        self.svg.append("g").attr("id", "map-ukraine")
            .selectAll(".subunit")
            .data(mapOutlines.features)
            .enter().append("path")
            .attr("class", d => `subunit ${d.id}`)
            .attr("d", self.path)
            .style("fill", "url(#background)");


        //draw cities and city labels
        let citiesOutline = topojson.feature(ua, ua.objects.places);
        self.cities = citiesOutline.features.map(d => {
            return {
                name: d.properties.name,
                coordinates: d.geometry.coordinates
            };
        });

        self.setScales();
        self.cityVeronoi = d3.voronoi()
            .x(d=> d.coordinates[0])
            .y(d=> d.coordinates[1])
            .size([self.width, self.height])(self.cities.map(d => {
                return {
                    coordinates: self.projection(d.coordinates),
                    name: d.name
                };
            }));

        self.svg
            .append("g")
            .attr("id", "city-voronoi")
            .selectAll("path")
            .data(self.cityVeronoi.polygons())
            .enter().append("path")
            .attr("class", "city-voronoi hidden")
            .attr("d", d=> `M${d.join("L")}Z`);

        //draw all veronoi links
        self.svg.append("g").attr("id", "city-all-links").selectAll(`.city-all-links`)
            .data(self.cityVeronoi.links())
            .enter().append("line")
            .attr("class", "city-all-links hidden")
            .attr("name", d=> `${d.source.name}-${d.target.name}`)
            .attr("x1", d => d.source.coordinates[0])
            .attr("y1", d => d.source.coordinates[1])
            .attr("x2", d => d.target.coordinates[0])
            .attr("y2", d => d.target.coordinates[1]);

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


        function clickCity(d) {
            let fromCity = self.fromCity;
            let toCity = {
                name: d.properties.name,
                coordinates: d.geometry.coordinates,
            };

            if (!fromCity) {
                self.fromCity = fromCity = toCity;
                self.svg.select(`.city[name=${fromCity.name}]`).classed("selected", true);
                return;
            }

            if (fromCity.name === toCity.name) {
                self.svg.select(`.city[name=${fromCity.name}]`).classed("selected", false);
                self.fromCity = null;
                return;
            }

            let scale = self.distanceScale(d3.geoDistance(fromCity.coordinates, toCity.coordinates));
            self.buildLink(fromCity, toCity, scale, colors[cityLinksRandomer.random(0, colors.length)]);

            self.svg.select(`.city[name=${fromCity.name}]`).classed("selected", false);
            self.fromCity = null;
        }

        self.svg.selectAll(".city")
            .on("click", clickCity);
    });
}

TicketToRide.prototype.setScales = function () {
    let cities = this.cities;

    let fromReferenceA = cities.find(d => d.name === 'Севастополь');
    let fromReferenceB = cities.find(d => d.name === 'Сімферополь');

    let toReferenceA = cities.find(d => d.name === 'Мукачево');
    let toReferenceB = cities.find(d => d.name === 'Ізмаїл');

    let min = d3.geoDistance(fromReferenceA.coordinates, fromReferenceB.coordinates);
    let max = d3.geoDistance(toReferenceA.coordinates, toReferenceB.coordinates);

    this.distanceScale = d3.scaleQuantize()
        .domain([min, max])
        .range(d3.range(0, 8));

};

let ids = {
    index: 0,
};

TicketToRide.prototype.drawLink = function (cityA, cityB, count, color, origin, destination, connectionCoords, connections, routeId) {
    let self = this;
    let nameA = cityA.name;
    let nameB = cityB.name;

    let routeGroup = self.svg.select(`g[name="route-group-${routeId}-${nameA}-${nameB}"]`);

    // connection link ------------------------------------------------------------
    var connectionDotsSelection = routeGroup.selectAll(`.city-route[name=${nameA}${nameB}]`)
        .data(connections, d => d.index);
    var connectionDots = connectionDotsSelection
        .enter().append("path")
        .merge(connectionDotsSelection)
        .attr("id", (d, i) => d.id)
        .attr("class", "city-route")
        .attr("name", `${nameA}${nameB}`);
    connectionDotsSelection.exit().remove();
    // connection link end ------------------------------------------------------------

    // trains ------------------------------------------------------------
    var connectionTrainsSelection = routeGroup.selectAll(`.city-route-train[name=${nameA}${nameB}]`)
        .data(connections, d => d.index);
    var connectionTrains = connectionTrainsSelection
        .enter().append("rect")
        .merge(connectionTrainsSelection)
        .attr("class", "city-route-train")
        .attr("name", `${nameA}${nameB}`)
        .attr("width", train.width)
        .attr("height", train.height)
        .style("fill", color);

    connectionTrainsSelection.exit().remove();
    // trains end ------------------------------------------------------------

    // circles ------------------------------------------------------------
    var connectionPoints = routeGroup.selectAll(`.city-links[name=${nameA}${nameB}]`)
        .data(connectionCoords, d => d.index);

    connectionPoints
        .enter().append("circle")
        .merge(connectionPoints)
        .attr("class", "city-links")
        .attr("name", `${nameA}${nameB}`)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => 3)
        .call(d3.drag()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded));

    connectionPoints.exit().remove();
    // circles end ------------------------------------------------------------

    var cityManualLinkSimulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.id));

    cityManualLinkSimulation
        .nodes(connections, d => d.id)
        .on("tick", () => {
            connectionDots
                .attr("d", d => {
                    let path = "M";
                    if (d.source.first) {
                        path += "" + self.projection(origin) + "L";
                    }
                    path += `${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;

                    if (d.target.last) {
                        path += "L" + self.projection(destination);
                    }
                    return path;
                });
            connectionTrains
                .attr("transform", (d, i) => {
                    let x = (d.source.x + d.target.x - train.width) / 2;
                    let y = (d.source.y + d.target.y - train.height) / 2;
                    let angle = angleRad(d.source, d.target);
                    return `translate(${x}, ${y}) rotate(${angle}, ${train.width / 2},${train.height / 2})`;
                })
        });

    // drag functions
    function dragStarted(d) {
        d3.select(this).raise().classed("selected", true);
        cityManualLinkSimulation.alphaTarget(0.3).restart();
    }

    function dragEnded(d) {
        d3.select(this).classed("selected", false);
        cityManualLinkSimulation.alphaTarget(0);
    }

    function dragged(d) {
        d3.select(this)
            .attr("cx", d.x = d3.event.x)
            .attr("cy", d.y = d3.event.y);
    }

    routeGroup.selectAll(`.city-route-train[name=${nameA}${nameB}]`)
        .on("click", function (d, i) {
            if (i === 0 && connections.length === 1) {
                d3.select(this.parentNode).remove();
                return;
            }

            //remove link
            if (i !== 0) {
                connections[i - 1].target = connections[i].target;
            }

            // regenerate id
            //connections[i] = null;
            connections.splice(i, 1);
            connectionCoords.splice(i, 1);
            if (i === 0) {
                connectionCoords[0].first = true;
            }
            self.drawLink(cityA, cityB, count, color, origin, destination, connectionCoords, connections, routeId);
        });

    routeGroup.selectAll(`.city-links[name=${nameA}${nameB}]`)
        .on("click", function (d, i) {
            connectionCoords.splice(i, 0, {
                x: connectionCoords[i].x,
                y: connectionCoords[i].y
            });

            connections.splice(i, 0, {
                source: connectionCoords[i],
                target: connectionCoords[i+1]
            });
            connections[i - 1].target = connectionCoords[i];
            self.drawLink(cityA, cityB, count, color, origin, destination, connectionCoords, connections, routeId);
        });

};

TicketToRide.prototype.buildLink = function (cityA, cityB, count, color, connectionType) {
    let self = this;
    let nameA = cityA.name;
    let nameB = cityB.name;

    let origin = [cityA.coordinates[0], cityA.coordinates[1]];
    let destination = [cityB.coordinates[0], cityB.coordinates[1]];

    let xD = (cityB.coordinates[0] - cityA.coordinates[0]) / (count + 1);
    let yD = (cityB.coordinates[1] - cityA.coordinates[1]) / (count + 1);

    let connectionCoords = [];
    connectionCoords.push([origin[0], origin[1]]);
    for (let i = 0; i < count; i++) {
        let cCoords = [cityA.coordinates[0] + (i + 1) * xD, cityA.coordinates[1] + (i + 1) * yD];
        connectionCoords.push(cCoords);
    }
    connectionCoords.push([destination[0], destination[1]]);
    connectionCoords = connectionCoords.map(d => self.projection(d)).map((d, i, arr) => {
        return {
            x: d[0],
            y: d[1],
            first: i === 0,
            last: i === arr.length - 1
        };
    });

    let connections = [];
    for (let i = 0; i < connectionCoords.length - 1; i++) {
        connections.push({
            source: connectionCoords[i],
            target: connectionCoords[i + 1],
        });
    }
    let routeId = routeCounter++;

    let routeGroup = self.svg.append("g")
        .attr("name", `route-group-${routeId}-${nameA}-${nameB}`);

    this.drawLink(cityA, cityB, count, color, origin, destination, connectionCoords, connections, routeId);
};


TicketToRide.prototype.generateRandomRoutes = function () {
    let self = this;

    // sort cities from left to right, top to bottom
    let cities = this.cities.slice(0).sort((a, b) => {
        let xSort = a.coordinates[0] - b.coordinates[0];
        return xSort ? xSort : a.coordinates[1] - b.coordinates[1];
    });
    let allLinks = this.cityVeronoi.links();

    let filteredLinks = cities.map(currentCity => {
        let destinations = [].concat.apply([], allLinks.filter(l => l.source.name === currentCity.name || l.target.name === currentCity.name)
            .map(l => {
                return [l.source, l.target];
            })).filter(l => l.name !== currentCity.name)
            .map(l => {
                return {
                    name: l.name,
                    // back to not projected coords
                    coordinates: self.cities.find(d => d.name === l.name).coordinates
                }
            });

        destinations = destinations.filter(d => {
            let equal = d.coordinates[0] === currentCity.coordinates[0];
            return equal ? d.coordinates[1] > currentCity.coordinates[1] : d.coordinates[0] > currentCity.coordinates[0];
        });

        return {
            source: currentCity,
            targets: destinations
        };
    });

    //remove duplicates
    filteredLinks.forEach((link, i) => {
        let slice = filteredLinks.slice(0, i);
        link.targets.forEach((target, idx, array) => {
            let found = slice.find(d => d.source.name === target.name);
            if (found) {
                array.splice(idx, 1);
            }
        });
    });

    filteredLinks.forEach(link => {
        let from = link.source;
        let quantity = link.targets.length;

        let linkColorIdxs = cityLinksRandomer.randomUniqueRange(0, colors.length, Math.max(quantity, maxLinks));
        let randomRoutesIdxs = cityLinksRandomer.randomUniqueRange(0, link.targets.length, link.targets.length);

        link.targets.forEach((destination, idx) => {
            if (randomRoutesIdxs.includes(idx)) {
                let to = destination;
                let scale = self.distanceScale(d3.geoDistance(from.coordinates, to.coordinates));
                self.buildLink(from, to, scale, colors[linkColorIdxs[idx]]);
            }
        })
    });


};