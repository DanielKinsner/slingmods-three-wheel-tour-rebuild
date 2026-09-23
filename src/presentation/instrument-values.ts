import type {VehicleTelemetry} from '../simulation';
export function displayValues(t:Pick<VehicleTelemetry,'speed'|'rpm'|'gear'|'powertrain'>,metric=false){return{speed:Math.round(Math.abs(t.speed)*(metric?3.6:2.23694)),units:metric?'km/h':'mph',rpm:Math.round(t.rpm/10)*10,gear:t.gear<0?'R':t.gear===0?'N':t.powertrain==='cvt'?'D':String(t.gear)}}
