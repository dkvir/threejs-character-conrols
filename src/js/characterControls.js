import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { A, D, DIRECTIONS, S, W } from './utils'

export class CharacterControls{
    running = false
    currentAction;
    play = ''
    angleYCameraDirection;
    directionOffset;

    
    // temporary data
    walkDirection = new THREE.Vector3()
    rotateAngle = new THREE.Vector3(0, 1, 0)
    rotateQuarternion= new THREE.Quaternion()
    cameraTarget = new THREE.Vector3()

    // constants
    fadeDuration = 0.2
    runVelocity = 5
    walkVelocity = 2

    constructor(model, mixer, animationsMap, orbitControl, camera, currentAction){
        this.model = model;
        this.mixer = mixer;
        this.animationsMap = animationsMap;
        this.currentAction = currentAction;
        
        this.animationsMap.forEach((value,key)=>{
            if(key == this.currentAction) value.play();
        })
        this.orbitControl = orbitControl;
        this.camera = camera;
        this.updateCameraTarget(0,0)
    }

    toggleRun(){
        this.running = !this.running
    }

    update(delta, keysPressed){
        const directionPressed = DIRECTIONS.some(key => keysPressed[key] == true)

        if(directionPressed && this.running){
            this.play = 'Run'
        } else if(directionPressed){
            this.play = 'Walk'
        } else {
            this.play = 'Idle'
        }

        if(this.currentAction != this.play){
            const next = this.animationsMap.get(this.play);
            const current = this.animationsMap.get(this.currentAction);

            current.fadeOut(this.fadeDuration)
            next.reset().fadeIn(this.fadeDuration).play();
            this.currentAction = this.play
        }
        
        this.mixer.update(delta);

        if(this.currentAction == 'Run' || this.currentAction == 'Walk'){
            // calculate towards camera direction
            this.angleYCameraDirection = Math.atan2(
                (this.camera.position.x - this.model.position.x),
                (this.camera.position.z - this.model.position.z)
            )
            // diagonal movement angle offset
            this.directionOffset = this.directionOffsetFunc(keysPressed)

            // rotate model
            this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, this.angleYCameraDirection + this.directionOffset)
            this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2)

            // calculate direction
            this.camera.getWorldDirection(this.walkDirection)
            this.walkDirection.y = 0
            this.walkDirection.normalize()
            this.walkDirection.applyAxisAngle(this.rotateAngle, this.directionOffset)
            
            // run/walk velocity
            const velocity = this.currentAction == 'Run' ? this.runVelocity : this.walkVelocity

            // move model & camera
            const moveX = this.walkDirection.x * velocity * delta
            const moveZ = this.walkDirection.z * velocity * delta
            this.model.position.x += moveX
            this.model.position.z += moveZ
            this.updateCameraTarget(moveX, moveZ)
        }

    }

    updateCameraTarget(moveX, moveZ) {
        // move camera
        this.camera.position.x += moveX
        this.camera.position.z += moveZ

        // update camera target
        this.cameraTarget.x = this.model.position.x
        this.cameraTarget.y = this.model.position.y + 1
        this.cameraTarget.z = this.model.position.z
        this.orbitControl.target = this.cameraTarget
    }

    
     directionOffsetFunc(keysPressed) {
        let directionOffset = 0 // w

        if (keysPressed[W]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 // w+a
            } else if (keysPressed[D]) {
                directionOffset = - Math.PI / 4 // w+d
            }
        } else if (keysPressed[S]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 + Math.PI / 2 // s+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2 // s+d
            } else {
                directionOffset = Math.PI // s
            }
        } else if (keysPressed[A]) {
            directionOffset = Math.PI / 2 // a
        } else if (keysPressed[D]) {
            directionOffset = - Math.PI / 2 // d
        }

        return directionOffset
    }
}