<script lang="ts">
  type Value = {
    title: string,
    value: string
  }[]
  export let values: Value
</script>

<div>
  <dl class="my-4 mx-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
    {#each values as v (v.title)}
      <div class="overflow-hidden rounded-lg bg-white dark:bg-transparent dark:border-gray-200/20 dark:border px-4 py-5 shadow sm:p-6">
        <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">{v.title}</dt>
        <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-200">{v.value}</dd>
      </div>
    {/each}
  </dl>
</div>