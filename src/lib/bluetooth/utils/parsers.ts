import { NOT_KNOWN } from '../constants/uuids';

// BLE Scalar format: value = raw_value * M * 10^d * 2^b
// All values are little-endian

export interface EnvironmentalData {
	temperatureIntake: number | null;
	temperatureExhaust: number | null;
	temperatureMcu: number | null;
	humidityIntake: number | null;
	humidityExhaust: number | null;
	pressureIntake: number | null;
	pressureExhaust: number | null;
	vocIndexIntake: number | null;
	vocIndexExhaust: number | null;
	vocRawIntake: number | null;
	vocRawExhaust: number | null;
}

export interface FanPowerTachoData {
	power: number | null;
	tachometer: number | null;
}

export interface FanAggregateData extends FanPowerTachoData {
	powerOverride: number | null;
	powerPassive: number | null;
	powerAutomatic: number | null;
	powerCoefficient: number | null;
}

export interface ThermalLimitData {
	lower: number | null;
	upper: number | null;
	scaler: number | null;
}

export interface ServoRangeData {
	start: number | null;
	end: number | null;
}

// Temperature: int16_t, M=1, d=-2, b=0 → multiply by 0.01 (°C)
export function parseTemperature(dataView: DataView): number | null {
	const raw = dataView.getInt16(0, true);
	if (raw === NOT_KNOWN.TEMPERATURE) return null;
	return raw * 0.01;
}

// Humidity: uint16_t, M=1, d=-2, b=0 → multiply by 0.01 (%)
export function parseHumidity(dataView: DataView): number | null {
	const raw = dataView.getUint16(0, true);
	if (raw === NOT_KNOWN.HUMIDITY) return null;
	return raw * 0.01;
}

// Pressure: uint32_t, M=1, d=-1, b=0 → multiply by 0.1 (Pa)
export function parsePressure(dataView: DataView): number | null {
	const raw = dataView.getUint32(0, true);
	if (raw === NOT_KNOWN.PRESSURE) return null;
	return raw * 0.1;
}

// Percentage8: uint8_t, M=1, d=0, b=-1 → multiply by 0.5 (%)
export function parsePercentage8(dataView: DataView): number | null {
	const raw = dataView.getUint8(0);
	if (raw === NOT_KNOWN.PERCENTAGE_8) return null;
	return raw * 0.5;
}

// Percentage16_10: uint16_t, M=1, d=-2, b=0 → multiply by 0.01 (%)
export function parsePercentage16(dataView: DataView): number | null {
	const raw = dataView.getUint16(0, true);
	if (raw === NOT_KNOWN.PERCENTAGE_16) return null;
	return raw * 0.01;
}

// VOC Index: uint16_t, unitless (0-500 range)
export function parseVocIndex(dataView: DataView): number | null {
	const raw = dataView.getUint16(0, true);
	if (raw === 0xFFFF) return null;
	return raw;
}

// VOC Raw: uint16_t
export function parseVocRaw(dataView: DataView): number | null {
	const raw = dataView.getUint16(0, true);
	if (raw === 0xFFFF) return null;
	return raw;
}

// RPM: uint16_t
export function parseRpm(dataView: DataView): number | null {
	const raw = dataView.getUint16(0, true);
	if (raw === 0xFFFF) return null;
	return raw;
}

// TimeSecond16: uint16_t, seconds
export function parseTimeSecond16(dataView: DataView): number | null {
	const raw = dataView.getUint16(0, true);
	if (raw === NOT_KNOWN.TIME_SECOND_16) return null;
	return raw;
}

// TimeMilli24: uint24_t (3 bytes), M=1, d=-3, b=0 → multiply by 0.001 (seconds)
export function parseTimeMilli24(dataView: DataView): number | null {
	const byte0 = dataView.getUint8(0);
	const byte1 = dataView.getUint8(1);
	const byte2 = dataView.getUint8(2);
	const raw = byte0 | (byte1 << 8) | (byte2 << 16);
	if (raw === NOT_KNOWN.TIME_MILLI_24) return null;
	return raw * 0.001;
}

// Count16: uint16_t
export function parseCount16(dataView: DataView): number | null {
	const raw = dataView.getUint16(0, true);
	if (raw === NOT_KNOWN.COUNT_16) return null;
	return raw;
}

// Environmental Aggregation (28 bytes)
export function parseEnvironmentalAggregate(dataView: DataView): EnvironmentalData {
	let offset = 0;

	const temperatureIntake = parseTemperature(new DataView(dataView.buffer, offset, 2));
	offset += 2;
	const temperatureExhaust = parseTemperature(new DataView(dataView.buffer, offset, 2));
	offset += 2;
	const temperatureMcu = parseTemperature(new DataView(dataView.buffer, offset, 2));
	offset += 2;

	const humidityIntake = parseHumidity(new DataView(dataView.buffer, offset, 2));
	offset += 2;
	const humidityExhaust = parseHumidity(new DataView(dataView.buffer, offset, 2));
	offset += 2;

	const pressureIntake = parsePressure(new DataView(dataView.buffer, offset, 4));
	offset += 4;
	const pressureExhaust = parsePressure(new DataView(dataView.buffer, offset, 4));
	offset += 4;

	const vocIndexIntake = parseVocIndex(new DataView(dataView.buffer, offset, 2));
	offset += 2;
	const vocIndexExhaust = parseVocIndex(new DataView(dataView.buffer, offset, 2));
	offset += 2;

	const vocRawIntake = parseVocRaw(new DataView(dataView.buffer, offset, 2));
	offset += 2;
	const vocRawExhaust = parseVocRaw(new DataView(dataView.buffer, offset, 2));

	return {
		temperatureIntake,
		temperatureExhaust,
		temperatureMcu,
		humidityIntake,
		humidityExhaust,
		pressureIntake,
		pressureExhaust,
		vocIndexIntake,
		vocIndexExhaust,
		vocRawIntake,
		vocRawExhaust
	};
}

// Fan Power & Tachometer Aggregation (3 bytes)
export function parseFanPowerTachoAggregate(dataView: DataView): FanPowerTachoData {
	const power = parsePercentage8(new DataView(dataView.buffer, 0, 1));
	const tachometer = parseRpm(new DataView(dataView.buffer, 1, 2));

	return { power, tachometer };
}

// Fan Service Aggregation (7 bytes)
export function parseFanAggregate(dataView: DataView): FanAggregateData {
	let offset = 0;

	const power = parsePercentage8(new DataView(dataView.buffer, offset, 1));
	offset += 1;
	const powerOverride = parsePercentage8(new DataView(dataView.buffer, offset, 1));
	offset += 1;
	const powerPassive = parsePercentage8(new DataView(dataView.buffer, offset, 1));
	offset += 1;
	const powerAutomatic = parsePercentage8(new DataView(dataView.buffer, offset, 1));
	offset += 1;
	const powerCoefficient = parsePercentage8(new DataView(dataView.buffer, offset, 1));
	offset += 1;
	const tachometer = parseRpm(new DataView(dataView.buffer, offset, 2));

	return {
		power,
		powerOverride,
		powerPassive,
		powerAutomatic,
		powerCoefficient,
		tachometer
	};
}

// Thermal Limit Settings (6 bytes)
export function parseThermalLimit(dataView: DataView): ThermalLimitData {
	const lower = parseTemperature(new DataView(dataView.buffer, 0, 2));
	const upper = parseTemperature(new DataView(dataView.buffer, 2, 2));
	const scaler = parsePercentage16(new DataView(dataView.buffer, 4, 2));

	return { lower, upper, scaler };
}

// Servo Range (4 bytes)
export function parseServoRange(dataView: DataView): ServoRangeData {
	const start = parsePercentage16(new DataView(dataView.buffer, 0, 2));
	const end = parsePercentage16(new DataView(dataView.buffer, 2, 2));

	return { start, end };
}

// Encoding functions for writes

export function encodePercentage8(value: number | null): Uint8Array {
	const buffer = new Uint8Array(1);
	if (value === null) {
		buffer[0] = NOT_KNOWN.PERCENTAGE_8;
	} else {
		buffer[0] = Math.round(value / 0.5);
	}
	return buffer;
}

export function encodePercentage16(value: number | null): Uint8Array {
	const buffer = new Uint8Array(2);
	const dataView = new DataView(buffer.buffer);
	if (value === null) {
		dataView.setUint16(0, NOT_KNOWN.PERCENTAGE_16, true);
	} else {
		dataView.setUint16(0, Math.round(value / 0.01), true);
	}
	return buffer;
}

export function encodeTimeSecond16(value: number | null): Uint8Array {
	const buffer = new Uint8Array(2);
	const dataView = new DataView(buffer.buffer);
	if (value === null) {
		dataView.setUint16(0, NOT_KNOWN.TIME_SECOND_16, true);
	} else {
		dataView.setUint16(0, Math.round(value), true);
	}
	return buffer;
}

export function encodeTimeMilli24(value: number | null): Uint8Array {
	const buffer = new Uint8Array(3);
	if (value === null) {
		buffer[0] = 0xFF;
		buffer[1] = 0xFF;
		buffer[2] = 0xFF;
	} else {
		const raw = Math.round(value / 0.001);
		buffer[0] = raw & 0xFF;
		buffer[1] = (raw >> 8) & 0xFF;
		buffer[2] = (raw >> 16) & 0xFF;
	}
	return buffer;
}

export function encodeCount16(value: number | null): Uint8Array {
	const buffer = new Uint8Array(2);
	const dataView = new DataView(buffer.buffer);
	if (value === null) {
		dataView.setUint16(0, NOT_KNOWN.COUNT_16, true);
	} else {
		dataView.setUint16(0, Math.round(value), true);
	}
	return buffer;
}

export function encodeVocIndex(value: number | null): Uint8Array {
	const buffer = new Uint8Array(2);
	const dataView = new DataView(buffer.buffer);
	if (value === null) {
		dataView.setUint16(0, 0xFFFF, true);
	} else {
		dataView.setUint16(0, Math.round(value), true);
	}
	return buffer;
}

export function encodeThermalLimit(data: ThermalLimitData): Uint8Array {
	const buffer = new Uint8Array(6);
	const dataView = new DataView(buffer.buffer);

	// Lower temperature
	if (data.lower === null) {
		dataView.setInt16(0, NOT_KNOWN.TEMPERATURE, true);
	} else {
		dataView.setInt16(0, Math.round(data.lower / 0.01), true);
	}

	// Upper temperature
	if (data.upper === null) {
		dataView.setInt16(2, NOT_KNOWN.TEMPERATURE, true);
	} else {
		dataView.setInt16(2, Math.round(data.upper / 0.01), true);
	}

	// Scaler percentage
	if (data.scaler === null) {
		dataView.setUint16(4, NOT_KNOWN.PERCENTAGE_16, true);
	} else {
		dataView.setUint16(4, Math.round(data.scaler / 0.01), true);
	}

	return buffer;
}

export function encodeServoRange(data: ServoRangeData): Uint8Array {
	const buffer = new Uint8Array(4);
	const dataView = new DataView(buffer.buffer);

	if (data.start === null) {
		dataView.setUint16(0, NOT_KNOWN.PERCENTAGE_16, true);
	} else {
		dataView.setUint16(0, Math.round(data.start / 0.01), true);
	}

	if (data.end === null) {
		dataView.setUint16(2, NOT_KNOWN.PERCENTAGE_16, true);
	} else {
		dataView.setUint16(2, Math.round(data.end / 0.01), true);
	}

	return buffer;
}
