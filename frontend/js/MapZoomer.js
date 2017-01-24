import * as d3 from "d3";
import {appendButton} from "./Utils";

const SCALE_DURATION = 1000;
const MIN_SCALE = 0;
const MAX_SCALE = 9;
const DEFAULT_SCALE = 1;

export default function MapZoomer(containerSelector, svgSelector, object) {
    this.container = d3.select(containerSelector);
    this.svg = this.container.select(svgSelector);
    this.object = object;
    this.currentScale = DEFAULT_SCALE;
    let self = this;

    this.zoom = d3.zoom().on("zoom.zoomer", function () {
        //!important. do not use => function, otherwise "this" is not defined correctly
        self.zoomed();
    });
    this.appendMapButtons();
    this.svg.call(self.zoom).on("dblclick.zoom", null);
}

MapZoomer.prototype.appendMapButtons = function () {
    let self = this;
    const resetButton = appendButton(this.container, 'Reset', 'resetButton');
    resetButton.on('click', function () {
        self.resetMap();
    });
    const zoomInButton = appendButton(this.container, '+', 'zoomInButton');
    zoomInButton.on('click', function () {
        self.zoomIn();
    });
    const zoomOutButton = appendButton(this.container, '-', 'zoomOutButton');
    zoomOutButton.on('click', function () {
        self.zoomOut();
    });
};

MapZoomer.prototype.zoomRatio = function (power) {
    return Math.max(MIN_SCALE, Math.min(MAX_SCALE, this.currentScale * Math.pow(2, power)));
};

MapZoomer.prototype.zoomed = function () {
    this.object.attr("transform", d3.event.transform);
    this.currentScale = d3.event.transform.k;
};

MapZoomer.prototype.zoomIn = function () {
    let self = this;
    if (this.currentScale < MAX_SCALE) {
        this.object.transition().duration(500).call(self.zoom.scaleTo, 1.5 * self.zoomRatio(0.2));
    }
};

MapZoomer.prototype.zoomOut = function () {
    let self = this;
    if (this.currentScale > MIN_SCALE) {
        this.object.transition().duration(500).call(self.zoom.scaleTo, self.zoomRatio(-0.2) / 1.5);
    }
};

MapZoomer.prototype.resetMap = function () {
    let self = this;
    this.object.transition().duration(SCALE_DURATION)
        .call(self.zoom.transform, d3.zoomIdentity.translate(0, 0).scale(DEFAULT_SCALE));
};