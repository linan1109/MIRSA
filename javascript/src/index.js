/* globals */
import * as THREE from 'three';
// import * as d3 from 'd3';
import Papa from 'papaparse';
import { registerDragEvents } from './dragAndDrop.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import URDFManipulator from './urdf-manipulator-element.js';
import globalTimer from './utils/global-timer.js';
import movementContainer from './utils/movement-container.js';
import {
    SmallHeatmapObs,
    SmallHeatmapObsForce,
    SmallHeatmapObsVelo,
    SmallHeatmapRobot,
    SmallHeatmapRobotForce,
    SmallHeatmapRobotVelo,
    SmallLineChartObs,
    SmallLineChartRobot,
} from './utils/small-svg/small-svg-index.js';
// import PositionSVG from './utils/realtime-svg/position-svg.js';
import XYZ3D from './utils/realtime-svg/xyz-3d.js';
import {
    GlobalHeatmapForceObs,
    GlobalHeatmapForceRobot,
    GlobalHeatmapObs,
    GlobalHeatmapRobot,
    GlobalHeatmapVeloRobot,
    GlobalHeatmapVelocityObs,
    GlobalLineChartObs,
    GlobalLineChartRobot,
    GlobalXAxis,
} from './utils/global-svg/global-svg-index.js';
import SnapShotDiv from './utils/snapshot.js';

import animationControl from './utils/animation-control.js';
import globalVariables from './utils/global-variables.js';

import penIco from './assets/pen.ico';

customElements.define('urdf-viewer', URDFManipulator);

// declare these globally for the sake of the example.
// Hack to make the build work with webpack for now.
// TODO: Remove this once modules or parcel is being used
const viewer = document.querySelector('urdf-viewer');
const menuDiv = document.getElementById('menu');
// const limitsToggle = document.getElementById('ignore-joint-limits');
const collisionToggle = document.getElementById('collision-toggle');
const showGridTextureToggle = document.getElementById(
    'show-grid-texture-toggle',
);
const wireframeToggle = document.getElementById('wireframe-toggle');
const snapShotButton = document.getElementById('snap-shot-button');
const snapshotContainer = document.getElementById('snapshot-container');
// const radiansToggle = document.getElementById('radians-toggle');
// const autocenterToggle = document.getElementById('autocenter-toggle');
const upSelect = document.getElementById('up-select');
// const sliderList = document.querySelector('#controls ul');
const controlsel = document.getElementById('controls');
const controlsToggle = document.getElementById('toggle-controls');

const svgContainer = document.getElementById('svg-container');
const plotsControls = document.getElementById('plots-controls');
const togglePlotsControls = document.getElementById('toggle-plots-controls');
const plotsLinkControlsContainer = document.getElementById(
    'plots-link-controls-container',
);
const plotsGroupSelection = document.getElementById('plots-group-selection');
const plotsLinkOptionName = document.getElementById('plots-link-option-name');
const plotsRobotControlsContainer = document.getElementById(
    'plots-robot-controls-container',
);
const plotsRobotOptionName = document.getElementById('plots-robot-option-name');

const robotControlContainer = document.getElementById(
    'robot-control-container',
);
const addRobotButton = document.getElementById('add-robot-button');

const globalHeatmapContainer = document.getElementById(
    'golbal-heatmap-container',
);
const globalXaxisContainer = document.getElementById('global-xaxis-container');
const globalHeatmapSelection = document.getElementById(
    'global-heatmap-selection',
);
const globalPlotSelectionMetric = document.getElementById(
    'global-plot-selection-metric',
);
const globalPlotSelectionGroupBy = document.getElementById(
    'global-plot-selection-groupby',
);
const globalPlotSelectionPlot = document.getElementById(
    'global-plot-selection-plot',
);

const onlyObsSelect = document.getElementById('only-obs-select');
const sliderPlotsPart = document.getElementById('slider-plots-part');
const PlotsPart = document.getElementById('plots-part');
const globalPlotPart = document.getElementById('global-heatmap-part');
const sliderGlbalPlotPart = document.getElementById('slider-global-plots-part');
const TopPart = document.getElementById('top-part');
const positionSvgContainer = document.getElementById('position-svg-container');

const plotsControlsContainer = document.getElementById(
    'plots-controls-container',
);
const svgContainerToggle = document.getElementById('svg-container-toggle');

// const snapshotSvgContainerToggle = document.getElementById(
//     'snapshot-svg-container-toggle',
// );
const svgContainerToggleIcon = document.getElementById(
    'svg-container-toggle-icon',
);
const positionSvgContainerToggle = document.getElementById(
    'position-svg-container-toggle',
);
const positionSvgContainerToggleIcon = document.getElementById(
    'position-svg-container-toggle-icon',
);
const brushLockToggle = document.getElementById('brush-lock-toggle');

const simulationStepInput = document.getElementById(
    'simulation-contorls-step-input',
);
const simulationStepLabel = document.getElementById(
    'simulation-contorls-step-input-label',
);

// const DEG2RAD = Math.PI / 180;
// const RAD2DEG = 1 / DEG2RAD;
let sliders = {};
const svgList = {};
let globalHeatmapSvg = null;
let snapShotDiv = null;
let positionSVG = null;
let globalXAxis = null;

// Global Functions
const setColor = (color) => {
    document.body.style.backgroundColor = color;
    viewer.highlightColor =
        '#' +
        new THREE.Color(0xffffff)
            .lerp(new THREE.Color(color), 0.35)
            .getHexString();
};

// Events

// toggle checkbox
// limitsToggle.addEventListener('click', () => {
//     limitsToggle.classList.toggle('checked');
//     viewer.ignoreLimits = limitsToggle.classList.contains('checked');
// });

// radiansToggle.addEventListener('click', () => {
//     radiansToggle.classList.toggle('checked');
//     Object.values(sliders).forEach((sl) => sl.update());
// });

collisionToggle.addEventListener('click', () => {
    collisionToggle.classList.toggle('checked');
    viewer.showCollision = collisionToggle.classList.contains('checked');
});

showGridTextureToggle.addEventListener('click', () => {
    showGridTextureToggle.classList.toggle('checked');
    viewer.showMeshPlane(showGridTextureToggle.classList.contains('checked'));
});

wireframeToggle.addEventListener('click', () => {
    wireframeToggle.classList.toggle('checked');
    viewer.changeWireframe(wireframeToggle.classList.contains('checked'));
});

brushLockToggle.addEventListener('click', () => {
    brushLockToggle.classList.toggle('checked');
    globalVariables.lockBrush = brushLockToggle.classList.contains('checked');
    if (globalHeatmapSvg !== null) {
        globalHeatmapSvg.setByLockBrush();
    }
});

// autocenterToggle.addEventListener('click', () => {
//     autocenterToggle.classList.toggle('checked');
//     viewer.noAutoRecenter = !autocenterToggle.classList.contains('checked');
// });

togglePlotsControls.addEventListener('click', () => {
    plotsControls.classList.toggle('hidden');
});

snapShotButton.addEventListener('click', () => {
    viewer.snapShot();
});

viewer.addEventListener('snapshot', (e) => {
    const img = e.detail.image;
    if (snapShotDiv === null) {
        snapShotDiv = new SnapShotDiv(
            globalPlotPart.offsetWidth,
            globalPlotPart.offsetHeight,
        );
        snapshotContainer.appendChild(snapShotDiv.div);
    }
    const time = e.detail.timestamp;
    if (globalXAxis) {
        snapShotDiv.addImage(img, time);
        globalXAxis.addOneSnapshot(time);
    }
});

globalHeatmapSelection.addEventListener('change', (e) => {
    // if no option
    if (globalHeatmapSelection.options.length === 0) {
        while (globalHeatmapContainer.firstChild) {
            globalHeatmapContainer.removeChild(
                globalHeatmapContainer.firstChild,
            );
            globalHeatmapSvg = null;
        }
        return;
    }
    changeGlobalPlot(globalHeatmapSelection.value);
});

addRobotButton.addEventListener('click', () => {
    createRobotControls(globalVariables.addedRobotCount);
    viewer.addOneRobot(globalVariables.addedRobotCount, [
        0,
        globalVariables.addedRobotCount,
        0,
    ]);
    globalVariables.addedRobotCount += 1;
});

viewer.addEventListener('joint-mouseover', (event) => {
    globalVariables.mouseOverObs = event.detail;
    if (!globalTimer.isRunning) {
        updateAllSVG();
    }
});

viewer.addEventListener('joint-mouseout', (event) => {
    globalVariables.mouseOverObs = null;
    if (!globalTimer.isRunning) {
        updateAllSVG();
    }
});

document.addEventListener('animationControl', (e) => {
    const checked = e.detail.checked;
    viewer.showTrajectory = checked;
    if (!checked) {
        // redraw the svg
        updateAllSVG();
        // update viewer
        if (e.detail.stop) {
            cancelTrajectory();
        }
        updateAnymal();

        // enable the step input
        simulationStepInput.disabled = false;
    } else {
        simulationStepInput.disabled = true;
    }
});

simulationStepInput.addEventListener('change', () => {
    if (simulationStepInput.disabled) {
        return;
    }
    const step = parseFloat(simulationStepInput.value);
    if (step >= 0 && step <= globalVariables.movementMinLen) {
        globalTimer.setIgnoreFirst(step);
        simulationStepInput.value = step;
        updateAllSVG();
        updateAnymal();
    } else {
        simulationStepInput.value = globalTimer.getCurrent();
    }
});

const cancelTrajectory = () => {
    viewer.cancelTrajectory();
    while (positionSvgContainer.firstChild) {
        positionSvgContainer.removeChild(positionSvgContainer.firstChild);
    }
    positionSVG = null;
};

viewer.addEventListener('trajectory-update', (e) => {
    if (positionSVG === null) {
        while (positionSvgContainer.firstChild) {
            positionSvgContainer.removeChild(positionSvgContainer.firstChild);
        }
        // const svg = new PositionSVG(PlotsPart.offsetWidth);
        // const svgNode = svg.svg.node();
        // positionSVG = svg;
        // positionSvgContainer.appendChild(svgNode);

        const xyz3d = new XYZ3D(PlotsPart.offsetWidth);
        const div = document.createElement('div');
        div.style.width = '100%';
        div.style.marginLeft = '8%';
        div.appendChild(xyz3d.getDomElement());
        positionSvgContainer.appendChild(div);
        positionSVG = xyz3d;

        const button = document.createElement('button');
        button.textContent = 'Clear';
        button.className = 'beautful-button';
        button.style.margin = '5px';
        button.addEventListener('click', () => {
            cancelTrajectory();
        });
        positionSvgContainer.appendChild(button);
    }
    const positionList = e.detail;
    positionSVG.addPosition(globalTimer.getCurrent(), positionList);
});

viewer.addEventListener('joint-click', (e) => {
    if (positionSVG !== null) {
        positionSVG.clear();
    }
});

viewer.addEventListener('axis-click', (e) => {
    if (positionSVG !== null) {
        positionSVG.clickOnSimulatorAxis(e.detail);
    }
});

document.addEventListener('global-map-changed', (e) => {
    updateGlobalXAxis(e.detail.width, e.detail.dataLength);
});

const updateGlobalXAxis = (
    width = globalHeatmapSvg.width,
    length = globalHeatmapSvg.dataLength,
) => {
    if (globalXAxis === null) {
        globalXAxis = new GlobalXAxis(globalXaxisContainer.offsetWidth, 20);
        const svgNode = globalXAxis.svg.node();
        globalXaxisContainer.appendChild(svgNode);
    }
    globalXAxis.updateSetup(width, length);
};

// hiders
svgContainerToggle.addEventListener('click', () => {
    svgContainer.classList.toggle('hidden');
    plotsControlsContainer.classList.toggle('hidden');

    if (svgContainer.classList.contains('hidden')) {
        svgContainerToggleIcon.classList.remove('fa-minus');
        svgContainerToggleIcon.classList.add('fa-plus');
    } else {
        svgContainerToggleIcon.classList.remove('fa-plus');
        svgContainerToggleIcon.classList.add('fa-minus');
    }
});

// snapshotSvgContainerToggle.addEventListener('click', () => {
//     snapshotContainer.classList.toggle('hidden');
//     if (snapshotContainer.classList.contains('hidden')) {
//         snapshotSvgContainerToggle.textContent = 'Show Snapshots';
//     } else {
//         snapshotSvgContainerToggle.textContent = 'Hide Snapshots';
//     }
// });

positionSvgContainerToggle.addEventListener('click', () => {
    positionSvgContainer.classList.toggle('hidden');
    if (positionSvgContainer.classList.contains('hidden')) {
        positionSvgContainerToggleIcon.classList.remove('fa-minus');
        positionSvgContainerToggleIcon.classList.add('fa-plus');
    } else {
        positionSvgContainerToggleIcon.classList.remove('fa-plus');
        positionSvgContainerToggleIcon.classList.add('fa-minus');
    }
});
// end of hiders

function createRobotControls(robotNumber) {
    // Create a container div
    const container = document.createElement('div');
    container.id = `input-container-${ robotNumber }`;
    container.className = 'input-container';

    // Create the inner HTML
    container.innerHTML = `
    <div class="title-name">
        Robot ${ robotNumber }
    </div>
    <div id="robot${ robotNumber }-controls" class="robot-controls hidden">
        <div id="robot${ robotNumber }-toggle-controls" class="toggle-robot-controls"></div>
        <div>
            <label for="load-movement${ robotNumber }"  class="beautiful-label">
                Load Movement
            </label>
            <input type="file" id="load-movement${ robotNumber }" class="load-movement-input" accept=".csv"/> 
        </div>    
        <button id="robot${ robotNumber }-delete" class="beautful-button">Delete</button>
        <div id="robot${ robotNumber }-visible" class="toggle checked robot-control">Visible</div>
        <div id="robot${ robotNumber }-highlight" class="toggle robot-control">Highlight</div>
        <div id="robot${ robotNumber }-position" class="toggle robot-control">Update Pos.</div>
        <div class="init-position">
            Init Pos. (
            <input id="robot${ robotNumber }-positionx" type="number" class="position-input" value="0" step="0.1"/>, 
            <input id="robot${ robotNumber }-positiony" type="number" class="position-input" value="${ robotNumber }" step="0.1"/>, 
            <input id="robot${ robotNumber }-positionz" type="number" class="position-input" value="0" step="0.1"/>
            )
        </div>
        <div id="robot${ robotNumber }-file-name" style="font-size:12px;padding-top: 2px;"> </div>
    </div>
    `;

    robotControlContainer.appendChild(container);
    // disable some controls before urdf is loaded
    animationControl.uncheck();
    addRobotButton.disabled = true;

    // one time event listener
    viewer.addEventListener('urdf-processed', function handler(event) {
        addListenerToNewRobot(robotNumber);
        for (const rbtnum of viewer.robotNames) {
            initRobotControlState(rbtnum);
        }
        addRobotButton.disabled = false;
        updateAnymal();
        // remove the event listener
        viewer.removeEventListener('urdf-processed', handler);
    });
}

const addNewRobotOptionToGlobalHeatmapSelection = (robotNum) => {
    // if already exists, return
    if (globalHeatmapSelection.querySelector(`option[value='${ robotNum }']`)) {
        return;
    }
    const option = document.createElement('option');
    option.value = robotNum;
    option.textContent = `Robot ${ robotNum }`;
    globalHeatmapSelection.appendChild(option);
};

const addNewObsOptionToGlobalHeatmapSelection = (obsName) => {
    // if already exists, return
    if (globalHeatmapSelection.querySelector(`option[value='${ obsName }']`)) {
        return;
    }
    const option = document.createElement('option');
    option.value = obsName;
    option.textContent = obsName;
    globalHeatmapSelection.appendChild(option);
};

const initRobotControlState = (robotNumber) => {
    const toggleVisibility = document.getElementById(
        `robot${ robotNumber }-visible`,
    );
    const toggleHightlight = document.getElementById(
        `robot${ robotNumber }-highlight`,
    );
    const toggleMovement = document.getElementById(
        `robot${ robotNumber }-position`,
    );

    const visibility = toggleVisibility.classList.contains('checked');
    viewer.setRobotVisibility(robotNumber, visibility);
    const highlight = toggleHightlight.classList.contains('checked');
    viewer.setRobotHighlight(robotNumber, highlight);
    const standStill = !toggleMovement.classList.contains('checked');
    viewer.setRobotStandStill(robotNumber, standStill);
};

const addListenerToNewRobot = (robotNumber) => {
    const robotControlsToggle = document.getElementById(
        `robot${ robotNumber }-toggle-controls`,
    );
    const robotControls = document.getElementById(
        `robot${ robotNumber }-controls`,
    );
    const toggleVisibility = document.getElementById(
        `robot${ robotNumber }-visible`,
    );
    const toggleHightlight = document.getElementById(
        `robot${ robotNumber }-highlight`,
    );
    const toggleMovement = document.getElementById(
        `robot${ robotNumber }-position`,
    );
    const loadMovement = document.getElementById(`load-movement${ robotNumber }`);
    const initialPosition = {
        x: document.getElementById(`robot${ robotNumber }-positionx`),
        y: document.getElementById(`robot${ robotNumber }-positiony`),
        z: document.getElementById(`robot${ robotNumber }-positionz`),
    };
    const deleteButton = document.getElementById(`robot${ robotNumber }-delete`);

    robotControlsToggle.addEventListener('click', () => {
        robotControls.classList.toggle('hidden');
    });
    loadMovement.addEventListener('change', () =>
        loadMovementFromCSV(robotNumber),
    );
    toggleVisibility.addEventListener('click', () => {
        toggleVisibility.classList.toggle('checked');
        if (toggleVisibility.classList.contains('checked')) {
            viewer.setRobotVisibility(robotNumber, true);
        } else {
            viewer.setRobotVisibility(robotNumber, false);
        }
    });

    toggleHightlight.addEventListener('click', () => {
        toggleHightlight.classList.toggle('checked');
        if (toggleHightlight.classList.contains('checked')) {
            viewer.setRobotHighlight(robotNumber, true);
        } else {
            viewer.setRobotHighlight(robotNumber, false);
        }
    });
    toggleMovement.addEventListener('click', () => {
        toggleMovement.classList.toggle('checked');
        if (toggleMovement.classList.contains('checked')) {
            viewer.setRobotStandStill(robotNumber, false);
        } else {
            viewer.setRobotStandStill(robotNumber, true);
        }
    });

    deleteButton.addEventListener('click', () => {
        // remove the movement data
        movementContainer.removeMovement(robotNumber);

        // remove from viewer
        viewer.deleteOne(robotNumber);
        const container = document.getElementById(
            'input-container-' + robotNumber,
        );
        container.remove();

        // remove from checkedRobots
        const index = globalVariables.checkedRobots.indexOf(robotNumber);
        if (index > -1) {
            globalVariables.checkedRobots.splice(index, 1);
        }

        // For the global heatmap
        // remove from global heatmap selection
        const option = document.querySelector(
            `#global-heatmap-selection option[value='${ robotNumber }']`,
        );
        if (option) {
            option.remove();
        }

        // reset global heatmap selection
        if (globalHeatmapSelection.options.length === 0) {
            while (globalHeatmapContainer.firstChild) {
                globalHeatmapContainer.removeChild(
                    globalHeatmapContainer.firstChild,
                );
                globalHeatmapSvg = null;
            }
        } else {
            const selectedOption = globalHeatmapSelection.options[0];
            globalHeatmapSelection.value = selectedOption.value;
            // changeGlobalPlot(selectedOption.value);
        }

        // For right plot part
        // remove from svg container
        removeRobotSelectToggles(robotNumber);
        // remove from svgList
        delete svgList[robotNumber];
        plotsSVGRedraw();
        globalHeatmapRedraw();
    });

    Object.values(initialPosition).forEach((input, index) => {
        // init values
        input.value = viewer.getRobotInitPosition(robotNumber, index);
        input.addEventListener('change', () => {
            const position = parseFloat(input.value);
            viewer.setRobotInitPosition(robotNumber, index, position);
        });
    });
};

// slider part
const plotsPartOnPointMove = (e) => {
    if (e.isPrimary) {
        const sliderPos = e.clientX;
        const newWidth = window.innerWidth - sliderPos;
        const newWidthPercent = Math.max(
            Math.min((newWidth / window.innerWidth) * 100, 100),
            0,
        );
        PlotsPart.style.width = newWidthPercent + '%';
        viewer.style.width = 100 - newWidthPercent + '%';
        menuDiv.style.width = 100 - newWidthPercent + '%';
    }
};

sliderPlotsPart.addEventListener('pointerdown', (e) => {
    window.addEventListener('pointermove', plotsPartOnPointMove);
});

sliderPlotsPart.addEventListener('pointerup', (e) => {
    window.removeEventListener('pointermove', plotsPartOnPointMove);
    plotsSVGRedraw();
    // resize the position svg
    if (positionSVG !== null) {
        positionSVG.resize(PlotsPart.offsetWidth);
    }
});

const globalPlotPartOnPointMove = (e) => {
    if (e.isPrimary) {
        const sliderPos = e.clientY;
        const newHeight = window.innerHeight - sliderPos;
        const newHeightPercent = Math.max(
            Math.min((newHeight / window.innerHeight) * 100, 100),
            0,
        );
        globalPlotPart.style.height = newHeightPercent + '%';
        TopPart.style.height = 100 - newHeightPercent + '%';
        if (snapShotDiv) {
            snapShotDiv.resize(globalPlotPart.offsetWidth, newHeight);
        }
    }
};

sliderGlbalPlotPart.addEventListener('pointerdown', (e) => {
    window.addEventListener('pointermove', globalPlotPartOnPointMove);
});

sliderGlbalPlotPart.addEventListener('pointerup', (e) => {
    window.removeEventListener('pointermove', globalPlotPartOnPointMove);
    globalHeatmapRedraw();
});

// end of slider part

const addObsSelectToggles = () => {
    // ADD right bar selection
    while (plotsLinkControlsContainer.firstChild) {
        plotsLinkControlsContainer.removeChild(
            plotsLinkControlsContainer.firstChild,
        );
    }

    for (const key in globalVariables.nameObsMap) {
        // create toggle button
        const toggle = document.createElement('div');
        toggle.className = 'toggle';
        toggle.innerHTML = key;
        toggle.textContent = key;
        toggle.addEventListener('click', () => {
            if (toggle.classList.contains('checked')) {
                toggle.classList.remove('checked');
                // remove from checkedObs
                const index = globalVariables.checkedObs.indexOf(key);
                if (index > -1) {
                    globalVariables.checkedObs.splice(index, 1);
                    updateAllSVG();
                }
                if (svgList[key] !== undefined) {
                    svgList[key].svg.remove();
                }
            } else {
                toggle.classList.add('checked');
                globalVariables.checkedObs.push(key);
                plotsSVGRedraw();
                globalHeatmapRedraw();
            }
        });
        plotsLinkControlsContainer.appendChild(toggle);
    }
};

const addRobotSelectToggles = (robotNum) => {
    const toggle = document.createElement('div');
    toggle.id = 'plot-svg-toggle-robot' + robotNum;
    toggle.className = 'toggle';
    toggle.classList.add('checked');
    toggle.innerHTML = 'Robot ' + robotNum;
    toggle.textContent = 'Robot ' + robotNum;
    toggle.addEventListener('click', () => {
        if (toggle.classList.contains('checked')) {
            toggle.classList.remove('checked');
            // remove from checkedRobots
            const index = globalVariables.checkedRobots.indexOf(robotNum);
            if (index > -1) {
                globalVariables.checkedRobots.splice(index, 1);
                updateAllSVG();
            }
            if (svgList[robotNum] !== undefined) {
                svgList[robotNum].svg.remove();
            }
        } else {
            toggle.classList.add('checked');
            globalVariables.checkedRobots.push(robotNum);
            plotsSVGRedraw();
            globalHeatmapRedraw();
        }
    });

    plotsRobotControlsContainer.appendChild(toggle);
};

const removeRobotSelectToggles = (robotNum) => {
    const toggle = document.getElementById('plot-svg-toggle-robot' + robotNum);
    toggle.remove();
};

const loadMovementFromCSV = (robotNum) => {
    const fileInput = document.getElementById('load-movement' + robotNum);
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = e.target.result;
        const movement = Papa.parse(data, { header: true }).data;
        // remove last empty row
        movement.pop();
        const movementLength = movement.length;
        globalVariables.movementIndexStart = 0;

        console.log('Loaded movement data');
        console.log('Length:' + movementLength);
        console.log('Start index:' + globalVariables.movementIndexStart);

        // use the first movement as offset, decuct the offset from all the movements

        console.log('Offset:');
        console.log(movement[0]);
        if (globalVariables.useOffset) {
            const offset = movement[0];
            console.log('Offset:');
            console.log(offset);
            for (let i = 0; i < movementLength; i++) {
                for (const key in movement[i]) {
                    movement[i][key] -= offset[key];
                }
            }
        }

        if (movementContainer.hasMovement(robotNum)) {
            movementContainer.removeMovement(robotNum);
        }
        movementContainer.addMovement(robotNum, movement);

        globalVariables.movementMinLen = movementLength;
        for (const key in movementContainer.movementDict) {
            globalVariables.movementMinLen = Math.min(
                globalVariables.movementMinLen,
                movementContainer.movementDict[key].length,
            );
        }
        simulationStepLabel.textContent = `/ ${ globalVariables.movementMinLen }`;
        simulationStepInput.max = globalVariables.movementMinLen;
        if (!globalVariables.checkedRobots.includes(robotNum)) {
            globalVariables.checkedRobots.push(robotNum);
        }

        while (plotsRobotControlsContainer.firstChild) {
            plotsRobotControlsContainer.removeChild(
                plotsRobotControlsContainer.firstChild,
            );
        }

        for (const rbtnum of movementContainer.robotNums) {
            addRobotSelectToggles(rbtnum);
        }

        if (plotsLinkControlsContainer.childElementCount === 0) {
            if (globalVariables.groupByRobot === true) {
                plotsLinkOptionName.textContent = 'Highlight Options:';
                plotsRobotOptionName.textContent = 'Plot Robots:';
            }
            addObsSelectToggles();
        }

        // add new robot option to global heatmap selection
        if (
            globalPlotSelectionGroupBy.value === 'Robot'
        ) {
            addNewRobotOptionToGlobalHeatmapSelection(robotNum);
        }

        // update the svg
        plotsSVGRedraw();
        globalHeatmapRedraw();

        updateAnymal();

        const fileName = file.name;
        const fileNameDiv = document.getElementById(
            'robot' + robotNum + '-file-name',
        );
        fileNameDiv.textContent = fileName;
    };
    reader.readAsText(file);
};

const addRobotSVG = (robotNum) => {
    if (svgList[robotNum] !== undefined) {
        svgList[robotNum].svg.remove();
    }
    // const movement = movementContainer.movementDict[robotNum];
    const svg = new SmallLineChartRobot(robotNum, PlotsPart.offsetWidth);
    const svgNode = svg.svg.node();
    svgNode.id = 'plot-all' + robotNum;
    svgContainer.appendChild(svgNode);
    svgList[robotNum] = svg;
    svg.updatePlotOnTime();
};

const addHeatMapRobotSVG = (robotNum) => {
    if (svgList[robotNum] !== undefined) {
        svgList[robotNum].svg.remove();
    }
    const svg = new SmallHeatmapRobot(
        robotNum,
        globalVariables.smallHeatMapGridNum,
        PlotsPart.offsetWidth,
    );
    const svgNode = svg.svg.node();
    svgNode.id = 'heatmap-' + robotNum;
    svgContainer.appendChild(svgNode);
    svgList[robotNum] = svg;
    svg.updatePlotOnTime();
};
const addHeatMapRobotVeloSVG = (robotNum) => {
    if (svgList[robotNum] !== undefined) {
        svgList[robotNum].svg.remove();
    }
    const svg = new SmallHeatmapRobotVelo(
        robotNum,
        globalVariables.smallHeatMapGridNum,
        PlotsPart.offsetWidth,
    );
    const svgNode = svg.svg.node();
    svgNode.id = 'heatmap-' + robotNum;
    svgContainer.appendChild(svgNode);
    svgList[robotNum] = svg;
    svg.updatePlotOnTime();
};
const addHeatMapRobotForceSVG = (robotNum) => {
    if (svgList[robotNum] !== undefined) {
        svgList[robotNum].svg.remove();
    }
    const svg = new SmallHeatmapRobotForce(
        robotNum,
        globalVariables.smallHeatMapGridNum,
        PlotsPart.offsetWidth,
    );
    const svgNode = svg.svg.node();
    svgNode.id = 'heatmap-' + robotNum;
    svgContainer.appendChild(svgNode);
    svgList[robotNum] = svg;
    svg.updatePlotOnTime();
};
const changeGlobalPlotToHeatmapRobot = (robotNum) => {
    while (globalHeatmapContainer.firstChild) {
        globalHeatmapContainer.removeChild(globalHeatmapContainer.firstChild);
        globalHeatmapSvg = null;
    }

    const svg = new GlobalHeatmapRobot(
        robotNum,
        globalVariables.globalHeatMapGridNum,
        globalPlotPart.offsetWidth,
        globalPlotPart.offsetHeight,
    );
    const svgNode = svg.svg.node();
    globalHeatmapSvg = svg;
    globalHeatmapContainer.appendChild(svgNode);
};

const changeGlobalPlotToHeatmapVeloRobot = (robotNum) => {
    while (globalHeatmapContainer.firstChild) {
        globalHeatmapContainer.removeChild(globalHeatmapContainer.firstChild);
        globalHeatmapSvg = null;
    }

    const svg = new GlobalHeatmapVeloRobot(
        robotNum,
        globalVariables.globalHeatMapGridNum,
        globalPlotPart.offsetWidth,
        globalPlotPart.offsetHeight,
    );
    const svgNode = svg.svg.node();
    globalHeatmapSvg = svg;
    globalHeatmapContainer.appendChild(svgNode);
};

const changeGlobalPlotToLineRobot = (robotNum) => {
    while (globalHeatmapContainer.firstChild) {
        globalHeatmapContainer.removeChild(globalHeatmapContainer.firstChild);
        globalHeatmapSvg = null;
    }
    const svg = new GlobalLineChartRobot(
        robotNum,
        globalPlotPart.offsetWidth,
        globalPlotPart.offsetHeight,
    );
    const svgNode = svg.svg.node();
    globalHeatmapSvg = svg;
    globalHeatmapContainer.appendChild(svgNode);
};

const changeGlobalPlotToHeatmapObs = (obsName) => {
    while (globalHeatmapContainer.firstChild) {
        globalHeatmapContainer.removeChild(globalHeatmapContainer.firstChild);
        globalHeatmapSvg = null;
    }
    const svg = new GlobalHeatmapObs(
        obsName,
        globalVariables.globalHeatMapGridNum,
        globalPlotPart.offsetWidth,
        globalPlotPart.offsetHeight,
    );
    const svgNode = svg.svg.node();
    globalHeatmapSvg = svg;
    globalHeatmapContainer.appendChild(svgNode);
};

const changeGlobalPlotToHeatmapVeloObs = (obsName) => {
    while (globalHeatmapContainer.firstChild) {
        globalHeatmapContainer.removeChild(globalHeatmapContainer.firstChild);
        globalHeatmapSvg = null;
    }
    const svg = new GlobalHeatmapVelocityObs(
        obsName,
        globalVariables.globalHeatMapGridNum,
        globalPlotPart.offsetWidth,
        globalPlotPart.offsetHeight,
    );
    const svgNode = svg.svg.node();
    globalHeatmapSvg = svg;
    globalHeatmapContainer.appendChild(svgNode);
};

const changeGlobalPlotToLineObs = (obsName) => {
    while (globalHeatmapContainer.firstChild) {
        globalHeatmapContainer.removeChild(globalHeatmapContainer.firstChild);
        globalHeatmapSvg = null;
    }
    const svg = new GlobalLineChartObs(
        obsName,
        globalPlotPart.offsetWidth,
        globalPlotPart.offsetHeight,
    );
    const svgNode = svg.svg.node();
    globalHeatmapSvg = svg;
    globalHeatmapContainer.appendChild(svgNode);
};

const changeGlobalPlotToHeatmapForceRobot = (robotNum) => {
    while (globalHeatmapContainer.firstChild) {
        globalHeatmapContainer.removeChild(globalHeatmapContainer.firstChild);
        globalHeatmapSvg = null;
    }
    const svg = new GlobalHeatmapForceRobot(
        robotNum,
        globalVariables.globalHeatMapGridNum,
        globalPlotPart.offsetWidth,
        globalPlotPart.offsetHeight,
    );
    const svgNode = svg.svg.node();
    globalHeatmapSvg = svg;
    globalHeatmapContainer.appendChild(svgNode);
};

const changeGlobalPlotToHeatmapForceObs = (obsName) => {
    while (globalHeatmapContainer.firstChild) {
        globalHeatmapContainer.removeChild(globalHeatmapContainer.firstChild);
        globalHeatmapSvg = null;
    }
    const svg = new GlobalHeatmapForceObs(
        obsName,
        globalVariables.globalHeatMapGridNum,
        globalPlotPart.offsetWidth,
        globalPlotPart.offsetHeight,
    );
    const svgNode = svg.svg.node();
    globalHeatmapSvg = svg;
    globalHeatmapContainer.appendChild(svgNode);
};

const changeGlobalPlot = (num, type = null) => {
    if (type === null) {
        type =
            globalPlotSelectionPlot.value +
            globalPlotSelectionGroupBy.value +
            globalPlotSelectionMetric.value;
    }
    console.log(type);
    if (type === 'Heat MapRobotJoint Position') {
        changeGlobalPlotToHeatmapRobot(num);
    } else if (type === 'Line ChartRobotJoint Position') {
        changeGlobalPlotToLineRobot(num);
    } else if (type === 'Heat MapJointJoint Position') {
        changeGlobalPlotToHeatmapObs(num);
    } else if (type === 'Line ChartJointJoint Position') {
        changeGlobalPlotToLineObs(num);
    } else if (type === 'Heat MapRobotJoint Velocity') {
        changeGlobalPlotToHeatmapVeloRobot(num);
    } else if (type === 'Heat MapJointJoint Velocity') {
        changeGlobalPlotToHeatmapVeloObs(num);
    } else if (type === 'Heat MapRobotJoint Torque') {
        changeGlobalPlotToHeatmapForceRobot(num);
    } else if (type === 'Heat MapJointJoint Torque') {
        changeGlobalPlotToHeatmapForceObs(num);
    }
};

const addObsSVG = (obsName) => {
    if (svgList[obsName] !== undefined) {
        svgList[obsName].svg.remove();
    }
    const svg = new SmallLineChartObs(obsName, PlotsPart.offsetWidth);
    const svgNode = svg.svg.node();
    svgNode.id = 'plot-all' + obsName;
    svgContainer.appendChild(svgNode);
    svgList[obsName] = svg;
    svg.updatePlotOnTime();
};

const addHeatMapObsSVG = (obsName) => {
    if (svgList[obsName] !== undefined) {
        svgList[obsName].svg.remove();
    }
    const svg = new SmallHeatmapObs(
        obsName,
        globalVariables.smallHeatMapGridNum,
        PlotsPart.offsetWidth,
    );
    const svgNode = svg.svg.node();
    svgNode.id = 'heatmap-' + obsName;
    svgContainer.appendChild(svgNode);
    svgList[obsName] = svg;
    svg.updatePlotOnTime();
};

const addHeatMapVeloObsSVG = (obsName) => {
    if (svgList[obsName] !== undefined) {
        svgList[obsName].svg.remove();
    }
    const svg = new SmallHeatmapObsVelo(
        obsName,
        globalVariables.smallHeatMapGridNum,
        PlotsPart.offsetWidth,
    );
    const svgNode = svg.svg.node();
    svgNode.id = 'heatmap-' + obsName;
    svgContainer.appendChild(svgNode);
    svgList[obsName] = svg;
    svg.updatePlotOnTime();
};

const addHeatMapObsForceSVG = (obsName) => {
    if (svgList[obsName] !== undefined) {
        svgList[obsName].svg.remove();
    }
    const svg = new SmallHeatmapObsForce(
        obsName,
        globalVariables.smallHeatMapGridNum,
        PlotsPart.offsetWidth,
    );
    const svgNode = svg.svg.node();
    svgNode.id = 'heatmap-' + obsName;
    svgContainer.appendChild(svgNode);
    svgList[obsName] = svg;
    svg.updatePlotOnTime();
};

const updateAllSVG = () => {
    for (const key in svgList) {
        const svg = svgList[key];
        svg.updatePlotOnTime();
    }
    if (globalHeatmapSvg !== null) {
        globalHeatmapSvg.updatePlotOnTime();
    } else {
        if (globalHeatmapSelection.options.length > 0) {
            const firstOption = globalHeatmapSelection.options[0];
            globalHeatmapSelection.value = firstOption.value;
            changeGlobalPlot(firstOption.value);
        }
    }
    if (positionSVG !== null) {
        positionSVG.updatePlotOnTime();
    }
    // if (snapShotDiv !== null) {
    //     snapShotDiv.updatePlotOnTime();
    // }
};

document.addEventListener('global-map-brushed', (e) => {
    // const { start, end } = e.detail;
    for (const key in svgList) {
        const svg = svgList[key];
        svg.updateWindowSize(globalVariables.rightSvgWindowSize);
        svg.updatePlotOnTime();
    }
    // if (snapShotDiv !== null) {
    //     snapShotDiv.updateWindowSize(globalVariables.rightSvgWindowSize);
    //     snapShotDiv.updatePlotOnTime();
    // }
});

upSelect.addEventListener('change', () => (viewer.up = upSelect.value));

const plotsSVGRedraw = () => {
    while (svgContainer.firstChild) {
        svgContainer.removeChild(svgContainer.firstChild);
    }
    if (plotsGroupSelection.value === 'LineRobot') {
        plotsLinkOptionName.textContent = 'Highlight Options:';
        plotsRobotOptionName.textContent = 'Plot Robots:';
        plotsLinkOptionName.hidden = false;
        plotsRobotOptionName.hidden = false;
        plotsRobotControlsContainer.hidden = false;
        plotsLinkControlsContainer.hidden = false;
        for (const child of plotsRobotControlsContainer.children) {
            child.hidden = false;
        }
        for (const child of plotsLinkControlsContainer.children) {
            child.hidden = false;
        }
        globalVariables.groupByRobot = true;
        for (const key in globalVariables.checkedRobots) {
            addRobotSVG(globalVariables.checkedRobots[key]);
        }
    } else if (plotsGroupSelection.value === 'LineLink') {
        plotsLinkOptionName.textContent = 'Plot Joints:';
        plotsRobotOptionName.textContent = 'Highlight Robots:';

        plotsLinkOptionName.hidden = false;
        plotsRobotOptionName.hidden = false;
        plotsRobotControlsContainer.hidden = false;
        plotsLinkControlsContainer.hidden = false;
        for (const child of plotsRobotControlsContainer.children) {
            child.hidden = false;
        }
        for (const child of plotsLinkControlsContainer.children) {
            child.hidden = false;
        }

        globalVariables.groupByRobot = false;
        for (const key in globalVariables.checkedObs) {
            addObsSVG(globalVariables.checkedObs[key]);
        }
    } else if (plotsGroupSelection.value === 'HeatMapRobot') {
        plotsRobotOptionName.textContent = 'Plot Robots:';
        plotsLinkOptionName.hidden = true;
        plotsRobotOptionName.hidden = false;
        plotsRobotControlsContainer.hidden = false;
        plotsLinkControlsContainer.hidden = true;
        for (const child of plotsRobotControlsContainer.children) {
            child.hidden = false;
        }
        for (const child of plotsLinkControlsContainer.children) {
            child.hidden = true;
        }
        globalVariables.groupByRobot = true;
        for (const key in globalVariables.checkedRobots) {
            addHeatMapRobotSVG(globalVariables.checkedRobots[key]);
        }
    } else if (plotsGroupSelection.value === 'HeatMapLink') {
        plotsLinkOptionName.textContent = 'Plot Joints:';
        globalVariables.groupByRobot = false;
        plotsLinkOptionName.hidden = false;
        plotsRobotOptionName.hidden = true;
        plotsRobotControlsContainer.hidden = true;
        plotsLinkControlsContainer.hidden = false;
        for (const child of plotsRobotControlsContainer.children) {
            child.hidden = true;
        }
        for (const child of plotsLinkControlsContainer.children) {
            child.hidden = false;
        }
        for (const key in globalVariables.checkedObs) {
            addHeatMapObsSVG(globalVariables.checkedObs[key]);
        }
    } else if (plotsGroupSelection.value === 'HeatMapVeloRobot') {
        plotsRobotOptionName.textContent = 'Plot Robots:';
        plotsLinkOptionName.hidden = true;
        plotsRobotOptionName.hidden = false;
        plotsRobotControlsContainer.hidden = false;
        plotsLinkControlsContainer.hidden = true;
        for (const child of plotsRobotControlsContainer.children) {
            child.hidden = false;
        }
        for (const child of plotsLinkControlsContainer.children) {
            child.hidden = true;
        }
        globalVariables.groupByRobot = true;
        for (const key in globalVariables.checkedRobots) {
            addHeatMapRobotVeloSVG(globalVariables.checkedRobots[key]);
        }
    } else if (plotsGroupSelection.value === 'HeatMapVeloLink') {
        plotsLinkOptionName.textContent = 'Plot Joints:';
        globalVariables.groupByRobot = false;
        plotsLinkOptionName.hidden = false;
        plotsRobotOptionName.hidden = true;
        plotsRobotControlsContainer.hidden = true;
        plotsLinkControlsContainer.hidden = false;
        for (const child of plotsRobotControlsContainer.children) {
            child.hidden = true;
        }
        for (const child of plotsLinkControlsContainer.children) {
            child.hidden = false;
        }
        for (const key in globalVariables.checkedObs) {
            addHeatMapVeloObsSVG(globalVariables.checkedObs[key]);
        }
    } else if (plotsGroupSelection.value === 'HeatMapForceRobot') {
        plotsRobotOptionName.textContent = 'Plot Robots:';
        plotsLinkOptionName.hidden = true;
        plotsRobotOptionName.hidden = false;
        plotsRobotControlsContainer.hidden = false;
        plotsLinkControlsContainer.hidden = true;
        for (const child of plotsRobotControlsContainer.children) {
            child.hidden = false;
        }
        for (const child of plotsLinkControlsContainer.children) {
            child.hidden = true;
        }
        globalVariables.groupByRobot = true;
        for (const key in globalVariables.checkedRobots) {
            addHeatMapRobotForceSVG(globalVariables.checkedRobots[key]);
        }
    } else if (plotsGroupSelection.value === 'HeatMapForceLink') {
        plotsLinkOptionName.textContent = 'Plot Joints:';
        globalVariables.groupByRobot = false;
        plotsLinkOptionName.hidden = false;
        plotsRobotOptionName.hidden = true;
        plotsRobotControlsContainer.hidden = true;
        plotsLinkControlsContainer.hidden = false;
        for (const child of plotsRobotControlsContainer.children) {
            child.hidden = true;
        }
        for (const child of plotsLinkControlsContainer.children) {
            child.hidden = false;
        }
        for (const key in globalVariables.checkedObs) {
            addHeatMapObsForceSVG(globalVariables.checkedObs[key]);
        }
    }
};

const globalHeatmapRedraw = () => {
    if (movementContainer.hasAnyMovement() === false) {
        return;
    }
    while (globalHeatmapSelection.firstChild) {
        globalHeatmapSelection.removeChild(globalHeatmapSelection.firstChild);
    }
    const option =
        globalPlotSelectionPlot.value +
        globalPlotSelectionGroupBy.value +
        globalPlotSelectionMetric.value;

    if (globalPlotSelectionGroupBy.value === 'Robot') {
        // add options for robots
        for (const key in movementContainer.movementDict) {
            addNewRobotOptionToGlobalHeatmapSelection(key);
        }
        const firstOption = globalHeatmapSelection.options[0];
        globalHeatmapSelection.value = firstOption.value;
    } else if (globalPlotSelectionGroupBy.value === 'Joint') {
        // add options for links
        for (const key in globalVariables.nameObsMap) {
            addNewObsOptionToGlobalHeatmapSelection(key);
        }
        const firstOption = globalHeatmapSelection.options[0];
        globalHeatmapSelection.value = firstOption.value;
    }
    changeGlobalPlot(globalHeatmapSelection.value, option);
};

plotsGroupSelection.addEventListener('change', () => {
    plotsSVGRedraw();
});

const addSelectionToElement = (selectElement, option) => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    selectElement.appendChild(optionElement);
};

globalPlotSelectionPlot.addEventListener('change', () => {
    const value = globalPlotSelectionPlot.value;
    const groupByOptions = Object.keys(globalVariables.globalPlotSelections[value]);
    console.log(groupByOptions);
    while (globalPlotSelectionGroupBy.firstChild) {
        globalPlotSelectionGroupBy.removeChild(globalPlotSelectionGroupBy.firstChild);
    }
    for (const option of groupByOptions) {
        addSelectionToElement(globalPlotSelectionGroupBy, option);
    }
    globalHeatmapRedraw();
});
globalPlotSelectionGroupBy.addEventListener('change', () => {
    const value = globalPlotSelectionGroupBy.value;
    const metricOptions = globalVariables.globalPlotSelections[globalPlotSelectionPlot.value][value];
    while (globalPlotSelectionMetric.firstChild) {
        globalPlotSelectionMetric.removeChild(globalPlotSelectionMetric.firstChild);
    }
    for (const option of metricOptions) {
        addSelectionToElement(globalPlotSelectionMetric, option);
    }
    globalHeatmapRedraw();
});
globalPlotSelectionMetric.addEventListener('change', () => {
    globalHeatmapRedraw();
});

controlsToggle.addEventListener('click', () =>
    controlsel.classList.toggle('hidden'),
);

// watch for urdf changes
viewer.addEventListener('urdf-change', () => {
    Object.values(sliders).forEach((sl) => sl.remove());
    sliders = {};
});

viewer.addEventListener('ignore-limits-change', () => {
    Object.values(sliders).forEach((sl) => sl.update());
});

viewer.addEventListener('angle-change', (e) => {
    if (sliders[e.detail]) sliders[e.detail].update();
});

viewer.addEventListener('joint-mouseover', (e) => {
    // change cursor to pen
    viewer.style.cursor = `url(${ penIco }), auto`;
});

viewer.addEventListener('joint-mouseout', (e) => {
    // change cursor
    viewer.style.cursor = 'auto';
});

let originalNoAutoRecenter;
viewer.addEventListener('manipulate-start', (e) => {
    originalNoAutoRecenter = viewer.noAutoRecenter;
    viewer.noAutoRecenter = true;
});

viewer.addEventListener('manipulate-end', (e) => {
    viewer.noAutoRecenter = originalNoAutoRecenter;
});

document.addEventListener('a-snapshot-closed', (e) => {
    const timestamp = e.detail.timestamp;
    snapShotDiv.removeOne(timestamp);
    globalXAxis.removeOneSnapshot(timestamp);
});

document.addEventListener('a-snapshot-hover', (e) => {
    const timestamp = e.detail.timestamp;
    globalXAxis.highlightOneSnapshot(timestamp);
});

document.addEventListener('a-snapshot-out', (e) => {
    const timestamp = e.detail.timestamp;
    globalXAxis.unhighlightOneSnapshot(timestamp);
});

document.addEventListener('snapshot-triangle-hover', (e) => {
    const timestamp = e.detail.timestamp;
    snapShotDiv.hoverOnImage(timestamp);
});

document.addEventListener('snapshot-triangle-out', (e) => {
    const timestamp = e.detail.timestamp;
    snapShotDiv.hoverOutImage(timestamp);
});

document.addEventListener('WebComponentsReady', () => {
    viewer.loadMeshFunc = (path, manager, done) => {
        const ext = path.split(/\./g).pop().toLowerCase();
        switch (ext) {

            case 'gltf':
            case 'glb':
                new GLTFLoader(manager).load(
                    path,
                    (result) => done(result.scene),
                    null,
                    (err) => done(null, err),
                );
                break;
            case 'obj':
                new OBJLoader(manager).load(
                    path,
                    (result) => done(result),
                    null,
                    (err) => done(null, err),
                );
                break;
            case 'dae':
                new ColladaLoader(manager).load(
                    path,
                    (result) => done(result.scene),
                    null,
                    (err) => done(null, err),
                );
                break;
            case 'stl':
                new STLLoader(manager).load(
                    path,
                    (result) => {
                        const material = new THREE.MeshPhongMaterial();
                        const mesh = new THREE.Mesh(result, material);
                        done(mesh);
                    },
                    null,
                    (err) => done(null, err),
                );
                break;

        }
    };

    document.querySelector('li[urdf]').dispatchEvent(new Event('click'));

    if (/javascript\/example\/bundle/i.test(window.location)) {
        viewer.package = '../../../urdf';
    }

    registerDragEvents(viewer, () => {
        setColor('#263238');
        // animToggle.classList.remove('checked');
        animationControl.uncheck();
        updateList();
    });
});

const updateAnymal = () => {
    if (!viewer.setJointValue) return;
    const current = getCurrentMovementTime();
    const names = Object.keys(globalVariables.nameObsMap);

    for (const robotNum of movementContainer.robotNums) {
        if (!movementContainer.hasMovement(robotNum)) continue;
        const movement = movementContainer.getMovement(robotNum);
        var mov = movement[current];
        if (mov === undefined) {
            globalTimer.stop();
            for (let i = 0; i < names.length; i++) {
                viewer.setJointValue(robotNum, names[i], 0);
            }
            return;
        }
        if (globalVariables.onlyMoveOneObs === null) {
            for (let i = 0; i < names.length; i++) {
                viewer.setJointValue(
                    robotNum,
                    names[i],
                    parseFloat(mov[names[i]]),
                );
            }
        } else {
            for (let i = 0; i < names.length; i++) {
                if (names[i] === globalVariables.onlyMoveOneObs) {
                    viewer.setJointValue(
                        robotNum,
                        names[i],
                        parseFloat(mov[names[i]]),
                    );
                } else {
                    viewer.setJointValue(robotNum, names[i], 0);
                }
            }
        }

        viewer.setRobotPosition(robotNum, {
            x: mov['pos_' + 0],
            y: mov['pos_' + 1],
            z: mov['pos_' + 2],
        });

        viewer.setRobotRotation(robotNum, {
            x: mov['rot_' + 0],
            y: mov['rot_' + 1],
            z: mov['rot_' + 2],
        });
    }
};

onlyObsSelect.addEventListener('change', () => {
    const obsName = onlyObsSelect.value;
    if (obsName === 'all') {
        globalVariables.onlyMoveOneObs = null;
    } else {
        globalVariables.onlyMoveOneObs = obsName;
    }
});

const getCurrentMovementTime = () => {
    const current = globalTimer.getCurrent();
    simulationStepInput.value = current;
    return current;
};

function timerD3Update() {
    updateAllSVG();
    updateAnymal();
}

const updateLoop = () => {
    if (movementContainer.hasAnyMovement()) {
        if (animationControl.isChecked()) {
            globalTimer.start();
        } else {
            if (globalTimer.isRunning) {
                globalTimer.pause();
            }
        }
    }
    requestAnimationFrame(updateLoop);
};

const updateList = () => {
    document.querySelectorAll('#urdf-options li[urdf]').forEach((el) => {
        el.addEventListener('click', (e) => {
            const urdf = e.target.getAttribute('urdf');
            const color = e.target.getAttribute('color');

            viewer.up = '+Z';
            document.getElementById('up-select').value = viewer.up;
            viewer.urdf = urdf;
            // animToggle.classList.add('checked');
            setColor(color);
        });
    });
};

updateList();

document.addEventListener('WebComponentsReady', () => {
    // stop the animation if user tried to manipulate the model
    viewer.addEventListener('manipulate-start', (e) =>
        // animToggle.classList.remove('checked'),
        animationControl.uncheck(),
    );
    createRobotControls(0);
    globalTimer.setTimerD3UpdateFunc(timerD3Update);
    // viewer.addEventListener('urdf-processed', (e) => updateAngles());
    updateLoop();
    viewer.camera.position.set(-5.5, 3.5, 5.5);
});
