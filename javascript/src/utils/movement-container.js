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
        this.min_values = {};
        this.max_values = {};
    }

    splitMovement(input) {
        const velocity = [];
        const movement = [];
        const force = [];
        const updates = [];
        const position = [];
        const rewards = [];
        const mins = {};
        const maxs = {};
        // Get all reward names
        const firstMov = input[0];
        for (const key in firstMov) {
            if (key.includes('reward')) {
                // remove the reward_ prefix
                const rewardName = key.slice(7);
                this.reward_names.add(rewardName);
            }
        }
        for (const rewardName of this.reward_names) {
            mins[rewardName] = 0;
            maxs[rewardName] = 0;
        }
        for (const joint in globalVariables.nameObsMap) {
            mins[joint] = 0;
            maxs[joint] = 0;
            mins[joint + '_angVel'] = 0;
            maxs[joint + '_angVel'] = 0;
            mins[joint + '_force'] = 0;
            maxs[joint + '_force'] = 0;
        }
        mins['pos_0'] = 0;
        maxs['pos_0'] = 0;
        mins['pos_1'] = 0;
        maxs['pos_1'] = 0;
        mins['pos_2'] = 0;
        maxs['pos_2'] = 0;
        mins['rot_0'] = 0;
        maxs['rot_0'] = 0;
        mins['rot_1'] = 0;
        maxs['rot_1'] = 0;
        mins['rot_2'] = 0;
        maxs['rot_2'] = 0;

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
                const mov = parseFloat(input[key][joint]);
                const vel = parseFloat(input[key][joint + '_angVel']);
                const f = parseFloat(input[key][joint + '_force']);

                oneMov[joint] = mov;
                oneVel[joint] = vel;
                oneForce[joint] = f;

                mins[joint] = Math.min(mins[joint], mov);
                maxs[joint] = Math.max(maxs[joint], mov);
                mins[joint + '_angVel'] = Math.min(mins[joint + '_angVel'], vel);
                maxs[joint + '_angVel'] = Math.max(maxs[joint + '_angVel'], vel);
                mins[joint + '_force'] = Math.min(mins[joint + '_force'], f);
                maxs[joint + '_force'] = Math.max(maxs[joint + '_force'], f);
            }

            const onePos = {
                pos_0: parseFloat(input[key]['pos_0']),
                pos_1: parseFloat(input[key]['pos_1']),
                pos_2: parseFloat(input[key]['pos_2']),
                rot_0: parseFloat(input[key]['rot_0']),
                rot_1: parseFloat(input[key]['rot_1']),
                rot_2: parseFloat(input[key]['rot_2']),
            };
            mins['pos_0'] = Math.min(mins['pos_0'], onePos['pos_0']);
            maxs['pos_0'] = Math.max(maxs['pos_0'], onePos['pos_0']);
            mins['pos_1'] = Math.min(mins['pos_1'], onePos['pos_1']);
            maxs['pos_1'] = Math.max(maxs['pos_1'], onePos['pos_1']);
            mins['pos_2'] = Math.min(mins['pos_2'], onePos['pos_2']);
            maxs['pos_2'] = Math.max(maxs['pos_2'], onePos['pos_2']);
            mins['rot_0'] = Math.min(mins['rot_0'], onePos['rot_0']);
            maxs['rot_0'] = Math.max(maxs['rot_0'], onePos['rot_0']);
            mins['rot_1'] = Math.min(mins['rot_1'], onePos['rot_1']);
            maxs['rot_1'] = Math.max(maxs['rot_1'], onePos['rot_1']);
            mins['rot_2'] = Math.min(mins['rot_2'], onePos['rot_2']);
            maxs['rot_2'] = Math.max(maxs['rot_2'], onePos['rot_2']);

            let totalReward = 0;
            for (const rewardName of this.reward_names) {
                if (input[key]['reward_' + rewardName] !== undefined) {
                    const reward = parseFloat(input[key]['reward_' + rewardName]);
                    mins[rewardName] = Math.min(mins[rewardName], reward);
                    maxs[rewardName] = Math.max(maxs[rewardName], reward);
                    oneReward[rewardName] = reward;
                    totalReward += reward;
                }
            }
            oneReward['Total'] = totalReward;
            mins['Total'] = Math.min(mins['Total'], totalReward);
            maxs['Total'] = Math.max(maxs['Total'], totalReward);

            rewards.push(oneReward);
            movement.push(oneMov);
            velocity.push(oneVel);
            force.push(oneForce);
            updates.push(oneStep);
            position.push(onePos);
        }
        return { movement, velocity, force, updates, position, rewards, mins, maxs };
    }

    addMovement(robotNum, input) {
        robotNum = parseInt(robotNum);
        this.robotNums.push(robotNum);
        const { movement, velocity, force, updates, position, rewards, mins, maxs } =
            this.splitMovement(input);
        this.movementDict[robotNum] = movement;
        this.velocity[robotNum] = velocity;
        this.jointForce[robotNum] = force;
        this.update_steps[robotNum] = updates;
        this.position[robotNum] = position;
        this.rewards[robotNum] = rewards;
        this.min_values[robotNum] = mins;
        this.max_values[robotNum] = maxs;
    }

    getMinByRobot(robotNum) {
        robotNum = parseInt(robotNum);
        if (!this.hasMovement(robotNum)) {
            console.error('No movement found for robotNum', robotNum);
            return null;
        }
        return this.min_values[robotNum];
    }

    getMaxByRobot(robotNum) {
        robotNum = parseInt(robotNum);
        if (!this.hasMovement(robotNum)) {
            console.error('No movement found for robotNum', robotNum);
            return null;
        }
        return this.max_values[robotNum];
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
