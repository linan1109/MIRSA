import { SmallHeatMapSVG } from './small-svg.js';
import movementContainer from '../movement-container.js';
import globalVariables from '../global-variables.js';

export default class SmallHeatmapObs extends SmallHeatMapSVG {

    constructor(obsName, gridNum, offsetWidth) {
        super(gridNum, offsetWidth);

        // this.data = movementContainer.getMovement(robotNum);
        // this.dataLength = this.data.length;
        this.dataLength = globalVariables.movementMinLen;
        this.id = 'small-heatmap-obs' + obsName;
        this.yLabels = movementContainer.robotNums;
        this.obsName = obsName;

        this.setup();
    }

    setup() {
        this.gridHeight = this.height / this.yLabels.length;
        if (this.gridHeight > 2 * this.gridWidth) {
            this.gridHeight = this.gridWidth;
            this.height = this.gridHeight * this.yLabels.length;
        }

        this.createHeatmap();
        this.svg.call((g) =>
            g
                .append('text')
                .attr('x', -22)
                .attr('y', -10)
                .attr('text-anchor', 'middle')
                .attr('font-size', 12)
                .text(this.obsName),
        );
    }

    processData(start, end) {
        const eachGridDataLength = Math.floor((end - start) / this.gridNum);
        const processedData = [];
        start = Math.floor(start);
        for (let i = 0; i < this.yLabels.length; i++) {
            const robotNum = this.yLabels[i];
            const data = movementContainer.getMovement(robotNum);
            for (let j = 0; j < this.gridNum; j++) {
                let sum = 0;
                for (let k = 0; k < eachGridDataLength; k++) {
                    sum += parseFloat(
                        data[start + j * eachGridDataLength + k][this.obsName],
                    );
                }
                processedData.push({
                    x: j,
                    y: i,
                    value: sum / eachGridDataLength,
                });
            }
        }

        this.all_xLabels = Array.from(
            { length: this.gridNum },
            (_, i) => i * eachGridDataLength,
        );

        return processedData;
    }

}
