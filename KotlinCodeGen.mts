import {
  Expression,
  FunctionDeclaration,
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
  ExpressionWithTypeArguments,
  Node,
  TypeElementTypes,
} from "npm:ts-morph@21.0.1";
import { KotlinHeaderCodeGen } from "./KotlinHeaderCodeGen.mts";

export interface KotlinCode {
  genCode(): string;
}
export abstract class KotlinBodyCode<N extends JSDocableNode>
  implements KotlinCode
{
  constructor(readonly node: N, parentHeader: KotlinHeaderCodeGen) {
    this.header = KotlinHeaderCodeGen.fromParent(parentHeader);
  }
  readonly header: KotlinHeaderCodeGen;
  genCode() {
    return this.genJsDocs(this.node);
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
    let prop_name = node.getName();
    if (prop_name.startsWith("[")) {
      return "";
    }
    if (prop_name.startsWith('"')) {
      return "";
      /// 还不支持 Name contains illegal chars that can't appear in JavaScript identifier
      prop_name = "`" + prop_name.slice(1, -1) + "`";
    }
    const codes: string[] = [];
    if ("hasOverrideKeyword" in node && node.hasOverrideKeyword()) {
      codes.push("override");
    }
    if (node.isReadonly()) {
      codes.push("val");
    } else {
      codes.push("var");
    }
    codes.push(prop_name, ":", this.genTypeNode(node.getTypeNode(), prop_name));
    return this.genJsDocs(node) + codes.join(" ") + ";";
  }
  genMethod(node: MethodSignature | MethodDeclaration, thisName: string) {
    let method_name = node.getName();
    if (method_name.startsWith("[") || method_name === "toString") {
      return "";
    }
    if (method_name.startsWith('"')) {
      return "";
      /// 还不支持 Name contains illegal chars that can't appear in JavaScript identifier
      method_name = "`" + method_name.slice(1, -1) + "`";
    }
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

    codes.push(this.genReturnType(node, thisName));

    if (hasQuestionToken) {
      codes.push(")?");
    }
    return this.genJsDocs(node) + codes.join(" ") + "\n";
  }

  genReturnType(
    node: MethodSignature | MethodDeclaration | FunctionDeclaration,
    thisName: string,
    returnTypeNode = node.getReturnTypeNode()
  ) {
    const codes: string[] = [];
    /// 返回类型
    const isAsync = "isAsync" in node && node.isAsync();
    if (isAsync) {
      codes.push("Promise<");
    }
    codes.push(this.genTypeNode(returnTypeNode, node.getName(), thisName));

    if (isAsync) {
      codes.push(">");
    }
    return codes.join("");
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
  genMemberTypes(
    members: (ClassMemberTypes | TypeElementTypes)[],
    thisName: string
  ) {
    return members
      .map((member) => {
        /// ClassMemberTypes = MethodDeclaration | PropertyDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | ConstructorDeclaration | ClassStaticBlockDeclaration
        /// TypeElementTypes = PropertySignature | MethodSignature | ConstructSignatureDeclaration | CallSignatureDeclaration | IndexSignatureDeclaration | GetAccessorDeclaration | SetAccessorDeclaration;
        let code = "";
        if (
          member.isKind(SyntaxKind.MethodDeclaration) ||
          member.isKind(SyntaxKind.MethodSignature)
        ) {
          code = this.genMethod(member, thisName);
        } else if (
          member.isKind(SyntaxKind.PropertyDeclaration) ||
          member.isKind(SyntaxKind.PropertySignature)
        ) {
          code = this.genProperty(member);
        }
        // 补充注释
        if (code.length > 0) {
          code = this.genJsDocs(member) + code;
        }
        return code;
      })
      .join("\n");
  }
  genExtends(exts: ExpressionWithTypeArguments[]) {
    if (exts.length === 0) {
      return "";
    }
    return `: ${exts.map((ext) => {
      return this.genTypeNode(ext);
    })}`;
  }
  genJsDocs(_node: JSDocableNode) {
    // return node
    //   .getJsDocs()
    //   .map((jsdoc) => jsdoc.getText())
    //   .join("\n");
    return "";
  }
  genTypeNode(
    node: TypeNode | undefined,
    alias?: string,
    thisName?: string,
    ignoreCommand?: boolean
  ) {
    try {
      const type = node?.getType();
      if (type !== undefined) {
        return this._genType(type, alias, ignoreCommand);
      }
    } catch (e) {}
    return this._genTypeByNodeText(
      node?.getText() || "",
      alias,
      thisName,
      ignoreCommand
    );
  }
  private _genTypeByNodeText(
    node_text: string,
    alias?: string,
    thisName?: string,
    ignoreCommand = false
  ) {
    const typeCodes: string[] = [];
    let withCommand = true;
    const isNullable = /\s*\|\s*undefined$/.test(node_text);
    if (isNullable) {
      node_text = node_text.replace(/\s*\|\s*undefined$/, "");
    }
    // console.log("getTypeByNodeText:", thisName, alias, node_text, isNullable);

    if (this.header.hasProjectKeyName(node_text)) {
      const projectGen = this.header.whereProjectKeyName(node_text);
      if (projectGen) {
        this.header.addImport(projectGen.package, node_text);
      }
      typeCodes.push(node_text);
      withCommand = false;
    } else if (/^NodeJS\.\w+$/.test(node_text)) {
      const importName = node_text.replace("NodeJS.", "");
      const importAlias = node_text.replaceAll(".", "_");
      this.header.addImport("org.node.nodejs", importName, importAlias);
      typeCodes.push(importAlias);
      withCommand = false;
    } else if (node_text === "string" || node_text.startsWith("`")) {
      typeCodes.push("String"); // JsString
      withCommand = node_text !== "string";
    } else if (
      node_text === "boolean" ||
      node_text === "true" ||
      node_text === "false"
    ) {
      typeCodes.push("Boolean"); // JsBoolean
      withCommand = node_text !== "boolean";
    } else if (node_text === "number" || /^\d+$/.test(node_text)) {
      if (alias?.indexOf("Id")) {
        typeCodes.push("Int"); // JsNumber
      } else {
        typeCodes.push("Double"); // JsNumber
      }
      withCommand = node_text !== "number";
    } else if (node_text.startsWith("Array<") || node_text.endsWith("[]")) {
      if (node_text === "string[]" || node_text === "Array<string>") {
        this.header.addImport("org.node", "JsStringArray");
        typeCodes.push("JsStringArray");
      } else if (node_text === "number[]" || node_text === "Array<number>") {
        this.header.addImport("org.node", "JsDoubleArray");
        typeCodes.push("JsDoubleArray");
      } else if (node_text === "boolean[]" || node_text === "Array<boolean>") {
        this.header.addImport("org.node", "JsBooleanArray");
        typeCodes.push("JsBooleanArray");
      } else {
        typeCodes.push("JsArray<*>");
      }
    } else if (node_text === "undefined" || node_text === "void") {
      typeCodes.push("Unit");
    } else if (node_text.startsWith("Promise<") || node_text === "Promise") {
      this.header.addImport("kotlin.js", "Promise");
      typeCodes.push("Promise<*>");
    } else if (
      node_text === "object" ||
      node_text === "any" ||
      node_text === "unknown"
    ) {
      typeCodes.push("JsAny");
    } else if (
      node_text === "this" &&
      thisName !== undefined &&
      thisName !== ""
    ) {
      typeCodes.push(thisName);
    } else {
      typeCodes.push("JsAny");
    }
    if (isNullable) {
      typeCodes.push("?");
    }
    if (ignoreCommand === false && withCommand) {
      typeCodes.push(`/* ${node_text} */`);
    }
    return typeCodes.join("");
  }
  private _genType(node: Type<ts.Type>, alias?: string, ignoreCommand = false) {
    const node_text = node.getText();
    // console.log("genType:", node_text, alias);
    let withCommand = false;
    const typeCodes: string[] = [];
    if (this.header.hasProjectKeyName(node_text)) {
      typeCodes.push(node_text);
    } else if (node.isString()) {
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
      withCommand = true;
      const arrayElementType = node.getArrayElementType();
      if (arrayElementType === undefined) {
        typeCodes.push("JsArray<*>");
      } else {
        const arrayElementTypeCode = this._genType(
          arrayElementType,
          undefined,
          true
        );
        if (arrayElementTypeCode === "String") {
          this.header.addImport("org.node", "JsStringArray");
          typeCodes.push("JsStringArray");
        } else if (arrayElementTypeCode === "Double") {
          this.header.addImport("org.node", "JsDoubleArray");
          typeCodes.push("JsDoubleArray");
        } else if (arrayElementTypeCode === "Int") {
          this.header.addImport("org.node", "JsIntArray");
          typeCodes.push("JsIntArray");
        } else if (arrayElementTypeCode === "Boolean") {
          this.header.addImport("org.node", "JsBooleanArray");
          typeCodes.push("JsBooleanArray");
        } else {
          typeCodes.push(`JsArray<${arrayElementTypeCode}>`);
        }
      }
    } else {
      withCommand = true;
      if (node_text === "undefined" || node_text === "void") {
        typeCodes.push("Unit");
      } else if (node_text.startsWith("Promise<")) {
        this.header.addImport("kotlin.js", "Promise");
        const promiseResolveType = node.getTypeArguments().at(0);
        if (promiseResolveType === undefined) {
          typeCodes.push("Promise<*>");
        } else {
          typeCodes.push(`Promise<${this._genType(promiseResolveType)}>`);
        }
      } else {
        typeCodes.push("JsAny");
      }
    }
    if (node.isNullable()) {
      typeCodes.push("?");
    }
    if (ignoreCommand === false && withCommand) {
      typeCodes.push(` /* ${node_text} */`);
    }
    return typeCodes.join("");
  }
}
