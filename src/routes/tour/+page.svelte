<script lang="ts">
  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;


</script>

Tour

{#if data.currentTour === null}
  New tour
{:else}
  Existing tour
{/if}