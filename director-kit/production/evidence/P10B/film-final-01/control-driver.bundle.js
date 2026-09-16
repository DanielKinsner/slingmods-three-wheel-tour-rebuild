var Evidence = (function(exports) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region src/simulation/profile.ts
	var HANDLING_PROFILES = {
		"legacy-p08a": {
			id: "legacy-p08a",
			name: "Legacy P08A",
			torqueScale: 1,
			shiftSeconds: .24,
			steerLock: .53,
			steerFalloff: .037,
			lateralSteerLimit: 5.4,
			steerRate: 1.7,
			asphaltGripScale: 1,
			tireStiffness: 7,
			brakeScale: 1,
			brakeSteerRelief: 0,
			damperFront: 3800,
			damperRear: 6500
		},
		"slingmods-sport-v1": {
			id: "slingmods-sport-v1",
			name: "SlingMods Sport",
			torqueScale: 1.3,
			shiftSeconds: .18,
			steerLock: .6,
			steerFalloff: .021,
			lateralSteerLimit: 8.2,
			steerRate: 2.7,
			asphaltGripScale: 1.15,
			tireStiffness: 8,
			brakeScale: .7,
			brakeSteerRelief: .35,
			damperFront: 3800,
			damperRear: 6500
		},
		"slingmods-sport-v2": {
			id: "slingmods-sport-v2",
			name: "SlingMods Sport v2",
			torqueScale: 1.3,
			shiftSeconds: .18,
			steerLock: .6,
			steerFalloff: .021,
			lateralSteerLimit: 8.2,
			steerRate: 2.7,
			asphaltGripScale: 1.15,
			tireStiffness: 8,
			brakeScale: 1,
			brakeSteerRelief: .15,
			damperFront: 3800,
			damperRear: 6500
		},
		"slingmods-sport-v3": {
			id: "slingmods-sport-v3",
			name: "SlingMods Sport v3",
			torqueScale: 1.3,
			shiftSeconds: .18,
			steerLock: .6,
			steerFalloff: .021,
			lateralSteerLimit: 8.2,
			steerRate: 2.7,
			asphaltGripScale: 1.15,
			tireStiffness: 8,
			brakeScale: 1,
			brakeSteerRelief: 0,
			damperFront: 3800,
			damperRear: 6500
		}
	};
	function handlingProfile(id = "legacy-p08a") {
		const p = HANDLING_PROFILES[id];
		if (!p) throw Error("Unknown handling profile: " + id);
		return p;
	}
	function steeringLimit(speed, id = "legacy-p08a", wheelbase = 2.667) {
		const p = handlingProfile(id);
		const geometric = Math.atan(p.lateralSteerLimit * wheelbase / Math.max(speed * speed, 1));
		const reserve = id === "slingmods-sport-v3" ? .025 * speed * speed / (speed * speed + 100) / (1 + speed * speed / 500) : 0;
		return Math.min(p.steerLock / (1 + Math.abs(speed) * p.steerFalloff), geometric + reserve);
	}
	function steeringRequest(demand, speed, id = "legacy-p08a", brake = 0, wheelbase = 2.667) {
		const p = handlingProfile(id);
		return Math.max(-1, Math.min(1, Number.isFinite(demand) ? demand : 0)) * steeringLimit(speed, id, wheelbase) * (id === "legacy-p08a" ? 1 : 1 - p.brakeSteerRelief * Math.max(0, Math.min(1, brake)));
	}
	/** Inverse request mapping shared by physical rival/recovery controllers. */
	function steeringDemandForAngle(angle, speed, id = "legacy-p08a", brake = 0, wheelbase = 2.667) {
		return Math.max(-1, Math.min(1, angle / steeringRequest(1, speed, id, brake, wheelbase)));
	}
	//#endregion
	//#region src/competition/stability.ts
	/** Contact recovery uses measured planar speed/slip, never extra tire force or a pose correction. */
	function stabilizeRival(v, control, profileId = "legacy-p08a") {
		const speed = Math.hypot(v.velocity.x, v.velocity.z);
		if (control.reverse || speed < 4) return control;
		const q = v.quaternion, yaw = Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.z * q.z)), left = -Math.cos(yaw) * v.velocity.x + Math.sin(yaw) * v.velocity.z, slip = Math.atan2(left, Math.max(.1, v.speed));
		if (Math.abs(slip) < .3) return control;
		const maxSteer = steeringLimit(v.speed, profileId), angle = Math.max(-.24, Math.min(.24, slip * .45 - v.angularVelocity.y * .08));
		return {
			...control,
			throttle: 0,
			brake: Math.max(control.brake, .4),
			steer: profileId === "slingmods-sport-v3" ? steeringDemandForAngle(angle, v.speed, profileId, Math.max(control.brake, .4)) : Math.max(-1, Math.min(1, angle / maxSteer))
		};
	}
	//#endregion
	//#region src/competition/road.ts
	/** Immutable segment cache; projection checks a local window, falling back only off its corridor. */
	var RaceRoad = class {
		route;
		starts = [];
		segments = [];
		constructor(route) {
			this.route = route;
			let d = 0;
			route.centerline.forEach((a, i) => {
				const b = route.centerline[(i + 1) % route.centerline.length], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
				this.starts.push(d);
				this.segments.push({
					x: a[0],
					z: a[1],
					dx: (b[0] - a[0]) / length,
					dz: (b[1] - a[1]) / length,
					length,
					...route.elevations ? {
						y: route.elevations[i],
						dy: (route.elevations[(i + 1) % route.centerline.length] - route.elevations[i]) / length
					} : {}
				});
				d += length;
			});
		}
		sample(distance) {
			const d = (distance % this.route.length + this.route.length) % this.route.length;
			let lo = 0, hi = this.starts.length - 1;
			while (lo < hi) {
				const mid = Math.ceil((lo + hi) / 2);
				if (this.starts[mid] <= d) lo = mid;
				else hi = mid - 1;
			}
			const s = this.segments[lo], t = d - this.starts[lo];
			return {
				x: s.x + s.dx * t,
				z: s.z + s.dz * t,
				dx: s.dx,
				dz: s.dz,
				...s.y !== void 0 ? {
					y: s.y + s.dy * t,
					dy: s.dy
				} : {}
			};
		}
		project(x, z, previous) {
			let best = {
				distance: Infinity,
				progress: 0,
				x: 0,
				z: 0,
				dx: 0,
				dz: -1,
				segment: 0
			};
			const n = this.segments.length;
			const test = (i) => {
				const s = this.segments[i], t = Math.max(0, Math.min(s.length, (x - s.x) * s.dx + (z - s.z) * s.dz)), px = s.x + s.dx * t, pz = s.z + s.dz * t, distance = Math.hypot(x - px, z - pz);
				if (distance < best.distance) best = {
					distance,
					progress: this.starts[i] + t,
					x: px,
					z: pz,
					dx: s.dx,
					dz: s.dz,
					segment: i,
					...s.y !== void 0 ? {
						y: s.y + s.dy * t,
						dy: s.dy
					} : {}
				};
			};
			if (previous !== void 0) for (let offset = -12; offset <= 12; offset++) test(((previous + offset) % n + n) % n);
			if (previous === void 0 || best.distance > this.route.width / 2 + this.route.runoff + 2) for (let i = 0; i < n; i++) test(i);
			return best;
		}
	};
	//#endregion
	//#region src/competition/rival.ts
	var clamp = (v, a, b) => Math.max(a, Math.min(b, v));
	var traits = {
		maya: {
			pace: 21.8,
			lateral: 2.8,
			braking: 3.35,
			headway: 1.2,
			line: -1.6
		},
		jett: {
			pace: 22.5,
			lateral: 3,
			braking: 3.8,
			headway: 1,
			line: 0
		},
		nico: {
			pace: 21.1,
			lateral: 2.7,
			braking: 3.2,
			headway: 1.45,
			line: 1.6
		},
		player: {
			pace: 23,
			lateral: 3.1,
			braking: 3.6,
			headway: 1,
			line: 0
		}
	};
	/** Production control-only pursuit. Strategy runs at 6Hz; no body mutation or gap-based physics changes. */
	var RivalController = class {
		id;
		seed;
		profileId;
		road;
		segment;
		time = 0;
		nextPlan = 0;
		targetLane = 0;
		lane = 0;
		heldUntil = 0;
		clearSince = 0;
		stationarySeconds = 0;
		stuckSeconds = 0;
		recoverySeconds = 0;
		recoveries = 0;
		mode = "follow";
		targetSpeed = 0;
		nearestGap = Infinity;
		retiredReason = null;
		preference;
		trait;
		stats = {
			plans: 0,
			passes: 0,
			brakingTicks: 0,
			recoveryTicks: 0
		};
		constructor(route, id, seed = 1, profileId = "legacy-p08a") {
			this.id = id;
			this.seed = seed;
			this.profileId = profileId;
			this.road = new RaceRoad(route);
			this.trait = { ...traits[id] ?? traits.player };
			if (profileId !== "legacy-p08a") {
				this.trait.pace *= 2.28;
				this.trait.lateral *= route.width < 13 ? 1.4 : 1.8;
				this.trait.braking *= 1;
				this.trait.headway *= 1.15;
			}
			if (route.elevations) {
				this.trait.pace *= .86;
				this.trait.lateral *= .85;
			}
			let h = seed >>> 0;
			for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
			this.preference = this.trait.line + (h % 1e3 / 1e3 - .5) * .25;
			this.targetLane = this.preference;
		}
		control(v, peers, dt = 1 / 60) {
			this.time += dt;
			if (this.retiredReason) return {
				throttle: 0,
				brake: 1,
				steer: 0,
				reverse: false,
				tractionControl: true
			};
			const p = this.road.project(v.position.x, v.position.z, this.segment);
			this.segment = p.segment;
			const speed = Math.abs(v.speed), q = v.quaternion, yaw = Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + (this.road.route.elevations ? q.x * q.x : q.z * q.z))), lateral = (v.position.x - p.x) * -p.dz + (v.position.z - p.z) * p.dx;
			if (this.time >= this.nextPlan) {
				this.stats.plans++;
				this.nextPlan = this.time + 1 / 6;
				let nearest = null;
				const traffic = [];
				for (const [id, other] of Object.entries(peers)) {
					if (id === this.id) continue;
					const dx = other.position.x - v.position.x, dz = other.position.z - v.position.z, ahead = dx * p.dx + dz * p.dz, side = dx * -p.dz + dz * p.dx;
					if (Math.hypot(dx, dz) > 65) continue;
					const lane = lateral + side, forwardSpeed = other.velocity.x * p.dx + other.velocity.z * p.dz;
					traffic.push({
						ahead,
						lane,
						speed: forwardSpeed
					});
					if (ahead > 0 && Math.abs(side) < 2.5 && (!nearest || ahead < nearest.gap)) nearest = {
						gap: ahead,
						speed: forwardSpeed,
						lane
					};
				}
				this.nearestGap = nearest?.gap ?? Infinity;
				if (this.mode !== "recover") {
					if (nearest && nearest.gap < 12 + speed * this.trait.headway && nearest.speed < speed + 1) {
						if (this.mode === "follow" || this.mode === "settle") {
							this.mode = "prepare-pass";
							this.heldUntil = this.time + .5;
						}
						if (this.mode === "prepare-pass" && this.time >= this.heldUntil) {
							const open = [-2.7, 2.7].sort((a, b) => Math.abs(a - lateral) - Math.abs(b - lateral)).find((l) => Math.abs(l - nearest.lane) > 2.5 && !traffic.some((o) => Math.abs(o.lane - l) < 2.5 && o.ahead > -7 - Math.max(0, o.speed - speed) * 1.2 && o.ahead < 12 + Math.max(0, speed - o.speed) * 1.2));
							if (open !== void 0) {
								this.targetLane = open;
								this.mode = "pass";
								this.heldUntil = this.time + 4;
								this.stats.passes++;
							}
						}
					} else if (this.mode === "pass" && this.time > this.heldUntil) {
						this.mode = "settle";
						this.clearSince = this.time;
					} else if (this.mode === "settle" && this.time - this.clearSince > 2 && !traffic.some((o) => Math.abs(o.lane - this.preference) < 2.5 && Math.abs(o.ahead) < 10)) {
						this.targetLane = this.preference;
						this.mode = "follow";
					} else if (this.mode === "prepare-pass" && !nearest) {
						this.mode = "follow";
						this.targetLane = this.preference;
					}
				}
				this.targetSpeed = this.trait.pace;
				for (let d = 0; d <= (this.profileId === "legacy-p08a" ? 75 : 200); d += 5) {
					const a = this.road.sample(p.progress + d - 7), b = this.road.sample(p.progress + d + 7), curvature = Math.abs(Math.atan2(a.dx * b.dz - a.dz * b.dx, a.dx * b.dx + a.dz * b.dz)) / 14, corner = Math.sqrt(this.trait.lateral / Math.max(curvature, .001));
					this.targetSpeed = Math.min(this.targetSpeed, Math.sqrt(corner * corner + 2 * (this.road.route.elevations ? Math.max(1.5, this.trait.braking + 9.81 * (b.dy ?? 0)) : this.trait.braking) * Math.max(0, d - 7)));
				}
				for (const other of traffic) {
					const pathOverlap = Math.abs(other.lane - this.lane) < 2.45 || Math.abs(other.lane - this.targetLane) < 2.45;
					if (other.ahead > 0 && pathOverlap) {
						const clearance = Math.max(0, other.ahead - 4.5), desired = 5 + speed * this.trait.headway;
						const leavingBlockedLane = this.mode === "pass" && Math.abs(other.lane - this.targetLane) >= 2.45 && clearance > 3;
						this.targetSpeed = Math.min(this.targetSpeed, leavingBlockedLane ? Math.max(2, other.speed) : Math.max(0, other.speed + (clearance - desired) * .65));
						if (clearance < 1.5) this.targetSpeed = 0;
					}
				}
				if (p.distance > (this.profileId === "legacy-p08a" ? 3.9 : this.road.route.width / 2 - 1.2)) this.targetSpeed = Math.min(this.targetSpeed, 7);
			}
			this.lane += clamp(this.targetLane - this.lane, -.65 * dt, .65 * dt);
			this.stationarySeconds = speed < .5 ? this.stationarySeconds + dt : 0;
			if (this.stationarySeconds > 40) this.retiredReason = "Blocked without a safe exit for40 seconds";
			this.stuckSeconds = speed < .7 && this.targetSpeed > 2 ? this.stuckSeconds + dt : Math.max(0, this.stuckSeconds - dt * 2);
			if (this.mode !== "recover" && this.stuckSeconds > 5) {
				this.mode = "recover";
				this.recoverySeconds = 0;
				this.recoveries++;
				this.stuckSeconds = 0;
			}
			if (this.recoveries >= 4) {
				this.retiredReason = "Stranded after three physical recovery attempts";
				return {
					throttle: 0,
					brake: 1,
					steer: 0,
					reverse: false,
					tractionControl: true
				};
			}
			const look = this.mode === "pass" && speed < 7 ? 3 + speed * .4 : this.profileId === "legacy-p08a" ? 7 + speed * .55 : 9 + speed * .55, t = this.road.sample(p.progress + look), tx = t.x - t.dz * this.lane, tz = t.z + t.dx * this.lane, dx = tx - v.position.x, dz = tz - v.position.z, forward = -Math.sin(yaw) * dx - Math.cos(yaw) * dz, left = -Math.cos(yaw) * dx + Math.sin(yaw) * dz, angle = Math.atan2(left, forward), wheelbase = 2.667, maxSteer = steeringLimit(speed, this.profileId, wheelbase), desired = Math.atan2(2 * wheelbase * Math.sin(angle), Math.hypot(dx, dz)), steer = this.profileId === "slingmods-sport-v3" ? steeringDemandForAngle(desired * 1.12, speed, this.profileId) : clamp(desired / maxSteer * 1.12, -1, 1);
			if (this.mode === "recover") {
				this.stats.recoveryTicks++;
				this.recoverySeconds += dt;
				const rearOccupied = Object.entries(peers).some(([id, o]) => {
					if (id === this.id) return false;
					const dx = o.position.x - v.position.x, dz = o.position.z - v.position.z;
					return dx * p.dx + dz * p.dz < 0 && Math.hypot(dx, dz) < 7;
				});
				if (this.recoverySeconds > 2.5) {
					this.mode = "follow";
					this.targetLane = this.preference;
					return {
						throttle: 0,
						brake: 1,
						steer: 0,
						reverse: false,
						tractionControl: true
					};
				}
				return {
					throttle: rearOccupied ? 0 : .4,
					brake: rearOccupied ? 1 : 0,
					steer: -steer,
					reverse: true,
					tractionControl: true
				};
			}
			const error = this.targetSpeed - v.speed, throttle = clamp(error * .36 + .15, 0, 1), brake = clamp(-error * .25, 0, 1);
			if (brake > .1) this.stats.brakingTicks++;
			return stabilizeRival(v, {
				throttle,
				brake,
				steer,
				reverse: false,
				tractionControl: true
			}, this.profileId);
		}
		inspect() {
			return {
				id: this.id,
				profileId: this.profileId,
				seed: this.seed,
				mode: this.mode,
				targetSpeed: this.targetSpeed,
				targetLane: this.targetLane,
				lane: this.lane,
				nearestGap: Number.isFinite(this.nearestGap) ? this.nearestGap : null,
				retiredReason: this.retiredReason,
				recoveries: this.recoveries,
				...this.stats
			};
		}
	};
	//#endregion
	//#region scripts/p08b-driving-evidence-agent.ts
	function toDevice(c = {
		throttle: 0,
		brake: 0,
		steer: 0,
		reverse: false
	}) {
		if (c.reverse) throw Error("Evidence driver requested reverse; recovery needs deliberate production direction input");
		const buttons = Array.from({ length: 17 }, () => ({
			value: 0,
			pressed: false
		}));
		buttons[7] = {
			value: c.throttle,
			pressed: c.throttle > .5
		};
		buttons[6] = {
			value: c.brake,
			pressed: c.brake > .5
		};
		return {
			keys: [],
			focused: true,
			pads: [{
				index: 0,
				id: "P08B labeled evidence-only virtual player",
				connected: true,
				mapping: "standard",
				axes: [
					c.steer === 0 ? 0 : -Math.sign(c.steer) * (.08 + .92 * Math.abs(c.steer) ** (1 / 1.25)),
					0,
					0,
					0
				],
				buttons
			}]
		};
	}
	//#endregion
	//#region scripts/p09c-career-driver.ts
	/** Test-only pedal/steering generator. No pose changes, checkpoint changes or synthetic race results. */
	var EvidenceDriver = class {
		controller;
		constructor(route, seed = 11) {
			this.controller = new RivalController(route, "player", seed, "slingmods-sport-v3");
		}
		sample(t, field, dt = 1 / 60) {
			return toDevice(this.controller.control(t, field, dt));
		}
		inspect() {
			return this.controller.inspect();
		}
	};
	//#endregion
	exports.EvidenceDriver = EvidenceDriver;
	exports.toDevice = toDevice;
	return exports;
})({});
