import * as d3 from 'd3';
import { GlobalLineChartSVG } from './global-svg.js';
import movementContainer from '../movement-container.js';
import globalTimer from '../global-timer.js';
import globalVariables from '../global-variables.js';

export default class GlobalLineChartRobotVelo extends GlobalLineChartSVG {

    constructor(robotNum, offsetWidth, offsetHeight) {
        super(offsetWidth, offsetHeight);
        this.robotNum = robotNum;
        this.movement = movementContainer.getJointForce(robotNum);
        this.dataLength = this.movement.length;
        this.id = 'global-linechart-robot' + robotNum;
        this.setup();
    }

    processData() {
        this.all_x = d3.range(this.dataLength - 1);
        for (const key in globalVariables.nameObsMap) {
            this.all_y[key] = this.movement.map((d) =>
                parseFloat(d[globalVariables.nameObsMap[key]]),
            );
        }
        const yMin = d3.min(Object.values(this.all_y).flat());
        const yMax = d3.max(Object.values(this.all_y).flat());
        // const yMin = -4;
        // const yMax = 4;

        this.yScale = d3
            .scaleLinear()
            .domain([yMin, yMax])
            .nice()
            .range([this.height, 0]);
        this.xScale = d3
            .scaleLinear()
            .domain(d3.extent(this.all_x))
            .nice()
            .range([0, this.width]);

        this.points = [];
        for (const key in globalVariables.nameObsMap) {
            this.points = this.points.concat(
                this.all_x.map((d, i) => [
                    this.xScale(d),
                    this.yScale(
                        parseFloat(
                            this.movement[d][globalVariables.nameObsMap[key]],
                        ),
                    ),
                    key,
                ]),
            );
        }
        this.sendChangeEvent();
    }

    setup() {
        this.processData();
        this.dot = this.svg.append('g').attr('display', 'none');

        this.dot.append('circle').attr('r', 2.5);

        this.dot.append('text').attr('text-anchor', 'middle').attr('y', -8);

        // add x axis
        // this.svg
        //     .append('g')
        //     .attr('transform', `translate(0,${ this.height })`)
        //     .attr('class', 'xaxis')
        //     .call(
        //         d3
        //             .axisTop(this.xScale)
        //             .ticks(this.width / 80)
        //             .tickSizeOuter(0),
        //     )
        //     .call((g) =>
        //         g
        //             .selectAll('.tick line')
        //             .attr('stroke', 'black')
        //             .attr('stroke-width', 0.5),
        //     )
        //     .call((g) =>
        //         g
        //             .select('.domain')
        //             .attr('stroke', 'black')
        //             .attr('stroke-width', 0.5),
        //     )
        //     .call((g) => g.selectAll('.tick text').attr('fill', 'black'));

        this.groups = d3.rollup(
            this.points,
            (v) => Object.assign(v, { z: v[0][2] }),
            (d) => d[2],
        );
        // add y axis
        this.svg
            .append('g')
            .attr('transform', `translate(0,0)`)
            .attr('class', 'yaxis')
            .call(d3.axisLeft(this.yScale))
            .call((g) => g.select('.domain').remove())
            .call((g) =>
                g
                    .selectAll('.tick line')
                    .attr('stroke', 'black')
                    .attr('stroke-width', 0.5),
            )
            .call((g) =>
                g
                    .selectAll('.tick line')
                    .clone()
                    .attr('x2', this.width)
                    .attr('stroke-opacity', 0.1),
            )
            .call((g) => g.selectAll('.tick text').attr('fill', 'black'));

        // add all lines
        this.path = this.svg
            .append('g')
            .attr('class', 'plotline')
            .attr('fill', 'none')
            .attr('stroke-width', 1.5)
            .selectAll('path')
            .data(this.groups.values())
            .join('path')
            .style('mix-blend-mode', 'multiply')
            .attr(
                'd',
                d3
                    .line()
                    .x((d) => d[0])
                    .y((d) => d[1]),
            );
        // keys in checkedObs are blue, others are grey
        this.path
            .style('stroke', ({ z }) =>
                z === globalVariables.mouseOverObs
                    ? globalVariables.lineColors.mouseOver
                    : globalVariables.checkedObs.includes(z)
                        ? globalVariables.lineColors.checked
                        : z === this.currentObs
                            ? globalVariables.lineColors.selection
                            : globalVariables.lineColors.noSelection,
            )
            .filter(({ z }) => globalVariables.checkedObs.includes(z))
            .raise();
        // add brush
        this.addBrush();
        // bind events
        this.bindEvents();
    }

    updatePlotOnTime() {
        // add the vertical line for current time
        const current = globalTimer.getCurrent();

        if (this.brushedWidth) {
            if (!this.brushLocked) {
                const x0 = current - this.brushedWidth / 2;
                const x1 = current + this.brushedWidth / 2;
                this.brushStart = x0;
                globalVariables.brushStart = x0;
                this.svg
                    .selectAll('.brush')
                    .call(this.brush.move, [
                        (x0 / this.dataLength) * this.width,
                        (x1 / this.dataLength) * this.width,
                    ]);
                this.buttonG.attr(
                    'transform',
                    `translate(${ (x1 / this.dataLength) * this.width - this.buttonWidth }, ${ this.height - this.buttonHeight })`,
                );
            }
        }

        const x = current / this.dataLength;
        this.drawlinebyx(x);
        // update the color of the lines
        this.path
            .style('stroke', ({ z }) =>
                z === globalVariables.mouseOverObs
                    ? globalVariables.lineColors.mouseOver
                    : globalVariables.checkedObs.includes(z)
                        ? globalVariables.lineColors.checked
                        : z === this.currentObs
                            ? globalVariables.lineColors.selection
                            : globalVariables.lineColors.noSelection,
            )
            .filter(({ z }) => globalVariables.checkedObs.includes(z))
            .raise();
    }

}
