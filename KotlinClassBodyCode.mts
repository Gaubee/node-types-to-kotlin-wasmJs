import {
  ClassDeclaration,
  ClassMemberTypes,
  TypeElementTypes,
} from "npm:ts-morph@21.0.1";
import { KotlinBodyCode } from "./KotlinCodeGen.mts";

export class KotlinClassBodyCode extends KotlinBodyCode<ClassDeclaration> {
  className = this.node.getName();
  classConstructors = this.node.getConstructors();
  staticMembers = this.node
    .getMembers()
    .filter((member) => "isStatic" in member && member.isStatic() === true);

  noStaticMembers: (ClassMemberTypes | TypeElementTypes)[] = this.node
    .getMembers()
    .filter(
      (member) => "isStatic" in member === false || member.isStatic() === false
    );
  classExtends = this.node.getExtends();
  override genCode() {
    const {
      node,
      className,
      classConstructors,
      staticMembers,
      noStaticMembers,
      classExtends,
    } = this;
    if (className === undefined) {
      return "";
    }
    if (className === "EventEmitter") {
      debugger;
    }
    let kotlinCode = `open external class ${className}`;

    if (classConstructors.length === 0) {
      kotlinCode += `()`;
    } else {
      kotlinCode += this.genConstructorDeclaration(classConstructors[0], true);
    }

    if (classExtends !== undefined) {
      kotlinCode += this.genExtends([classExtends]); // + "()";
    }

    kotlinCode += `{
    ${
      classConstructors.length <= 1
        ? ""
        : classConstructors
            .slice(1)
            .map((ctorDec) => this.genConstructorDeclaration(ctorDec, false))
            .join("\n")
    }
    ${
      staticMembers.length === 0
        ? ""
        : `
        companion object {
          ${this.genMemberTypes(staticMembers, className)}
        }`
    }
    ${this.genMemberTypes(noStaticMembers, className)}
    }`;
    return this.genJsDocs(node) + kotlinCode + "\n";
  }
}
