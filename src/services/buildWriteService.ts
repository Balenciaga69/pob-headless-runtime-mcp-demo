import { createWorkerRequest } from "../worker/requests.js";
import { getPersistentPobWorker } from "../worker/persistentClient.js";

export type BuildConfigInput = {
  bandit?: string;
  pantheonMajorGod?: string;
  pantheonMinorGod?: string;
  enemyLevel?: number;
  enemyFireResist?: number;
  enemyColdResist?: number;
  enemyLightningResist?: number;
  enemyChaosResist?: number;
  enemyArmour?: number;
  enemyEvasion?: number;
  usePowerCharges?: boolean;
  useFrenzyCharges?: boolean;
  useEnduranceCharges?: boolean;
  conditionShockedGround?: boolean;
  conditionFortify?: boolean;
  conditionLeeching?: boolean;
  buffOnslaught?: boolean;
  enemyIsBoss?: string;
};

export async function setCurrentConfig(config: BuildConfigInput) {
  return getPersistentPobWorker().send(createWorkerRequest("set_config", config));
}

export async function equipCurrentItem(itemText: string, slot?: string) {
  return getPersistentPobWorker().send(
    createWorkerRequest("equip_item", {
      item_text: itemText,
      ...(slot ? { slot } : {}),
    }),
  );
}

export async function saveCurrentBuildCode() {
  return getPersistentPobWorker().send(createWorkerRequest("save_build_code", {}));
}

export async function saveCurrentBuildXml() {
  return getPersistentPobWorker().send(createWorkerRequest("save_build_xml", {}));
}

export async function saveCurrentBuildFile(filePath?: string) {
  return getPersistentPobWorker().send(
    createWorkerRequest("save_build_file", filePath ? { path: filePath } : {}),
  );
}
