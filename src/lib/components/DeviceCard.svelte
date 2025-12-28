<script lang="ts">
    import type { DeviceConnection } from '$lib/bluetooth/DeviceConnection.svelte';
    import { EnvironmentalSensing } from '$lib/bluetooth/services/EnvironmentalSensing.svelte';
    import { Fan } from '$lib/bluetooth/services/Fan.svelte';
    import { Servo } from '$lib/bluetooth/services/Servo.svelte';
    import { SERVICES, NEVERMORE_SERVICES, toUuidString } from '$lib/bluetooth/constants/uuids';
    import SensorReading from './SensorReading.svelte';
    import SensorGroup from './SensorGroup.svelte';
    import SliderControl from './SliderControl.svelte';
    import ServoCalibration from './ServoCalibration.svelte';

    let { device, ondisconnect }: { device: DeviceConnection; ondisconnect: () => void } = $props();

    let environmental = $state<EnvironmentalSensing | null>(null);
    let fan = $state<Fan | null>(null);
    let servo = $state<Servo | null>(null);
    let loading = $state(false);

    async function loadServices() {
        loading = true;
        try {
            // Load environmental sensing service
            const envService = await device.getService(
                toUuidString(SERVICES.ENVIRONMENTAL_SENSING)
            );
            if (envService) {
                environmental = new EnvironmentalSensing(envService);
                await environmental.discover();
            }

            // Load fan service
            const fanService = await device.getService(NEVERMORE_SERVICES.FAN);
            if (fanService) {
                fan = new Fan(fanService);
                await fan.discover();
            }

            // Load servo service
            const servoService = await device.getService(NEVERMORE_SERVICES.SERVO);
            if (servoService) {
                servo = new Servo(servoService);
                await servo.discover();
            }
        } catch (e) {
            console.error('Error loading services:', e);
        } finally {
            loading = false;
        }
    }

    let fanPowerOverride = $state(50);
    let servoPosition = $state(0);
    let showServoCalibration = $state(false);

    // Servo calibration state (duty cycle in milliseconds)
    // Standard servo: 20ms period, duty cycle 0.5ms-2.5ms = 2.5%-12.5% = percentage * 0.2
    const SERVO_PERIOD_MS = 20;
    let servoMinDuty = $state(0.5); // ms
    let servoMaxDuty = $state(2.5); // ms

    // Convert duty cycle (ms) to percentage (0-100%)
    function dutyToPercentage(dutyMs: number): number {
        return (dutyMs / SERVO_PERIOD_MS) * 100;
    }

    // Convert percentage (0-100%) to duty cycle (ms)
    function percentageToDuty(percentage: number): number {
        return (percentage / 100) * SERVO_PERIOD_MS;
    }

    // Initialize calibration values from servo range
    $effect(() => {
        if (servo?.range?.value) {
            const range = servo.range.value;
            if (range.start !== null) {
                servoMinDuty = percentageToDuty(range.start);
            }
            if (range.end !== null) {
                servoMaxDuty = percentageToDuty(range.end);
            }
        }
    });

    // Initialize fan power override from current value
    $effect(() => {
        if (fan?.powerOverride?.value !== undefined && fan?.powerOverride?.value !== null) {
            fanPowerOverride = fan.powerOverride.value;
        }
    });

    async function setFanPowerOverride() {
        if (fan) {
            try {
                await fan.setPowerOverride(fanPowerOverride);
            } catch (e) {
                console.error('Error setting fan power override:', e);
            }
        }
    }

    async function clearFanPowerOverride() {
        if (fan) {
            try {
                await fan.setPowerOverride(null);
                fanPowerOverride = 50; // Reset slider to middle
            } catch (e) {
                console.error('Error clearing fan power override:', e);
            }
        }
    }

    async function setServoPosition() {
        if (servo) {
            try {
                await servo.setPosition(servoPosition);
            } catch (e) {
                console.error('Error setting servo position:', e);
            }
        }
    }

    async function adjustServoDuty(target: 'min' | 'max', delta: number) {
        // Adjust the duty cycle value
        if (target === 'min') {
            servoMinDuty = Math.max(0.1, Math.min(20, servoMinDuty + delta));
        } else {
            servoMaxDuty = Math.max(0.1, Math.min(20, servoMaxDuty + delta));
        }

        // Apply the new range with two-step movement
        if (servo) {
            try {
                const startPerc = dutyToPercentage(servoMinDuty);
                const endPerc = dutyToPercentage(servoMaxDuty);

                // First move to center position (50%)
                await servo.setPosition(50);

                // Wait 250ms for servo to actualize the movement
                await new Promise((resolve) => setTimeout(resolve, 250));

                // Apply the new range
                await servo.setRange(startPerc, endPerc);

                // Then move to the target position being calibrated
                const targetPosition = target === 'min' ? 0 : 100;
                await servo.setPosition(targetPosition);
            } catch (e) {
                console.error('Error adjusting servo:', e);
            }
        }
    }

    async function testServoPosition(position: 0 | 100) {
        if (servo) {
            try {
                await servo.setPosition(position);
            } catch (e) {
                console.error('Error testing servo position:', e);
            }
        }
    }

    async function swapServoRange() {
        [servoMinDuty, servoMaxDuty] = [servoMaxDuty, servoMinDuty];

        // Apply the swapped range immediately
        if (servo) {
            try {
                const startPerc = dutyToPercentage(servoMinDuty);
                const endPerc = dutyToPercentage(servoMaxDuty);
                await servo.setRange(startPerc, endPerc);
            } catch (e) {
                console.error('Error swapping servo range:', e);
            }
        }
    }

    // Load services when device connects
    $effect(() => {
        if (device.connected && !environmental && !servo && !loading) {
            loadServices();
        }
    });

    // Cleanup services on component unmount
    $effect(() => {
        return () => {
            if (environmental) {
                environmental.cleanup();
            }
            if (fan) {
                fan.cleanup();
            }
            if (servo) {
                servo.cleanup();
            }
        };
    });
</script>

<div class="device-card">
    <div class="device-header">
        <h2>{device.name}</h2>
        <div class="device-actions">
            <span class="status {device.connected ? 'connected' : 'disconnected'}">
                {device.connected ? '● Connected' : '○ Disconnected'}
            </span>
            <button onclick={ondisconnect} class="disconnect-button" aria-label="Disconnect device">
                <span class="disconnect-text">Disconnect</span>
                <svg
                    class="disconnect-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                >
                    <path
                        d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"
                    />
                    <path
                        fill-rule="evenodd"
                        d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                    />
                </svg>
            </button>
        </div>
    </div>

    {#if device.error}
        <div class="error">{device.error}</div>
    {/if}

    {#if device.connected && environmental}
        <div class="sensors">
            <h3>Environmental Sensors</h3>

            {#if environmental.aggregate?.value}
                {@const data = environmental.aggregate.value}

                <div class="sensor-groups">
                    <SensorGroup label="Intake">
                        {#if data.temperatureIntake !== null}
                            <SensorReading
                                label="Temperature"
                                value={data.temperatureIntake.toFixed(1)}
                                unit="°C"
                            />
                        {/if}

                        {#if data.humidityIntake !== null}
                            <SensorReading
                                label="Humidity"
                                value={data.humidityIntake.toFixed(1)}
                                unit="%"
                            />
                        {/if}

                        {#if data.vocIndexIntake !== null}
                            <SensorReading
                                label="VOC Index"
                                value={data.vocIndexIntake.toString()}
                            />
                        {/if}
                    </SensorGroup>

                    <SensorGroup label="Exhaust">
                        {#if data.temperatureExhaust !== null}
                            <SensorReading
                                label="Temperature"
                                value={data.temperatureExhaust.toFixed(1)}
                                unit="°C"
                            />
                        {/if}

                        {#if data.humidityExhaust !== null}
                            <SensorReading
                                label="Humidity"
                                value={data.humidityExhaust.toFixed(1)}
                                unit="%"
                            />
                        {/if}

                        {#if data.vocIndexExhaust !== null}
                            <SensorReading
                                label="VOC Index"
                                value={data.vocIndexExhaust.toString()}
                            />
                        {/if}
                    </SensorGroup>
                </div>

                {#if environmental.aggregate.lastUpdate}
                    <div class="last-update">
                        Last update: {environmental.aggregate.lastUpdate.toLocaleTimeString()}
                    </div>
                {/if}
            {:else if loading}
                <p>Loading sensors...</p>
            {:else}
                <p>Waiting for sensor data...</p>
            {/if}
        </div>
    {/if}

    {#if device.connected && fan}
        <div class="fan-control">
            <h3>Fan Control</h3>

            {#if fan.aggregate?.value}
                {@const data = fan.aggregate.value}
                <SensorGroup>
                    <SensorReading
                        label="Power"
                        value={data.power !== null ? data.power.toFixed(1) : 'N/A'}
                        unit={data.power !== null ? '%' : ''}
                    />
                    <SensorReading
                        label="Speed"
                        value={data.tachometer !== null ? data.tachometer.toString() : 'N/A'}
                        unit={data.tachometer !== null ? ' RPM' : ''}
                    />
                </SensorGroup>

                {#if fan.aggregate.lastUpdate}
                    <div class="last-update">
                        Last update: {fan.aggregate.lastUpdate.toLocaleTimeString()}
                    </div>
                {/if}
            {:else if loading}
                <p>Loading fan data...</p>
            {:else}
                <p>Waiting for fan data...</p>
            {/if}

            {#if fan.powerOverride}
                <div class="fan-override">
                    <SliderControl
                        label="Power Override"
                        bind:value={fanPowerOverride}
                        min={0}
                        max={100}
                        step={0.5}
                        decimals={1}
                        onchange={setFanPowerOverride}
                    />
                    <button
                        onclick={clearFanPowerOverride}
                        class="clear-button"
                        disabled={fan.powerOverride.value === null}
                    >
                        Clear Override
                    </button>
                </div>
            {/if}
        </div>
    {/if}

    {#if device.connected && servo}
        <div class="servo-control">
            <div class="servo-header">
                <h3>Exhaust Vent</h3>
                <button
                    onclick={() => (showServoCalibration = !showServoCalibration)}
                    class="calibrate-button"
                >
                    {showServoCalibration ? 'Hide' : 'Calibrate'}
                </button>
            </div>

            {#if !showServoCalibration}
                {#if servo.position?.value !== null && servo.position?.value !== undefined}
                    <SensorGroup>
                        <SensorReading
                            label="Current Position"
                            value={servo.position.value.toFixed(1)}
                            unit="%"
                        />
                    </SensorGroup>
                {/if}

                <SliderControl
                    label="Set Position"
                    bind:value={servoPosition}
                    min={0}
                    max={100}
                    step={1}
                    decimals={0}
                    onchange={setServoPosition}
                />

                {#if servo.position?.lastUpdate}
                    <div class="last-update">
                        Last update: {servo.position.lastUpdate.toLocaleTimeString()}
                    </div>
                {/if}
            {:else}
                <!-- Calibration Mode -->
                <ServoCalibration
                    bind:minDutyMs={servoMinDuty}
                    bind:maxDutyMs={servoMaxDuty}
                    currentPosition={servo.position?.value}
                    servoPeriodMs={SERVO_PERIOD_MS}
                    onAdjustMin={(delta) => adjustServoDuty('min', delta)}
                    onAdjustMax={(delta) => adjustServoDuty('max', delta)}
                    onTestMin={() => testServoPosition(0)}
                    onTestMax={() => testServoPosition(100)}
                    onSwap={swapServoRange}
                />
            {/if}
        </div>
    {/if}
</div>

<style>
    .device-card {
        border: 1px solid var(--border-color, #ccc);
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
        background: var(--card-bg, #fff);
        color: var(--text-color, #333);
    }

    .device-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        gap: 1rem;
    }

    .device-header h2 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--text-color, #333);
        flex: 1;
    }

    .device-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .status {
        font-size: 0.9rem;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        white-space: nowrap;
    }

    .status.connected {
        color: var(--success-color, #0a0);
        background: var(--success-bg, #dfd);
    }

    .status.disconnected {
        color: var(--text-muted, #888);
        background: var(--hover-bg, #f0f0f0);
    }

    .error {
        color: var(--error-color, #c00);
        background: var(--error-bg, #fdd);
        padding: 0.5rem;
        border-radius: 4px;
        margin-bottom: 1rem;
    }

    .sensors h3 {
        margin-top: 0;
        font-size: 1.2rem;
        color: var(--text-color, #333);
    }

    .sensor-groups {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin-bottom: 1rem;
    }

    .last-update {
        font-size: 0.85rem;
        color: var(--text-muted, #888);
        font-style: italic;
    }

    .sensors p {
        color: var(--text-muted, #666);
    }

    .disconnect-button {
        padding: 0.375rem 0.75rem;
        background: var(--disconnect-bg, #dc3545);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
        transition: background 0.2s;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .disconnect-button:hover {
        background: var(--disconnect-hover, #c82333);
    }

    .disconnect-icon {
        display: none;
    }

    @media (max-width: 640px) {
        .disconnect-text {
            display: none;
        }

        .disconnect-icon {
            display: block;
        }

        .disconnect-button {
            padding: 0.5rem;
        }
    }

    .fan-control {
        border-top: 1px solid var(--border-color, #ccc);
        padding-top: 1.5rem;
        margin-top: 1.5rem;
    }

    .fan-control h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        font-size: 1.2rem;
        color: var(--text-color, #333);
    }

    .fan-override {
        margin-top: 1.5rem;
    }

    .clear-button {
        margin-top: 0.75rem;
        padding: 0.5rem 1rem;
        background: var(--button-bg, #007bff);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
        transition: background 0.2s;
    }

    .clear-button:hover:not(:disabled) {
        background: var(--button-hover, #0056b3);
    }

    .clear-button:disabled {
        background: var(--text-muted, #888);
        cursor: not-allowed;
        opacity: 0.6;
    }

    .servo-control {
        border-top: 1px solid var(--border-color, #ccc);
        padding-top: 1.5rem;
        margin-top: 1.5rem;
    }

    .servo-control h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        font-size: 1.2rem;
        color: var(--text-color, #333);
    }

    .servo-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .servo-header h3 {
        margin: 0;
    }

    .calibrate-button {
        padding: 0.375rem 0.75rem;
        background: var(--sensor-bg, #f8f8f8);
        color: var(--text-color, #333);
        border: 1px solid var(--border-color, #ccc);
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 600;
        transition: all 0.2s;
    }

    .calibrate-button:hover {
        background: var(--hover-bg, #f0f0f0);
    }
</style>
