import { DeviceConnection } from './DeviceConnection.svelte';
import { NEVERMORE_SERVICES, SERVICES, toUuidString } from './constants/uuids';

class BluetoothManager {
	devices = $state<Map<string, DeviceConnection>>(new Map());
	isScanning = $state(false);
	error = $state<string | null>(null);
	isSupported = $state(false);

	constructor() {
		// Check if Web Bluetooth is supported
		if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
			this.isSupported = true;
		}
	}

	async requestDevice(): Promise<DeviceConnection | null> {
		if (!this.isSupported) {
			this.error = 'Web Bluetooth is not supported in this browser';
			return null;
		}

		this.isScanning = true;
		this.error = null;

		try {
			const device = await navigator.bluetooth.requestDevice({
				filters: [
					{ namePrefix: 'Nevermore' }
				],
				optionalServices: [
					toUuidString(SERVICES.ENVIRONMENTAL_SENSING),
					toUuidString(SERVICES.DEVICE_INFORMATION),
					NEVERMORE_SERVICES.FAN,
					NEVERMORE_SERVICES.FAN_POLICY,
					NEVERMORE_SERVICES.NEOPIXEL,
					NEVERMORE_SERVICES.DISPLAY,
					NEVERMORE_SERVICES.PHOTOCATALYTIC,
					NEVERMORE_SERVICES.COOLER,
					NEVERMORE_SERVICES.SERVO,
					NEVERMORE_SERVICES.CONFIGURATION
				]
			});

			const connection = new DeviceConnection(device);
			this.devices.set(connection.id, connection);

			// Auto-connect
			await connection.connect();

			return connection;
		} catch (e) {
			if (e instanceof Error && e.name === 'NotFoundError') {
				// User cancelled, not really an error
				this.error = null;
			} else {
				this.error = e instanceof Error ? e.message : 'Failed to request device';
			}
			return null;
		} finally {
			this.isScanning = false;
		}
	}

	getDevice(id: string): DeviceConnection | null {
		return this.devices.get(id) || null;
	}

	async disconnectDevice(id: string): Promise<void> {
		const device = this.devices.get(id);
		if (device) {
			await device.disconnect();
			device.cleanup();
			this.devices.delete(id);
		}
	}

	async disconnectAll(): Promise<void> {
		for (const [id, device] of this.devices) {
			await device.disconnect();
			device.cleanup();
		}
		this.devices.clear();
	}

	get connectedDevices(): DeviceConnection[] {
		return Array.from(this.devices.values()).filter(d => d.connected);
	}

	get deviceCount(): number {
		return this.devices.size;
	}

	get connectedCount(): number {
		return this.connectedDevices.length;
	}
}

// Export singleton instance
export const bluetoothManager = new BluetoothManager();
