<script lang="ts">
  import { enhance } from '$app/forms';
  import Section from '$lib/components/routeSpecific/entry/framing/Section.svelte';
  import Input from '$lib/components/routeSpecific/entry/Input.svelte';
  import Select from '$lib/components/routeSpecific/entry/Select.svelte';
  import Switch from '$lib/components/routeSpecific/entry/Switch.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import Image from '$lib/components/Image.svelte';

  export let data: import('./$types').PageData;
	export let form: import('./new/$types').ActionData;

  let submitting = false;

  const update = () => {
    console.log('update');
  }

</script>


<!-- <div class="grid grid-cols-1 xs:grid-cols-2 h-64"> -->

<ul role="list" class="mx-8 mt-20 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3">
  {#each data.types as type}
    <li>
      <Image id={type.imageId} size={500} lazy={false} class="sm:hidden aspect-[3/2] w-full rounded-2xl object-cover" alt="" />
      <Image id={type.imageId} size={400} lazy={false} class="hidden sm:block aspect-[3/2] w-full rounded-2xl object-cover" alt="" />
      <h3 class="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900">{type.make} {type.model}</h3>
      <p class="text-base leading-7 text-gray-600">{type.typeCode}-{type.subCode} - {type.catClass}</p>
      <!-- <ul role="list" class="mt-6 flex gap-x-6">
        <li>
          <a href="#" class="text-gray-400 hover:text-gray-500">
            <span class="sr-only">Twitter</span>
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
            </svg>
          </a>
        </li>
        <li>
          <a href="#" class="text-gray-400 hover:text-gray-500">
            <span class="sr-only">LinkedIn</span>
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clip-rule="evenodd" />
            </svg>
          </a>
        </li>
      </ul> -->
    </li>
  {/each}
</ul>
<!-- 
  <div class="flex flex-col">
    {#each data.types as type}
      <div class="w-full flex items-center gap-4">
        {#if type.imageId !== null}
          <div class="w-12 h-12 xs:w-24 xs:h-24 flex-shrink-0">
            <Image id="{type.imageId}" square={false} xs="3rem" larger="6rem" class="" />
          </div>
        {/if}
        <div>
          {type.typeCode} - {type.make} {type.model}
        </div>
      </div>
    {/each}
  </div> -->

  <!-- <form class="hidden xs:block"  method="post" action="/aircraft/type/new" use:enhance={() => {
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

</div> -->