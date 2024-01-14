import {
  ClassDeclaration,
  InterfaceDeclaration,
  SyntaxKind,
} from "npm:ts-morph@21.0.1";
import { KotlinBodyCode } from "./KotlinCodeGen.mts";
import { KotlinHeaderCodeGen } from "./KotlinHeaderCodeGen.mts";
import type { KotlinClassBodyCode } from "./KotlinClassBodyCode.mts";
import { KotlinProjectCodeGen } from "./KotlinProjectCodeGen.mts";

export class KotlinInterfaceBodyCode extends KotlinBodyCode<InterfaceDeclaration> {
  constructor(
    node: InterfaceDeclaration,
    parentHeader: KotlinHeaderCodeGen,
    readonly classBodyCode?: KotlinClassBodyCode
  ) {
    super(node, parentHeader);
    if (classBodyCode) {
      this.init(classBodyCode);
    }
  }
  interfaceName = this.node.getName();
  interfaceExtends = this.node.getExtends();
  interfaceMembers = this.node.getMembers();
  init(classBodyCode: KotlinClassBodyCode) {
    const { interfaceName, interfaceMembers, interfaceExtends } = this;
    const preNoStaticMembers = classBodyCode.noStaticMembers;
    Object.defineProperty(classBodyCode, "noStaticMembers", {
      configurable: true,
      get() {
        const newNoStaticMembers = [...preNoStaticMembers, ...interfaceMembers];
        interfaceExtends.forEach((ext) => {
          const ext_text = this.genTypeNode(
            ext,
            undefined,
            interfaceName,
            true
          );
          const kotlinImport = this.header.codes.get(ext_text);
          if (kotlinImport !== undefined) {
            for (const project of KotlinProjectCodeGen.ALL.values()) {
              if (project.package === kotlinImport.package) {
                if (project.hasDeclaration(kotlinImport.name)) {
                  const extInterface = project.kotlinCodes.getInterface(
                    kotlinImport.name
                  );
                  if (extInterface) {
                    newNoStaticMembers.push(...extInterface.interfaceMembers);
                    break;
                  }
                }
              }
            }
          }
          this.genTypeNode(ext);
        });
        return newNoStaticMembers;
      },
    });

    console.log("ookk", classBodyCode.className);
  }
  override genCode() {
    const { classBodyCode, interfaceName, interfaceMembers, interfaceExtends } =
      this;
    if (classBodyCode !== undefined) {
      return "";
    }

    const kotlinCode = `
      external interface ${interfaceName} ${this.genExtends(interfaceExtends)} {
        ${this.genMemberTypes(interfaceMembers, interfaceName)}
      }
    `;

    return super.genCode() + kotlinCode + "\n";
  }
}
