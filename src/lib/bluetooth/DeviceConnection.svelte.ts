import { NEVERMORE_SERVICES, SERVICES, toUuidString } from './constants/uuids';

export class DeviceConnection {
    device: BluetoothDevice;
    server = $state<BluetoothRemoteGATTServer | null>(null);
    connected = $state(false);
    connecting = $state(false);
    error = $state<string | null>(null);

    // Services will be populated during discovery
    services = $state<Map<string, BluetoothRemoteGATTService>>(new Map());

    constructor(device: BluetoothDevice) {
        this.device = device;

        // Listen for disconnection
        device.addEventListener('gattserverdisconnected', this.handleDisconnected);
    }

    get id(): string {
        return this.device.id;
    }

    get name(): string {
        return this.device.name || 'Unknown Device';
    }

    async connect(): Promise<boolean> {
        if (this.connecting || this.connected) return this.connected;

        this.connecting = true;
        this.error = null;

        try {
            this.server = (await this.device.gatt?.connect()) || null;
            this.connected = true;
            await this.discoverServices();
            return true;
        } catch (e) {
            this.error = e instanceof Error ? e.message : 'Failed to connect';
            this.connected = false;
            return false;
        } finally {
            this.connecting = false;
        }
    }

    async disconnect(): Promise<void> {
        try {
            this.device.gatt?.disconnect();
            this.connected = false;
            this.server = null;
            this.services.clear();
            this.error = null;
        } catch (e) {
            this.error = e instanceof Error ? e.message : 'Failed to disconnect';
        }
    }

    private async discoverServices(): Promise<void> {
        if (!this.server) return;

        try {
            // Try to get all available services
            const serviceUuids = [
                toUuidString(SERVICES.ENVIRONMENTAL_SENSING),
                NEVERMORE_SERVICES.FAN,
                NEVERMORE_SERVICES.FAN_POLICY,
                NEVERMORE_SERVICES.NEOPIXEL,
                NEVERMORE_SERVICES.DISPLAY,
                NEVERMORE_SERVICES.PHOTOCATALYTIC,
                NEVERMORE_SERVICES.COOLER,
                NEVERMORE_SERVICES.SERVO,
                NEVERMORE_SERVICES.CONFIGURATION
            ];

            for (const uuid of serviceUuids) {
                try {
                    const service = await this.server.getPrimaryService(uuid);
                    this.services.set(uuid, service);
                } catch {
                    // Service not available on this device, skip
                }
            }
        } catch (e) {
            console.error('Error discovering services:', e);
        }
    }

    async getService(uuid: string): Promise<BluetoothRemoteGATTService | null> {
        // Check if we already have it
        if (this.services.has(uuid)) {
            return this.services.get(uuid) || null;
        }

        // Try to get it
        if (!this.server) return null;

        try {
            const service = await this.server.getPrimaryService(uuid);
            this.services.set(uuid, service);
            return service;
        } catch {
            return null;
        }
    }

    private handleDisconnected = () => {
        this.connected = false;
        this.server = null;
        this.services.clear();
    };

    cleanup(): void {
        this.device.removeEventListener('gattserverdisconnected', this.handleDisconnected);
    }
}
