import * as d3 from 'd3';


function openNav() {
    d3.select("#mySidenav").classed("active", true);
    d3.select("#container").classed("inactive", true);
}

function closeNav() {
    d3.select("#mySidenav").classed("active", false);
    d3.select("#container").classed("inactive", false);
}

d3.select("#menu-open").on("click", () => {
    openNav();
});

d3.select("#menu-close").on("click", () => {
    closeNav();
});

d3.selectAll("#mySidenav a").on("click.close", () => {
    closeNav();
});

