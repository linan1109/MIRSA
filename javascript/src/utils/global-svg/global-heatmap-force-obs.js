import { globalHeatMapSVG } from './global-svg.js';
import movementContainer from '../movement-container.js';
import globalVariables from '../global-variables.js';
import * as d3 from 'd3';

export default class GlobalHeatmapForceObs extends globalHeatMapSVG {

    constructor(obsName, gridNum, offsetWidth, offsetHeight) {
        super(gridNum, offsetWidth, offsetHeight);
        this.obsName = obsName;
        this.dataLength = globalVariables.movementMinLen;
        this.yLabels = movementContainer.robotNums.map(
            (robotNum) => 'Robot ' + robotNum,
        );
        this.gridHeight = Math.min(
            this.height / Math.max(this.yLabels.length, 12),
            this.maxGridHeight,
        );
        this.height = this.gridHeight * this.yLabels.length;

        this.initSvg();
        // use max value of data[update] as gridNum
        // this.gridNum = Math.max(...this.data.map((d) => d.update));
        this.id = 'global-heatmap-force-obs' + obsName;
        this.createHeatmap();
    }

    processData() {
        const eachGridDataLength = Math.floor(this.dataLength / this.gridNum);
        const processedData = [];
        const yLabelOrder = {};
        let maxVelocity = 0;
        let minVelocity = 0;

        for (let i = 0; i < this.yLabels.length; i++) {
            const robotNum = parseInt(this.yLabels[i].split(' ')[1]);
            const data = movementContainer.getJointForce(robotNum);
            for (let j = 0; j < this.gridNum; j++) {
                let sum = 0;
                for (let k = 0; k < eachGridDataLength; k++) {
                    const v = parseFloat(
                        data[j * eachGridDataLength + k][this.obsName],
                    );
                    sum += v;
                    maxVelocity = Math.max(maxVelocity, v);
                    minVelocity = Math.min(minVelocity, v);
                }
                const value = sum / eachGridDataLength;
                processedData.push({
                    x: j,
                    y: i,
                    value: value,
                });
            }
            yLabelOrder[this.yLabels[i]] = i;
        }

        this.all_xLabels = Array.from(
            { length: this.gridNum },
            (_, i) => i * eachGridDataLength,
        );
        this.yLabelOrder = yLabelOrder;
        this.minVelocity = minVelocity;
        this.maxVelocity = maxVelocity;
        this.colorScale = globalVariables.HeatmapColorScaleForALL.domain([
            minVelocity,
            maxVelocity,
        ]);
        this.sendChangeEvent();
        return processedData;
    }

    addArcLegend() {
        const arcLegend = d3.range(
            this.minVelocity,
            this.maxVelocity,
            (this.maxVelocity - this.minVelocity) / 61,
        );
        const arclegentWidth = this.maxWidth / arcLegend.length;
        for (let i = 0; i < arcLegend.length; i++) {
            const legend = arcLegend[i];
            const arc = d3.arc().innerRadius(5).outerRadius(10).startAngle(0);

            // add background full circle
            this.svg
                .append('path')
                .datum({ endAngle: 2 * Math.PI })
                .attr('d', arc)
                .attr(
                    'transform',
                    `translate(${ i * arclegentWidth + 15 }, ${ this.height + 15 })`,
                )
                .style('fill', 'lightgray');

            this.svg
                .append('path')
                .datum({ endAngle: legend })
                .attr('d', arc)
                .attr(
                    'transform',
                    `translate(${ i * arclegentWidth + 15 }, ${ this.height + 15 })`,
                )
                .style('fill', this.colorScale(legend));

            this.svg
                .append('text')
                .text(`${ legend.toFixed(1) }`)
                .attr('x', i * arclegentWidth + 15)
                .attr('y', this.height + 35)
                .style('text-anchor', 'middle');
        }
    }

    addRectLegend() {
        const legends = d3.range(
            this.minVelocity,
            this.maxVelocity,
            (this.maxVelocity - this.minVelocity) / 10,
        );
        legends.push(this.maxVelocity);
        for (let i = 0; i < legends.length; i++) {
            legends[i] = legends[i].toFixed(2);
        }
        const legend = this.svg.selectAll('.legend').data(legends);

        const legendEnter = legend.enter().append('g').attr('class', 'legend');
        const legendMargin = 20;
        const heatmapWidth = this.width;
        legendEnter
            .append('rect')
            .attr('x', heatmapWidth + legendMargin) // Position legend to the right of the heatmap
            .attr('y', (d, i) => this.gridHeight * i) // Adjust vertical position based on index
            .attr('width', this.gridWidth * 1.5)
            .attr('height', this.gridHeight / 2)
            .style('fill', (d, i) => this.colorScale(legends[i]));

        legendEnter
            .append('text')
            .attr('class', 'mono')
            .text((d) => ` ${ d }`)
            .attr('x', heatmapWidth + legendMargin + this.gridWidth * 2) // Adjust x to align with the rect's right side
            .attr('y', (d, i) => this.gridHeight * i + this.gridHeight / 2); // Center text vertically within the rect
        legend.exit().remove();
    }

    createHeatmap() {
        this.data = this.processData();
        // const numXLables = Math.floor(this.gridNum / 10);

        // const xLabels = Array.from({ length: numXLables }, (_, i) => i).map(
        //     (d) => Math.floor((d * this.dataLength) / numXLables),
        // );

        // this.svg
        //     .selectAll('.xLabel')
        //     .data(xLabels)
        //     .enter()
        //     .append('text')
        //     .text((d) => d)
        //     .attr('x', (d, i) => i * this.gridWidth * 10)
        //     .attr('y', 0)
        //     .style('text-anchor', 'middle')
        //     .attr('transform', `translate(${ this.gridWidth / 2 }, -6)`)
        //     .attr('class', 'xLabel mono axis');

        this.labelContainer = this.svg
            .append('g')
            .attr('class', 'label-container');
        this.yLabelGroups = this.labelContainer
            .selectAll('.yLabelGroup')
            .data(this.yLabels.map((label, index) => ({ label, index })))
            .enter()
            .append('g')
            .attr('class', 'yLabelGroup')
            .attr(
                'transform',
                (d) => `translate(0, ${ d.index * this.gridHeight })`,
            )
            .call(
                d3
                    .drag()
                    .on('drag', (event, d) => {
                        const newY = Math.min(
                            Math.max(0, d3.pointer(event, this.svg.node())[1]),
                            (this.yLabels.length - 1) * this.gridHeight,
                        );
                        d3.select(event.sourceEvent.target.parentNode).attr(
                            'transform',
                            `translate(0, ${ newY })`,
                        );
                    })
                    .on('end', (event, d) => {
                        const newY = Math.min(
                            Math.max(0, d3.pointer(event, this.svg.node())[1]),
                            (this.yLabels.length - 1) * this.gridHeight,
                        );

                        const newYIndex = Math.floor(newY / this.gridHeight);
                        const selectedLabel = this.yLabels[d.index];
                        // remove the yLabel from the YLabels
                        this.yLabels.splice(d.index, 1);
                        // insert the yLabel to the newYIndex
                        this.yLabels.splice(newYIndex, 0, selectedLabel);
                        this.updateHeatmap();
                    }),
            );

        this.yLabelGroups
            .append('text')
            .text((d) => d.label)
            .attr('x', 0)
            .attr('y', this.gridHeight / 2)
            .style('text-anchor', 'end')
            .attr('transform', `translate(-6, ${ this.gridHeight / 2 })`)
            .attr('class', 'yLabel mono axis');

        this.yLabelGroups.each((d, i, nodes) => {
            const smallHeatmap = this.createSmallHeatmap(d.label, this.data, i);
            d3.select(nodes[i]).node().appendChild(smallHeatmap);
        });

        // this.addArcLegend();
        this.addRectLegend();

        // add brush
        this.addBrush();
        // bind events
        this.bindEvents();
    }

}
