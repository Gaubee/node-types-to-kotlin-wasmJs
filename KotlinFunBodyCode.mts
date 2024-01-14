import { FunctionDeclaration } from "npm:ts-morph@21.0.1";
import { KotlinBodyCode } from "./KotlinCodeGen.mts";

export class KotlinFunBodyCode extends KotlinBodyCode<FunctionDeclaration> {
  funName = this.node.getName();
  funParams = this.node.getParameters();
  returnTypeNode = this.node.getReturnTypeNode();
  override genCode() {
    const { node, funName, funParams, returnTypeNode } = this;
    const kotlinCode = `external fun ${funName}${this.genParameters(
      funParams
    )}:${this.genReturnType(node, "", returnTypeNode)}`;

    return super.genCode() + kotlinCode + "\n";
  }
}
