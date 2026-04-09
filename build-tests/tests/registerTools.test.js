import assert from "node:assert/strict";
import test from "node:test";
import { registerDemoTools } from "../src/mcp/registerTools.js";
test("registerDemoTools exposes the stable skill and item tools", () => {
    const registeredTools = [];
    const server = {
        registerTool(name) {
            registeredTools.push(name);
        },
    };
    registerDemoTools(server);
    assert.ok(registeredTools.includes("list_items"), "expected list_items tool");
    assert.ok(registeredTools.includes("list_skills"), "expected list_skills tool");
    assert.ok(registeredTools.includes("get_selected_skill"), "expected get_selected_skill tool");
    assert.ok(registeredTools.includes("select_skill"), "expected select_skill tool");
    assert.ok(registeredTools.includes("preview_item_display_stats"), "expected preview_item_display_stats tool");
});
