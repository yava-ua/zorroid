import * as d3 from "d3";
import * as topojson from "topojson";
import MapZoomer from "./MapZoomer";

const MapConfig = {
    width: 960,
    height: 500,
    color: d3.scaleOrdinal(d3.schemeCategory20c),
    sensitivity: 0.25,
    Globe: {
        file: "globe-black-sea_simplified.json",
        extentOffsets: [[3, 3], [3, 3]]
    }
};

export default function MapGlobe(container) {
    let self = this;
    this.container = container;
    this.width = MapConfig.width;
    this.height = MapConfig.height;

    this.projection = d3.geoOrthographic()
        .rotate([-32, -49, 0]);
    this.path = d3.geoPath().projection(this.projection);


    let svg = d3.select(container)
        .append("svg")
        .attr("id", "map-globe")
        .attr("viewBox", `0 0 ${this.width} ${this.height}`);

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

        new MapZoomer(self.container, "#map-globe", self.svg);
    });
};

MapGlobe.prototype.redrawMap = function () {
    let self = this;
    self.svg.selectAll("path.countries").attr("d", self.path);
    self.svg.selectAll("path.graticule.line").attr("d", self.path);
}