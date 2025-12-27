import {
    NEVERMORE_SERVICES,
    NEVERMORE_CHARACTERISTICS,
    STANDARD_CHARACTERISTICS,
    toUuidString
} from '../constants/uuids';
import {
    NotifyCharacteristic,
    ReadOnlyCharacteristic,
    WriteableCharacteristic
} from '../characteristics/BaseCharacteristic.svelte';
import {
    parsePercentage16,
    parseServoRange,
    encodePercentage16,
    encodeServoRange,
    type ServoRangeData
} from '../utils/parsers';

export class Servo {
    private service: BluetoothRemoteGATTService;

    // Servo position (current actuator position) - NOTIFY + READ + WRITE
    position = $state<NotifyCharacteristic<number | null> | null>(null);

    // Servo PWM range (start/end percentages) - READ + WRITE
    range = $state<WriteableCharacteristic<ServoRangeData> | null>(null);

    constructor(service: BluetoothRemoteGATTService) {
        this.service = service;
    }

    async discover(): Promise<void> {
        try {
            // Servo Actuator Position - NOTIFY + READ + WRITE (Percentage16_10)
            const positionChar = await this.service.getCharacteristic(
                NEVERMORE_CHARACTERISTICS.SERVO_POSITION
            );
            if (positionChar) {
                this.position = new NotifyCharacteristic(positionChar, parsePercentage16);
                // Subscribe to notifications for real-time updates
                await this.position.subscribe();
                // Also read initial value
                await this.position.read();
            }

            // Servo Range (start/end PWM) - READ + WRITE
            const rangeChar = await this.service.getCharacteristic(
                NEVERMORE_CHARACTERISTICS.SERVO_RANGE
            );
            if (rangeChar) {
                this.range = new WriteableCharacteristic(
                    rangeChar,
                    parseServoRange,
                    encodeServoRange
                );
                await this.range.read();
            }
        } catch (e) {
            console.error('Error discovering servo characteristics:', e);
        }
    }

    // Helper to write position (0-100%)
    async setPosition(percentage: number): Promise<void> {
        if (!this.position) {
            throw new Error('Servo position characteristic not available');
        }

        // Clamp to 0-100%
        const clamped = Math.max(0, Math.min(100, percentage));

        // Convert to WriteableCharacteristic and write
        const writeChar = new WriteableCharacteristic(
            (this.position as any).characteristic,
            parsePercentage16,
            encodePercentage16
        );
        await writeChar.write(clamped);

        // Read back the value to ensure UI updates
        // (in case device doesn't send notification immediately)
        await this.position.read();
    }

    // Helper to write range
    async setRange(start: number, end: number): Promise<void> {
        if (!this.range) {
            throw new Error('Servo range characteristic not available');
        }

        // Clamp to 0-100%
        const clampedStart = Math.max(0, Math.min(100, start));
        const clampedEnd = Math.max(0, Math.min(100, end));

        await this.range.write({ start: clampedStart, end: clampedEnd });
    }

    cleanup(): void {
        if (this.position && (this.position as any).unsubscribe) {
            (this.position as any).unsubscribe();
        }
    }
}
