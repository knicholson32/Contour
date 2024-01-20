<script lang="ts">
  export let title: string;
</script>

<div class="w-full bg-sky-900 dark:bg-sky-900/60 text-white">
  <div class="text-xl w-full text-left font-bold font-mono px-4 pt-2">{title}</div>
  <slot/>
</div>