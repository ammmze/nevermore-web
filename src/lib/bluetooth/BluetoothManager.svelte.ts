import { DeviceConnection } from './DeviceConnection.svelte';
import { NEVERMORE_SERVICES, SERVICES, toUuidString } from './constants/uuids';

class BluetoothManager {
    private _devices = $state<Map<string, DeviceConnection>>(new Map());
    isScanning = $state(false);
    error = $state<string | null>(null);
    isSupported = $state(false);

    // Expose devices as a reactive array
    get devices() {
        return Array.from(this._devices.values());
    }

    get devicesMap() {
        return this._devices;
    }

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
                filters: [{ namePrefix: 'Nevermore' }],
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
            this._devices.set(connection.id, connection);
            // Trigger reactivity by reassigning
            this._devices = new Map(this._devices);

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
        return this._devices.get(id) || null;
    }

    async disconnectDevice(id: string): Promise<void> {
        const device = this._devices.get(id);
        if (device) {
            await device.disconnect();
            device.cleanup();
            this._devices.delete(id);
            // Trigger reactivity
            this._devices = new Map(this._devices);
        }
    }

    async disconnectAll(): Promise<void> {
        for (const [id, device] of this._devices) {
            await device.disconnect();
            device.cleanup();
        }
        this._devices.clear();
        // Trigger reactivity
        this._devices = new Map(this._devices);
    }

    get connectedDevices(): DeviceConnection[] {
        return this.devices.filter((d) => d.connected);
    }

    get deviceCount(): number {
        return this.devices.length;
    }

    get connectedCount(): number {
        return this.connectedDevices.length;
    }
}

// Export singleton instance
export const bluetoothManager = new BluetoothManager();
