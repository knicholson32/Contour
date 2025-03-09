<script lang="ts">

  // import { page } from "$app/stores";
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

</script>
{@render children?.()}