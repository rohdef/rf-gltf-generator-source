#!/usr/bin/env node
import * as fs from "node:fs"
import Path from "node:path"
import {GLTFLoader} from "node-three-gltf"
import {Group, Mesh, Object3D} from "three"

if (process.argv.length != 4) {
    console.error("Usage: generateClasses [gltfPath] [outputPath]")
    console.error("    [gltfPath]   - the glb/gltf file to parse")
    console.error("    [outputPath] - where to put the resulting typescript")
    process.exit()
}
const gltfPath = process.argv[2]
const outputPath = process.argv[3]

parseGltf(gltfPath, outputPath)

function parseGltf(gltfPath: string, outputPath: string) {
    const loader = new GLTFLoader()
    const fileData = fs.readFileSync(gltfPath)
    const outputFilename = Path.parse(gltfPath).name

    loader.parse(
        fileData,
        "",
        (gltf) => dumpFile(gltf.scene, outputPath, outputFilename),
        (err) => {
            console.error(`Could not parse input file as gltf: ${gltfPath}`)
            console.error(err)
        },
    )
}

function dumpFile(obj: Object3D, path: string, outputFilename: string) {
    const structureCode = dumpObject3d(obj)
    const code = `import {Group, Mesh, Object3D} from "three"

export const GltfStructure = {
${structureCode}
}
`

    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, {recursive: true});
    }

    fs.writeFileSync(`${path}/${outputFilename}.ts`, code)
}

function dumpObject3d(object3d: Object3D, indent: string = "  ") {
    let element: string
    switch (object3d.constructor) {
        case Object3D:
            element = `${indent}element: (contained: Object3D) => (contained.getObjectByName("${object3d.name}") as Object3D),`
            break;
        case Group:
            element = `${indent}element: (contained: Object3D) => (contained.getObjectByName("${object3d.name}") as Group),`
            break;
        case Mesh:
            element = `${indent}element: (contained: Object3D) => (contained.getObjectByName("${object3d.name}") as Mesh),`
            break;
        default:
            throw new Error(`Unsupported Object3D type: ${object3d.constructor.name} for object with name: ${object3d.name}`)
    }

    const newIndent = `${indent}  `
    object3d.children.forEach((child: Object3D) => dumpObject3d(child, newIndent))
    const childen: string = object3d.children
        .map((child: Object3D) => `${indent}"${sanitizeName(child.name)}": {\n${dumpObject3d(child, newIndent)}\n${indent}},`)
        .join("\n")

    return `${element}\n${childen}`
}

function sanitizeName(name: string) {
    const nameBits = name.trim()
        .split("_")
        .filter(name => name != null && name != "")

    const car = nameBits[0]
    const cdr = nameBits.slice(1)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join()

    return `${car}${cdr}`
}