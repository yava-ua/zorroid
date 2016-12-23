import * as d3 from 'd3-selection';
import {transition} from 'd3-transition';//needed for transitions
import * as topojson from 'topojson';
import {json} from 'd3-request';
import {geoAlbers, geoPath, geoCentroid} from 'd3-geo';


const GB_COUNTRY_CODE = 'GB';

const TRANSITION_DURATION = 1000;

let tooltip;
let statisticsData;
let currentDataSet = 'day';
let ipsStorage = {};

let dispatcher;

export default function init(container, disp) {
    const viewBoxWidth = 955;
    const viewBoxHeight = 894;

    dispatcher = disp;
    addListeners();

    const widgetContainer = d3.select(container);
    widgetContainer.text('');

    const containerBoundingRectangle = widgetContainer.node().getBoundingClientRect();
    const width = containerBoundingRectangle.width;
    const height = containerBoundingRectangle.height;

    const controlBar = widgetContainer.append('div')
        .classed('control-bar', true);

    const svg = widgetContainer
        .append('svg')
        .attr('viewBox', `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
    // .append('g');

    const projection = geoAlbers()
        .center([0, 55.4])
        .rotate([4.4, 0])
        .parallels([50, 60])
        .scale(4400)
        .translate([width * (viewBoxWidth / width) / 2, height * (viewBoxHeight / height) / 2]);

    const path = geoPath(projection);

    const switchInput = appendSwitch(controlBar);
    switchInput.on('change', () => {
        if (switchInput.node().checked) {
            betsSubscribe(showBet);
        }
        else {
            betsUnsubscribe();
        }
    });

    tooltip = createTooltip(widgetContainer);
    statisticsData = getStatistics();

    json('../json/uk.json', (error, uk) => {
        if (error) {
            console.error(error);
            return;
        }

        //Countries
        const countries = topojson.feature(uk, uk.objects.subunits).features;
        svg.selectAll('.subunit')
            .data(countries)
            .enter().append('path')
            .attr('class', (d) => `subunit ${d.id}`)
            .attr('d', path)
            .on('mouseover', (d) => {
                if (!switchInput.node().checked) {
                    showTooltip(d.id, svg, containerBoundingRectangle);
                }
            })
            .on('mouseout', () => {
                tooltip.style('display', 'none');
            })
        // .on('click', clicked);

        // let active = d3.select(null);
        //
        // function clicked(d) {
        //     if (active.node() === this) return reset();
        //     active.classed("active", false);
        //     active = d3.select(this).classed("active", true);
        //
        //     let lWidth = 955;
        //     let lHeight = 894;
        //
        //     var bounds = path.bounds(d),
        //         dx = bounds[1][0] - bounds[0][0],
        //         dy = bounds[1][1] - bounds[0][1],
        //         x = (bounds[0][0] + bounds[1][0]) / 2,
        //         y = (bounds[0][1] + bounds[1][1]) / 2,
        //         scale = .95 / Math.max(dx / lWidth, dy / lHeight),
        //         translate = [lWidth / 2 - scale * x, lHeight / 2 - scale * y];
        //
        //     svg.transition()
        //         .duration(750)
        //         .style("stroke-width", 1.5 / scale + "px")
        //         .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
        //
        //     d3.selectAll('.place-label')
        //         // .transition()
        //         .style('font-size', 14 / scale);
        // }
        //
        // function reset() {
        //     active.classed("active", false);
        //     active = d3.select(null);
        //
        //     svg.transition()
        //         .duration(750)
        //         .style("stroke-width", "1.5px")
        //         .attr("transform", "");
        // }

        //Borders
        svg.append('path')
            .datum(topojson.mesh(uk, uk.objects.subunits))
            .attr('d', path)
            .attr('class', 'subunit-boundary');

        //Capitals points
        svg.append('path')
            .datum(topojson.feature(uk, uk.objects.places))
            .attr('d', path.pointRadius(2))
            .attr('class', 'place');


        let capitals = topojson.feature(uk, uk.objects.places).features;
        //added specific config for each label for nice placement on the map
        capitals.forEach((capital) => {
            function createConfig(x = 0, y = 0, textAnchor = 'start') {
                return {x: x, y: y, textAnchor: textAnchor};
            }

            const capitalName = capital.properties.name;

            switch (capitalName) {
                case Country.ENGLAND.capital:
                case Country.NORTH_IRELAND.capital:
                    capital.properties.config = createConfig(-6, 4, 'end');
                    break;
                case Country.WALES.capital:
                    capital.properties.config = createConfig(-24, -6);
                    break;
                case Country.SCOTLAND.capital:
                    capital.properties.config = createConfig(-30, 14);
                    break;
            }
        });

        //Capitals labels
        svg.selectAll('.place-label')
            .data(capitals)
            .enter().append('text')
            .attr('class', 'place-label')
            .attr('transform', (d) => `translate(${projection(d.geometry.coordinates)})`)
            .attr('x', (d) => d.properties.config.x)
            .attr('text-anchor', (d) => d.properties.config.textAnchor)
            .attr('y', (d) => d.properties.config.y)
            .text((d) => d.properties.name);
    });

    function showBet(bet) {
        const request = `https://freegeoip.net/json/${bet.ip}`;
        const location = ipsStorage[bet.ip];

        if (!location) {
            json(request, (error, locationJson) => {
                if (error) {
                    console.error(error);
                    return;
                }

                if (locationJson.country_code === GB_COUNTRY_CODE) {
                    showCircle(locationJson.longitude, locationJson.latitude, bet.numOfBets);
                    //for test only
                    ipsStorage[bet.ip] = {longitude: locationJson.longitude, latitude: locationJson.latitude};
                }
            })
        }
        else {
            showCircle(location.longitude, location.latitude, bet.numOfBets);
        }
    }

    function showCircle(longitude, latitude, numberOfBets) {
        const scaleFactor = 5;
        let [cx, cy] = projection([longitude, latitude]);

        svg.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('fill', '#f5402e')
            .attr('stroke', 'transparent')//fix for junk pixels after animation
            .attr('opacity', 0.6)
            .transition()
            .duration(TRANSITION_DURATION)
            .attr('r', 4 + numberOfBets * scaleFactor)
            .transition()
            .duration(TRANSITION_DURATION)
            .attr('opacity', 0)
            .attr('r', 0)
            .remove();
    }
}

function addListeners() {
    dispatcher.on(Event.MAP_PERIOD_CHANGED, periodChangedHandler);
}

function periodChangedHandler(period) {
    currentDataSet = period;
}

function appendSwitch(selection) {
    const inputId = 'inputSwitch';

    const switchDiv = selection.append('div')
        .classed('switch', true);

    const switchInput = switchDiv.append('input')
        .attr('type', 'checkbox')
        .attr('id', inputId)
        .property('checked', false)
        .classed('switch-checkbox', true);

    const switchLabel = switchDiv.append('label')
        .attr('for', inputId)
        .classed('switch-label', true);

    switchLabel.append('span')
        .classed('switch-inner', true);

    switchLabel.append('span')
        .classed('switch-slider', true);

    return switchInput;
}

const tooltipAnchor = {
    [Country.ENGLAND.code]: {x: 578, y: 412},
    [Country.NORTH_IRELAND.code]: {x: 388, y: 456},
    [Country.SCOTLAND.code]: {x: 455, y: 198},
    [Country.WALES.code]: {x: 478, y: 597}
};

function showTooltip(countryCode, svg, containerBoundingRectangle) {
    setTooltipData(countryCode);
    positionTooltip(countryCode, svg.node(), containerBoundingRectangle);
    tooltip.style('display', 'block');
}

function setTooltipData(countryCode) {
    const data = statisticsData[countryCode];
    const periodData = data[currentDataSet];

    tooltip.select('.tooltip-title').text(Country.getNameByCode(countryCode));
    tooltip.select('.tooltip-subtitle').text(`Number of bets per ${currentDataSet}`);
    tooltip.select('.tooltip-bets').text(`${periodData.bets} Bets`);
    tooltip.select('.tooltip-growth')
        .text(`${periodData.growth}%`)
        .classed(periodData.growth > 0 ? 'increase' : 'decrease', true)
        .classed(periodData.growth > 0 ? 'decrease' : 'increase', false);
}

function positionTooltip(countryCode, svg, containerBoundingRectangle) {
    const tailHeight = 10;

    const x = tooltipAnchor[countryCode].x;
    const y = tooltipAnchor[countryCode].y;

    const CTM = svg.getScreenCTM();
    const svgPoint = svg.createSVGPoint();
    svgPoint.x = x;
    svgPoint.y = y;

    const screenCoordinates = svgPoint.matrixTransform(CTM);
    const resultX = screenCoordinates.x - containerBoundingRectangle.left;
    const resultY = screenCoordinates.y - containerBoundingRectangle.top - tailHeight;

    tooltip
        .style('left', `${resultX}px`)
        .style('top', `${resultY}px`);
}

