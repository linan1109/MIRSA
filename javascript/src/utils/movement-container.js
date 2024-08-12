import globalVariables from './global-variables';

class MovementContainer {

    constructor() {
        this.robotNums = [];
        this.movementDict = {};
        this.velocity = {};
        this.jointForce = {};
        this.position = {};
        this.update_steps = {};
        this.rewards = {};
        this.reward_names = new Set();
        this.reward_names.add('Total');
    }

    splitMovement(input) {
        const velocity = [];
        const movement = [];
        const force = [];
        const updates = [];
        const position = [];
        const rewards = [];
        // Get all reward names
        const firstMov = input[0];
        for (const key in firstMov) {
            if (key.includes('reward')) {
                // remove the reward_ prefix
                const rewardName = key.slice(7);
                this.reward_names.add(rewardName);
            }
        }
        for (const key in input) {
            const oneMov = {};
            const oneVel = {};
            const oneForce = {};
            const oneReward = {};
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
                pos_0: input[key]['pos_0'],
                pos_1: input[key]['pos_1'],
                pos_2: input[key]['pos_2'],
                rot_0: input[key]['rot_0'],
                rot_1: input[key]['rot_1'],
                rot_2: input[key]['rot_2'],
            };
            let totalReward = 0;
            for (const rewardName of this.reward_names) {
                if (input[key]['reward_' + rewardName] !== undefined) {
                    const reward = parseFloat(input[key]['reward_' + rewardName]);
                    oneReward[rewardName] = reward;
                    totalReward += reward;
                }
            }
            oneReward['Total'] = totalReward;

            rewards.push(oneReward);
            movement.push(oneMov);
            velocity.push(oneVel);
            force.push(oneForce);
            updates.push(oneStep);
            position.push(onePos);
        }
        return { movement, velocity, force, updates, position, rewards};
    }

    addMovement(robotNum, input) {
        robotNum = parseInt(robotNum);
        this.robotNums.push(robotNum);
        const { movement, velocity, force, updates, position, rewards } =
            this.splitMovement(input);
        this.movementDict[robotNum] = movement;
        this.velocity[robotNum] = velocity;
        this.jointForce[robotNum] = force;
        this.update_steps[robotNum] = updates;
        this.position[robotNum] = position;
        this.rewards[robotNum] = rewards;
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

    getReward(robotNum) {
        robotNum = parseInt(robotNum);
        if (!this.hasMovement(robotNum)) {
            console.error('No movement found for robotNum', robotNum);
            return null;
        }
        return this.rewards[robotNum];
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

    getCertainReward(robotNum, index) {
        robotNum = parseInt(robotNum);
        if (!this.hasMovement(robotNum)) {
            console.error('No movement found for robotNum', robotNum);
            return null;
        }
        return this.rewards[robotNum][index];
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

    getRewardLabels() {
        return Array.from(this.reward_names);
    }

}

const movementContainer = new MovementContainer();
export default movementContainer;
