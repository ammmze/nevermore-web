<script lang="ts">
    let {
        label,
        dutyMs,
        dutyPercentage,
        onAdjust,
        onTest
    }: {
        label: string;
        dutyMs: number;
        dutyPercentage: number;
        onAdjust: (delta: number) => void;
        onTest: () => void;
    } = $props();
</script>

<div class="calibration-section">
    <h4>{label}</h4>
    <div class="duty-display">
        <span class="duty-value">{dutyMs.toFixed(3)}ms</span>
        <span class="duty-percentage">({dutyPercentage.toFixed(2)}%)</span>
    </div>
    <div class="adjustment-controls">
        <div class="minus-buttons">
            <button onclick={() => onAdjust(-0.1)} class="adj-btn large">-0.1ms</button>
            <button onclick={() => onAdjust(-0.05)} class="adj-btn medium">-0.05ms</button>
            <button onclick={() => onAdjust(-0.01)} class="adj-btn small">-0.01ms</button>
        </div>
        <button onclick={onTest} class="test-button">Go</button>
        <div class="plus-buttons">
            <button onclick={() => onAdjust(0.01)} class="adj-btn small">+0.01ms</button>
            <button onclick={() => onAdjust(0.05)} class="adj-btn medium">+0.05ms</button>
            <button onclick={() => onAdjust(0.1)} class="adj-btn large">+0.1ms</button>
        </div>
    </div>
</div>

<style>
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

    .adjustment-controls {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .minus-buttons,
    .plus-buttons {
        display: flex;
        gap: 0.5rem;
    }

    @media (max-width: 640px) {
        .adjustment-controls {
            flex-direction: column;
            gap: 0.5rem;
        }

        .minus-buttons,
        .plus-buttons {
            width: 100%;
        }

        .minus-buttons {
            flex-direction: row-reverse;
        }

        .adj-btn {
            flex: 1;
        }

        .test-button {
            width: 100%;
        }
    }

    .adj-btn {
        padding: 0.5rem 0.75rem;
        background: var(--bg-color, #fff);
        color: var(--text-color, #333);
        border: 1px solid var(--border-color, #ccc);
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
        transition: all 0.2s;
    }

    .adj-btn.small {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
    }

    .adj-btn.medium {
        padding-left: 1rem;
        padding-right: 1rem;
    }

    .adj-btn.large {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
    }

    .adj-btn:hover {
        background: var(--hover-bg, #f0f0f0);
        border-color: var(--button-bg, #007bff);
    }

    .test-button {
        padding: 0.625rem 1.25rem;
        background: var(--button-bg, #007bff);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 600;
        transition: background 0.2s;
        white-space: nowrap;
    }

    .test-button:hover {
        background: var(--button-hover, #0056b3);
    }
</style>
