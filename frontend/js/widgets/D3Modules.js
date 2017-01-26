//
import * as d3 from "d3";
import Widget from "./Widget";

const reposLink = "https://api.github.com/orgs/d3/repos";
const config = {
    width: 1240,
    height: 800,
    excludes: ["d3", "d3.github.com"]
};

export default class D3Modules extends Widget {
    constructor(container, menuContainer) {
        super(container, menuContainer);
        let self = this;

        let color = d3.scaleOrdinal(d3.schemeCategory20);

        let svg = d3.select(container)
            .append("svg")
            .attr("id", "d3-modules")
            .attr("viewBox", `0 0 ${config.width} ${config.height}`);

        d3.json(reposLink, function (error, data) {
            if (error) {
                throw new Error("Couldn't load data");
            }

            let squareScale = d3.scalePow().exponent(0.66)
                .domain(d3.extent(data, d=> d.size))
                .range([0, 100])
                .clamp(true);

            let root = {
                name: "d3-repo",
                children: data.map(d => {
                    return {
                        id: d.id,
                        name: d.name,
                        size: d.size,
                        description: d.description
                    }
                }).filter(d => {
                    return !config.excludes.includes(d.name) && !d.description.toLowerCase().includes("deprecated");
                })
            };

            let treeMap = d3.treemap()
                .size([config.width, config.height])
                .round(true)
                .paddingInner(1);

            let hierarchy = d3.hierarchy(root)
                .sum(d => d.size ? squareScale(Number(d.size)) : 0)
                .sort((a, b) => b.height - a.height || b.value - a.value);

            treeMap(hierarchy);

            let cell = svg.selectAll("g")
                .data(hierarchy.leaves())
                .enter().append("g")
                .attr("transform", d => `translate(${d.x0},${d.y0})`);

            cell.append("rect")
                .attr("width", d => d.x1 - d.x0)
                .attr("height", d => d.y1 - d.y0)
                .attr("fill", d => color(d.data.id));

            cell.append("text")
                .attr("transform", d => {
                    let width = d.x1 - d.x0;
                    let height = d.y1 - d.y0;
                    let horizontal = width > 100 || width > height;
                    return `translate(${horizontal ? "5" : "5"}, ${horizontal ? "15" : "5"}) rotate(${horizontal ? "0" : "90"}, 0, 0)`;
                })
                .text(d => d.data.name);
        });
    }
}