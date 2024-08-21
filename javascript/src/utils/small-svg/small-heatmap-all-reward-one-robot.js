import { SmallHeatMapSVG } from './small-svg.js';
import movementContainer from '../movement-container.js';
import globalVariables from '../global-variables.js';

export default class SmallHeatmaphAllRewardOneRobot extends SmallHeatMapSVG {

    constructor(robotNum, gridNum, offsetWidth) {
        super(gridNum, offsetWidth);
        this.robotNum = robotNum;
        this.originalData = movementContainer.getReward(robotNum);
        this.dataLength = this.originalData.length;
        this.id = 'small-heatmap-robot' + robotNum;

        this.setup();
    }

    setup() {
        this.yLabels = movementContainer.getRewardLabels();
        this.gridHeight = this.height / this.yLabels.length;

        // get min and max values for color scale
        this.minValue = 0;
        const allMin = movementContainer.getMinByRobot(this.robotNum);
        for (const key of this.yLabels) {
            this.minValue = Math.min(this.minValue, allMin[key]);
        }
        this.maxValue = 0;
        const allMax = movementContainer.getMaxByRobot(this.robotNum);
        for (const key of this.yLabels) {
            this.maxValue = Math.max(this.maxValue, allMax[key]);
        }

        this.colorScale = globalVariables.HeatmapColorScaleForALL.domain([
            this.minValue,
            this.maxValue,
        ]);

        this.createHeatmap();

        this.svg.call((g) =>
            g
                .append('text')
                .attr('x', -22)
                .attr('y', -10)
                .attr('text-anchor', 'middle')
                .attr('font-size', 12)
                .text('Robot ' + this.robotNum),
        );
    }

    processData(start, end) {
        const eachGridDataLength = Math.floor((end - start) / this.gridNum);
        const processedData = [];
        start = Math.floor(start);

        this.yLabels.forEach((measurement, i) => {
            for (let j = 0; j < this.gridNum; j++) {
                let sum = 0;
                for (let k = 0; k < eachGridDataLength; k++) {
                    sum += parseFloat(
                        this.originalData[start + j * eachGridDataLength + k][
                            measurement
                        ],
                    );
                }
                const value = sum / eachGridDataLength;
                processedData.push({
                    x: j,
                    y: i,
                    value: value,
                });
            }
        });
        this.all_xLabels = Array.from(
            { length: this.gridNum },
            (_, i) => i * eachGridDataLength,
        );

        return processedData;
    }

}
