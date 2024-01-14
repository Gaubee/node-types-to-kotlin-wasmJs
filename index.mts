import {
  Expression,
  JSDocableNode,
  MethodSignature,
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
} from "npm:ts-morph@21.0.1";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { KotlinProjectCodeGen } from "./KotlinProjectCodeGen.mts";

const project = new Project();
const filepaths = [
  `./node_modules/@types/node/globals.d.ts`,
  `./node_modules/@types/node/async_hooks.d.ts`,
  `./node_modules/@types/node/events.d.ts`,
];
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

/// 清空输出的文件夹
fs.rmSync(path.resolve(process.cwd(), "org/node"), {
  recursive: true,
  force: true,
});

filepaths.forEach((filepath) => {
  const sourceFile = project.createSourceFile(
    path.parse(filepath).name,
    fs.readFileSync(fileURLToPath(import.meta.resolve(filepath))).toString()
  );
  sourceFile.forEachChild((node) => {
    if (node.isKind(SyntaxKind.ModuleDeclaration)) {
      KotlinProjectCodeGen.genKotlinCode(node);
    }
  });
});

for (const codeGen of KotlinProjectCodeGen.ALL.values()) {
  codeGen.save();
}
