import * as THREE from 'three';
import URDFViewer from './urdf-viewer-element.js';
import { PointerURDFDragControls } from './URDFDragControls.js';
import globalVariables from './utils/global-variables.js';

// urdf-manipulator element
// Displays a URDF model that can be manipulated with the mouse

// Events
// joint-mouseover: Fired when a joint is hovered over
// joint-mouseout: Fired when a joint is no longer hovered over
// manipulate-start: Fires when a joint is manipulated
// manipulate-end: Fires when a joint is done being manipulated
export default class URDFManipulator extends URDFViewer {

    static get observedAttributes() {
        return ['highlight-color', ...super.observedAttributes];
    }

    get disableDragging() {
        return this.hasAttribute('disable-dragging');
    }
    set disableDragging(val) {
        val
            ? this.setAttribute('disable-dragging', !!val)
            : this.removeAttribute('disable-dragging');
    }

    get highlightColor() {
        return this.getAttribute('highlight-color') || '#FFFFFF';
    }
    set highlightColor(val) {
        val
            ? this.setAttribute('highlight-color', val)
            : this.removeAttribute('highlight-color');
    }

    constructor(...args) {
        super(...args);

        // The highlight material
        this.highlightMaterial = new THREE.MeshPhongMaterial({
            shininess: 10,
            color: this.highlightColor,
            emissive: this.highlightColor,
            emissiveIntensity: 0.25,
        });

        const isJoint = (j) => {
            return j.isURDFJoint && j.jointType !== 'fixed';
        };

        // Highlight the link geometry under a joint
        const highlightLinkGeometry = (m, revert) => {
            const traverse = (c) => {
                // Set or revert the highlight color
                if (c.type === 'Mesh') {
                    if (revert) {
                        c.material = c.__origMaterial;
                        delete c.__origMaterial;
                    } else {
                        c.__origMaterial = c.material;
                        c.material = this.highlightMaterial;
                    }
                }

                // Look into the children and stop if the next child is
                // another joint
                if (c === m || !isJoint(c)) {
                    for (let i = 0; i < c.children.length; i++) {
                        const child = c.children[i];
                        if (!child.isURDFCollider) {
                            traverse(c.children[i]);
                        }
                    }
                }
            };

            traverse(m);
        };

        const el = this.renderer.domElement;

        const dragControls = new PointerURDFDragControls(
            this.scene,
            this.camera,
            el,
        );
        dragControls.onDragStart = (joint, robot) => {
            const robotIndex = this.findRobotByUUID(robot.uuid);
            this.dispatchEvent(
                new CustomEvent('manipulate-start', {
                    bubbles: true,
                    cancelable: true,
                    detail: joint.name,
                    robot: robotIndex,
                }),
            );
            this.controls.enabled = false;
            this.redraw();
        };

        dragControls.onDragEnd = (joint, robot) => {
            const robotIndex = this.findRobotByUUID(robot.uuid);
            this.dispatchEvent(
                new CustomEvent('manipulate-end', {
                    bubbles: true,
                    cancelable: true,
                    detail: joint.name,
                    robot: robotIndex,
                }),
            );
            this.controls.enabled = true;
            this.redraw();
        };

        dragControls.updateJoint = (joint, angle, robot) => {
            const robotIndex = this.findRobotByUUID(robot.uuid);
            this.setJointValue(robotIndex, joint.name, angle);
        };

        dragControls.onHover = (joint, robot) => {
            const robotIndex = this.findRobotByUUID(robot.uuid);
            highlightLinkGeometry(joint, false);
            this.dispatchEvent(
                new CustomEvent('joint-mouseover', {
                    bubbles: true,
                    cancelable: true,
                    detail: joint.name,
                    robot: robotIndex,
                }),
            );
            this.redraw();
        };

        dragControls.onUnhover = (joint, robot) => {
            const robotIndex = this.findRobotByUUID(robot.uuid);
            highlightLinkGeometry(joint, true);
            this.dispatchEvent(
                new CustomEvent('joint-mouseout', {
                    bubbles: true,
                    cancelable: true,
                    detail: joint.name,
                    robot: robotIndex,
                }),
            );
            this.redraw();
        };

        dragControls.onClick = (joint, robot, point) => {
            if (globalVariables.selectTrajectory) {
                this.pointTrajectory.updateSelectedPoint(joint, robot, point);
                globalVariables.selectTrajectory = false;
                this.style.cursor = 'auto';
            }
            const event = new CustomEvent('joint-click', {
                bubbles: true,
                cancelable: true,
            });
            this.dispatchEvent(event);
        };

        this.dragControls = dragControls;
    }



    attributeChangedCallback(attr, oldval, newval) {
        super.attributeChangedCallback(attr, oldval, newval);

        switch (attr) {

            case 'highlight-color':
                this.highlightMaterial.color.set(this.highlightColor);
                this.highlightMaterial.emissive.set(this.highlightColor);
                break;

        }
    }

}
