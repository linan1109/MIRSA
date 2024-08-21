import { SmallHeatMapSVG } from './small-svg.js';
import movementContainer from '../movement-container.js';
import globalVariables from '../global-variables.js';

export default class SmallHeatmapOneRewardAllRobot extends SmallHeatMapSVG {

    constructor(rewardName, gridNum, offsetWidth) {
        super(gridNum, offsetWidth);

        // this.data = movementContainer.getMovement(robotNum);
        // this.dataLength = this.data.length;
        this.dataLength = globalVariables.movementMinLen;
        this.id = 'small-heatmap-obs' + rewardName;
        this.yLabels = movementContainer.robotNums;
        this.rewardName = rewardName;

        this.setup();
    }

    setup() {
        this.gridHeight = this.height / this.yLabels.length;
        if (this.gridHeight > 2 * this.gridWidth) {
            this.gridHeight = this.gridWidth;
            this.height = this.gridHeight * this.yLabels.length;
        }

        // get min and max values for color scale
        this.minValue = 0;
        this.maxValue = 0;
        for (const robotNum of this.yLabels) {
            const mins = movementContainer.getMinByRobot(robotNum);
            const maxs = movementContainer.getMaxByRobot(robotNum);
            this.minValue = Math.min(this.minValue, mins[this.rewardName]);
            this.maxValue = Math.max(this.maxValue, maxs[this.rewardName]);
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
                .text(this.rewardName),
        );
    }

    processData(start, end) {
        const eachGridDataLength = Math.floor((end - start) / this.gridNum);
        const processedData = [];
        start = Math.floor(start);

        for (let i = 0; i < this.yLabels.length; i++) {
            const robotNum = this.yLabels[i];
            const data = movementContainer.getReward(robotNum);
            for (let j = 0; j < this.gridNum; j++) {
                let sum = 0;
                for (let k = 0; k < eachGridDataLength; k++) {
                    sum += parseFloat(
                        data[start + j * eachGridDataLength + k][this.rewardName],
                    );
                }
                const value = sum / eachGridDataLength;
                processedData.push({
                    x: j,
                    y: i,
                    value: value,
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
