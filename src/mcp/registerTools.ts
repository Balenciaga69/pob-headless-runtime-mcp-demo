import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerBuildConfigTools } from "../tools/build/configTools.js";
import { registerBuildEquipmentTools } from "../tools/build/equipmentTools.js";
import { registerBuildLoadTools } from "../tools/build/loadTools.js";
import { registerBuildReadTools } from "../tools/build/readTools.js";
import { registerBuildSkillTools } from "../tools/build/skillTools.js";
import { registerBuildSaveTools } from "../tools/build/saveTools.js";
import { registerRuntimeTools } from "../tools/runtimeTools.js";

export function registerDemoTools(server: McpServer) {
  registerRuntimeTools(server);
  registerBuildLoadTools(server);
  registerBuildReadTools(server);
  registerBuildConfigTools(server);
  registerBuildEquipmentTools(server);
  registerBuildSkillTools(server);
  registerBuildSaveTools(server);
}
