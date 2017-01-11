import * as d3 from 'd3';

function openLeftNav() {
    d3.select("#navigation-left").classed("active", true);
    d3.select("#container").classed("inactive", true);
}
function closeLeftNav() {
    d3.select("#navigation-left").classed("active", false);
    d3.select("#container").classed("inactive", false);
}

d3.select("#menu-open").on("click", () => {
    openLeftNav();
});
d3.select("#menu-sub").on("click", () => {
    openLeftNav();
});
d3.select("#menu-close").on("click", () => {
    closeLeftNav();
});
d3.selectAll("#navigation-left a").on("click.close", () => {
    closeLeftNav();
});


// right
function openRightNav() {
    d3.select("#navigation-right").classed("active", true);
}

function closeRightNav() {
    d3.select("#navigation-right").classed("active", false);
}

d3.select("#menu-sub").on("click", () => {
    openRightNav();
});
d3.select("#navigation-right-close").on("click", () => {
    closeRightNav();
});

