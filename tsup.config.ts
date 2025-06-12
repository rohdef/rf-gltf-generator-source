import {defineConfig} from "tsup"

export default defineConfig({
    entry: ["./generate-gltf-structure.ts"],
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    clean: true,
})