import * as d3 from "d3";
import * as topojson from "topojson";
import MapZoomer from "./MapZoomer";

const MapConfig = {
    width: 960,
    height: 500,
    color: d3.scaleOrdinal(d3.schemeCategory20c),
    sensitivity: 0.25,
    Globe: {
        file: "globe_black-sea_simplified_quantized.json",
        extentOffsets: [[3, 3], [3, 3]]
    }
};

export default function MapGlobe(container) {
    this.container = container;

    this.projection = d3.geoOrthographic().rotate([-32, -49, 0]);
    this.path = d3.geoPath().projection(this.projection);

    let svg = d3.select(container)
        .append("svg")
        .attr("id", "map-globe")
        .attr("viewBox", `0 0 ${MapConfig.width} ${MapConfig.height}`);

    this.svg = svg.append("g")
        .attr("transform", `translate(0,0)`);
    this.loadMap(MapConfig.Globe);
}
MapGlobe.prototype.loadMap = function (mapObj) {
    let self = this;
    let url = "static/" + mapObj.file;
    d3.json(url, function (error, topoMap) {
        if (error) {
            return console.error(error);
        }

        let graticule = d3.geoGraticule();
        let mapOutlines = topojson.feature(topoMap, topoMap.objects.countries);


        self.svg.append("g").attr("id", "map-sphere")
            .append("path").datum({type: "Sphere"})
            .attr("class", "graticule outline").attr("d", self.path);

        self.svg.append("g").attr("id", "map-countries")
            .selectAll(".countries")
            .data(mapOutlines.features)
            .enter().append("path")
            .attr("class", "countries").attr("d", self.path)
            .style("fill", (d, i) => MapConfig.color(i));

        self.svg.append("g").attr("id", "map-graticule")
            .append("path").datum(graticule)
            .attr("class", "graticule line").attr("d", self.path);

        let citiesOutline = topojson.feature(topoMap, topoMap.objects.cities);
        self.svg.append("g").attr("id", "city-labels")
            .selectAll(".city-label")
            .data(citiesOutline.features.filter(d => d.properties.scalerank <= 1), d => d.properties.name)
            .enter().append("text")
            .attr("class", "city-label")
            .attr("transform", d => `translate(${self.projection(d.geometry.coordinates)})`)
            .attr("dy", "0.5em")
            .text(d => d.properties.name);

        self.svg.append("g").attr("id", "city-circles")
            .selectAll(".city")
            .data(citiesOutline.features.filter(d => d.properties.scalerank <= 1), d => d.properties.name)
            .enter()
            .append("circle")
            .attr("class", "city")
            .attr("transform", d => `translate( ${self.projection(d.geometry.coordinates)} )`)
            .attr("r", d => 1)
            .attr("name", d => d.properties.name);

        self.svg.call(d3.drag()
            .subject(function () {
                let rotate = self.projection.rotate();
                return {
                    x: rotate[0] / MapConfig.sensitivity,
                    y: -rotate[1] / MapConfig.sensitivity
                };
            })
            .on("drag.map", () => {
                let rotate = self.projection.rotate();
                self.projection.rotate([d3.event.x * MapConfig.sensitivity, -d3.event.y * MapConfig.sensitivity, rotate[2]]);
                self.redrawMap();
            }));

        let zoomer = self.zoomer = new MapZoomer(self.container, "#map-globe", self.svg);
        zoomer.zoom.on("zoom.labels", function () {
            let cityLabelSelection = self.svg.select("#city-labels").selectAll("text.city-label")
                .data(citiesOutline.features.filter(d => zoomer.currentScale > 0.5 && d.properties.scalerank <= zoomer.currentScale), d => d.properties.name);

            cityLabelSelection.enter().append("text")
                .attr("class", "city-label")
                .attr("transform", d => `translate(${self.projection(d.geometry.coordinates)})`)
                .text(d => d.properties.name)
                .merge(cityLabelSelection)
                .attr("dy", "0.5em")
                .style("font-size", 6 / zoomer.currentScale);
            cityLabelSelection.exit().remove();


            let cityCircleSelection = self.svg.select("#city-circles").selectAll("circle.city")
                .data(citiesOutline.features.filter(d => zoomer.currentScale > 0.5 && d.properties.scalerank <= zoomer.currentScale), d => d.properties.name);

            cityCircleSelection.enter().append("circle")
                .attr("class", "city")
                .attr("transform", d => `translate( ${self.projection(d.geometry.coordinates)} )`)
                .attr("name", d => d.properties.name)
                .merge(cityCircleSelection)
                .attr("r", 1 / zoomer.currentScale);
            cityCircleSelection.exit().remove();
        });


    });
};

MapGlobe.prototype.redrawMap = function () {
    let self = this;
    self.svg.selectAll("path.countries").attr("d", self.path);
    self.svg.selectAll("path.graticule.line").attr("d", self.path);
    self.svg.selectAll("text.city-label")
        .attr("transform", d => `translate(${self.projection(d.geometry.coordinates)})`)
        .text(d => isProjectedCoordinate(self.path, d.geometry.coordinates) ? d.properties.name : "");

    self.svg.selectAll("circle.city")
        .attr("transform", d => `translate(${self.projection(d.geometry.coordinates)})`)
        .attr("r", d => isProjectedCoordinate(self.path, d.geometry.coordinates) ? 1 / self.zoomer.currentScale : 0);
};

function isProjectedCoordinate(path, coordinates) {
    return path({type: "MultiPoint", coordinates: [coordinates]}) !== undefined;
}