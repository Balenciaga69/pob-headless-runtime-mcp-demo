import { createWorkerRequest } from "../worker/requests.js";
import { getPersistentPobWorker } from "../worker/persistentClient.js";
export async function setCurrentConfig(config) {
    return getPersistentPobWorker().send(createWorkerRequest("set_config", config));
}
export async function equipCurrentItem(itemText, slot) {
    return getPersistentPobWorker().send(createWorkerRequest("equip_item", {
        item_text: itemText,
        ...(slot ? { slot } : {}),
    }));
}
export async function selectCurrentSkill(params) {
    return getPersistentPobWorker().send(createWorkerRequest("select_skill", {
        ...params,
    }));
}
export async function saveCurrentBuildCode() {
    return getPersistentPobWorker().send(createWorkerRequest("save_build_code", {}));
}
export async function saveCurrentBuildXml() {
    return getPersistentPobWorker().send(createWorkerRequest("save_build_xml", {}));
}
export async function saveCurrentBuildFile(filePath) {
    return getPersistentPobWorker().send(createWorkerRequest("save_build_file", filePath ? { path: filePath } : {}));
}
