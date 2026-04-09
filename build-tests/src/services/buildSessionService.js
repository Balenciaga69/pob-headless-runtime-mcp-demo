import { createWorkerRequest } from "../worker/requests.js";
import { getPersistentPobWorker } from "../worker/persistentClient.js";
function buildLoadRequest(source) {
    if ("buildCode" in source) {
        return createWorkerRequest("load_build_code", {
            build_code: source.buildCode,
            ...(source.buildName ? { build_name: source.buildName } : {}),
        });
    }
    if ("buildXml" in source) {
        return createWorkerRequest("load_build_xml", {
            build_xml: source.buildXml,
            ...(source.buildName ? { build_name: source.buildName } : {}),
        });
    }
    return createWorkerRequest("load_build_file", {
        path: source.filePath,
    });
}
export async function loadBuildIntoSession(source) {
    return getPersistentPobWorker().send(buildLoadRequest(source));
}
