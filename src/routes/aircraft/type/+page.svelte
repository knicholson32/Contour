<script lang="ts">
  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

</script>


<ul>
{#each data.types as type}
  <li>
    {type.typeCode} - {type.make} {type.model}
  </li>
{/each}
</ul>