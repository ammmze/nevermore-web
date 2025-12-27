import { NotifyCharacteristic, ReadOnlyCharacteristic } from '../characteristics/BaseCharacteristic.svelte';
import { NEVERMORE_CHARACTERISTICS, STANDARD_CHARACTERISTICS, toUuidString } from '../constants/uuids';
import {
	parseEnvironmentalAggregate,
	parseHumidity,
	parsePressure,
	parseTemperature,
	parseVocIndex,
	parseVocRaw,
	type EnvironmentalData
} from '../utils/parsers';

export class EnvironmentalSensing {
	service: BluetoothRemoteGATTService;

	// Individual sensor characteristics
	temperatureIntake = $state<ReadOnlyCharacteristic<number | null> | null>(null);
	temperatureExhaust = $state<ReadOnlyCharacteristic<number | null> | null>(null);
	temperatureMcu = $state<ReadOnlyCharacteristic<number | null> | null>(null);

	humidityIntake = $state<ReadOnlyCharacteristic<number | null> | null>(null);
	humidityExhaust = $state<ReadOnlyCharacteristic<number | null> | null>(null);

	pressureIntake = $state<ReadOnlyCharacteristic<number | null> | null>(null);
	pressureExhaust = $state<ReadOnlyCharacteristic<number | null> | null>(null);

	vocIndexIntake = $state<ReadOnlyCharacteristic<number | null> | null>(null);
	vocIndexExhaust = $state<ReadOnlyCharacteristic<number | null> | null>(null);

	vocRawIntake = $state<ReadOnlyCharacteristic<number | null> | null>(null);
	vocRawExhaust = $state<ReadOnlyCharacteristic<number | null> | null>(null);

	// Aggregated data (includes all sensors in one notification)
	aggregate = $state<NotifyCharacteristic<EnvironmentalData> | null>(null);

	constructor(service: BluetoothRemoteGATTService) {
		this.service = service;
	}

	async discover(): Promise<void> {
		try {
			const characteristics = await this.service.getCharacteristics();

			// Group characteristics by UUID (there are multiples of each type)
			const tempChars: BluetoothRemoteGATTCharacteristic[] = [];
			const humidityChars: BluetoothRemoteGATTCharacteristic[] = [];
			const pressureChars: BluetoothRemoteGATTCharacteristic[] = [];
			const vocIndexChars: BluetoothRemoteGATTCharacteristic[] = [];
			const vocRawChars: BluetoothRemoteGATTCharacteristic[] = [];

			for (const char of characteristics) {
				const uuid = char.uuid.toLowerCase();

				if (uuid === toUuidString(STANDARD_CHARACTERISTICS.TEMPERATURE).toLowerCase()) {
					tempChars.push(char);
				} else if (uuid === toUuidString(STANDARD_CHARACTERISTICS.HUMIDITY).toLowerCase()) {
					humidityChars.push(char);
				} else if (uuid === toUuidString(STANDARD_CHARACTERISTICS.PRESSURE).toLowerCase()) {
					pressureChars.push(char);
				} else if (uuid === NEVERMORE_CHARACTERISTICS.VOC_INDEX.toLowerCase()) {
					vocIndexChars.push(char);
				} else if (uuid === NEVERMORE_CHARACTERISTICS.VOC_RAW.toLowerCase()) {
					vocRawChars.push(char);
				} else if (uuid === NEVERMORE_CHARACTERISTICS.ENV_AGGREGATE.toLowerCase()) {
					this.aggregate = new NotifyCharacteristic(char, parseEnvironmentalAggregate);
					await this.aggregate.subscribe();
				}
			}

			// Assign characteristics in order (intake, exhaust, mcu for temp)
			if (tempChars[0]) this.temperatureIntake = new ReadOnlyCharacteristic(tempChars[0], parseTemperature);
			if (tempChars[1]) this.temperatureExhaust = new ReadOnlyCharacteristic(tempChars[1], parseTemperature);
			if (tempChars[2]) this.temperatureMcu = new ReadOnlyCharacteristic(tempChars[2], parseTemperature);

			if (humidityChars[0]) this.humidityIntake = new ReadOnlyCharacteristic(humidityChars[0], parseHumidity);
			if (humidityChars[1]) this.humidityExhaust = new ReadOnlyCharacteristic(humidityChars[1], parseHumidity);

			if (pressureChars[0]) this.pressureIntake = new ReadOnlyCharacteristic(pressureChars[0], parsePressure);
			if (pressureChars[1]) this.pressureExhaust = new ReadOnlyCharacteristic(pressureChars[1], parsePressure);

			if (vocIndexChars[0]) this.vocIndexIntake = new ReadOnlyCharacteristic(vocIndexChars[0], parseVocIndex);
			if (vocIndexChars[1]) this.vocIndexExhaust = new ReadOnlyCharacteristic(vocIndexChars[1], parseVocIndex);

			if (vocRawChars[0]) this.vocRawIntake = new ReadOnlyCharacteristic(vocRawChars[0], parseVocRaw);
			if (vocRawChars[1]) this.vocRawExhaust = new ReadOnlyCharacteristic(vocRawChars[1], parseVocRaw);

		} catch (e) {
			console.error('Error discovering environmental characteristics:', e);
		}
	}

	async cleanup(): Promise<void> {
		if (this.aggregate?.isSubscribed) {
			await this.aggregate.unsubscribe();
		}
	}
}
