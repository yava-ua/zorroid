import * as d3 from "d3";
import * as topojson from "topojson";
import Randomer from "../utils/Randomer";
import {random, randomUniqueRange, angleRad, download, displayTooltip, hideTooltip} from "../utils/Utils";
import MapZoomer from "../utils/MapZoomer";
import Graph from "../model/Graph";
import Widget from "./Widget";

const MAX_LINKS = 2;
const CONNECTION_TYPES = ["track", "ferriage", "tunnel"];
const CONNECTION_TYPE_IMAGES = ["", "train.svg", "tunnel-1.svg"];
const connectionTypes = {
    track: CONNECTION_TYPES[0],
    ferriage: CONNECTION_TYPES[1],
    tunnel: CONNECTION_TYPES[2],
    getByIndex: (i) => CONNECTION_TYPES[i],
    getImage: type => CONNECTION_TYPE_IMAGES[CONNECTION_TYPES.indexOf(type)],
    getFillColor: (type, color)=> {
        if (type === connectionTypes.ferriage) {
            return color === colors[6] ? d3.color(color).brighter(2) : d3.color(color).darker(2);
        }
        if (type === connectionTypes.tunnel) {
            return color === colors[6] ? d3.color(color).brighter(2) : d3.color(color).darker(2);
        }
        return "black";
    },
    getStrokeColor: (type, color) => {
        if (type === connectionTypes.ferriage) {
            return d3.color(color).brighter(1);
        }
        if (type === connectionTypes.tunnel) {
            return color === colors[6] ? d3.color(color).brighter(1) : d3.color(color).darker(1);
        }

        return "white";
    }
};

const connectionTypeRandomer = new Randomer([45, 30, 25]);
const colors = ["#b11700", "#e17b0c", "#e5d331", "#7c9434", "#4591c5", "#e7a7ca", "#2a2126", "#f1f5f6", "#808080"];
const train = {
    width: 34,
    height: 10
};
const trainCarriage = {
    width: 30,
    height: 8
};
const singleCityDestinationsSelector = "g#single-city-destinations";
const MapConfig = {
    width: 1240,
    height: 800,
    color: d3.scaleOrdinal(d3.schemeCategory20c)
};
const Maps = {
    Ukraine: {
        file: "ua.json",
        extentOffsets: [[3, 63], [3, 23]]
    },
    Ukraine2: {
        file: "ua-2.json",
        extentOffsets: [[3, 63], [3, 23]]
    },
    BlackSea: {
        file: "black-sea.json",
        extentOffsets: [[3, 3], [3, 3]]
    },
    Globe: {
        file: "globe-black-sea_simplified.json",
        extentOffsets: [[3, 3], [3, 3]]
    }
};

function clickCity(d, self) {
    let fromCity = self.editorState.fromCity;
    let toCity = {
        name: d.properties.name,
        coordinates: d.geometry.coordinates,
    };

    if (!fromCity) {
        self.editorState.fromCity = fromCity = toCity;
        self.svg.select("#city-circles").select(`.city[name='${fromCity.name}']`).classed("selected", true);
        return;
    }

    if (fromCity.name === toCity.name) {
        self.svg.select(`.city[name='${fromCity.name}']`).classed("selected", false);
        self.editorState.fromCity = null;
        return;
    }

    let scale = self.distanceScale(d3.geoDistance(fromCity.coordinates, toCity.coordinates));

    let color = self.editorState.color;
    let connectionType = self.editorState.connectionType;

    let linkGroup = self.createLinkGroup(fromCity, toCity, scale, color, connectionType);
    self.drawLink(linkGroup);

    self.svg.select("#city-circles").select(`.city[name='${fromCity.name}']`).classed("selected", false);
    self.editorState.fromCity = null;
}
function hideCityDestinations(self) {
    self.svg.select(singleCityDestinationsSelector).selectAll(".city-destinations").remove();
}
function showCityDestinations(d, self) {
    let fromCity = self.cities.find(el => el.name === d.properties.name);

    let routes = randomUniqueRange(0, self.cities.length - 1, random(1, 7)).map(el => {
        return {
            source: self.projection(fromCity.coordinates),
            target: self.projection(self.cities[el].coordinates),
            targetName: self.cities[el].name
        };
    });

    let cityDestinationsSelection = self.svg.select(singleCityDestinationsSelector).selectAll(".city-destinations")
        .data(routes, d => d.index);
    cityDestinationsSelection
        .enter()
        .append("path")
        .attr("class", "city-destinations")
        .merge(cityDestinationsSelection)
        .attr("id", (d, i) => `city-destination-${i}`)
        .attr("d", d => {
            let dx = d.target[0] - d.source[0];
            let dy = d.target[1] - d.source[1],
                dr = Math.sqrt(dx * dx + dy * dy);
            let invert = d.target[0] > d.source[0];

            return `M${d.source[0]},${d.source[1]} A ${dr} ${dr} 0 0 ${+invert} ${d.target[0]},${d.target[1]}`;
        })
        .transition()
        .duration(1500)
        .ease(d3.easeCircleOut)
        .attrTween("stroke-dasharray", function () {
            let length = this.getTotalLength();
            return t => d3.interpolateString(`0, ${length}`, `${length}, 0`)(t);
        });
    cityDestinationsSelection.exit().remove();
}
function hideCityLinks(state) {
    d3.selectAll(".city-link-circles").classed("hidden", state);
    d3.selectAll(".city-link-outline").classed("hidden", state);
}
function hideCityVoronoi(state) {
    d3.selectAll(".city-voronoi-links").classed("hidden", state);
    d3.selectAll(".city-voronoi").classed("hidden", state);
}

function backgroundImage(self, defs, code) {
    defs.append("pattern")
        .attr("id", `background-${code}`)
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", self.width)
        .attr("height", self.height)
        .append("image")
        .attr("href", "./images/bg-04.jpg")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", self.width)
        .attr("height", self.height)
}
function drawConnectionType(selection, connectionType, nameA, nameB, color, connectionOptions) {
    let image = "#" + connectionTypes.getImage(connectionType);

    let fillColor = connectionTypes.getFillColor(connectionType, color);
    let strokeColor = connectionTypes.getStrokeColor(connectionType, color);
    let ferriageLength = connectionOptions.ferriageLength || 2;

    selection
        .enter().append("use")
        .attr("class", "city-link-train-carriage")
        .style("--fill-color", fillColor)
        .style("--stroke-color", strokeColor)
        .attr("name", `${nameA}${nameB}`)
        .attr("width", trainCarriage.width)
        .attr("height", trainCarriage.height)
        .attr("link:href", (d, i) => connectionType === connectionTypes.ferriage && i > ferriageLength - 1 ? "" : image);
}
function buildConnections(connectionCoords) {
    let connections = [];
    for (let i = 0; i < connectionCoords.length - 1; i++) {
        connections.push({
            sourceIdx: i,
            targetIdx: i + 1,
        });
    }
    return connections;
}

export default class TicketToRide extends Widget {

    constructor(container, menuContainer) {
        super(container, menuContainer);

        let self = this;

        this.width = MapConfig.width;
        this.height = MapConfig.height;


        this.linkGroupId = 0;
        this.cities = [];
        this.linkGroups = {};

        this.distanceScale = null;
        this.cityVeronoi = null;

        this.editorState = {
            fromCity: null,
            connectionType: connectionTypes.track,
            color: colors[0]
        };

        let svg = d3.select(container)
            .append("svg")
            .attr("id", "ticket-to-ride")
            .attr("viewBox", `0 0 ${this.width} ${this.height}`)
            .append("g").attr("id", "ticket-to-ride-container");
        this.svg = svg.append("g");
        this.loadMap(Maps.BlackSea);
        new MapZoomer(self.container, "#ticket-to-ride-container", self.svg);
    }

    buildMenu() {
        let self = this;
        let html = `
                <li id="menu-map-mode" class="menu-submenu-item">Viewer</li>
                <li id="menu-hide-links" class="menu-submenu-item">Hide links</li>
                <li  id="menu-hide-voronoi" class="menu-submenu-item">Show grid</li>
                <li id="menu-generate-links" class="menu-submenu-item">Generate links</li>
                <li id="menu-reset" class="menu-submenu-item">Reset</li>
                <li  id="dijkstra" class="menu-submenu-item">Dijkstra</li>
                <li>
                    <input type="file" accept=".json" id="import" class="menu-import"/>
                </li>
                <li class="menu-submenu-item">
                    <a id="export">Export</a>
                </li>               
                <li class="menu-submenu-item">
                    <select id="selector-map">
                        <option>BlackSea</option>
                        <option>Ukraine</option>
                        <option>Ukraine2</option>
                        <option>Globe</option>
                    </select>
                </li>                
                <li class="menu-submenu-item">
                    <select id="selector-connection-type">
                        <option>track</option>
                        <option>ferriage</option>
                        <option>tunnel</option>
                    </select>
                </li>               
                <li class="menu-submenu-item">
                    <select id="selector-color">
                        <option>firebrick</option>
                        <option>chockolate</option>
                        <option>goldenrod</option>
                        <option>olivedrab</option>
                        <option>steelblue</option>
                        <option>plum</option>
                        <option>darkslategrey</option>
                        <option>whitesmoke</option>
                        <option>grey</option>
                    </select>
                </li>`;


        d3.select(self.menuContainer).html(html);

        d3.select("#menu-map-mode").on("click.map", function () {
            if (d3.select("#menu-map-mode").text() === "Viewer") {
                d3.select("#menu-map-mode").text("Editor");

                self.svg.selectAll(".city")
                    .on("click.destinations", d => showCityDestinations(d, self))
                    .on("dblclick.builder", null);
                hideCityLinks(true);
                self.displayDestinations();
            } else {
                d3.select("#menu-map-mode").text("Viewer");
                self.svg.selectAll(".city")
                    .on("click.destinations", null)
                    .on("dblclick", d => clickCity(d, self));
                hideCityDestinations(self);
                hideTooltip("#tooltip");
            }
        });
        d3.select("#menu-hide-links").on("click.map", () => {
            if (d3.select("#menu-hide-links").text() === "Hide links") {
                d3.select("#menu-hide-links").text("Show links");
                hideCityLinks(true, self)
            } else {
                d3.select("#menu-hide-links").text("Hide links");
                hideCityLinks(false, self);
            }
        });
        d3.select("#menu-hide-voronoi").on("click.map", () => {
            if (d3.select("#menu-hide-voronoi").text() === "Hide grid") {
                d3.select("#menu-hide-voronoi").text("Show grid");
                hideCityVoronoi(true, self);
            } else {
                d3.select("#menu-hide-voronoi").text("Hide grid");
                hideCityVoronoi(false, self);
            }

        });
        d3.select("#menu-generate-links").on("click.map", () => {
            self.generateRandomLinks();
        });
        d3.select("#menu-reset").on("click.map", () => {
            self.resetEditor();
            hideTooltip("#tooltip");
        });

        d3.select("#export").on("click.map", function () {
            let cfg = {
                format: 'text/json',
                filename: 'TicketToRide',
                extension: 'json'
            };
            download(this, cfg, self.exportAsJson());
        });
        d3.select("#dijkstra").on("click.map", () => {
        });
        d3.select("#import").on("change.map", function () {
            let selection = this;
            let files = selection.files;
            if (files.length <= 0) {
                return;
            }

            var fr = new FileReader();
            fr.readAsText(files.item(0));

            fr.onload = function (e) {
                let result = JSON.parse(e.target.result);
                if (!result) {
                    console.log("Could not upload file");
                    return;
                }
                selection.value = "";
                self.importFile(result);

            }
        });

        d3.select("#selector-map").on("change.map", function () {
            self.resetEditor();
            self.svg.selectAll("*").remove();
            self.loadMap(Maps[this.value]);
        });
        d3.select("#selector-connection-type").on("change.map", function () {
            self.editorState.connectionType = this.value;
        });
        d3.select("#selector-color").on("change.map", function () {
            self.editorState.color = colors[this.selectedIndex];
        });
    }

    resetEditor() {
        this.linkGroupsSelector.selectAll("g[name^='link-group']").remove();
        this.linkGroupId = 0;
    };

    loadMap(mapObj) {
        let self = this;
        let url = "static/" + mapObj.file;
        d3.json(url, function (error, topoMap) {
            if (error) {
                return console.error(error);
            }
            self.projection = d3.geoMercator();
            let mapOutlines = topojson.feature(topoMap, topoMap.objects.countries);
            let citiesOutline = topojson.feature(topoMap, topoMap.objects.cities);
            let regions = topoMap.objects.regions ? topojson.feature(topoMap, topoMap.objects.regions) : undefined;
            self.projection.fitExtent([[mapObj.extentOffsets[0][0], mapObj.extentOffsets[0][1]], [self.width - mapObj.extentOffsets[1][0], self.height - mapObj.extentOffsets[1][1]]], citiesOutline);

            self.path = d3.geoPath().projection(self.projection);
            // draw map


            self.svg.append("g").attr("id", "map")
                .selectAll(".countries")
                .data(mapOutlines.features)
                .enter().append("path")
                .attr("class", d => `countries ${d.properties.id}`)
                .attr("d", self.path)
                //.style("fill", d => `url(#background-${d.properties.id})`);
                .style("fill", (d, i) => MapConfig.color(i));
            if (regions) {
                self.svg.append("g").attr("id", "regions")
                    .selectAll(".regions")
                    .data(regions.features)
                    .enter().append("path")
                    .attr("class", "regions")
                    .attr("d", self.path);
            }

            //draw cities and city labels
            self.cities = citiesOutline.features.map(d => {
                return {
                    name: d.properties.name,
                    coordinates: d.geometry.coordinates,
                    label: d.properties.label || d.properties.name,
                    country: d.properties.country
                };
            });

            self.cityVeronoi = d3.voronoi()
                .x(d=> d.coordinates[0])
                .y(d=> d.coordinates[1])
                //.size([self.width, self.height])
                (self.cities.map(d => {
                    return {
                        coordinates: self.projection(d.coordinates),
                        name: d.name
                    };
                }));
            self.setScales();

            self.svg
                .append("g")
                .attr("id", "city-voronoi")
                .selectAll("path")
                .data(self.cityVeronoi.polygons())
                .enter().append("path")
                .attr("class", "city-voronoi hidden")
                .attr("d", d => `M${d.filter(e => !!e).join("L")}Z`);

            //draw all veronoi links
            self.svg.append("g").attr("id", "city-voronoi-links").selectAll(`.city-voronoi-links`)
                .data(self.cityVeronoi.links())
                .enter().append("line")
                .attr("class", "city-voronoi-links hidden")
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
                .attr("dy", "5")
                .text(function (d) {
                    return d.properties.label || d.properties.name;
                })
                .call(d3.drag().on("drag", dragLabel));

            function dragLabel(d) {
                let selection = d3.select(this);
                selection
                    .attr("dx", d3.event.x - d.x)
                    .attr("dy", 5 + d3.event.y - d.y);
            }

            self.svg.append("g").attr("id", "city-circles")
                .selectAll(".city")
                .data(citiesOutline.features)
                .enter()
                .append("circle")
                .attr("transform", d => `translate( ${self.projection(d.geometry.coordinates)} )`)
                .attr("r", 5)
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


            self.svg.append("g").attr("id", "link-groups");
            self.linkGroupsSelector = self.svg.select("g#link-groups");
            self.svg.append("g").attr("id", "single-city-destinations");
            self.svg.selectAll(".city").on("dblclick", function (d) {
                clickCity(d, self)
            });
        });
    };

    setScales() {
        let distances = this.cityVeronoi
            .links()
            .map(l => {
                let from = this.cities.find(d => d.name === l.source.name);
                let to = this.cities.find(d => d.name === l.target.name);
                return d3.geoDistance(from.coordinates, to.coordinates);
            });

        this.distanceScale = d3.scaleQuantize()
            .domain(d3.extent(distances))
            .range(d3.range(0, 8));
    };

    drawLink(params) {
        let self = this;

        let cityA = params.cityA;
        let cityB = params.cityB;
        let color = params.color;
        let connectionType = params.connectionType;
        let connectionCoords = params.connectionCoords;
        let connectionOptions = params.connectionOptions || {};
        let connections = params.connections;
        let linkId = params.linkId;

        let origin = cityA.coordinates;
        let destination = cityB.coordinates;
        let nameA = cityA.name;
        let nameB = cityB.name;

        let linkGroup = self.linkGroupsSelector.select(`g[name='link-group-${linkId}-${nameA}-${nameB}']`);
        if (linkGroup.empty()) {
            linkGroup = self.linkGroupsSelector.append("g").attr("name", `link-group-${linkId}-${nameA}-${nameB}`);
        }

        // connection link ------------------------------------------------------------
        let connectionDotsSelection = linkGroup.selectAll(`.city-link-outline[name='${nameA}${nameB}']`)
            .data(connections, d => d.index);
        connectionDotsSelection
            .enter().append("path")
            .attr("class", "city-link-outline")
            .attr("name", `${nameA}${nameB}`);
        connectionDotsSelection.exit().remove();
        // connection link end ------------------------------------------------------------

        // trains ------------------------------------------------------------
        let connectionTrainsSelection = linkGroup.selectAll(`.city-link-train[name='${nameA}${nameB}']`)
            .data(connections, d => d.index);
        connectionTrainsSelection
            .enter().append("rect")
            .attr("class", "city-link-train")
            .attr("name", `${nameA}${nameB}`)
            .style("fill", color)
            .attr("width", train.width)
            .attr("height", train.height);
        connectionTrainsSelection.exit().remove();

        let connectionTrainCarriagesSelection = linkGroup.selectAll(`.city-link-train-carriage[name='${nameA}${nameB}']`)
            .data(connections, d => d.index);
        drawConnectionType(connectionTrainCarriagesSelection, connectionType, nameA, nameB, color, connectionOptions);
        connectionTrainCarriagesSelection.exit().remove();
        // trains end ------------------------------------------------------------

        // circles ------------------------------------------------------------
        let connectionPoints = linkGroup.selectAll(`.city-link-circles[name='${nameA}${nameB}']`)
            .data(connectionCoords, d => d.index);

        connectionPoints
            .enter().append("circle")
            .attr("name", `${nameA}${nameB}`)
            .attr("class", "city-link-circles")
            .attr("r", d => 3)
            .merge(connectionPoints)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
        connectionPoints.exit().remove();
        // circles end ------------------------------------------------------------

        linkGroup.selectAll(`.city-link-circles[name='${nameA}${nameB}']`)
            .on("dblclick", function (d, i) {
                connectionCoords.splice(i, 0, {
                    x: connectionCoords[i].x,
                    y: connectionCoords[i].y
                });

                connections.splice(0, connections.length);
                connections.push.apply(connections, buildConnections(connectionCoords));

                if (i === 0) {
                    connectionCoords[0].first = true;
                    delete connectionCoords[1].first;

                    connectionCoords[0].fx = connectionCoords[0].x;
                    connectionCoords[0].fy = connectionCoords[0].y;
                    connectionCoords[1].fx = null;
                    connectionCoords[1].fy = null;
                }

                self.drawLink(self.linkGroups[linkId]);
            })
            .call(d3.drag()
                .on("start", dragStarted)
                .on("drag", dragged)
                .on("end", dragEnded));

        let start = connectionCoords[0];
        start.fx = start.x;
        start.fy = start.y;

        let end = connectionCoords[connectionCoords.length - 1];
        end.fx = end.x;
        end.fy = end.y;

        let cityManualLinkSimulation = d3.forceSimulation()
            .force("link", d3.forceLink())
            .nodes(connections)
            .on("tick", tick);

        function tick() {
            linkGroup.selectAll(`.city-link-outline[name='${nameA}${nameB}']`)
                .attr("d", d => {
                    let s = connectionCoords[d.sourceIdx], t = connectionCoords[d.targetIdx];
                    let path = "M";
                    if (s.first) {
                        path += "" + self.projection(origin) + "L";
                    }
                    path += `${s.x},${s.y}L${t.x},${t.y}`;

                    if (t.last) {
                        path += "L" + self.projection(destination);
                    }
                    return path;
                });
            linkGroup.selectAll(`.city-link-train[name='${nameA}${nameB}']`)
                .attr("transform", d => {
                    let s = connectionCoords[d.sourceIdx], t = connectionCoords[d.targetIdx];
                    let x = (s.x + t.x - train.width) / 2;
                    let y = (s.y + t.y - train.height) / 2;
                    let angle = angleRad(s, t);
                    return `translate(${x}, ${y}) rotate(${angle}, ${train.width / 2},${train.height / 2})`;
                });

            let connectionTrainCarriagesSelection = linkGroup.selectAll(`.city-link-train-carriage[name='${nameA}${nameB}']`);
            if (!connectionTrainCarriagesSelection.empty()) {
                connectionTrainCarriagesSelection
                    .attr("transform", d => {
                        let s = connectionCoords[d.sourceIdx], t = connectionCoords[d.targetIdx];
                        let x = (s.x + t.x - trainCarriage.width) / 2;
                        let y = (s.y + t.y - trainCarriage.height) / 2;
                        let angle = angleRad(s, t);
                        return `translate(${x}, ${y}) rotate(${angle}, ${trainCarriage.width / 2},${trainCarriage.height / 2})`;
                    });
            }
        }

        // drag functions
        function dragStarted(d) {
            d3.select(this).raise().classed("selected", true);
            //d3.select(this).style("cursor", "move");
            cityManualLinkSimulation.alphaTarget(0.3).restart();
        }
        function dragEnded(d) {
            d3.select(this).classed("selected", false);
            //d3.select(this).style("cursor", "pointer");
            cityManualLinkSimulation.alphaTarget(0);
        }
        function dragged(d) {
            cityManualLinkSimulation.alphaTarget(0.3);
            d3.select(this)
                .attr("cx", d.x = d3.event.x)
                .attr("cy", d.y = d3.event.y);
        }

        linkGroup.selectAll(`.city-link-train[name='${nameA}${nameB}']`)
            .on("dblclick", function (d, i) {
                if (i === 0 && connections.length === 1) {
                    d3.select(this.parentNode).remove();
                    delete self.linkGroups[linkId];
                    return;
                }
                if (connectionType === connectionTypes.ferriage && i > 0 && i < connectionOptions.ferriageLength) {
                    connectionOptions.ferriageLength = connectionOptions.ferriageLength - 1;
                }
                connectionCoords.splice(i, 1);
                if (i === 0) {
                    connectionCoords[0].first = true;
                }

                connections.splice(0, connections.length);
                connections.push.apply(connections, buildConnections(connectionCoords));

                self.drawLink(self.linkGroups[linkId]);
            });
    };

    createLinkGroup(cityA, cityB, initialSize, color, connectionType) {
        let self = this;
        let origin = [cityA.coordinates[0], cityA.coordinates[1]];
        let destination = [cityB.coordinates[0], cityB.coordinates[1]];
        let xD = (cityB.coordinates[0] - cityA.coordinates[0]) / (initialSize + 1);
        let yD = (cityB.coordinates[1] - cityA.coordinates[1]) / (initialSize + 1);

        let connectionCoords = [];
        connectionCoords.push([origin[0], origin[1]]);
        for (let i = 0; i < initialSize; i++) {
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

        let connections = buildConnections(connectionCoords);
        let currentId = self.linkGroupId++;
        let connectionOptions = {};
        if (connectionType === connectionTypes.ferriage) {
            connectionOptions.ferriageLength = 1;
            if (connections.length > 4) {
                connectionOptions.ferriageLength = 2;
            }
        }

        this.linkGroups[currentId] = {
            cityA: cityA,
            cityB: cityB,
            color: color,
            connectionType: connectionType,
            connectionOptions: {},
            connectionCoords: connectionCoords,
            connections: connections,
            linkId: currentId
        };
        return this.linkGroups[currentId];
    };

    generateRandomLinks() {
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

            let linkColorIdxs = randomUniqueRange(0, colors.length, Math.max(quantity, MAX_LINKS));
            let randomLinksIdxs = randomUniqueRange(0, quantity, Math.min(quantity, MAX_LINKS));

            link.targets.forEach((destination, idx) => {
                if (randomLinksIdxs.includes(idx)) {
                    let to = destination;
                    let scale = self.distanceScale(d3.geoDistance(from.coordinates, to.coordinates));

                    let connectionType = connectionTypes.getByIndex([connectionTypeRandomer.pRandom()]);
                    let linkGroup = self.createLinkGroup(from, to, scale, colors[linkColorIdxs[idx]], connectionType);
                    self.drawLink(linkGroup);
                }
            });
        });
    };

    importFile(json) {
        let self = this;
        self.resetEditor();
        this.graph = new Graph(json);
        this.graph.load(json);

        self.linkGroupId = json.linkGroupId;
        self.linkGroups = json.linkGroups;

        Object.keys(self.linkGroups)
            .forEach(d => {
                let linkGroup = self.linkGroups[d];
                self.drawLink(linkGroup);
            });

        if (json.cityLabels) {
            let sel = self.svg.select("#city-labels").selectAll(".city-label");
            sel
                .attr("dx", (d, i) => json.cityLabels[i].dx)
                .attr("dy", (d, i) => json.cityLabels[i].dy);
        }

    };

    exportAsJson() {
        let self = this;
        let cityLabels = self.svg.select("#city-labels").selectAll(".city-label")
            .nodes()
            .map((d, i) => {
                let sel = d3.select(d);
                return {
                    name: self.cities[i].name,
                    dx: sel.attr("dx") ? Number(sel.attr("dx")) : 0,
                    dy: sel.attr("dy") ? Number(sel.attr("dy")) : 0,
                }
            });


        return {
            version: "0.1",
            linkGroupId: self.linkGroupId,
            linkGroups: self.linkGroups,
            cities: self.cities,
            cityLabels: cityLabels
        }

    };

    displayDestinations() {
        let self = this;
        let dijkstra = self.cities.map(function (el) {
            return self.graph.findDijkstraRoutes(el);
        });

        let html = `<table class="destination-table">
                <tr class="destination-header">
                    <th>${self.cities.length}</th>
                    ${self.cities.map(el => `<th class="rotate"><div><span>${el.label}</span></div></th>`).join("")}                                                    
                </tr>
                ${self.cities.map((el, i) => {
            return `<tr><td class="destination-city">${el.label}</td>${self.cities.map(el => `<td class="destination-distance">${dijkstra[i].distances[el.name]}</td>`).join("")}</tr>`;
        }).join("")}                
            </table>`;

        displayTooltip("#tooltip", {left: 40, bottom: 10, width: 600, height: 430}, {offsetX: 5, offsetY: 5}, html);
    };
}