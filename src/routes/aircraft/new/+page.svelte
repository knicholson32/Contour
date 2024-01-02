<script lang="ts">
  import Section from '$lib/components/routeSpecific/entry/framing/Section.svelte';
  import TextField from '$lib/components/routeSpecific/entry/TextField.svelte';
  import Input from '$lib/components/routeSpecific/entry/Input.svelte';

  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

  const update = () => {
    console.log('update');
  }


</script>


<form>

  <Section title="General">
    <Input title="Tail Number" name="tail" uppercase={true} update={update} />
  </Section>

  <Section title="Comments">
    <TextField name="comments" placeholder="Enter comments here" update={update} />
  </Section>

</form>

<div class="inline-flex -mt-[2px] py-2 px-5 gap-4 w-full border-t flex-row justify-center sticky bottom-0 bg-white">
  <button type="submit" class="touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-gray-300 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 bg-white text-gray-800 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-grey-500">Next</button>
  <button type="submit" class="touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-gray-300 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 bg-white text-gray-800 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-grey-500">Next</button>
</div>