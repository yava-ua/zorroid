import TicketToRide from "../widgets/TicketToRide";
import MapUkraine from "../widgets/MapUkraine";
import MapGlobe from "../widgets/MapGlobe";
import D3Modules from "../widgets/D3Modules";

import * as d3 from "d3";

const widgets = [
    {
        id: "ticket-to-ride",
        title: "Ticket To Ride",
        icon: "road.svg"
    }, {
        id: "map-ukraine",
        title: "Map of Ukraine",
        icon: "sphere.svg"
    }, {
        id: "map-globe",
        title: "Globe",
        icon: "earth.svg"
    }, {
        id: "d3-modules",
        title: "D3 Modules",
        icon: "star-empty.svg"
    }
];

let currentWidget = null, selectedMenu = null;


function resetWidget() {
    if (currentWidget) {
        currentWidget.dispose();
    }
    currentWidget = null;

}
function openWidget(widget) {
    const submenu = d3.select(`#menu-widget-${widget.id}`).select('.menu-submenu');
    const isOpen = submenu.classed('open');
    submenu.classed('open', !isOpen);

    if (selectedMenu && selectedMenu.id === widget.id) {
        return;
    }

    resetWidget();
    switch (widget.id) {
        case "ticket-to-ride":
            currentWidget = new TicketToRide("#container", `#menu-widget-${widget.id} .menu-submenu`);
            break;
        case "map-ukraine":
            currentWidget = new MapUkraine("#container", `#menu-widget-${widget.id} .menu-submenu`);
            break;
        case "map-globe":
            currentWidget = new MapGlobe("#container", `#menu-widget-${widget.id} .menu-submenu`);
            break;
        case "d3-modules":
            currentWidget = new D3Modules("#container", `#menu-widget-${widget.id} .menu-submenu`);
            break;
        default:
            return;
    }

    selectedMenu = widget;
    currentWidget.buildMenu();
}

function buildWidgetsMenu() {
    d3.select("#navigation-left").html(`<ul class="menu-list no-select"></ul>`);

    let menuSelection = d3.select("#navigation-left")
        .select(".menu-list")
        .selectAll(".menu-item")
        .data(widgets)
        .enter().append("li")
        .attr("class", "menu-item")
        .attr("id", d => `menu-widget-${d.id}`)
        .html(d => `<div class="menu-item-title">
                        <span class="menu-item-title-image"><img src="images/${d.icon}" width="22px" height="22px"></span>
                        <span class="menu-item-title-label">${d.title}</span>
                    </div>
                    <ul class="menu-submenu"></ul>`);
    menuSelection.select(".menu-item-title")
        .on("click.menu-item", d => {
            openWidget(d);
        });

    d3.select("#menu-open").on("click", () => {
        openLeftNav();
    });
    d3.select("#menu-close").on("click", () => {
        closeLeftNav();
    });
}


function openLeftNav() {
    d3.select("#navigation-left").classed("closed", false);
    d3.select("#container").classed("wide", false);
}
function closeLeftNav() {
    d3.select("#navigation-left").classed("closed", true);
    d3.select("#container").classed("wide", true);
}

buildWidgetsMenu();
openWidget(widgets[3]);

d3.select("#menu-open").on("click", () => {
    let menu = d3.select("#navigation-left");
    let closed = menu.classed("closed");
    !closed ? closeLeftNav() : openLeftNav();
});
