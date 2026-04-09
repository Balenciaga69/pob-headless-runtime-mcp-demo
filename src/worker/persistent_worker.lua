local function normalize(path)
    if package.config:sub(1, 1) == "\\" then
        return path:gsub("/", "\\")
    end
    return path:gsub("\\", "/")
end

local function dirname(path)
    local normalized = normalize(path)
    local parent = normalized:match("^(.*)[/\\][^/\\]+$") or "."
    return parent
end

local function join(...)
    local separator = package.config:sub(1, 1)
    local parts = { ... }
    for index = 1, #parts do
        parts[index] = tostring(parts[index]):gsub("[/\\]+$", "")
    end
    return table.concat(parts, separator)
end

local function prependPackagePath(moduleDir)
    local pattern = join(moduleDir, "?.lua")
    local initPattern = join(moduleDir, "?", "init.lua")

    if not package.path:find(pattern, 1, true) then
        package.path = pattern .. ";" .. package.path
    end

    if not package.path:find(initPattern, 1, true) then
        package.path = initPattern .. ";" .. package.path
    end
end

local headlessDir = os.getenv("POB_HEADLESS_DIR")
if type(headlessDir) ~= "string" or headlessDir == "" then
    io.stderr:write("POB_HEADLESS_DIR is required\n")
    os.exit(1)
end

headlessDir = normalize(headlessDir)
local hostRepoRoot = dirname(headlessDir)

prependPackagePath(join(headlessDir, "src"))
prependPackagePath(join(hostRepoRoot, "runtime", "lua"))

local bootstrap = require("entry.bootstrap")
local transport = require("transport.json_stdio")
local transportError = require("transport.error")
local callbacks = require("runtime.callbacks").new()
local sessionModule = require("runtime.session")

local function readManifestVersion(repoRoot)
    local manifestPath = join(repoRoot, "manifest.xml")
    local handle = io.open(manifestPath, "rb")
    if not handle then
        return "unknown"
    end

    local content = handle:read("*a")
    handle:close()
    local version = content and content:match('<Version number="([^"]+)"')
    return version or "unknown"
end

local function stderrPrint(...)
    local parts = {}
    for index = 1, select("#", ...) do
        parts[#parts + 1] = tostring(select(index, ...))
    end
    io.stderr:write(table.concat(parts, "\t") .. "\n")
end

_G.print = stderrPrint

local context = {
    pathSeparator = package.config:sub(1, 1),
    toolDir = headlessDir,
    repoRoot = hostRepoRoot,
    sourceDir = join(hostRepoRoot, "src"),
    runtimeDir = join(hostRepoRoot, "runtime"),
    luaDir = join(headlessDir, "src"),
    runtimeLuaDir = join(hostRepoRoot, "runtime", "lua"),
    entryDir = join(headlessDir, "src", "entry"),
    runtimeModuleDir = join(headlessDir, "src", "runtime"),
    compatibilityDir = join(headlessDir, "src", "compatibility"),
    currentWorkDir = join(hostRepoRoot, "src"),
}

bootstrap.prepareEnvironment(context)
bootstrap.launch(context, callbacks)

local session = sessionModule.new(context, callbacks)
local _, settleErr = session:runUntilSettled({
    maxFrames = tonumber(os.getenv("POB_HEADLESS_MAX_FRAMES")) or 200,
    maxSeconds = tonumber(os.getenv("POB_HEADLESS_MAX_SECONDS")) or 5,
})

local baseResponseOptions = {
    api_version = "v1",
    engine_version = readManifestVersion(context.repoRoot),
}

if settleErr then
    local response = transportError.fromUpstream(nil, settleErr, transport.buildMeta(nil, {
        api_version = baseResponseOptions.api_version,
        engine_version = baseResponseOptions.engine_version,
        started_at = os.clock(),
    }))
    io.write(transport.encodeResponse(response) .. "\n")
    io.flush()
end

while true do
    local line = io.read("*line")
    if not line then
        break
    end

    local request, requestErr = transport.decodeRequest(line)
    local options = {
        api_version = baseResponseOptions.api_version,
        engine_version = baseResponseOptions.engine_version,
        started_at = os.clock(),
    }

    local response
    if not request then
        response = transportError.response(
            nil,
            requestErr.code,
            requestErr.message,
            requestErr.retryable,
            nil,
            transport.buildMeta(nil, options)
        )
    else
        response = transport.dispatchRequest(session.api, request, options)
    end

    io.write(transport.encodeResponse(response) .. "\n")
    io.flush()
end
