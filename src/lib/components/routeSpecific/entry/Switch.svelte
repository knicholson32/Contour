<script lang="ts">
  import Switch from "$lib/components/buttons/Switch.svelte";
  import type { API } from "$lib/types";
  import Frame from "./framing/Frame.svelte";

  export let value: boolean = false;
	export let name: string;
  export let title: string;
	export let disabled: boolean = false;
  export let action: string = '?/default';
  export let form: null | API.Form.Type = null

  export let update: () => void = () => {};

  let input: HTMLInputElement;

  let focus: () => void;

</script>


<Frame {name} {action} {form} bind:title focus={focus} bind:disabled>
  <Switch type="submit" bind:click={focus} disableClick={true} bind:value changed={update} bind:valueName={name} {disabled} />
</Frame>