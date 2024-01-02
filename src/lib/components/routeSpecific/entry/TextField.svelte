<script lang="ts">
  export let name: string;
  export let disabled: boolean = false;
  export let placeholder = 'Enter comments';
  export let update: () => void = () => {};
  export let required: boolean = false;
  export let value: string | null = null;

</script>

<div class="w-full relative inline-flex items-center px-3 py-1 {disabled ? 'cursor-not-allowed bg-gray-50 text-gray-500' : ''}">
  <textarea {required} bind:value={value} on:input={update} disabled={disabled ? true : undefined} {placeholder} {name} class="m-0 p-0 text-sm font-medium w-full border-0 ring-0 outline-none bg-transparent focus-within:outline-none focus-within:ring-0 disabled:cursor-not-allowed disabled:text-gray-500" rows="5"/>
</div>