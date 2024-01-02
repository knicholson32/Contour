<script lang="ts">
  import Header from "./Header.svelte";
  export let title: string;
  export let error: string | null = null;

  let visible = true;

</script>

<Header {error} bind:title bind:visible />
<dl class="space-y-0 divide-y divide divide-gray-200 border-b border-gray-200 text-sm leading-6 w-full {!visible ? 'hidden' : ''}">
  <slot/>
</dl>