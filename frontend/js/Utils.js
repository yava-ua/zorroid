
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