import {
  Expression,
  FunctionDeclaration,
  InterfaceDeclaration,
  ClassDeclaration,
  JSDocableNode,
  MethodSignature,
  ModuleDeclaration,
  Project,
  PropertySignature,
  SyntaxKind,
  Type,
  TypeNode,
  ts,
  ConstructorDeclaration,
  MethodDeclaration,
  PropertyDeclaration,
  ParameterDeclaration,
  ClassMemberTypes,
  ReturnTypedNode,
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

const KOTLIN_CODE_GEN_MAP = new Map<string, KotlinCodeGen>();

class KotlinCodeGen {
  static genKotlinCode(node: ModuleDeclaration) {
    const module_name = KotlinCodeGen.get_module_name(node);
    if (KOTLIN_CODE_GEN_MAP.has(module_name)) {
      return;
    }
    const codeGen = new KotlinCodeGen(node, module_name);
    KOTLIN_CODE_GEN_MAP.set(module_name, codeGen);
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
  readonly declarationNames = new Set<string>();
  constructor(
    readonly tsNode: ModuleDeclaration,
    readonly module_name: string
  ) {
    this.moduleName = KotlinCodeGen.getModuleName(this.module_name);
    this.kotlinHead = trim_ind(`
    @file:JsModule("node:${this.module_name}")
    
    package org.node.${this.moduleName}

    `);

    /// 收集关键字
    tsNode.getBody()?.forEachChild((node) => {
      if (
        node.isKind(SyntaxKind.InterfaceDeclaration) ||
        node.isKind(SyntaxKind.FunctionDeclaration) ||
        node.isKind(SyntaxKind.ClassDeclaration)
      ) {
        const dec_name = node.getName();
        if (dec_name !== undefined) {
          this.declarationNames.add(dec_name);
        }
      }
    });

    /// 生成代码
    let kotlinCode = "";
    tsNode.getBody()?.forEachChild((node) => {
      if (node.isKind(SyntaxKind.InterfaceDeclaration)) {
        kotlinCode += this.genInterfaceDeclaration(node);
      } else if (node.isKind(SyntaxKind.FunctionDeclaration)) {
        kotlinCode += this.genFunctionDeclaration(node);
      } else if (node.isKind(SyntaxKind.ClassDeclaration)) {
        kotlinCode += this.genClassDeclaration(node);
      }
    });

    this.save(kotlinCode);
  }
  kotlinHead: string;
  genClassDeclaration(node: ClassDeclaration) {
    let kotlinCode = `external class ${node.getName()}`;
    const constructors = node.getConstructors();

    if (constructors.length === 0) {
      kotlinCode += `()`;
    } else {
      kotlinCode += this.genConstructorDeclaration(constructors[0], true);
    }
    const staticMembers = node
      .getMembers()
      .filter((member) => "isStatic" in member && member.isStatic() === true);
    const noStaticMembers = node
      .getMembers()
      .filter(
        (member) =>
          "isStatic" in member === false || member.isStatic() === false
      );

    kotlinCode += `{
    ${
      constructors.length <= 1
        ? ""
        : constructors
            .slice(1)
            .map((ctorDec) => this.genConstructorDeclaration(ctorDec, false))
            .join("\n")
    }
    ${
      staticMembers.length === 0
        ? ""
        : `
        companion object {
          ${this.genClassMemberTypes(staticMembers)}
        }`
    }
    ${this.genClassMemberTypes(noStaticMembers)}
    }`;
    return this.genJsDocs(node) + kotlinCode + "\n";
  }
  genClassMemberTypes(members: ClassMemberTypes[]) {
    return members
      .map((member) => {
        /// MethodDeclaration | PropertyDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | ConstructorDeclaration | ClassStaticBlockDeclaration
        if (member.isKind(SyntaxKind.MethodDeclaration)) {
          return this.genMethod(member);
        } else if (member.isKind(SyntaxKind.PropertyDeclaration)) {
          return this.genProperty(member);
        }
        return "";
      })
      .join("\n");
  }
  genFunctionDeclaration(node: FunctionDeclaration) {
    const codes = [
      `external fun ${node.getName()}${this.genParameters(
        node.getParameters()
      )}`,
      ":",
      this.genReturnType(node),
    ];

    return this.genJsDocs(node) + codes.join(" ") + "\n";
  }
  genConstructorDeclaration(
    node: ConstructorDeclaration,
    isDefaultConstructor: boolean
  ) {
    let code = "";
    if (isDefaultConstructor === false) {
      code = "constructor";
    }
    code += this.genParameters(node.getParameters());

    return code;
  }
  genParameters(parameters: ParameterDeclaration[]) {
    return `(${parameters.map((param) => {
      const param_name = param.getName();
      if (param.isRestParameter()) {
        return `vararg ${param_name}: JsAny`;
      }
      return `${param_name}:${this.genTypeNode(
        param.getTypeNode(),
        param_name
      )}`;
    })})`;
  }

  genProperty(node: PropertySignature | PropertyDeclaration) {
    const codes: string[] = [];
    if ("hasOverrideKeyword" in node && node.hasOverrideKeyword()) {
      codes.push("override");
    }
    if (node.isReadonly()) {
      codes.push("val");
    } else {
      codes.push("var");
    }
    codes.push(
      node.getName(),
      ":",
      this.genType(node.getType(), node.getName())
    );
    return this.genJsDocs(node) + codes.join(" ") + ";";
  }
  genMethod(node: MethodSignature | MethodDeclaration) {
    const method_name = node.getName();
    const hasQuestionToken = node.hasQuestionToken();
    const codes: string[] = [];
    if ("hasOverrideKeyword" in node && node.hasOverrideKeyword()) {
      codes.push("override");
    }
    codes.push(
      hasQuestionToken ? `val ${method_name}: (` : `fun ${method_name}`
    );
    codes.push(this.genParameters(node.getParameters()));
    codes.push(hasQuestionToken ? " -> " : " : ");

    codes.push(this.genReturnType(node));

    if (hasQuestionToken) {
      codes.push(")?");
    }
    return this.genJsDocs(node) + codes.join(" ") + "\n";
  }

  genReturnType(
    node: MethodSignature | MethodDeclaration | FunctionDeclaration
  ) {
    const codes: string[] = [];
    /// 返回类型
    const isAsync = "isAsync" in node && node.isAsync();
    if (isAsync) {
      codes.push("Promise<");
    }
    codes.push(this.genTypeNode(node.getReturnTypeNode(), node.getName()));

    if (isAsync) {
      codes.push(">");
    }
    return codes.join("");
  }

  genInterfaceDeclaration(node: InterfaceDeclaration) {
    const interfaceName = node.getName();
    return (
      this.genJsDocs(node) +
      trim_ind(`
    external interface ${interfaceName} {
      ${node
        .getMembers()
        .map((member) => {
          let code = "";
          if (member.isKind(SyntaxKind.PropertySignature)) {
            code = this.genProperty(member);
          } else if (member.isKind(SyntaxKind.MethodSignature)) {
            code = this.genMethod(member);
          }

          // 补充注释
          if (code.length > 0) {
            code = this.genJsDocs(member) + code;
          }
          return code;
        })
        .join("\n")}
    }

    `)
    );
  }
  genJsDocs(_node: JSDocableNode) {
    // return node
    //   .getJsDocs()
    //   .map((jsdoc) => jsdoc.getText())
    //   .join("\n");
    return "";
  }
  genTypeByNodeText(node_text: string, alias?: string) {
    console.log("getTypeByNodeText:", node_text, alias);
    const typeCodes: string[] = [];
    if (this.declarationNames.has(node_text)) {
      typeCodes.push(node_text);
    } else if (node_text === "string" || node_text.startsWith("`")) {
      typeCodes.push("String"); // JsString
    } else if (
      node_text === "boolean" ||
      node_text === "true" ||
      node_text === "false"
    ) {
      typeCodes.push("Boolean"); // JsBoolean
    } else if (node_text === "number" || /^\d+$/.test(node_text)) {
      if (alias?.indexOf("Id")) {
        typeCodes.push("Int"); // JsNumber
      } else {
        typeCodes.push("Double"); // JsNumber
      }
    } else if (node_text.startsWith("Array<") || node_text.endsWith("[]")) {
      typeCodes.push("JsArray");
      if (node_text === "string[]" || node_text === "Array<string>") {
        typeCodes.push("JsStringArray");
      } else {
        typeCodes.push("JsArray<*>");
      }
    } else if (node_text === "undefined" || node_text === "void") {
      typeCodes.push("Unit");
    } else if (
      node_text === "object" ||
      node_text === "any" ||
      node_text === "unknown"
    ) {
      typeCodes.push("JsAny");
    } else if (/\|\s*undefined/.test(node_text)) {
      typeCodes.push("JsAny?");
    } else {
      typeCodes.push("JsAny");
    }
    typeCodes.push(`/* ${node_text} */`);
    return typeCodes.join("");
  }
  genTypeNode(node: TypeNode | undefined, alias?: string) {
    return this.genTypeByNodeText(node?.getText() || "", alias);
  }
  genType(node: Type<ts.Type>, alias?: string) {
    const node_text = node.getText();
    console.log("genType:", node_text, alias);
    const typeCodes: string[] = [];
    if (node.isString()) {
      typeCodes.push("String"); // JsString
    } else if (node.isBoolean() || node.isBooleanLiteral()) {
      typeCodes.push("Boolean"); // JsBoolean
    } else if (node.isNumber() || node.isNumberLiteral()) {
      if (alias?.indexOf("Id")) {
        typeCodes.push("Int"); // JsNumber
      } else {
        typeCodes.push("Double"); // JsNumber
      }
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
      if (node_text === "undefined" || node_text === "void") {
        typeCodes.push("Unit");
      } else {
        typeCodes.push("JsAny");
      }
    }
    if (node.isNullable()) {
      typeCodes.push("?");
    }
    typeCodes.push(`/* ${node_text} */`);
    return typeCodes.join("");
  }

  save(kotlinCode: string) {
    fs.writeFileSync(`${this.moduleName}.kt`, this.kotlinHead + kotlinCode);
    execSync(
      `java -jar ktfmt-0.46-jar-with-dependencies.jar ${this.moduleName}.kt`
    );
  }
}

async_hooks_sourceFile.forEachChild((node) => {
  if (node.isKind(SyntaxKind.ModuleDeclaration)) {
    KotlinCodeGen.genKotlinCode(node);
  }
  return node;
});
