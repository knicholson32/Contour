<script lang="ts">

  export let title: string;

  // NOTICE: Change the `top` class to match the height of the header bar

</script>

<div class="relative">
  <div class="sticky top-0 z-10 border-y border-b-gray-200 border-t-gray-100 bg-gray-50 px-3 py-1.5 text-sm font-semibold leading-6 text-gray-900">
    <h3>{title}</h3>
  </div>
  <ul role="list" class="divide-y divide-gray-100">
    <slot />
  </ul>
</div>