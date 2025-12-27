<script lang="ts">
    let { minDutyMs, maxDutyMs }: { minDutyMs: number; maxDutyMs: number } = $props();
</script>

<div class="klipper-config">
    <h4>Klipper Configuration</h4>
    <pre><code
            ><span class="comment"
                ># seconds \in (0, 0.02), duration of pulse when requested 0%</span
            >
<span class="key">vent_servo_pulse_width_min:</span> <span class="value"
                >{(minDutyMs / 1000).toFixed(6)}</span
            >
<span class="comment"># seconds \in (0, 0.02), duration of pulse when requesting 100%</span>
<span class="key">vent_servo_pulse_width_max:</span> <span class="value"
                >{(maxDutyMs / 1000).toFixed(6)}</span
            ></code
        ></pre>
</div>

<style>
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
