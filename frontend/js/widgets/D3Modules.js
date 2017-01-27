import * as d3 from "d3";
import Widget from "./Widget";
import rp from "request-promise";

const reposLink = "https://api.github.com/orgs/d3/repos?access_token=cc9d560ad8011eab239e145dafba6762bc15fe71";
const commitsLink = "https://api.github.com/repos/d3/:repo/stats/participation?access_token=cc9d560ad8011eab239e145dafba6762bc15fe71";

const config = {
    width: 1240,
    height: 800,
    excludes: ["d3", "d3.github.com"],
    color: d3.scaleOrdinal(d3.schemeCategory20)
};

export default class D3Modules extends Widget {
    constructor(container, menuContainer) {
        super(container, menuContainer);
        let self = this;

        this.svg = d3.select(container)
            .append("svg")
            .attr("id", "d3-modules")
            .attr("viewBox", `0 0 ${config.width} ${config.height}`);

        d3.json(reposLink, function (error, data) {
            if (error) {
                throw new Error("Couldn't load data");
            }

            self.root = {
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

            self.squareScale = d3.scalePow().exponent(0.66)
                .domain(d3.extent(self.root.children, d=> d.size))
                .range([10, 100])
                .clamp(true);

            let options = self.root.children.map(d => {
                return {
                    url: commitsLink.replace(':repo', d.name),
                    json: true
                };
            });
            Promise.all(options.map(d => {
                return rp(d)
                    .then(r => r)
                    .catch(e => e);
            })).then((d) => {

                d.map(d1 => d1.all.reduce((a, b) => a + b, 0))
                    .forEach((d1, i) => {
                        self.root.children[i].commits = d1;
                    });
                console.log(self.root.children);
            }).catch(r => {
                console.log(r);
            });

            self.treeMap = d3.treemap()
                .size([config.width, config.height])
                .round(true)
                .paddingInner(1);

            self.hierarchy = d3.hierarchy(self.root)
                .sum(d => d.size ? self.squareScale(Number(d.size)) : 0)
                .sort((a, b) => b.height - a.height || b.value - a.value);

            self.treeMap(self.hierarchy);
            self.reDraw();
        });
    }

    reDraw() {
        let self = this;
        let cell = self.svg.selectAll("g")
            .data(self.hierarchy.leaves())
            .enter().append("g");

        cell.append("rect")
            .attr("fill", d => config.color(d.data.id));

        cell.append("text")
            .text(d => d.data.name);

        let sel = self.svg.selectAll("g").transition().duration(750)
            .attr("transform", d => `translate(${d.x0},${d.y0})`);


        sel.select("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0);

        sel.select("text")
            .attr("transform", d => {
                let width = d.x1 - d.x0;
                let height = d.y1 - d.y0;
                let horizontal = width > 100 || width > height;
                return `translate(${horizontal ? "5" : "5"}, ${horizontal ? "15" : "5"}) rotate(${horizontal ? "0" : "90"}, 0, 0)`;
            });
    }

    buildMenu() {
        let self = this;
        let html = `
                <li class="menu-submenu-item">
                    <select id="selector-by-modules">
                        <option>Size</option>
                        <option>Commits</option>
                    </select>
                </li>`;

        d3.select(self.menuContainer).html(html);
        d3.select("#selector-by-modules").on("change", function () {
            let bySize = this.value === "Size";
            self.squareScale.domain(d3.extent(self.root.children, bySize ? d => d.size : d => d.commits));
            self.hierarchy
                .sum(bySize
                    ? (d => d.size ? self.squareScale(Number(d.size)) : 0)
                    : (d => d.commits ? self.squareScale(Number(d.commits)) : 0));

            self.treeMap(self.hierarchy);
            self.reDraw();
        });
    }
}