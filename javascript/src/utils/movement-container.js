import globalVariables from './global-variables';

class MovementContainer {

    constructor() {
        this.robotNums = [];
        this.movementDict = {};
        this.velocity = {};
        this.jointForce = {};
        this.position = {};
        this.update_steps = {};
    }

    splitMovement(input) {
        const velocity = [];
        const movement = [];
        const force = [];
        const updates = [];
        const position = [];
        for (const key in input) {
            const oneMov = {};
            const oneVel = {};
            const oneForce = {};
            const oneStep = {
                step: input[key].step,
                update: input[key].update,
            };
            for (const joint in globalVariables.nameObsMap) {
                oneMov[joint] = input[key][joint];
                oneVel[joint] = input[key][joint + '_angVel'];
                oneForce[joint] = input[key][joint + '_force'];
            }

            const onePos = {
                'pos_0': input[key]['pos_0'],
                'pos_1': input[key]['pos_1'],
                'pos_2': input[key]['pos_2'],
                'rot_0': input[key]['rot_0'],
                'rot_1': input[key]['rot_1'],
                'rot_2': input[key]['rot_2'],
            };

            movement.push(oneMov);
            velocity.push(oneVel);
            force.push(oneForce);
            updates.push(oneStep);
            position.push(onePos);
        }
        console.log('movement', movement);
        console.log('velocity', velocity);
        console.log('force', force);
        return { movement, velocity, force, updates, position };
    }

    addMovement(robotNum, input) {
        robotNum = parseInt(robotNum);
        this.robotNums.push(robotNum);
        const { movement, velocity, force, updates, position } = this.splitMovement(input);
        this.movementDict[robotNum] = movement;
        this.velocity[robotNum] = velocity;
        this.jointForce[robotNum] = force;
        this.update_steps[robotNum] = updates;
        this.position[robotNum] = position;
    }

    getMovement(robotNum) {
        robotNum = parseInt(robotNum);
        if (!this.hasMovement(robotNum)) {
            console.error('No movement found for robotNum', robotNum);
            return null;
        }
        return this.movementDict[robotNum];
    }

    getVelocity(robotNum) {
        robotNum = parseInt(robotNum);
        if (!this.hasMovement(robotNum)) {
            console.error('No movement found for robotNum', robotNum);
            return null;
        }
        return this.velocity[robotNum];
    }

    getJointForce(robotNum) {
        robotNum = parseInt(robotNum);
        if (!this.hasMovement(robotNum)) {
            console.error('No movement found for robotNum', robotNum);
            return null;
        }
        return this.jointForce[robotNum];
    }

    getPosition(robotNum) {
        robotNum = parseInt(robotNum);
        if (!this.hasMovement(robotNum)) {
            console.error('No movement found for robotNum', robotNum);
            return null;
        }
        return this.position[robotNum];
    }

    getCertainMovement(robotNum, index) {
        robotNum = parseInt(robotNum);
        if (!this.hasMovement(robotNum)) {
            console.error('No movement found for robotNum', robotNum);
            return null;
        }
        return this.movementDict[robotNum][index];
    }

    getCertainVelocity(robotNum, index) {
        robotNum = parseInt(robotNum);
        if (!this.hasMovement(robotNum)) {
            console.error('No movement found for robotNum', robotNum);
            return null;
        }
        return this.velocity[robotNum][index];
    }

    getCertainJointForce(robotNum, index) {
        robotNum = parseInt(robotNum);
        if (!this.hasMovement(robotNum)) {
            console.error('No movement found for robotNum', robotNum);
            return null;
        }
        return this.jointForce[robotNum][index];
    }

    getCertainPosition(robotNum, index) {
        robotNum = parseInt(robotNum);
        if (!this.hasMovement(robotNum)) {
            console.error('No movement found for robotNum', robotNum);
            return null;
        }
        return this.position[robotNum][index];
    }

    hasMovement(robotNum) {
        robotNum = parseInt(robotNum);
        return this.robotNums.includes(robotNum);
    }

    hasAnyMovement() {
        return this.robotNums.length > 0;
    }

    removeMovement(robotNum) {
        robotNum = parseInt(robotNum);
        if (!this.hasMovement(robotNum)) {
            return;
        }
        const index = this.robotNums.indexOf(robotNum);
        this.robotNums.splice(index, 1);
        delete this.movementDict[robotNum];
        delete this.velocity[robotNum];
    }

}

const movementContainer = new MovementContainer();
export default movementContainer;
