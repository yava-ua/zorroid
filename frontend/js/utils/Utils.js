import * as d3 from "d3";

export function randomUniqueRange(min, max, quantity) {
    if (quantity > max - min) {
        throw new Error("range too low");
    }
    let excludes = [];
    let result = [];
    let left = quantity;
    while (left > 0) {
        let current = random(min, max);
        if (!excludes.includes(current)) {
            result.push(current);
            excludes.push(current);
            left--;
        }
    }
    //console.log(`Range: [${min}, ${max}] Quantity: ${quantity}. Result: ${result}`);
    return result;
}

export function random(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

export function angleRad(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
}

export function appendButton(selection, name, buttonClass) {
    return selection.append('div')
        .classed(`no-print map-button ${buttonClass}`, true)
        .text(name);
}

export function download(el, cfg, data) {
    el.setAttribute("href", `data:${cfg.format};charset=utf-8, ${encodeURIComponent(JSON.stringify(data))}`);
    el.setAttribute("download", `${cfg.filename}.${cfg.extension}`);
}

export function displayTooltip(tooltipSelector, clientRect, {offsetX, offsetY}, html) {
    let width = clientRect.width, height = clientRect.height;
    let toTop = !!clientRect.top;
    let toLeft = !!clientRect.left;
    let xPos = toLeft ? clientRect.left: clientRect.right;
    let yPos = toTop ? clientRect.top : clientRect.bottom;

    d3.select(tooltipSelector)
        .style("width", `${width}px`)
        .style("height", `${height}px`)
        .style(toTop ? "top" : "bottom", `${yPos}px`)
        .style(toLeft ? "left" : "right", `${xPos}px`)
        .style('display', 'block')
        .html(html);
}
export function hideTooltip(tooltipSelector) {
    d3.select(tooltipSelector).selectAll("*").remove();
    d3.select(tooltipSelector).style("display", "none");
}