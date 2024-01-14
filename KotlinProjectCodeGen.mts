import {
  FunctionDeclaration,
  InterfaceDeclaration,
  ClassDeclaration,
  ModuleDeclaration,
  SyntaxKind,
  Node,
  ImportDeclaration,
} from "npm:ts-morph@21.0.1";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { KotlinCode } from "./KotlinCodeGen.mts";
import { KotlinHeaderCodeGen } from "./KotlinHeaderCodeGen.mts";
import process from "node:process";
import { KotlinFunBodyCode } from "./KotlinFunBodyCode.mts";
import { KotlinInterfaceBodyCode } from "./KotlinInterfaceBodyCode.mts";
import { KotlinClassBodyCode } from "./KotlinClassBodyCode.mts";

export class KotlinProjectCodeGen {
  static ALL = new Map<string, KotlinProjectCodeGen>();
  static genKotlinCode(node: ModuleDeclaration, parent?: KotlinProjectCodeGen) {
    const module_name = KotlinProjectCodeGen.get_module_name(node);
    if (parent === undefined && module_name !== "global") {
      parent = this.ALL.get("org/node/global.kt");
    }
    const kotlinCodeGen = new KotlinProjectCodeGen(node, module_name, parent);
    const cache_key = kotlinCodeGen.relativeFilepath;
    let cacheCodeGen = this.ALL.get(cache_key);
    if (cacheCodeGen === undefined) {
      cacheCodeGen = kotlinCodeGen;
      this.ALL.set(cache_key, cacheCodeGen);
    }
    cacheCodeGen.transform(node);

    return cacheCodeGen;
  }
  static getModuleName = (module_name: string) =>
    module_name.replace(/_([a-z])/, (_, l) => l.toUpperCase());
  static get_module_name = (tsNode: ModuleDeclaration) =>
    tsNode
      .getName()
      .replace(/['"]/g, "")
      .replace(/^node\:/, "");
  /// genModuleDeclaration
  readonly moduleName: string;
  readonly _declarationNames = new Set<string>();
  hasDeclaration(name: string): boolean {
    return this._declarationNames.has(name);
  }
  hasKeyName(name: string): boolean {
    return (
      this.hasDeclaration(name) ||
      this.kotlinHeaderCodeGen.hasImportedName(name) ||
      this.parent?.hasKeyName(name) ||
      false
    );
  }
  whereKeyName(name: string): KotlinProjectCodeGen | undefined {
    if (this._declarationNames.has(name)) {
      return this;
    }
    return this.parent?.whereKeyName(name);
  }
  get fileJsModule(): string {
    if (this.module_name === "global") {
      return "";
    }
    if (this.moduleNode.hasDeclareKeyword()) {
      return `@file:JsModule("node:${this.module_name}")`;
    }
    return this.parent?.fileJsModule ?? "";
  }
  get hasFileJsModule() {
    return this.fileJsModule !== "";
  }
  get package(): string {
    if (this.moduleName === "global") {
      return "org.node";
    }

    if (this.parent?.hasFileJsModule) {
      return this.parent.package;
    }
    const basePackage = this.parent?.package ?? "org.node";
    return `${basePackage}.${this.module_name}`.toLowerCase();
  }

  constructor(
    readonly moduleNode: ModuleDeclaration,
    readonly module_name: string,
    readonly parent?: KotlinProjectCodeGen
  ) {
    this.moduleName = KotlinProjectCodeGen.getModuleName(this.module_name);
  }

  kotlinCodes = new (class KotlinCodes extends Map<string, KotlinCode> {
    getInterface(name: string) {
      return this.get(`interface ${name}`) as
        | KotlinInterfaceBodyCode
        | undefined;
    }
    getClass(name: string) {
      return this.get(`class ${name}`) as KotlinClassBodyCode | undefined;
    }
  })();

  transform(moduleNode = this.moduleNode) {
    /// 收集关键字
    const moduleNodes = this.groupModuleNodes(moduleNode);
    for (const node of Object.values(moduleNodes).flat()) {
      const dec_name = "getName" in node && node.getName();
      if (typeof dec_name === "string") {
        this._declarationNames.add(dec_name);
      }
    }

    /// 生成代码
    moduleNodes.importNodes.forEach((node) => {
      this.kotlinHeaderCodeGen.parse(node);
    });
    moduleNodes.functionNodes.forEach((node) => {
      this.kotlinCodes.set(
        `fun ${node.getName()}`,
        this.genFunctionDeclaration(node)
      );
    });
    moduleNodes.classNodes.forEach((node) => {
      this.kotlinCodes.set(
        `class ${node.getName()}`,
        this.genClassDeclaration(node)
      );
    });
    moduleNodes.interfaceNodes.forEach((node) => {
      const interfaceName = node.getName();

      const classNode = this.kotlinCodes.getClass(interfaceName) as
        | KotlinClassBodyCode
        | undefined;

      this.kotlinCodes.set(
        `interface ${interfaceName}`,
        this.genInterfaceDeclaration(node, classNode)
      );
    });

    moduleNodes.moduleNodes.forEach((node) => {
      KotlinProjectCodeGen.genKotlinCode(node, this);
    });
  }

  static *walkNodes(
    node: Node,
    transformer: (node: Node) => Node | undefined
  ): Generator<Node> {
    for (const children of node.getChildren()) {
      const transformChildren = transformer(children);
      if (transformChildren) {
        yield* this.walkNodes(transformChildren, transformer);
      }
    }
  }

  groupModuleNodes(node: ModuleDeclaration) {
    const nodeBody = node.getBody();
    const interfaceNodes: InterfaceDeclaration[] = [];
    const functionNodes: FunctionDeclaration[] = [];
    const classNodes: ClassDeclaration[] = [];
    const importNodes: ImportDeclaration[] = [];
    const moduleNodes: ModuleDeclaration[] = [];
    if (nodeBody !== undefined) {
      const walker = KotlinProjectCodeGen.walkNodes(nodeBody, (node) => {
        if (node.isKind(SyntaxKind.InterfaceDeclaration)) {
          interfaceNodes.push(node);
        } else if (node.isKind(SyntaxKind.FunctionDeclaration)) {
          functionNodes.push(node);
        } else if (node.isKind(SyntaxKind.ClassDeclaration)) {
          classNodes.push(node);
        } else if (node.isKind(SyntaxKind.ImportDeclaration)) {
          importNodes.push(node);
        } else if (node.isKind(SyntaxKind.ModuleDeclaration)) {
          moduleNodes.push(node);
          // KotlinCodeGen.genKotlinCode(node, this);
        } else {
          return node;
        }
      });
      for (const _ of walker) {
        /** all */
      }
    }
    return {
      interfaceNodes,
      functionNodes,
      classNodes,
      importNodes,
      moduleNodes,
    };
  }
  get kotlinHead() {
    return `
      ${this.fileJsModule}

      package ${this.package}
    `;
  }
  kotlinHeaderCodeGen = new KotlinHeaderCodeGen(this);

  genClassDeclaration(node: ClassDeclaration) {
    return new KotlinClassBodyCode(node, this.kotlinHeaderCodeGen);
  }
  genFunctionDeclaration(node: FunctionDeclaration) {
    return new KotlinFunBodyCode(node, this.kotlinHeaderCodeGen);
  }
  genInterfaceDeclaration(
    node: InterfaceDeclaration,
    classNode?: KotlinClassBodyCode
  ) {
    return new KotlinInterfaceBodyCode(
      node,
      this.kotlinHeaderCodeGen,
      classNode
    );
  }
  get relativeFilepath() {
    return this.package.replaceAll(".", "/") + `/${this.moduleName}.kt`;
  }
  get kotlinImportCode(): string {
    return (
      (this.parent?.kotlinImportCode ?? "") +
      "\n" +
      this.kotlinHeaderCodeGen.genCode()
    );
  }
  get kotlinBodyCode() {
    return [...this.kotlinCodes.values()]
      .map((gen) => gen.genCode())
      .join("\n");
  }
  get kotlinContent() {
    /// 先读取 bodyCode，这样才能读取到importCode
    const kotlinBodyCode = this.kotlinBodyCode;
    const kotlinImportCode = this.kotlinImportCode;
    return kotlinImportCode + "\n\n" + kotlinBodyCode;
  }
  save() {
    const { relativeFilepath } = this;
    console.log("saving", relativeFilepath);
    const rFilepath = path.resolve(process.cwd(), relativeFilepath);
    fs.mkdirSync(path.dirname(rFilepath), { recursive: true });

    fs.writeFileSync(rFilepath, this.kotlinHead + this.kotlinContent);
    try {
      execSync(`java -jar ktfmt-0.46-jar-with-dependencies.jar ${rFilepath}`);
    } catch (e) {
      console.warn(e);
    }

    /// 拷贝到我们自己的项目中
    const tFilepath = path.resolve(
      `/Users/kzf/Development/GitHub/dweb_browser/next/kmp/helperPlatformNode/src/wasmJsMain/kotlin`,
      relativeFilepath
    );
    fs.mkdirSync(path.dirname(tFilepath), { recursive: true });
    fs.writeFileSync(tFilepath, fs.readFileSync(rFilepath));
  }
}
