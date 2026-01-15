# Project arguments
ARG NODE_VERSION=24.5.0
ARG USR_LOCAL_EXPORT=/export-usr-bin
ARG ROOT_EXPORT=/export-root
ARG SERVER_PORT=3000

ARG PARENT_IMAGE=node:${NODE_VERSION}-alpine3.22


FROM ${PARENT_IMAGE} AS node_install


FROM ${PARENT_IMAGE} AS dev
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install pnpm
RUN pnpm fetch --prod

# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
# RUN apt-get update && apt-get install curl gnupg -y \
#   && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
#   && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
#   && apt-get update \
#   && apt-get install google-chrome-stable -y --no-install-recommends \
#   && rm -rf /var/lib/apt/lists/*
RUN apk --update --upgrade add chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

######### Node Modules & Build #####################################################################
FROM ${PARENT_IMAGE} AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copy the application and move to the copied folder
WORKDIR /app
# Install pnpm
RUN pnpm fetch --prod
COPY ./ /app/

# Install node modules
RUN echo "---- INSTALL NODE MODULES ----" \
  && cd /app/ && pnpm i && pnpm exec prisma generate

RUN apk --update --upgrade add chromium

# Build the SvelteKit project
RUN echo "---- BUILD SERVER ----" \
  && ORIGIN=${ORIGIN} PROTOCOL_HEADER=x-forwarded-proto HOST_HEADER=x-forwarded-host pnpm run build


######### Production Stage #########################################################################
FROM ${PARENT_IMAGE} AS prod
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Assign labels
LABEL org.opencontainers.image.title=contour
LABEL org.opencontainers.image.description="Docker container logging flight data"
LABEL org.opencontainers.image.documentation="https://github.com/knicholson32/contour"
LABEL org.opencontainers.image.authors="Keenan Nicholson, Norris Nicholson"
LABEL org.opencontainers.image.source="https://github.com/knicholson32/contour"

# Renew args from above
ARG NODE_VERSION
ARG PARENT_IMAGE
ARG USR_LOCAL_EXPORT
ARG ROOT_EXPORT
ARG WHEEL_EXPORT
ARG SERVER_PORT

# Set environmental variables
ENV PORT=${SERVER_PORT}
ENV DATABASE_URL="file:/db/contour.db?connection_limit=1"
ENV ORIGIN="http://localhost:${SERVER_PORT}"
# 11MB Max body size (for image uploads)
ENV BODY_SIZE_LIMIT=11000000
ENV PROC_SHELL='/bin/sh'
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install pnpm
RUN pnpm fetch --prod

COPY --from=build "/app/prisma/" "/app/prisma"
COPY --from=build "/app/package.json" "/app/package.json"
COPY --from=build "/app/pnpm-lock.yaml" "/app/pnpm-lock.yaml"
COPY --from=build "/app/pnpm-lock.yaml" "/app/pnpm-lock.yaml"
# COPY --from=build "/usr/bin/chromium-browser" "/usr/bin/chromium-browser"
# COPY --from=build "/usr/bin/chromium" "/usr/bin/chromium"

# Install chromium
RUN apk --update --upgrade add chromium

# Install production node dependancies
RUN echo "---- Install Production Dependancies ----" \
  && cd /app \
  && pnpm i --prod --loglevel debug && pnpm exec prisma generate

COPY --from=build "/app/build/" "/app/"

ARG GIT_COMMIT
ARG GIT_REF
ARG GIT_REF_PROTECTED
ARG REGISTRY_IMAGE
ARG CI

ENV GIT_COMMIT=$GIT_COMMIT
ENV GIT_REF=$GIT_REF
ENV GIT_REF_PROTECTED=$GIT_REF_PROTECTED
ENV REGISTRY_IMAGE=$REGISTRY_IMAGE
ENV CI=$CI
ENV NODE_VERSION=${NODE_VERSION}
ENV PARENT_IMAGE=${PARENT_IMAGE}

ARG BUILD_TIMESTAMP
ENV BUILD_TIMESTAMP=$BUILD_TIMESTAMP

STOPSIGNAL SIGKILL
# Set Docker command entry point and expose the proper port
EXPOSE ${SERVER_PORT}/tcp
CMD ["sh","-c","cd /app && pnpm exec prisma migrate deploy && PROTOCOL_HEADER=x-forwarded-proto HOST_HEADER=x-forwarded-host CHROMIUM_VERSION=$(/usr/bin/chromium-browser --version) /usr/local/bin/node /app"]