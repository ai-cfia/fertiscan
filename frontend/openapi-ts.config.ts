import { defineConfig } from "@hey-api/openapi-ts"

export default defineConfig({
  input: "./openapi.json",
  output: "./src/api",

  plugins: [
    "@hey-api/client-axios",
    {
      name: "@hey-api/sdk",
      // NOTE: this doesn't allow tree-shaking
      asClass: true,
      operationId: true,
      classNameBuilder: "{{name}}Service",
      methodNameBuilder: (operation: any) => {
        // Use id (camelCase) or operationId (snake_case) as fallback
        const name = operation.id || operation.operationId || ""
        const tags = operation.tags || []
        const service = tags[0] || ""

        let methodName = name

        // Remove service prefix if present (e.g., "healthLiveness" -> "liveness")
        if (
          service &&
          methodName.toLowerCase().startsWith(service.toLowerCase())
        ) {
          methodName = methodName.slice(service.length)
        }

        // Ensure first letter is lowercase
        return methodName.charAt(0).toLowerCase() + methodName.slice(1)
      },
    },
    {
      name: "@hey-api/schemas",
      type: "json",
    },
  ],
})
