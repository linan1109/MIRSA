import { SmallHeatMapSVG } from './small-svg.js';
import movementContainer from '../movement-container.js';
import globalVariables from '../global-variables.js';

export default class SmallHeatmapRobotVelo extends SmallHeatMapSVG {

    constructor(robotNum, gridNum, offsetWidth) {
        super(gridNum, offsetWidth);
        this.robotNum = robotNum;
        this.originalData = movementContainer.getVelocity(robotNum);
        this.dataLength = this.originalData.length;
        this.id = 'small-heatmap-robot' + robotNum;

        this.setup();
    }

    setup() {
        this.yLabels = Object.values(globalVariables.nameObsMap);
        this.gridHeight = this.height / this.yLabels.length;
        // get min and max values for color scale
        this.minValue = 0;
        this.maxValue = 0;
        const mins = movementContainer.getMinByRobot(this.robotNum);
        const maxs = movementContainer.getMaxByRobot(this.robotNum);
        for (const obsName of this.yLabels) {
            this.minValue = Math.min(this.minValue, mins[obsName + '_angVel']);
            this.maxValue = Math.max(this.maxValue, maxs[obsName + '_angVel']);
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
