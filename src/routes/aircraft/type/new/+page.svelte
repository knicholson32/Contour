<script lang="ts">
  import Section from '$lib/components/routeSpecific/entry/framing/Section.svelte';
  import TextField from '$lib/components/routeSpecific/entry/TextField.svelte';
  import Input from '$lib/components/routeSpecific/entry/Input.svelte';
  import Select from '$lib/components/routeSpecific/entry/Select.svelte';
  import Switch from '$lib/components/routeSpecific/entry/Switch.svelte';
  import * as prisma from '$lib/types/prisma';
  import ImageUpload from '$lib/components/routeSpecific/entry/ImageUpload.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import { enhance } from '$app/forms';

  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;


  const update = () => {
    console.log('update');
  }

  let submitting = false;


</script>


<form method="post" use:enhance={() => {
  submitting = true;
  return async ({ update }) => {
    await update({ reset: false });
    submitting = false;
  };
}}>

  <Section title="General" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
    <Input {form} required={false} title="Type Code" name="type" placeholder="CL30" uppercase={true} update={update} />
    <Input {form} required={false} title="Sub Code" name="subType" placeholder="350" uppercase={true} update={update} />
    <Input {form} required={false} title="Make" name="make" placeholder="Bombardier" uppercase={false} update={update} />
    <Input {form} required={false} title="Model" name="model" placeholder="Challenger 350" uppercase={false} update={update} />
  </Section>

  <Section title="Type">
    <Select {form} required={false} title="Category / Class" options={data.enums.categoryClass} placeholder="Unset" name="catClass" update={update} />
    <Select {form} required={false} title="Gear Type" options={data.enums.gearType} name="gear" placeholder="Unset" update={update} />
    <Select {form} required={false} title="Engine Type" options={data.enums.engineType} placeholder="Unset" name="engine" update={update} />
    <Switch {form} title="Complex" name="complex" update={update} />
    <Switch {form} title="Technically Advanced" name="taa" update={update} />
    <Switch {form} title="High Performance" name="hp" update={update} />
    <Switch {form} title="Pressurized" name="press" update={update} />
  </Section>

  <div class="w-full h-10 bg-gray-100"></div>

  <div class=" inline-flex -mt-[2px] py-4 px-5 gap-4 w-full border-t flex-row justify-center sticky bottom-0 bg-white">
    <a href="/aircraft/type" class="touch-manipulation text-center flex-grow select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-gray-300 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Cancel</a>
    <Submit failed={form?.ok === false} class="flex-grow" {submitting} theme={{primary: 'white'}} actionText="Create" actionTextInProgress="Creating" />
  </div>
</form>