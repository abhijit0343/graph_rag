/**
 * Damped spring solver simulating physical mass-spring-damper dynamics.
 * Substeps at 1ms with 64ms frame cap. Rest condition: |v| < 0.01 and |target - value| < 0.01.
 */

export const SPRING_CONFIGS = {
  REVEAL: { tension: 90, friction: 26 },
  ROW: { tension: 170, friction: 24 },
  ITEM: { tension: 170, friction: 24 },
  SHEET: { tension: 190, friction: 26 },
  FIGURE: { tension: 200, friction: 24 },
  TYPE: { tension: 210, friction: 24 },
  YEAR: { tension: 190, friction: 24 },
  COPY: { tension: 110, friction: 26 },
  NAME: { tension: 190, friction: 24 },
  VEIL: { tension: 70, friction: 24 },
  CLEAR: { tension: 140, friction: 26 },
  PROGRESS_WAITING: { tension: 10, friction: 30 },
  PROGRESS_READY: { tension: 170, friction: 26 },
  YEAR_SETTLE: { tension: 32, friction: 26 },
  TRIGGER: { tension: 140, friction: 30 },
};

export class Spring {
  constructor({
    initial = 0,
    target = initial,
    tension = 170,
    friction = 24,
    mass = 1,
    precision = 0.01,
  } = {}) {
    this.value = initial;
    this.velocity = 0;
    this.target = target;
    this.tension = tension;
    this.friction = friction;
    this.mass = mass;
    this.precision = precision;
    this.atRest = true;
  }

  setTarget(newTarget) {
    if (this.target !== newTarget) {
      this.target = newTarget;
      this.atRest = false;
    }
  }

  snapTo(val) {
    this.value = val;
    this.target = val;
    this.velocity = 0;
    this.atRest = true;
  }

  step(dtMs) {
    if (this.atRest) return this.value;

    const clampedDt = Math.min(Math.max(dtMs, 1), 64);
    const subSteps = Math.ceil(clampedDt);
    const dt = (clampedDt / subSteps) / 1000;

    for (let i = 0; i < subSteps; i++) {
      const springForce = -this.tension * (this.value - this.target);
      const dampingForce = -this.friction * this.velocity;
      const acceleration = (springForce + dampingForce) / this.mass;

      this.velocity += acceleration * dt;
      this.value += this.velocity * dt;
    }

    const restVelocity = Math.abs(this.velocity) < this.precision;
    const restPosition = Math.abs(this.target - this.value) < this.precision;

    if (restVelocity && restPosition) {
      this.value = this.target;
      this.velocity = 0;
      this.atRest = true;
    }

    return this.value;
  }
}

export const CONFIGS = SPRING_CONFIGS;
export const SpringSolver = Spring;
export default Spring;
