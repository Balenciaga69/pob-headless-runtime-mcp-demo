import { summarizeCurrentBuild } from "../services/buildReadService.js";
import { loadBuildIntoSession } from "../services/buildSessionService.js";
import { shutdownPersistentPobWorker } from "../worker/persistentClient.js";
const buildCode = process.env.POB_BUILD_CODE ?? "PASTE_POB_BUILD_CODE_HERE";
async function main() {
    try {
        if (buildCode === "PASTE_POB_BUILD_CODE_HERE") {
            throw new Error("Set POB_BUILD_CODE before running npm run test:worker, or edit src/scripts/testWorker.ts.");
        }
        await loadBuildIntoSession({ buildCode });
        console.error(JSON.stringify(await summarizeCurrentBuild(), null, 2));
    }
    finally {
        await shutdownPersistentPobWorker();
    }
}
main()
    .then(() => {
    process.exit(0);
})
    .catch((error) => {
    console.error("Worker test failed:", error);
    process.exit(1);
});
