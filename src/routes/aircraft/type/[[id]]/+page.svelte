<script lang="ts">
  import { enhance } from '$app/forms';
  import Section from '$lib/components/Section.svelte';
  import Input from '$lib/components/routeSpecific/entry/Input.svelte';
  import Select from '$lib/components/routeSpecific/entry/Select.svelte';
  import Switch from '$lib/components/routeSpecific/entry/Switch.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import Image from '$lib/components/Image.svelte';
  import TwoColumn from '$lib/components/scrollFrames/TwoColumn.svelte';

  export let data: import('./$types').PageData;
	export let form: import('./new/$types').ActionData;

  let submitting = false;

  const update = () => {
    console.log('update');
  }

</script>

<TwoColumn left="safe" right="scroll" activeOnSingleCol="left">
  <ul slot="right" role="list" class="mt-20 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3">
    {#each data.types as type}
      <li>
        <Image id={type.imageId} size={500} lazy={false} class="sm:hidden aspect-[3/2] w-full rounded-2xl object-cover" alt="" />
        <Image id={type.imageId} size={400} lazy={false} class="hidden sm:block aspect-[3/2] w-full rounded-2xl object-cover" alt="" />
        <h3 class="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900">{type.make} {type.model}</h3>
        <p class="text-base leading-7 text-gray-600">{type.typeCode}-{type.subCode} - {type.catClass}</p>
      </li>
    {/each}
    {#each data.types as type}
      <li>
        <Image id={type.imageId} size={500} lazy={false} class="sm:hidden aspect-[3/2] w-full rounded-2xl object-cover" alt="" />
        <Image id={type.imageId} size={400} lazy={false} class="hidden sm:block aspect-[3/2] w-full rounded-2xl object-cover" alt="" />
        <h3 class="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900">{type.make} {type.model}</h3>
        <p class="text-base leading-7 text-gray-600">{type.typeCode}-{type.subCode} - {type.catClass}</p>
      </li>
    {/each}
  </ul>

  <nav slot="left" class="" aria-label="Directory">
    <Section title="A">
      <ul role="list" class="divide-y divide-gray-100">
        <li class="flex gap-x-4 px-3 py-5">
          <img class="h-12 w-12 flex-none rounded-full bg-gray-50" src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-6 text-gray-900">Emma Young</p>
            <p class="mt-1 truncate text-xs leading-5 text-gray-500">emma.young@example.com</p>
          </div>
        </li>
      </ul>
      <ul role="list" class="divide-y divide-gray-100">
        <li class="flex gap-x-4 px-3 py-5">
          <img class="h-12 w-12 flex-none rounded-full bg-gray-50" src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-6 text-gray-900">Emma Young</p>
            <p class="mt-1 truncate text-xs leading-5 text-gray-500">emma.young@example.com</p>
          </div>
        </li>
      </ul>
      <ul role="list" class="divide-y divide-gray-100">
        <li class="flex gap-x-4 px-3 py-5">
          <img class="h-12 w-12 flex-none rounded-full bg-gray-50" src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-6 text-gray-900">Emma Young</p>
            <p class="mt-1 truncate text-xs leading-5 text-gray-500">emma.young@example.com</p>
          </div>
        </li>
      </ul>
    </Section>
    <Section title="A">
      <ul role="list" class="divide-y divide-gray-100">
        <li class="flex gap-x-4 px-3 py-5">
          <img class="h-12 w-12 flex-none rounded-full bg-gray-50" src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-6 text-gray-900">Emma Young</p>
            <p class="mt-1 truncate text-xs leading-5 text-gray-500">emma.young@example.com</p>
          </div>
        </li>
      </ul><ul role="list" class="divide-y divide-gray-100">
        <li class="flex gap-x-4 px-3 py-5">
          <img class="h-12 w-12 flex-none rounded-full bg-gray-50" src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-6 text-gray-900">Emma Young</p>
            <p class="mt-1 truncate text-xs leading-5 text-gray-500">emma.young@example.com</p>
          </div>
        </li>
      </ul><ul role="list" class="divide-y divide-gray-100">
        <li class="flex gap-x-4 px-3 py-5">
          <img class="h-12 w-12 flex-none rounded-full bg-gray-50" src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-6 text-gray-900">Emma Young</p>
            <p class="mt-1 truncate text-xs leading-5 text-gray-500">emma.young@example.com</p>
          </div>
        </li>
      </ul>
    </Section>
    <Section title="A">
      <ul role="list" class="divide-y divide-gray-100">
        <li class="flex gap-x-4 px-3 py-5">
          <img class="h-12 w-12 flex-none rounded-full bg-gray-50" src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-6 text-gray-900">Emma Young</p>
            <p class="mt-1 truncate text-xs leading-5 text-gray-500">emma.young@example.com</p>
          </div>
        </li>
      </ul><ul role="list" class="divide-y divide-gray-100">
        <li class="flex gap-x-4 px-3 py-5">
          <img class="h-12 w-12 flex-none rounded-full bg-gray-50" src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-6 text-gray-900">Emma Young</p>
            <p class="mt-1 truncate text-xs leading-5 text-gray-500">emma.young@example.com</p>
          </div>
        </li>
      </ul><ul role="list" class="divide-y divide-gray-100">
        <li class="flex gap-x-4 px-3 py-5">
          <img class="h-12 w-12 flex-none rounded-full bg-gray-50" src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-6 text-gray-900">Emma Young</p>
            <p class="mt-1 truncate text-xs leading-5 text-gray-500">emma.young@example.com</p>
          </div>
        </li>
      </ul>
    </Section>
    <Section title="A">
      <ul role="list" class="divide-y divide-gray-100">
        <li class="flex gap-x-4 px-3 py-5">
          <img class="h-12 w-12 flex-none rounded-full bg-gray-50" src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-6 text-gray-900">Emma Young</p>
            <p class="mt-1 truncate text-xs leading-5 text-gray-500">emma.young@example.com</p>
          </div>
        </li>
      </ul><ul role="list" class="divide-y divide-gray-100">
        <li class="flex gap-x-4 px-3 py-5">
          <img class="h-12 w-12 flex-none rounded-full bg-gray-50" src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-6 text-gray-900">Emma Young</p>
            <p class="mt-1 truncate text-xs leading-5 text-gray-500">emma.young@example.com</p>
          </div>
        </li>
      </ul><ul role="list" class="divide-y divide-gray-100">
        <li class="flex gap-x-4 px-3 py-5">
          <img class="h-12 w-12 flex-none rounded-full bg-gray-50" src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-6 text-gray-900">Emma Young</p>
            <p class="mt-1 truncate text-xs leading-5 text-gray-500">emma.young@example.com</p>
          </div>
        </li>
      </ul>
    </Section>
    <Section title="A">
      <ul role="list" class="divide-y divide-gray-100">
        <li class="flex gap-x-4 px-3 py-5">
          <img class="h-12 w-12 flex-none rounded-full bg-gray-50" src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-6 text-gray-900">Emma Young</p>
            <p class="mt-1 truncate text-xs leading-5 text-gray-500">emma.young@example.com</p>
          </div>
        </li>
      </ul><ul role="list" class="divide-y divide-gray-100">
        <li class="flex gap-x-4 px-3 py-5">
          <img class="h-12 w-12 flex-none rounded-full bg-gray-50" src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-6 text-gray-900">Emma Young</p>
            <p class="mt-1 truncate text-xs leading-5 text-gray-500">emma.young@example.com</p>
          </div>
        </li>
      </ul><ul role="list" class="divide-y divide-gray-100">
        <li class="flex gap-x-4 px-3 py-5">
          <img class="h-12 w-12 flex-none rounded-full bg-gray-50" src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-6 text-gray-900">Emma Young</p>
            <p class="mt-1 truncate text-xs leading-5 text-gray-500">emma.young@example.com</p>
          </div>
        </li>
      </ul>
    </Section>
    <div class="inline-flex -mt-[2px] py-2 px-5 gap-4 w-full border-t flex-row justify-center sticky bottom-0 z-50 bg-white">
      <button type="submit" class="touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-gray-300 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 bg-white text-gray-800 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-grey-500">Next</button>
      <button type="submit" class="touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-gray-300 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 bg-white text-gray-800 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-grey-500">Next</button>
    </div>
  </nav>


</TwoColumn>
