<script lang="ts">
    import * as helpers from ".";


    interface Props {
      entry: {
        type: 'blank',
        startTime_utc: number,
        endTime_utc: number,
      };
      i: number;
      dayStartTime: number;
      dayEndTime: number;
    }

    let {
        entry,
        i,
        dayStartTime,
        dayEndTime
    }: Props = $props();


</script>

<div class="opacity-0 select-none" style="width: {helpers.convertUTCToWidth(i, entry.startTime_utc, entry.endTime_utc, dayStartTime, dayEndTime)}%;"></div>