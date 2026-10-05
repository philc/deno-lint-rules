// Requires braces around the bodies of control statements, with the body on its own line:
//
//   if (done) return;   // Not allowed.
//
//   if (done) {         // Allowed.
//     return;
//   }
//
// This applies to if/else, for, for-in, for-of, while, and do-while statements. `else if` is
// allowed, since the `if` is the start of another statement rather than an unbraced body. Empty
// bodies, like `while (next());`, are fixed to `{}`.
//
// The fix adds braces and moves the body onto its own line, re-indenting bodies which span
// multiple lines.

const indentSize = 2;

// Returns the leading whitespace of the line containing `offset`.
function lineIndent(text, offset) {
  const lineStart = text.lastIndexOf("\n", offset - 1) + 1;
  return text.slice(lineStart).match(/^[ \t]*/)[0];
}

// Returns the offset just after the last non-whitespace character before `offset`.
function endOfPreviousToken(text, offset) {
  let i = offset;
  while (i > 0 && /\s/.test(text[i - 1])) {
    i--;
  }
  return i;
}

// Returns the body's source, with its continuation lines shifted by the distance the body moves to
// get to `newIndent`. A body which starts on the statement's line is effectively at the statement's
// indentation. Lines which start inside a template literal aren't changed, because their
// indentation is part of the string.
function reindentBody(text, body, newIndent, templates) {
  const bodyLineStart = text.lastIndexOf("\n", body.range[0] - 1) + 1;
  const startsOwnLine = text.slice(bodyLineStart, body.range[0]).trim() == "";
  const currentIndent = startsOwnLine
    ? lineIndent(text, body.range[0])
    : text.slice(bodyLineStart).match(/^[ \t]*/)[0];
  const shift = newIndent.length - currentIndent.length;
  const isInTemplate = (offset) => templates.some(([start, end]) => start < offset && offset < end);

  const lines = text.slice(body.range[0], body.range[1]).split("\n");
  let offset = body.range[0] + lines[0].length + 1;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!isInTemplate(offset)) {
      if (shift > 0) {
        lines[i] = " ".repeat(shift) + line;
      } else if (shift < 0) {
        const removable = line.match(/^ */)[0].length;
        lines[i] = line.slice(Math.min(removable, -shift));
      }
    }
    offset += line.length + 1;
  }
  return lines.join("\n");
}

const message = (keyword) => `Expected braces around the body of this ${keyword} statement.`;
const hint = "Put the body on its own line, inside braces.";

// Deno's AST represents an empty body, like the `;` in `while (next());`, as null rather than as an
// EmptyStatement node. This reports it if it ends the statement, and fixes it to `{}`.
function checkEmptyBody(context, statement, keyword) {
  const text = context.sourceCode.text;
  const end = statement.range[1];
  if (text[end - 1] != ";") {
    return;
  }
  context.report({
    node: statement,
    message: message(keyword),
    hint,
    fix(fixer) {
      return fixer.replaceTextRange([endOfPreviousToken(text, end - 1), end], " {}");
    },
  });
}

// `templates` is the ranges of all of the template literals in the file.
function check(context, statement, body, keyword, templates) {
  if (body === null) {
    checkEmptyBody(context, statement, keyword);
    return;
  }
  if (body.type == "BlockStatement") {
    return;
  }
  const text = context.sourceCode.text;
  context.report({
    node: body,
    message: message(keyword),
    hint,
    fix(fixer) {
      const indent = lineIndent(text, statement.range[0]);
      const bodyIndent = indent + " ".repeat(indentSize);
      const block = `{\n${bodyIndent}${
        reindentBody(text, body, bodyIndent, templates)
      }\n${indent}}`;
      // Replace the whitespace before the body too, so that the brace goes on the same line as the
      // statement's head, e.g. `if (done) {`. If something other than whitespace precedes the body,
      // like a comment, leave it in place.
      const start = endOfPreviousToken(text, body.range[0]);
      const previous = text.slice(0, start);
      const precededByHead = previous.endsWith(")") || /\b(else|do)$/.test(previous);
      return precededByHead
        ? fixer.replaceTextRange([start, body.range[1]], ` ${block}`)
        : fixer.replaceTextRange(body.range, block);
    },
  });
}

export default {
  create(context) {
    // The bodies to check, as arguments to `check`. They're checked once the whole file has been
    // visited, because re-indenting a body requires knowing where the file's template literals are.
    const bodies = [];
    const templates = [];
    return {
      IfStatement(node) {
        // An empty consequent (`if (a);`) is only detectable when there's no else.
        if (node.consequent || !node.alternate) {
          bodies.push([node, node.consequent, "if"]);
        }
        // An empty else (`else ;`) is indistinguishable from no else at all, so it isn't checked.
        if (node.alternate && node.alternate.type != "IfStatement") {
          bodies.push([node, node.alternate, "else"]);
        }
      },
      ForStatement(node) {
        bodies.push([node, node.body, "for"]);
      },
      ForInStatement(node) {
        bodies.push([node, node.body, "for-in"]);
      },
      ForOfStatement(node) {
        bodies.push([node, node.body, "for-of"]);
      },
      WhileStatement(node) {
        bodies.push([node, node.body, "while"]);
      },
      DoWhileStatement(node) {
        // An empty body (`do ; while (a)`) isn't checked, because it can't be located.
        if (node.body) {
          bodies.push([node, node.body, "do-while"]);
        }
      },
      TemplateLiteral(node) {
        templates.push(node.range);
      },
      "Program:exit"() {
        for (const [statement, body, keyword] of bodies) {
          check(context, statement, body, keyword, templates);
        }
      },
    };
  },
};
