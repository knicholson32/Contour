<script lang="ts">
  import { CalendarIcon } from 'lucide-svelte';
  import type { DateRange } from "bits-ui";
  import {
    DateFormatter,
    getLocalTimeZone,
    type DateValue
  } from "@internationalized/date";
  import { cn } from "$lib/utils";
  import { Button } from "$lib/components/ui/button";
  import { RangeCalendar } from "$lib/components/ui/range-calendar";
  import * as Popover from "$lib/components/ui/popover";
 
  const df = new DateFormatter("en-US", {
    dateStyle: "medium"
  });
 

  interface Props {
    value?: DateRange | undefined;
    highlights?: string[];
    class?: string;
  }

  let { value = $bindable(undefined), highlights = $bindable([]), class: className = '' }: Props = $props();

  let placeholder = $state(value?.start);
 
  let button: HTMLButtonElement | null = $state(null);

  let startValue: DateValue | undefined = $state(undefined);
</script>

<Popover.Root>
  <Popover.Trigger>
    <Button bind:ref={button} variant="outline" visual={true} class={cn("w-[300px] justify-start text-left font-normal", !value && "text-muted-foreground", className)}>
      <CalendarIcon class="mr-2 h-4 w-4" />
      {#if value && value.start}
        {#if value.end}
          {df.format(value.start.toDate(getLocalTimeZone()))} - {df.format(
            value.end.toDate(getLocalTimeZone())
          )}
        {:else}
          {df.format(value.start.toDate(getLocalTimeZone()))}
        {/if}
      {:else if startValue}
        {df.format(startValue.toDate(getLocalTimeZone()))}
      {:else}
        Pick a date
      {/if}
    </Button>
  </Popover.Trigger>
  <Popover.Content class="w-auto p-0" align="end">
    <RangeCalendar
      bind:value
      bind:startValue
      bind:highlights
      numberOfMonths={2}
      placeholder={placeholder}
    />
    <!-- initialFocus -->
  </Popover.Content>
</Popover.Root>