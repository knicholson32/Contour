<script lang="ts">
    import * as helpers from ".";

    export let entry: {
      type: 'blank',
      startTime_utc: number,
      endTime_utc: number,
    }

    export let i: number;
    export let spacing: number;
    export let dayStartTime: number;
    export let dayEndTime: number;


</script>

<div class="opacity-0 select-none" style="width: {helpers.convertUTCToWidth(i, entry.startTime_utc, entry.endTime_utc, dayStartTime, dayEndTime)}%;"></div>