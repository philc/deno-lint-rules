// Disallows exports whose names repeat their module's name, since they're used under a namespace
// import named for the module (see namespace-imports), where the repetition stutters:
//
//   // In cut.js:
//   export function planCuts() {}   // Not allowed; used as cut.planCuts().
//   export function plan() {}       // Allowed; used as cut.plan().
//
//   // In file_tree.js:
//   export class FileTree {}        // Not allowed; used as new fileTree.FileTree().
//   export class Tree {}            // Allowed; used as new fileTree.Tree().
//
// Names are compared word by word, so `start` in art.js is allowed, and a plural matches its
// singular, so `planCuts` in cut.js is reported. The module's name is the file's name, without its
// extension, or the directory's name for files named mod, index, or main.
//
// When the module's name is one word, an export named just that word is allowed, like `Workbook` in
// workbook.js, since there's no shorter name for the module's main thing. Go does the same:
// `list.List`, `template.Template`. When it's more than one, the export can drop some of them:
// `Tree` in file_tree.js.
//
// Test files are skipped, since they're not imported.

// File names which carry no meaning of their own, so the directory names the module instead.
const genericNames = new Set(["mod", "index", "main"]);

// Returns whether the file is a test: one named like foo_test.js or foo.test.js, or one in a test/
// or tests/ directory.
function isTestFile(filename) {
  return /[._]test\.[cm]?[jt]sx?$/.test(filename) || /(^|\/)tests?\//.test(filename);
}

// Splits a name into lowercase words: "planCuts" is ["plan", "cuts"], "file_tree" is
// ["file", "tree"], and "XMLParser" is ["xml", "parser"].
function words(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w != "");
}

// Returns the words of the module's name, from its file path.
function moduleWords(filename) {
  const segments = filename.split(/[\\/]/).filter((s) => s != "");
  let name = (segments.at(-1) ?? "").replace(/\.[^.]*$/, "");
  if (genericNames.has(name) && segments.length > 1) {
    name = segments.at(-2);
  }
  return words(name);
}

// Whether two words are the same, or one is the other's plural.
function sameWord(a, b) {
  return a == b || a == b + "s" || a == b + "es" || b == a + "s" || b == a + "es";
}

// Whether the module's words appear, in order and next to each other, in the export's words.
function stutters(exportWords, moduleWords) {
  const isJustTheModulesWord = moduleWords.length == 1 && exportWords.length == 1;
  if (moduleWords.length == 0 || isJustTheModulesWord) {
    return false;
  }
  for (let i = 0; i + moduleWords.length <= exportWords.length; i++) {
    if (moduleWords.every((w, j) => sameWord(exportWords[i + j], w))) {
      return true;
    }
  }
  return false;
}

// Returns the identifier nodes for the names a declaration exports.
function declaredNames(declaration) {
  if (!declaration) {
    return [];
  }
  if (declaration.type == "VariableDeclaration") {
    return declaration.declarations.map((d) => d.id).filter((id) => id.type == "Identifier");
  }
  return declaration.id ? [declaration.id] : [];
}

export const rule = {
  create(context) {
    if (isTestFile(context.filename)) {
      return {};
    }
    const moduleNameWords = moduleWords(context.filename);
    const check = (node, name) => {
      if (name == "default" || !stutters(words(name), moduleNameWords)) {
        return;
      }
      context.report({
        node,
        message:
          `"${name}" repeats its module's name, so it stutters when used with the module's ` +
          "namespace.",
        hint: "Rename it to read well with the namespace, e.g. `cut.plan`, not `cut.planCuts`.",
      });
    };
    return {
      ExportNamedDeclaration(node) {
        for (const id of declaredNames(node.declaration)) {
          check(id, id.name);
        }
        for (const specifier of node.specifiers) {
          check(specifier.exported, specifier.exported.name ?? specifier.exported.value);
        }
      },
    };
  },
};
