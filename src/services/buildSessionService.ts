import { createWorkerRequest } from "../worker/requests.js";
import { getPersistentPobWorker } from "../worker/persistentClient.js";

export type BuildSource =
  | {
      buildCode: string;
      buildName?: string;
    }
  | {
      buildXml: string;
      buildName?: string;
    }
  | {
      filePath: string;
    };

function buildLoadRequest(source: BuildSource) {
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

export async function loadBuildIntoSession(source: BuildSource) {
  return getPersistentPobWorker().send(buildLoadRequest(source));
}
