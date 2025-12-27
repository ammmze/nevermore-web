import { NEVERMORE_SERVICES, NEVERMORE_CHARACTERISTICS, STANDARD_CHARACTERISTICS, toUuidString } from '../constants/uuids';
import { NotifyCharacteristic, ReadOnlyCharacteristic, WriteableCharacteristic } from '../characteristics/BaseCharacteristic.svelte';
import { parsePercentage8, parseFanPowerTachoAggregate, encodePercentage8, type FanPowerTachoData } from '../utils/parsers';

export class Fan {
	private service: BluetoothRemoteGATTService;

	// Fan power & tachometer aggregate - NOTIFY + READ
	aggregate = $state<NotifyCharacteristic<FanPowerTachoData> | null>(null);

	// Power override characteristic (writable)
	powerOverride = $state<WriteableCharacteristic<number | null> | null>(null);

	constructor(service: BluetoothRemoteGATTService) {
		this.service = service;
	}

	async discover(): Promise<void> {
		try {
			// Get the power & tachometer aggregate characteristic
			const aggregateChar = await this.service.getCharacteristic(NEVERMORE_CHARACTERISTICS.FAN_POWER_TACHO_AGGREGATE);
			if (aggregateChar) {
				this.aggregate = new NotifyCharacteristic(aggregateChar, parseFanPowerTachoAggregate);
				await this.aggregate.subscribe();
				await this.aggregate.read();
			}

			// Get all Percentage8 characteristics and find power override by description
			const allChars = await this.service.getCharacteristics(toUuidString(STANDARD_CHARACTERISTICS.PERCENTAGE_8));

			// Find the power override characteristic by its user description
			if (allChars) {
				for (let i = 0; i < allChars.length; i++) {
					try {
						const descriptors = await allChars[i].getDescriptors();
						for (const desc of descriptors) {
							if (desc.uuid === '00002901-0000-1000-8000-00805f9b34fb') { // User Description UUID
								const value = await desc.readValue();
								const description = new TextDecoder().decode(value);

								// Match "Fan % - Override" description
								if (description.includes('Override') && !description.includes('Kick-start')) {
									this.powerOverride = new WriteableCharacteristic(allChars[i], parsePercentage8, encodePercentage8);
									await this.powerOverride.read();
									break;
								}
							}
						}
						if (this.powerOverride) break;
					} catch (e) {
						// Skip characteristics without descriptors
					}
				}
			}
		} catch (e) {
			console.error('Error discovering fan characteristics:', e);
		}
	}

	// Helper to write power override (0-100% or null to disable)
	async setPowerOverride(percentage: number | null): Promise<void> {
		if (!this.powerOverride) {
			throw new Error('Fan power override characteristic not available');
		}
		await this.powerOverride.write(percentage);

		// Read back aggregate to update UI
		if (this.aggregate) {
			await this.aggregate.read();
		}
	}

	cleanup(): void {
		if (this.aggregate && (this.aggregate as any).unsubscribe) {
			(this.aggregate as any).unsubscribe();
		}
	}
}
