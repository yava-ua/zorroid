import * as d3 from "d3";
import * as topojson from "topojson";
const ua = require('../static/ua-result.json');

export default function MapUkraine(container) {
    let self = this;
    this.width = 1240;
    this.height = 800;

    this.format = d3.format(",.2f");

    this.projection = d3.geoAlbers()
        .center([49, 32])
        .rotate([-7.8, 4, -32])
        .parallels([42, 52])
        .translate([this.width / 2, this.height / 2]);

    this.svg = d3.select(container)
        .append("svg")
        .attr("id", "map-ukraine")
        //.attr("width", "100%")
        //.attr("height", "100%")
        .attr("viewBox", `0 0 ${this.width} ${this.height}`);

    this.path = d3.geoPath().projection(this.projection);


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


    d3.csv("./static/models-all.csv", function (error, data) {
        if (error) {
            throw new Error("Couldn't load data");
        }

        self.data = groupData(data);

        self.svg.append("g").selectAll("text")
            .data(regions.features)
            .enter()
            .append("text")
            .text(d => {
                let byRegion = self.data["2015"][d.properties.name];
                let sales = byRegion ? byRegion.reduce((a, b) => Number(b.sales) + a, 0) : "";

                return `Region: ${d.properties.name}; Sales: ${self.format(sales)}`;
            })
            .attr("transform", d => `translate(${self.path.centroid(d)})`)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px");


    });
}

function groupData(data) {
    let result = {};
    data.forEach(d => {
        if (!result[d.date]) {
            result[d.date] = {};
        }
        if (!result[d.date][d.city]) {
            result[d.date][d.city] = [];
        }
        result[d.date][d.city].push({
            dealer: d.dealer,
            model: d.model,
            sales: d.sales
        });
    });
    return result;

}