import * as THREE from 'three';
import type { VehicleTelemetry } from '../simulation';

export type RiderGesture = 'acknowledge' | 'look-left' | 'look-right';
type RiderInput = Pick<VehicleTelemetry, 'speed' | 'steer' | 'throttle' | 'brake'>;
const clamp = THREE.MathUtils.clamp;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const TAU = Math.PI * 2;
const ease = (x: number) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

/**
 * Small additive motions on the existing semantic rig, BEFORE contact IK.
 * No root translation, physical forces, asset mutations or input/save side effects.
 * Parent presenter restores the bind pose each frame; this layer never accumulates rotations.
 */
export class RiderMotion {
  private spine?: THREE.Object3D;
  private head?: THREE.Object3D;
  private q = new THREE.Quaternion();
  private time = 0;
  private stoppedFor = 0;
  private nextLook = 6;
  private direction = 1;
  private gesture?: RiderGesture;
  private gestureTime = 0;
  private still = 0;
  private yaw = 0;
  private roll = 0;
  private pitch = 0;
  private lastSpeed = 0;
  readonly enabled: boolean;
  readonly report = { enabled: false, breathing: 0, headYaw: 0, headPitch: 0, bodyRoll: 0, bodyPitch: 0, gesture: 'none', stoppedFor: 0 };

  constructor(root: THREE.Object3D, private phase = 0) {
    this.enabled = root.getObjectByName('driver_root')?.userData.riderMotionVersion === 1;
    this.spine = root.getObjectByName('driver_spine');
    this.head = root.getObjectByName('driver_head');
    this.nextLook += phase % 4;
    this.report.enabled = this.enabled;
  }

  /** Explicit presentation cue. Acknowledge/look cues are accepted only while stationary. */
  trigger(gesture: RiderGesture) {
    if (!this.enabled || Math.abs(this.lastSpeed) >= .5 || this.gesture) return false;
    if (!['acknowledge', 'look-left', 'look-right'].includes(gesture)) return false;
    this.gesture = gesture;
    this.gestureTime = 0;
    return true;
  }

  update(t: RiderInput, elapsed: number, reset = false) {
    if (!this.enabled) return this.report;
    const dt = Number.isFinite(elapsed) ? clamp(elapsed, 0, .1) : 0;
    const speed = Number.isFinite(t.speed) ? Math.abs(t.speed) : 0;
    const steer = Number.isFinite(t.steer) ? clamp(t.steer, -.7, .7) : 0;
    if (reset) {
      this.time = 0; this.stoppedFor = 0; this.nextLook = 6 + this.phase % 4;
      this.gesture = undefined; this.gestureTime = 0; this.direction = 1;
      this.still = this.yaw = this.roll = this.pitch = 0;
      this.lastSpeed = speed;
      Object.assign(this.report, { breathing: 0, headYaw: 0, headPitch: 0, bodyRoll: 0, bodyPitch: 0, gesture: 'none', stoppedFor: 0 });
      return this.report;
    }
    this.lastSpeed = speed;
    // Pause calls leave time and the currently sampled pose unchanged.
    if (dt > 0) {
      this.time += dt;
      const stationary = speed < .35 && Math.abs(t.throttle) < .05 && Math.abs(steer) < .10;
      this.stoppedFor = stationary ? this.stoppedFor + dt : 0;
      const follow = 1 - Math.exp(-5 * dt);
      this.still += ((stationary ? 1 : 0) - this.still) * follow;
      this.yaw += (steer * .22 * clamp(speed / 8, 0, 1) - this.yaw) * follow;
      this.roll += (-steer * .034 * clamp(speed / 12, 0, 1) - this.roll) * follow;
      this.pitch += ((-.009 * clamp(speed / 35, 0, 1) - .003 * clamp(t.brake, 0, 1)) - this.pitch) * follow;
      if (this.stoppedFor === 0) this.nextLook = 6 + this.phase % 4;
      if (this.stoppedFor >= this.nextLook && !this.gesture) {
        this.trigger(this.direction > 0 ? 'look-left' : 'look-right');
        this.direction *= -1;
        this.nextLook += 17;
      }
      if (this.gesture) {
        this.gestureTime += dt;
        if (this.gestureTime >= (this.gesture === 'acknowledge' ? 1.4 : 2.8)) this.gesture = undefined;
      }
    }
    const breathing = .0038 * Math.sin(this.time * TAU / 4.6 + this.phase);
    let look = 0, nod = 0;
    if (this.gesture) {
      const duration = this.gesture === 'acknowledge' ? 1.4 : 2.8;
      const envelope = ease(this.gestureTime / .65) * ease((duration - this.gestureTime) / .8);
      if (this.gesture === 'acknowledge') nod = .055 * envelope * Math.sin(Math.PI * this.gestureTime / duration);
      else look = (this.gesture === 'look-left' ? 1 : -1) * .20 * envelope;
    }
    // Standing-start throttle fades idle gestures away smoothly; never take a hand off the control.
    const headYaw = this.yaw + look * this.still;
    const headPitch = -breathing * .45 + nod * this.still;
    if (this.spine) {
      this.spine.quaternion.multiply(this.q.setFromAxisAngle(X, breathing + this.pitch));
      this.spine.quaternion.multiply(this.q.setFromAxisAngle(Z, this.roll));
    }
    if (this.head) {
      this.head.quaternion.multiply(this.q.setFromAxisAngle(Y, headYaw));
      this.head.quaternion.multiply(this.q.setFromAxisAngle(X, headPitch));
    }
    Object.assign(this.report, { breathing, headYaw, headPitch, bodyRoll: this.roll, bodyPitch: this.pitch, gesture: this.gesture ?? 'none', stoppedFor: this.stoppedFor });
    return this.report;
  }
}
