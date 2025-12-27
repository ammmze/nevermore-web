export abstract class BaseCharacteristic<T> {
	characteristic: BluetoothRemoteGATTCharacteristic;
	value = $state<T | null>(null);
	lastUpdate = $state<Date | null>(null);
	error = $state<string | null>(null);

	constructor(characteristic: BluetoothRemoteGATTCharacteristic) {
		this.characteristic = characteristic;
	}

	protected abstract parse(dataView: DataView): T;

	async read(): Promise<T | null> {
		try {
			const dataView = await this.characteristic.readValue();
			this.value = this.parse(dataView);
			this.lastUpdate = new Date();
			this.error = null;
			return this.value;
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Unknown error';
			return null;
		}
	}
}

export class NotifyCharacteristic<T> extends BaseCharacteristic<T> {
	isSubscribed = $state(false);
	private parser: (dataView: DataView) => T;

	constructor(characteristic: BluetoothRemoteGATTCharacteristic, parser: (dataView: DataView) => T) {
		super(characteristic);
		this.parser = parser;
	}

	protected parse(dataView: DataView): T {
		return this.parser(dataView);
	}

	async subscribe(): Promise<boolean> {
		try {
			await this.characteristic.startNotifications();
			this.characteristic.addEventListener('characteristicvaluechanged', this.handleChange);
			this.isSubscribed = true;
			this.error = null;
			return true;
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to subscribe';
			return false;
		}
	}

	async unsubscribe(): Promise<void> {
		try {
			this.characteristic.removeEventListener('characteristicvaluechanged', this.handleChange);
			await this.characteristic.stopNotifications();
			this.isSubscribed = false;
			this.error = null;
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to unsubscribe';
		}
	}

	private handleChange = (event: Event) => {
		const target = event.target as BluetoothRemoteGATTCharacteristic;
		if (target.value) {
			this.value = this.parse(target.value);
			this.lastUpdate = new Date();
		}
	};
}

export class ReadOnlyCharacteristic<T> extends BaseCharacteristic<T> {
	private parser: (dataView: DataView) => T;

	constructor(characteristic: BluetoothRemoteGATTCharacteristic, parser: (dataView: DataView) => T) {
		super(characteristic);
		this.parser = parser;
	}

	protected parse(dataView: DataView): T {
		return this.parser(dataView);
	}
}

export class WriteableCharacteristic<T> extends BaseCharacteristic<T> {
	private parser: (dataView: DataView) => T;
	private encoder: (value: T) => Uint8Array;
	isWriting = $state(false);

	constructor(
		characteristic: BluetoothRemoteGATTCharacteristic,
		parser: (dataView: DataView) => T,
		encoder: (value: T) => Uint8Array
	) {
		super(characteristic);
		this.parser = parser;
		this.encoder = encoder;
	}

	protected parse(dataView: DataView): T {
		return this.parser(dataView);
	}

	async write(value: T): Promise<boolean> {
		this.isWriting = true;
		try {
			const encoded = this.encoder(value);
			await this.characteristic.writeValue(encoded as BufferSource);
			this.value = value;
			this.lastUpdate = new Date();
			this.error = null;
			return true;
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to write';
			return false;
		} finally {
			this.isWriting = false;
		}
	}
}
