[![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/knicholson32/Contour/docker-build.yml)](https://github.com/knicholson32/Contour/actions)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/knicholson32/Contour/issues)
[![Docker Image Size with architecture (latest by date/latest semver)](https://img.shields.io/docker/image-size/keenanrnicholson/contour)](https://hub.docker.com/r/keenanrnicholson/Contour/tags)
[![Docker Pulls](https://img.shields.io/docker/pulls/keenanrnicholson/contour)](https://hub.docker.com/r/keenanrnicholson/contour/tags)

# Introduction

### **Notice**: Contour is in development, and is not currently stable.

## Features

- Download track data for flights
- Manage logbook
- Get tour statistics

# Usage

Typical `docker-compose.yml`:

```yml
version: '3.8'
services:
  db:
    image: mysql
    command: --default-authentication-plugin=mysql_native_password
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: contour-root-password # Change this!
      MYSQL_DATABASE: contour
      MYSQL_USER: contour
      MYSQL_PASSWORD: contour-password # Change this!
    ports:
      - 3306:3306
    volumes:
      - /path/to/db:/var/lib/mysql

  phpmyadmin:
    image: phpmyadmin
    restart: always
    ports:
      - 8080:80
    environment:
      PMA_ARBITRARY: 1
    depends_on:
      - db

  contour:
    image: 'keenanrnicholson/contour:local'
    container_name: contour
    restart: unless-stopped
    environment:
      PUID: 1000
      PGID: 1000
      ORIGIN: 'http://localhost:5173'
      TZ: 'America/New_York'
      DATABASE_URL: 'mysql://contour:contour-password@db:/contour' # Change this!
    ports:
      - '5173:3000'
    depends_on:
      - db
```

Contour is _not_ designed to be accessible to the public internet. A reverse proxy such as [traefik](https://traefik.io/traefik/) or [Nginx Proxy Manager](https://nginxproxymanager.com/) should be used if `https` is required. Access to Contour should be confined to your local network or intelligently managed.

# Development

Contour is based on [SvelteKit](https://kit.svelte.dev/), and therefore is developed using `vite`. Development for Contour is done inside a developmental Docker image.

If first-time:

```shell
# Switch to correct version of node using `nvm`
nvm use

# Install prisma globally
npm i prisma -g

# Create the database file
npx prisma db push
```

Create the dev image and start a local development session:

```shell
# Start dev environment
make dev
```

Build the project and serve it locally without creating the full Docker image:

```shell
# Build to node-adapter and preview result
make preview
```

Create the Docker image and serve it locally:

```shell
# Build the full image and host it locally
make create-local && make local
```

In all of the above cases, the front-end URL is [`http://localhost:5173/`](http://localhost:5173/)

## Database

Contour uses [`prisma`](https://www.prisma.io/) for database (`sqlite`) access and management, with the schema stored in `prisma/schema.prisma`. When the dev environment is loaded, `prisma` expects the database to already exist. In the production environment, `prisma` performs database migrations and will create the database if it does not exist. An automatic database migration is not performed in dev to allow database schema modifications and experiments without creating an official database migration.

### After modifying the schema during development

```shell
# Check the prisma format
npx prisma format

# Push the changes to the DB. This may delete DB data.
npx prisma db push
```

### Before committing / building the prod container

```shell
# Check the prisma format
npx prisma format

# Create a migration & push the changes to the DB
npx prisma migrate dev --name v0.0.0 # Changes this version

# Check the resulting migration file in `/prisma/migrations` to make sure it will do what is expected during the migration
```

## `node_modules`

During development, a `node_modules` folder is created in the top-level directory. Note that the libraries within are not necessarily compatible with your local machine, as they were installed within the Docker container environment. This means that if `npm i` is ran outside the Docker container, the incorrect libraries will be loaded by the dev environment. If issues are encountered with respect to dependencies, delete the `node_modules` folder and try again to allow the container environment to install the correct libraries.

## Folder Structure

All source code is in `src`, with `lib` and `routes` being the primary development folders.

```shell
Directory       Client/Server   Description
───────────────────────────────────────────
src
 ├─lib
 │  ├─components      C         # Svelte components
 │  ├─events          C         # Client-side event library
 │  ├─helpers        S/C        # Client-side and server-side helpers
 │  ├─server          S         # Primary server code
 │  │  ├─helpers      S         # Server-side helper functions
 │  │  ├─prisma       S         # Prisma instance
 │  │  └─settings     S         # Settings sub-system
 │  └─types          S/C        # Shared client-side and server types
 └─routes            S/C        # Front-end routes and API endpoints
    └─api            S/C        # Front-end API endpoints
```

## `dev` vs `prod`

There are some differences between the dev environment and the production environment. The primary difference applicable to development is hot-reloading. Since `vite` watches for changes in files, and the dev Docker container is mounted to the local file directory, changes in code will trigger a reload in the dev environment. This makes for very efficient development, as the container does not have to be restarted to reflect changes. _However_, the hot-reload is **not** an actual reload. The following are some examples of async code server-side that will still exist after the hot-reload:

- `setTimeout` and `setInterval` functions
- The processes created by `child_process.spawn(...)` and similar
- Anything stored in `global`

## Debug Logs

During development, it is often useful to see more logs. Activate `debug` in `settings` to increase the verbosity of console logs. Use the `debug` level setting in code when appropriate:

```Typescript
const debug = await settings.get('system.debug');
if (debug) console.log('Debug message here!');
```