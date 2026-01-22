import { defineConfig, utils } from "@hey-api/openapi-ts"

export default defineConfig({
  input: "./openapi.json",
  output: "./src/api",
  plugins: [
    {
      name: "@hey-api/sdk",
      operations: {
        strategy: "byTags",
        containerName: "{{name}}Service",
        nesting: (operation) => {
          const name = operation.operationId || ""
          const tags = operation.tags || []
          const service = tags[0] || ""

          // Remove service prefix if present (e.g., "health_liveness" -> "_liveness")
          if (service && name.toLowerCase().startsWith(service.toLowerCase()))
            return [name.slice(service.length)] as const

          return [name] as const
        },
        methodName: (name) => {
          return utils.toCase(name || "", "camelCase")
        },
      },
    },
    {
      name: "@hey-api/schemas",
      type: "json",
    },
  ],
})
