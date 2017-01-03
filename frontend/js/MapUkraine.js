import * as d3 from "d3";
import * as topojson from "topojson";

export default function MapUkraine(container) {
    let self = this;
    this.width = 1240;
    this.height = 800;

    this.projection = d3.geoAlbers()
        .center([49, 32])
        .rotate([-7.8, 4, -32])
        .parallels([42, 52])
        .translate([this.width / 2, this.height / 2]);

    let svg = d3.select(container)
        .append("svg")
        .attr("id", "map-ukraine")
        //.attr("width", "100%")
        //.attr("height", "100%")
        .attr("viewBox", `0 0 ${this.width} ${this.height}`);
    this.svg = svg;

    this.path = d3.geoPath().projection(this.projection);

    d3.json("json/ua-result.json", function (error, ua) {
        if (error) {
            return console.error(error);
        }

        // draw map
        let countries = topojson.feature(ua, ua.objects.countries);

        self.projection.fitExtent([[0, 0], [self.width, self.height]], countries);
        self.svg.append("g").attr("id", "countries")
            .selectAll(".countries")
            .data(countries.features)
            .enter().append("path")
            .attr("class", "countries")
            .attr("d", self.path);

        let regions = topojson.feature(ua, ua.objects.regions);
        self.svg.append("g").attr("id", "regions")
            .selectAll(".regions")
            .data(regions.features)
            .enter().append("path")
            .attr("class", "regions")
            .attr("d", self.path);

        let waterways = topojson.feature(ua, ua.objects.waterways);
        self.svg.append("g").attr("id", "waterways")
            .selectAll(".waterways")
            .data(waterways.features)
            .enter().append("path")
            .attr("class", "waterways")
            .attr("d", self.path);

    });

}