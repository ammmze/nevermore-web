<script lang="ts">
    import type { DeviceConnection } from '$lib/bluetooth/DeviceConnection.svelte';
    import { EnvironmentalSensing } from '$lib/bluetooth/services/EnvironmentalSensing.svelte';
    import { Fan } from '$lib/bluetooth/services/Fan.svelte';
    import { Servo } from '$lib/bluetooth/services/Servo.svelte';
    import { SERVICES, NEVERMORE_SERVICES, toUuidString } from '$lib/bluetooth/constants/uuids';

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

        // Immediately apply the new range
        if (servo) {
            try {
                const startPerc = dutyToPercentage(servoMinDuty);
                const endPerc = dutyToPercentage(servoMaxDuty);
                await servo.setRange(startPerc, endPerc);
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
            <button onclick={ondisconnect} class="disconnect-button"> Disconnect </button>
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
                    <div class="sensor-group">
                        <h4>Intake</h4>
                        <div class="sensor-grid">
                            {#if data.temperatureIntake !== null}
                                <div class="sensor-reading">
                                    <span class="label">Temperature</span>
                                    <span class="value">{data.temperatureIntake.toFixed(1)}°C</span>
                                </div>
                            {/if}

                            {#if data.humidityIntake !== null}
                                <div class="sensor-reading">
                                    <span class="label">Humidity</span>
                                    <span class="value">{data.humidityIntake.toFixed(1)}%</span>
                                </div>
                            {/if}

                            {#if data.vocIndexIntake !== null}
                                <div class="sensor-reading">
                                    <span class="label">VOC Index</span>
                                    <span class="value">{data.vocIndexIntake}</span>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <div class="sensor-group">
                        <h4>Exhaust</h4>
                        <div class="sensor-grid">
                            {#if data.temperatureExhaust !== null}
                                <div class="sensor-reading">
                                    <span class="label">Temperature</span>
                                    <span class="value">{data.temperatureExhaust.toFixed(1)}°C</span
                                    >
                                </div>
                            {/if}

                            {#if data.humidityExhaust !== null}
                                <div class="sensor-reading">
                                    <span class="label">Humidity</span>
                                    <span class="value">{data.humidityExhaust.toFixed(1)}%</span>
                                </div>
                            {/if}

                            {#if data.vocIndexExhaust !== null}
                                <div class="sensor-reading">
                                    <span class="label">VOC Index</span>
                                    <span class="value">{data.vocIndexExhaust}</span>
                                </div>
                            {/if}
                        </div>
                    </div>
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
                <div class="fan-readings">
                    <div class="fan-reading">
                        <span class="label">Power</span>
                        <span class="value"
                            >{data.power !== null ? data.power.toFixed(1) + '%' : 'N/A'}</span
                        >
                    </div>
                    <div class="fan-reading">
                        <span class="label">Speed</span>
                        <span class="value"
                            >{data.tachometer !== null ? data.tachometer + ' RPM' : 'N/A'}</span
                        >
                    </div>
                </div>

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
                    <label for="fan-override">Power Override</label>
                    <div class="slider-container">
                        <input
                            type="range"
                            id="fan-override"
                            min="0"
                            max="100"
                            step="0.5"
                            bind:value={fanPowerOverride}
                            onchange={setFanPowerOverride}
                            class="fan-slider"
                        />
                        <span class="slider-value">{fanPowerOverride.toFixed(1)}%</span>
                    </div>
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
                    <div class="servo-status">
                        <span class="label">Current Position</span>
                        <span class="value">{servo.position.value.toFixed(1)}%</span>
                    </div>
                {/if}

                <div class="servo-controls">
                    <label for="servo-slider" class="control-label">Set Position</label>
                    <div class="slider-control">
                        <input
                            type="range"
                            id="servo-slider"
                            min="0"
                            max="100"
                            step="1"
                            bind:value={servoPosition}
                            onchange={setServoPosition}
                            class="servo-slider"
                        />
                        <span class="slider-value">{servoPosition}%</span>
                    </div>
                </div>

                {#if servo.position?.lastUpdate}
                    <div class="last-update">
                        Last update: {servo.position.lastUpdate.toLocaleTimeString()}
                    </div>
                {/if}
            {:else}
                <!-- Calibration Mode -->
                <div class="calibration-mode">
                    <p class="calibration-hint">
                        Adjust duty cycle values to calibrate servo range. Use test buttons to
                        verify positions.
                    </p>

                    <div class="calibration-section">
                        <h4>Minimum Position (0%)</h4>
                        <div class="duty-display">
                            <span class="duty-value">{servoMinDuty.toFixed(3)}ms</span>
                            <span class="duty-percentage"
                                >({dutyToPercentage(servoMinDuty).toFixed(2)}%)</span
                            >
                        </div>
                        <div class="adjustment-buttons">
                            <button onclick={() => adjustServoDuty('min', -0.1)} class="adj-btn"
                                >-0.1ms</button
                            >
                            <button onclick={() => adjustServoDuty('min', -0.05)} class="adj-btn"
                                >-0.05ms</button
                            >
                            <button onclick={() => adjustServoDuty('min', -0.01)} class="adj-btn"
                                >-0.01ms</button
                            >
                            <button onclick={() => adjustServoDuty('min', 0.01)} class="adj-btn"
                                >+0.01ms</button
                            >
                            <button onclick={() => adjustServoDuty('min', 0.05)} class="adj-btn"
                                >+0.05ms</button
                            >
                            <button onclick={() => adjustServoDuty('min', 0.1)} class="adj-btn"
                                >+0.1ms</button
                            >
                        </div>
                        <button onclick={() => testServoPosition(0)} class="test-button">
                            Test Minimum Position
                        </button>
                    </div>

                    <div class="calibration-section">
                        <h4>Maximum Position (100%)</h4>
                        <div class="duty-display">
                            <span class="duty-value">{servoMaxDuty.toFixed(3)}ms</span>
                            <span class="duty-percentage"
                                >({dutyToPercentage(servoMaxDuty).toFixed(2)}%)</span
                            >
                        </div>
                        <div class="adjustment-buttons">
                            <button onclick={() => adjustServoDuty('max', -0.1)} class="adj-btn"
                                >-0.1ms</button
                            >
                            <button onclick={() => adjustServoDuty('max', -0.05)} class="adj-btn"
                                >-0.05ms</button
                            >
                            <button onclick={() => adjustServoDuty('max', -0.01)} class="adj-btn"
                                >-0.01ms</button
                            >
                            <button onclick={() => adjustServoDuty('max', 0.01)} class="adj-btn"
                                >+0.01ms</button
                            >
                            <button onclick={() => adjustServoDuty('max', 0.05)} class="adj-btn"
                                >+0.05ms</button
                            >
                            <button onclick={() => adjustServoDuty('max', 0.1)} class="adj-btn"
                                >+0.1ms</button
                            >
                        </div>
                        <button onclick={() => testServoPosition(100)} class="test-button">
                            Test Maximum Position
                        </button>
                    </div>

                    <button onclick={swapServoRange} class="swap-button">
                        ↔️ Swap Min/Max (Reverse Direction)
                    </button>

                    <div class="klipper-config">
                        <h4>Klipper Configuration</h4>
                        <pre><code
                                ><span class="comment"
                                    ># seconds \in (0, 0.02), duration of pulse when requested 0%</span
                                >
<span class="key">vent_servo_pulse_width_min:</span> <span class="value"
                                    >{(servoMinDuty / 1000).toFixed(6)}</span
                                >
<span class="comment"># seconds \in (0, 0.02), duration of pulse when requesting 100%</span>
<span class="key">vent_servo_pulse_width_max:</span> <span class="value"
                                    >{(servoMaxDuty / 1000).toFixed(6)}</span
                                ></code
                            ></pre>
                    </div>

                    {#if servo.position?.value !== null && servo.position?.value !== undefined}
                        <div class="servo-status">
                            <span class="label">Current Position</span>
                            <span class="value">{servo.position.value.toFixed(1)}%</span>
                        </div>
                    {/if}
                </div>
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

    .sensor-group h4 {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        color: var(--text-muted, #666);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .sensor-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
    }

    .sensor-reading {
        display: flex;
        flex-direction: column;
        padding: 0.75rem;
        background: var(--sensor-bg, #f8f8f8);
        border-radius: 4px;
    }

    .sensor-reading .label {
        font-size: 0.85rem;
        color: var(--text-muted, #666);
        margin-bottom: 0.25rem;
    }

    .sensor-reading .value {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-color, #333);
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
    }

    .disconnect-button:hover {
        background: var(--disconnect-hover, #c82333);
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

    .fan-readings {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .fan-reading {
        display: flex;
        flex-direction: column;
        padding: 0.75rem;
        background: var(--sensor-bg, #f8f8f8);
        border-radius: 4px;
        min-width: 150px;
    }

    .fan-reading .label {
        font-size: 0.85rem;
        color: var(--text-muted, #666);
        margin-bottom: 0.25rem;
    }

    .fan-reading .value {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-color, #333);
    }

    .fan-override {
        margin-top: 1.5rem;
    }

    .fan-override label {
        display: block;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-color, #333);
        margin-bottom: 0.5rem;
    }

    .slider-container {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .slider-value {
        min-width: 50px;
        font-weight: 600;
        color: var(--text-color, #333);
    }

    .fan-slider {
        flex: 1;
        height: 6px;
        border-radius: 3px;
        background: var(--sensor-bg, #f8f8f8);
        outline: none;
        -webkit-appearance: none;
        appearance: none;
    }

    .fan-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--button-bg, #007bff);
        cursor: pointer;
        transition: background 0.2s;
    }

    .fan-slider::-webkit-slider-thumb:hover {
        background: var(--button-hover, #0056b3);
    }

    .fan-slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--button-bg, #007bff);
        cursor: pointer;
        border: none;
        transition: background 0.2s;
    }

    .fan-slider::-moz-range-thumb:hover {
        background: var(--button-hover, #0056b3);
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

    .servo-status {
        display: flex;
        flex-direction: column;
        padding: 0.75rem;
        background: var(--sensor-bg, #f8f8f8);
        border-radius: 4px;
        margin-bottom: 1rem;
        max-width: 200px;
    }

    .servo-status .label {
        font-size: 0.85rem;
        color: var(--text-muted, #666);
        margin-bottom: 0.25rem;
    }

    .servo-status .value {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-color, #333);
    }

    .servo-controls {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
    }

    .control-label {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-color, #333);
    }

    .slider-control {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .servo-slider {
        flex: 1;
        height: 6px;
        border-radius: 3px;
        background: var(--sensor-bg, #f8f8f8);
        outline: none;
        -webkit-appearance: none;
        appearance: none;
    }

    .servo-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--button-bg, #007bff);
        cursor: pointer;
        transition: background 0.2s;
    }

    .servo-slider::-webkit-slider-thumb:hover {
        background: var(--button-hover, #0056b3);
    }

    .servo-slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--button-bg, #007bff);
        cursor: pointer;
        border: none;
        transition: background 0.2s;
    }

    .servo-slider::-moz-range-thumb:hover {
        background: var(--button-hover, #0056b3);
    }

    .slider-value {
        min-width: 50px;
        font-weight: 600;
        color: var(--text-color, #333);
        text-align: right;
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

    .calibration-mode {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .calibration-hint {
        margin: 0;
        padding: 0.75rem;
        background: var(--sensor-bg, #f8f8f8);
        border-left: 3px solid var(--button-bg, #007bff);
        border-radius: 4px;
        color: var(--text-muted, #666);
        font-size: 0.9rem;
    }

    .calibration-section {
        padding: 1rem;
        background: var(--sensor-bg, #f8f8f8);
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .calibration-section h4 {
        margin: 0;
        font-size: 1rem;
        color: var(--text-color, #333);
        font-weight: 600;
    }

    .duty-display {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
    }

    .duty-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-color, #333);
    }

    .duty-percentage {
        font-size: 0.9rem;
        color: var(--text-muted, #666);
    }

    .adjustment-buttons {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
    }

    .adj-btn {
        padding: 0.5rem;
        background: var(--bg-color, #fff);
        color: var(--text-color, #333);
        border: 1px solid var(--border-color, #ccc);
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
        transition: all 0.2s;
    }

    .adj-btn:hover {
        background: var(--hover-bg, #f0f0f0);
        border-color: var(--button-bg, #007bff);
    }

    .test-button {
        padding: 0.625rem 1rem;
        background: var(--button-bg, #007bff);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 600;
        transition: background 0.2s;
    }

    .test-button:hover {
        background: var(--button-hover, #0056b3);
    }

    .swap-button {
        width: 100%;
        padding: 0.75rem 1rem;
        background: var(--sensor-bg, #f8f8f8);
        color: var(--text-color, #333);
        border: 1px solid var(--border-color, #ccc);
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.95rem;
        font-weight: 600;
        transition: all 0.2s;
    }

    .swap-button:hover {
        background: var(--hover-bg, #f0f0f0);
        border-color: var(--button-bg, #007bff);
    }

    .klipper-config {
        padding: 1rem;
        background: var(--sensor-bg, #f8f8f8);
        border-radius: 6px;
        border: 1px solid var(--border-color, #ccc);
    }

    .klipper-config h4 {
        margin: 0 0 0.75rem 0;
        font-size: 0.95rem;
        color: var(--text-color, #333);
        font-weight: 600;
    }

    .klipper-config pre {
        margin: 0;
        padding: 0.75rem;
        background: var(--bg-color, #fff);
        border-radius: 4px;
        overflow-x: auto;
    }

    .klipper-config code {
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.85rem;
        line-height: 1.5;
        color: var(--text-color, #333);
    }

    .klipper-config .comment {
        color: #6a9955;
        font-style: italic;
    }

    .klipper-config .key {
        color: #0066cc;
        font-weight: 600;
    }

    .klipper-config .value {
        color: #d73a49;
        font-weight: 600;
    }

    :global(.dark) .klipper-config .comment {
        color: #6a9955;
    }

    :global(.dark) .klipper-config .key {
        color: #4fc3f7;
    }

    :global(.dark) .klipper-config .value {
        color: #f48771;
    }
</style>
