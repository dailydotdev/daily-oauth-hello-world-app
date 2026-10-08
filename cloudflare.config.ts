import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  accountId: "40ad70c54e5f931d964841dce2b5d066",
  worker: defineWorker({
    name: "daily-oauth-hello-world-app",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-07",
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    workersDev: false,
    previewUrls: false,
    env: {
      ASSETS: bindings.assets(),
      DAILY_CLIENT_ID: bindings.secret(),
      DAILY_CLIENT_SECRET: bindings.secret(),
      DAILY_API_URL: bindings.secret(),
      DAILY_RESOURCE: bindings.secret(),
      DAILY_SCOPES: bindings.secret(),
      APP_URL: bindings.secret(),
    },
  }),
});
