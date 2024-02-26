<script lang="ts">
  import { Calendar } from "$lib/components/calendar";

  let currentMonth: number;
  let currentYear: number;

</script>

<div class="mx-5 mt-5 max-w-md">
  <h2 class="text-base font-semibold leading-6 text-gray-900">Upcoming meetings</h2>
  <Calendar bind:currentMonth={currentMonth} bind:currentYear={currentYear} />
</div>