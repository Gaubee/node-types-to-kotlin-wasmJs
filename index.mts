import {
  FunctionDeclaration,
  InterfaceDeclaration,
  ModuleDeclaration,
  Project,
  SyntaxKind,
  Type,
  ts,
} from "npm:ts-morph@21.0.1";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const project = new Project();
const async_hooks_filepath = `./node_modules/@types/node/async_hooks.d.ts`;
const async_hooks_sourceFile = project.createSourceFile(
  path.parse(async_hooks_filepath).name,
  fs
    .readFileSync(fileURLToPath(import.meta.resolve(async_hooks_filepath)))
    .toString()
);
const trim_ind = (str: string) => {
  const ind = Math.min(
    ...str.split("\n").map((line) => {
      const trim_line = line.trimStart();
      if (trim_line.length === 0) {
        return Infinity;
      }
      return line.length - trim_line.length;
    })
  );
  return str
    .trimStart()
    .split("\n")
    .map((line) => {
      if (line.slice(0, ind).trim().length === 0) {
        return line.slice(ind);
      }
      return line.trimStart();
    })
    .join("\n");
};

class KotlinCodeGen {
  /// genModuleDeclaration
  constructor(readonly tsNode: ModuleDeclaration) {
    this.module_name = tsNode.getName().replace(/['"]/g, "");
    this.moduleName = KotlinCodeGen.getModuleName(this.module_name);
    this.kotlinCode = trim_ind(`
    @file:JsModule("${this.module_name}")
    
    package org.node.${this.moduleName}

    `);
    tsNode.getBody()?.forEachChild((node) => {
      if (node.isKind(SyntaxKind.InterfaceDeclaration)) {
        this.genInterfaceDeclaration(node);
      } else if (node.isKind(SyntaxKind.FunctionDeclaration)) {
        this.genFunctionDeclaration(node);
      }
    });
  }
  static getModuleName = (module_name: string) =>
    module_name.replace(/_([a-z])/, (_, l) => l.toUpperCase());
  readonly module_name: string;
  readonly moduleName: string;
  kotlinCode: string;
  genFunctionDeclaration(node: FunctionDeclaration) {
    this.kotlinCode += `fun ${node.getName()}(${node
      .getParameters()
      .map((param) => {
        return `${param.getName()}:${this.genType(param.getType())}`;
      })})`;

    try {
      this.kotlinCode += ":" + this.genType(node.getReturnType());
    } catch {}
    this.kotlinCode += "\n";
  }

  genInterfaceDeclaration(node: InterfaceDeclaration) {
    const interfaceName = node.getName();
    this.kotlinCode += trim_ind(`
    external interface ${interfaceName} {
      ${node
        .getProperties()
        .map((prop) => {
          const propCode: string[] = [];
          if (prop.isReadonly()) {
            propCode.push("val");
          } else {
            propCode.push("var");
          }
          propCode.push(prop.getName(), ":", this.genType(prop.getType()));
          return propCode.join(" ") + ";";
        })
        .join("\n")}
    }

    `);
  }
  genType(node: Type<ts.Type>) {
    console.log("genType:", node.getText());
    const typeCodes: string[] = [];
    if (node.isString()) {
      typeCodes.push("String"); // JsString
    } else if (node.isBoolean() || node.isBooleanLiteral()) {
      typeCodes.push("Boolean"); // JsBoolean
    } else if (node.isNumber() || node.isNumberLiteral()) {
      typeCodes.push("Double"); // JsNumber
    } else if (node.isArray()) {
      typeCodes.push("JsArray");
      const arrayElementType = node.getArrayElementType();
      if (arrayElementType === undefined) {
        typeCodes.push("<*>");
      } else {
        const arrayTypeCode = `<${this.genType(arrayElementType)}>`;
        if (arrayTypeCode === "<String>") {
          typeCodes.pop();
          typeCodes.push("JsStringArray");
        } else {
          typeCodes.push(arrayTypeCode);
        }
      }
    } else {
      typeCodes.push("JsAny");
    }
    if (node.isNullable()) {
      typeCodes.push("?");
    }
    return typeCodes.join("");
  }

  save() {
    fs.writeFileSync(`${this.moduleName}.kt`, this.kotlinCode);
    execSync(
      `java -jar ktfmt-0.46-jar-with-dependencies.jar ${this.moduleName}.kt`
    );
  }
}

function genKotlinCode(node: ModuleDeclaration) {
  const codeGen = new KotlinCodeGen(node);
  node.getBody()?.forEachChild((node) => {
    if (node.isKind(SyntaxKind.InterfaceDeclaration)) {
      codeGen.genInterfaceDeclaration(node);
    }
  });

  codeGen.save();
}

async_hooks_sourceFile.forEachChild((node) => {
  if (node.isKind(SyntaxKind.ModuleDeclaration)) {
    genKotlinCode(node);
  }
  return node;
});
