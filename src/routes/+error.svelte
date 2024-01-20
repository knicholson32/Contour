<script lang="ts">
  import { page } from '$app/stores';

  let error = $page.error?.message;
  let longQuip = 'Oops! Something went wrong.';
  if (error === undefined) error = 'An error occurred';

  switch ($page.status) {
    case 400:
      longQuip = 'We\'re not sure what to do with your request.'
      break;
    case 401:
    case 403:
      longQuip = 'You\'re not allowed to do that.'
      break;
    case 404:
      longQuip = 'Sorry, we couldn\'t find the page you\'re looking for.'
      break;
    case 500:
    case 501:
    case 502:
    case 503:
      longQuip = 'Sorry, something went wrong processing your request.'
      break;
  }

</script>

<div class="flex min-h-full flex-col dark:bg-zinc-900">
  <main class="mx-auto flex w-full max-w-7xl flex-auto flex-col justify-center px-6 py-24 sm:py-64 lg:px-8">
    <p class="text-base font-semibold leading-8 text-sky-600">{$page.status}</p>
    <h1 class="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-200 sm:text-5xl">{error}</h1>
    <p class="mt-6 text-base leading-7 text-gray-600 dark:text-gray-400">{longQuip}</p>
    <div class="mt-10">
      <a href="/" class="text-sm font-semibold leading-7 text-sky-600"><span aria-hidden="true">&larr;</span> Back to home</a>
    </div>
    <div class="">
      <button type="button" on:click={() => history.back()} class="text-sm font-semibold leading-7 text-sky-600"><span aria-hidden="true">&larr;</span> Back to previous</button>
    </div>
  </main>
</div>