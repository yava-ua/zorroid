import * as d3 from "d3";
import * as topojson from "topojson";
import Widget from "./Widget";

const MapConfig = {
    width: 950,
    height: 500,
    color: d3.scaleOrdinal(d3.schemeCategory20c),
    file: "world_cqs.json"
};

export default class MapSimple extends Widget {
    constructor(container, menuContainer) {
        super(container, menuContainer);
        this.projection = d3.geoEquirectangular();
        this.path = d3.geoPath().projection(this.projection);

        this.svg = d3.select(container)
            .append("svg").attr("id", "map-simple")
            .attr("viewBox", `0 0 ${MapConfig.width} ${MapConfig.height}`);

        this.loadMap(MapConfig.file);
    }
    loadMap(mapFile) {
        let self = this;
        let url = "static/" + mapFile;
        d3.json(url, function (error, topoMap) {
            if (error) {
                return console.error(error);
            }

            let mapOutlines = topojson.feature(topoMap, topoMap.objects.countries);
            self.svg.append("g").attr("id", "map-countries")
                .selectAll(".countries")
                .data(mapOutlines.features)
                .enter().append("path")
                .attr("class", "countries").attr("d", self.path)
                .style("fill", (d, i) => MapConfig.color(i));

            let citiesOutline = topojson.feature(topoMap, topoMap.objects.cities);
            self.svg.append("g").attr("id", "city-labels")
                .selectAll(".city-label")
                .data(citiesOutline.features.filter(d => d.properties.SCALERANK <= 1), d => d.properties.name)
                .enter().append("text")
                .attr("class", "city-label")
                .attr("transform", d => `translate(${self.projection(d.geometry.coordinates)})`)
                .attr("dy", "0.5em")
                .text(d => d.properties.NAME);

            self.svg.append("g").attr("id", "city-circles")
                .selectAll(".city")
                .data(citiesOutline.features.filter(d => d.properties.SCALERANK <= 2), d => d.properties.name)
                .enter()
                .append("circle")
                .attr("class", "city")
                .attr("transform", d => `translate( ${self.projection(d.geometry.coordinates)} )`)
                .attr("r", d => 1)
                .attr("name", d => d.properties.NAME);
        });
    }
}