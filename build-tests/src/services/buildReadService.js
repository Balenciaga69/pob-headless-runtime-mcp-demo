import { createWorkerRequest } from "../worker/requests.js";
import { getPersistentPobWorker } from "../worker/persistentClient.js";
import { callTransientPobWorker } from "../worker/transientClient.js";
export async function summarizeCurrentBuild() {
    return getPersistentPobWorker().send(createWorkerRequest("get_summary", {}));
}
export async function summarizeBuildIsolated(buildCode, buildName) {
    return callTransientPobWorker(createWorkerRequest("get_summary", {
        build_code: buildCode,
        ...(buildName ? { build_name: buildName } : {}),
    }));
}
export async function getCurrentBuildStats(fields) {
    return getPersistentPobWorker().send(createWorkerRequest("get_stats", {
        fields,
    }));
}
export async function getCurrentDisplayStats() {
    return getPersistentPobWorker().send(createWorkerRequest("get_display_stats", {}));
}
export async function previewCurrentItemDisplayStats(itemText, slot) {
    return getPersistentPobWorker().send(createWorkerRequest("preview_item_display_stats", {
        item_text: itemText,
        ...(slot ? { slot } : {}),
    }));
}
export async function listCurrentEquipment() {
    return getPersistentPobWorker().send(createWorkerRequest("list_equipment", {}));
}
export async function listCurrentItems() {
    return getPersistentPobWorker().send(createWorkerRequest("list_items", {}));
}
export async function listCurrentSkills() {
    return getPersistentPobWorker().send(createWorkerRequest("list_skills", {}));
}
export async function getCurrentSelectedSkill() {
    return getPersistentPobWorker().send(createWorkerRequest("get_selected_skill", {}));
}
export async function getCurrentConfig() {
    return getPersistentPobWorker().send(createWorkerRequest("get_config", {}));
}
