import * as d3 from "d3";

export default class Widget {

    constructor(container, menuContainer) {
        if (this.constructor === Widget) {
            throw new TypeError('Abstract class "Widget" cannot be instantiated directly.');
        }

        this.container = container;
        this.menuContainer = menuContainer;
    }

    dispose() {
        d3.select(this.container).selectAll("*").remove();
        d3.select(this.menuContainer).selectAll("*").remove();
    }

    buildMenu() {
    }

}