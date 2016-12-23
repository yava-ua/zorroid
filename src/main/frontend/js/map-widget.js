import * as d3 from "d3";
import * as topojson from "topojson";
import Randomer from "./Randomer";

export default function MapWidget(container) {
    this.width = 800;
    this.height = 450;

    this.svg = d3.select(container)
        .append("svg")
        .attr("class", "svg")
        //.attr("width", "100%")
        //.attr("height", "100%")
        .attr("viewBox", "0 0 800 400");

    let projection = d3.geoAlbers()
            .center([49, 32])
            .rotate([-2, 2, -27])
            .parallels([42, 52])
            .translate([this.width / 2, this.height / 2])
            .scale(2800);

    let path = d3.geoPath()
        .projection(projection);

    let self = this;
    d3.json("json/ua.json", function (error, ua) {
        if (error) {
            return console.error(error);
        }

        let mapOutlines = topojson.feature(ua, ua.objects.subunits);

        self.svg.selectAll(".subunit")
            .data(mapOutlines.features)
            .enter().append("path")
            .attr("class", d => `subunit ${d.id}`)
            .attr("d", path);


        let citiesOutline = topojson.feature(ua, ua.objects.places);

        self.svg.append("path")
            .datum(citiesOutline)
            .attr("d", path)
            .attr("stroke-width", 1)
            .attr("class", "place");


        self.svg.selectAll(".city-label")
            .data(citiesOutline.features)
            .enter().append("text")
            .attr("class", "city-label")
            .attr("transform", d => `translate( ${projection(d.geometry.coordinates)} )`)
            .attr("dy", ".3em")
            .text(function (d) {
                return d.properties.name;
            });

        self.svg.selectAll(".city-label")
            .attr("x", d => d.geometry.coordinates[0] > -1 ? 6 : -6)
            .style("text-anchor", d => d.geometry.coordinates[0] > -1 ? "start" : "end");

        self.cities = citiesOutline.features.map(d => {
            return {
                name: d.properties.name,
                coordinates: d.geometry.coordinates
            };
        });

        self.generateRoutes();

        let linkLines = self.links.map(d => {
            return {
                type: "LineString",
                coordinates: [self.cities.find(e=> e.name === d.source).coordinates, self.cities.find(e=> e.name === d.target).coordinates]
            };
        });

        let link = self.svg.selectAll(".link")
            .data(linkLines)
            .enter().append("path")
            .attr("d", path)
            .attr("class", "link");

    });
}

let lengthRandomer = new Randomer([5, 25, 25, 10, 10, 10, 10, 5]);
const maxLinks = 5;
let cityLinksRandomer = new Randomer([16, 23, 33, 23, 5]);

MapWidget.prototype.generateRoutes = function () {
    let links = [];
    let cityLinks = {
        /*
         maxNumberOfLinks: Number
         linkedTo: array[cityLink]
         */
    };

    // generate max number of links per city
    this.cities.forEach(d=> {
        cityLinks[d.name] = {
            maxNumberOfLinks: cityLinksRandomer.pRandom(),
            linkedTo: []
        };
    });

    // generate links
    this.cities.forEach((d, idx) => {
        let currentCityLink = cityLinks[d.name];

        if (currentCityLink.linkedTo.length >= currentCityLink.maxNumberOfLinks) {
            // already generated maximum links
            return;
        }
        let to = this.getRandomNotLinkedCity([idx]);

        links.push({
            source: d.name,
            target: to.name
        });

        currentCityLink.linkedTo.push(to.name);
    });

    this.links = links;
};


MapWidget.prototype.getRandomNotLinkedCity = function (excludes) {
    let idx = lengthRandomer.random(0, this.cities.length - 1);

    if (typeof excludes.includes !== "function") {
        console.log(excludes);
    }

    if (excludes.includes(idx)) {
        excludes.push(idx);
        return this.getRandomNotLinkedCity(excludes);
    }

    return this.cities[idx];
};
