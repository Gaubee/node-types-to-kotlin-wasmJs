import { ImportDeclaration } from "npm:ts-morph@21.0.1";
import { KotlinCode } from "./KotlinCodeGen.mts";
import type { KotlinProjectCodeGen } from "./KotlinProjectCodeGen.mts";

interface KotlinImport {
  package: string;
  name: string;
  alias?: string;
}

export class KotlinHeaderCodeGen implements KotlinCode {
  constructor(
    readonly project: KotlinProjectCodeGen,
    readonly parent?: KotlinHeaderCodeGen
  ) {
    parent?.children.push(this);
  }
  static fromParent(parent: KotlinHeaderCodeGen) {
    return new KotlinHeaderCodeGen(parent.project, parent);
  }
  readonly codes = new Map<string, KotlinImport>();
  addImport(importPackage: string, importName: string, importAlias?: string) {
    this.codes.set(importAlias || importName, {
      package: importPackage,
      name: importName,
      alias: importAlias,
    });
  }
  readonly children: KotlinHeaderCodeGen[] = [];
  // readonly _importedNames = new Set<string>();
  hasImportedName(name: string): boolean {
    return (
      this.codes.has(name) || this.children.some((c) => c.hasImportedName(name))
    );
  }
  hasProjectKeyName(name: string) {
    return this.project.hasKeyName(name);
  }
  whereProjectKeyName(name: string) {
    return this.project.whereKeyName(name);
  }
  getAllCodes(): Map<string, KotlinImport> {
    if (this.children.length === 0) {
      return this.codes;
    }
    const importCodes = new Map(this.codes);
    for (const child of this.children) {
      for (const [key, code] of child.getAllCodes()) {
        importCodes.set(key, code);
      }
    }
    return importCodes;
  }
  parse(node: ImportDeclaration) {
    const importFrom = node.getModuleSpecifier().getLiteralText();
    if (importFrom.startsWith("node:") === false) {
      return "";
    }
    const import_module_name = importFrom.replace("node:", "");
    for (const namedImport of node.getNamedImports()) {
      const importName = namedImport.getName();
      const importAlias = namedImport.getAliasNode()?.getText();
      this.addImport(`org.node.${import_module_name}`, importName, importAlias);
    }
    return "";
  }
  genCode() {
    return [...this.getAllCodes().values()]
      .map((kotlinImport) => {
        const kotlinImportCode = `import ${kotlinImport.package}.${kotlinImport.name}`;
        if (kotlinImport.alias) {
          return `${kotlinImportCode} as ${kotlinImport.alias}`;
        }
        return kotlinImportCode;
      })
      .join("\n");
  }
}
