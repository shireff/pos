/**
 * Empty stub that replaces native MongoDB packages in the browser/client
 * bundle. These packages use Node.js native binaries (.node files) that
 * cannot run in a browser context. cloud-db.ts is marked `server-only` so
 * none of this code executes client-side — the stub just satisfies webpack's
 * module resolution without bundling the native binaries.
 */
module.exports = {};
