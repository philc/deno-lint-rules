// Requires comment lines to be at most 100 characters, when they can be wrapped. Formatters wrap
// code, but not comments, so long comment lines get through otherwise.
//
// A line is only reported if wrapping would fix it: if the word which crosses the limit would fit
// on a line of its own. A line which is long because of something which can't be broken, like a
// long URL, is allowed. A comment after code on the same line is treated as though it were on its
// own line, since it can be moved above the code.
//
// The limit is fixed, since deno lint plugins can't be configured. The rule doesn't fix lines,
// since wrapping comments automatically can mangle lists and code samples in them.

const maxLength = 100;

// Checks one line of a comment. `lineStart` and `lineEnd` are offsets in `text`, and the comment
// starts at `commentStart`, which may be before the line, for a block comment.
function checkLine(context, text, lineStart, lineEnd, commentStart) {
  const line = text.slice(lineStart, lineEnd).replace(/\r$/, "");
  // Columns are counted in characters, rather than UTF-16 code units.
  const lineLength = Array.from(line).length;
  if (lineLength <= maxLength) {
    return;
  }
  const indent = line.match(/^\s*/)[0];
  const isOwnLine = commentStart <= lineStart + indent.length;
  const commentIndex = isOwnLine ? indent.length : commentStart - lineStart;
  // The comment marker (//, /*, /**, or the * which starts a line of a block comment), and the
  // whitespace after it.
  const marker = line.slice(commentIndex).match(/^(\/\/+|\/\*+|\*)?\s*/)[0];
  const textIndex = commentIndex + marker.length;
  // How long a new line holding the overflowing word would be, before that word.
  const continuationLength = indent.length + marker.length;

  // Find the word which crosses the limit, and whether it could be wrapped onto a line of its own.
  for (const match of line.slice(textIndex).matchAll(/\S+/g)) {
    const wordIndex = textIndex + match.index;
    const wordColumn = Array.from(line.slice(0, wordIndex)).length;
    const wordLength = Array.from(match[0]).length;
    if (wordColumn + wordLength <= maxLength) {
      continue;
    }
    const fitsOnItsOwnLine = continuationLength + wordLength <= maxLength;
    // The first word of a comment on its own line is already as far left as it can go.
    const canMove = wordIndex > textIndex || !isOwnLine;
    if (fitsOnItsOwnLine && canMove) {
      context.report({
        range: [lineStart, lineStart + line.length],
        message: `This comment line is ${lineLength} characters. Wrap it at ${maxLength}.`,
      });
    }
    return;
  }
}

export const rule = {
  create(context) {
    return {
      Program() {
        const text = context.sourceCode.text;
        // Each line is checked once, even if it has more than one comment.
        const checkedLines = new Set();
        for (const comment of context.sourceCode.getAllComments()) {
          const [start, end] = comment.range;
          let lineStart = text.lastIndexOf("\n", start - 1) + 1;
          while (lineStart < end) {
            let lineEnd = text.indexOf("\n", lineStart);
            if (lineEnd == -1) {
              lineEnd = text.length;
            }
            if (!checkedLines.has(lineStart)) {
              checkedLines.add(lineStart);
              checkLine(context, text, lineStart, lineEnd, start);
            }
            lineStart = lineEnd + 1;
          }
        }
      },
    };
  },
};
