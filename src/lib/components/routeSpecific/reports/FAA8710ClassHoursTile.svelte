<script lang="ts">
  import { formatNumberOmitZero } from '$lib/helpers';

  export let title: string;
  export let value: number;
  export let striped = false;

</script>

<div class="relative content-center text-center text-xs {striped ? 'bg-gray-100 dark:bg-zinc-925' : 'bg-gray-50 dark:bg-zinc-900'} {$$restProps.class}">
  <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">{title}</div>
  <div class="h-5 mt-4 mb-2">{formatNumberOmitZero(value)}</div>
</div>