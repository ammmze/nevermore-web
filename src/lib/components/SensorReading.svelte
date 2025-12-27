<script lang="ts">
    let { label, value, unit = '' }: { label: string; value: string; unit?: string } = $props();
</script>

<div class="sensor-reading">
    <span class="label">{label}</span>
    <span class="value">{value}{unit}</span>
</div>

<style>
    .sensor-reading {
        display: flex;
        flex-direction: column;
        padding: 0.75rem;
        background: var(--sensor-bg, #f8f8f8);
        border-radius: 4px;
    }

    .label {
        font-size: 0.85rem;
        color: var(--text-muted, #666);
        margin-bottom: 0.25rem;
    }

    .value {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-color, #333);
    }
</style>
