/**
 * Safe evaluator for Condition-node expressions such as
 *
 *   data.score > 5
 *   data.payload.priority === "high" && data.score >= 7
 *   data.payload?.message.toLowerCase().includes("urgent")
 *
 * Why this exists: the engine used to run expressions with `new Function(...)`.
 * That is NOT a sandbox. On a public deployment, any signed-up user could type
 * code into a Condition node and it would run on the server with access to
 * process.env (including SUPABASE_SERVICE_ROLE_KEY).
 *
 * This evaluator parses the text itself and can only read from the `data`
 * object. It never calls eval or new Function.
 *
 * Supported:
 *   - numbers, "strings", true, false, null, undefined
 *   - `data` (the only variable) with .property and ?.property access
 *   - comparison  === !== == != < > <= >=
 *   - logic       && || !
 *   - arithmetic  + - * / %
 *   - parentheses
 *   - a short allowlist of methods: includes, startsWith, endsWith,
 *     toLowerCase, toUpperCase, trim (strings) and includes (arrays)
 *
 * Anything else (unknown names, function expressions, bracket access,
 * __proto__ / constructor / prototype) makes the condition evaluate to false.
 */

type Token =
  | { kind: "num"; value: number }
  | { kind: "str"; value: string }
  | { kind: "ident"; value: string }
  | { kind: "op"; value: string };

type Ast =
  | { type: "literal"; value: unknown }
  | { type: "data" }
  | { type: "member"; object: Ast; property: string; optional: boolean }
  | { type: "call"; object: Ast; method: string; optional: boolean; args: Ast[] }
  | { type: "unary"; op: "!" | "-"; arg: Ast }
  | { type: "binary"; op: string; left: Ast; right: Ast };

const MAX_LENGTH = 500;
const MAX_DEPTH = 50;

// Longer operators must come before their prefixes (e.g. "===" before "==").
const OPERATORS = [
  "===", "!==", "==", "!=", ">=", "<=", "&&", "||", "?.",
  ">", "<", "!", "+", "-", "*", "/", "%", "(", ")", ".", ",",
];

const BLOCKED_PROPERTIES = new Set(["__proto__", "constructor", "prototype"]);
const STRING_METHODS = new Set([
  "includes", "startsWith", "endsWith", "toLowerCase", "toUpperCase", "trim",
]);

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < source.length) {
    const ch = source[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      const match = /^\d+(\.\d+)?/.exec(source.slice(i))!;
      tokens.push({ kind: "num", value: Number(match[0]) });
      i += match[0].length;
      continue;
    }

    if (ch === '"' || ch === "'") {
      let out = "";
      i++;
      while (i < source.length && source[i] !== ch) {
        if (source[i] === "\\") {
          i++;
          const esc = source[i];
          out += esc === "n" ? "\n" : esc === "t" ? "\t" : (esc ?? "");
        } else {
          out += source[i];
        }
        i++;
      }
      if (source[i] !== ch) throw new Error("Unterminated string");
      i++;
      tokens.push({ kind: "str", value: out });
      continue;
    }

    if (/[A-Za-z_$]/.test(ch)) {
      const match = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(source.slice(i))!;
      tokens.push({ kind: "ident", value: match[0] });
      i += match[0].length;
      continue;
    }

    const op = OPERATORS.find((o) => source.startsWith(o, i));
    if (!op) throw new Error(`Unexpected character "${ch}"`);
    tokens.push({ kind: "op", value: op });
    i += op.length;
  }

  return tokens;
}

class Parser {
  private pos = 0;
  private depth = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): Ast {
    const ast = this.parseOr();
    if (this.pos < this.tokens.length) throw new Error("Unexpected token");
    return ast;
  }

  private isOp(value: string): boolean {
    const t = this.tokens[this.pos];
    return t?.kind === "op" && t.value === value;
  }

  private eatOp(value: string): boolean {
    if (this.isOp(value)) {
      this.pos++;
      return true;
    }
    return false;
  }

  private expectOp(value: string) {
    if (!this.eatOp(value)) throw new Error(`Expected "${value}"`);
  }

  private matchAny(ops: string[]): string | undefined {
    const op = ops.find((o) => this.isOp(o));
    if (op) this.pos++;
    return op;
  }

  private binaryLevel(ops: string[], next: () => Ast): Ast {
    let left = next();
    for (;;) {
      const op = this.matchAny(ops);
      if (!op) return left;
      left = { type: "binary", op, left, right: next() };
    }
  }

  private parseOr = (): Ast => this.binaryLevel(["||"], this.parseAnd);
  private parseAnd = (): Ast => this.binaryLevel(["&&"], this.parseEquality);
  private parseEquality = (): Ast =>
    this.binaryLevel(["===", "!==", "==", "!="], this.parseRelational);
  private parseRelational = (): Ast =>
    this.binaryLevel([">=", "<=", ">", "<"], this.parseAdditive);
  private parseAdditive = (): Ast =>
    this.binaryLevel(["+", "-"], this.parseMultiplicative);
  private parseMultiplicative = (): Ast =>
    this.binaryLevel(["*", "/", "%"], this.parseUnary);

  private parseUnary = (): Ast => {
    if (++this.depth > MAX_DEPTH) throw new Error("Expression too deeply nested");
    try {
      if (this.eatOp("!")) return { type: "unary", op: "!", arg: this.parseUnary() };
      if (this.eatOp("-")) return { type: "unary", op: "-", arg: this.parseUnary() };
      return this.parsePostfix();
    } finally {
      this.depth--;
    }
  };

  private parsePostfix(): Ast {
    let node = this.parsePrimary();

    while (this.isOp(".") || this.isOp("?.")) {
      const optional = this.isOp("?.");
      this.pos++;

      const name = this.tokens[this.pos];
      if (name?.kind !== "ident") throw new Error("Expected a property name");
      this.pos++;

      if (this.eatOp("(")) {
        const args: Ast[] = [];
        if (!this.eatOp(")")) {
          do {
            args.push(this.parseOr());
          } while (this.eatOp(","));
          this.expectOp(")");
        }
        node = { type: "call", object: node, method: name.value, optional, args };
      } else {
        node = { type: "member", object: node, property: name.value, optional };
      }
    }

    return node;
  }

  private parsePrimary(): Ast {
    const t = this.tokens[this.pos++];
    if (!t) throw new Error("Unexpected end of expression");

    if (t.kind === "num" || t.kind === "str") return { type: "literal", value: t.value };

    if (t.kind === "ident") {
      switch (t.value) {
        case "data": return { type: "data" };
        case "true": return { type: "literal", value: true };
        case "false": return { type: "literal", value: false };
        case "null": return { type: "literal", value: null };
        case "undefined": return { type: "literal", value: undefined };
        default: throw new Error(`Unknown name "${t.value}"`);
      }
    }

    if (t.kind === "op" && t.value === "(") {
      const inner = this.parseOr();
      this.expectOp(")");
      return inner;
    }

    throw new Error("Unexpected token");
  }
}

function readProperty(object: unknown, property: string): unknown {
  if (BLOCKED_PROPERTIES.has(property)) throw new Error("Blocked property");

  if ((typeof object === "string" || Array.isArray(object)) && property === "length") {
    return object.length;
  }

  if (
    typeof object === "object" &&
    object !== null &&
    Object.prototype.hasOwnProperty.call(object, property)
  ) {
    return (object as Record<string, unknown>)[property];
  }

  return undefined;
}

function evaluate(ast: Ast, data: unknown): unknown {
  switch (ast.type) {
    case "literal":
      return ast.value;

    case "data":
      return data;

    case "member": {
      const object = evaluate(ast.object, data);
      if (object === null || object === undefined) {
        if (ast.optional) return undefined;
        throw new Error(`Cannot read "${ast.property}" of ${String(object)}`);
      }
      return readProperty(object, ast.property);
    }

    case "call": {
      const object = evaluate(ast.object, data);
      if (object === null || object === undefined) {
        if (ast.optional) return undefined;
        throw new Error(`Cannot call "${ast.method}" on ${String(object)}`);
      }
      const args = ast.args.map((a) => evaluate(a, data));

      if (typeof object === "string" && STRING_METHODS.has(ast.method)) {
        if (args.some((a) => typeof a !== "string")) {
          throw new Error("String methods only accept string arguments");
        }
        const method = (object as unknown as Record<string, (...a: string[]) => unknown>)[ast.method];
        return method.apply(object, args as string[]);
      }

      if (Array.isArray(object) && ast.method === "includes") {
        return object.includes(args[0]);
      }

      throw new Error(`Method "${ast.method}" is not allowed`);
    }

    case "unary": {
      const value = evaluate(ast.arg, data);
      return ast.op === "!" ? !value : -(value as number);
    }

    case "binary": {
      if (ast.op === "&&") {
        const left = evaluate(ast.left, data);
        return left ? evaluate(ast.right, data) : left;
      }
      if (ast.op === "||") {
        const left = evaluate(ast.left, data);
        return left ? left : evaluate(ast.right, data);
      }

      const l = evaluate(ast.left, data);
      const r = evaluate(ast.right, data);

      switch (ast.op) {
        case "===": return l === r;
        case "!==": return l !== r;
        case "==": return l == r;
        case "!=": return l != r;
        case ">": return (l as number) > (r as number);
        case "<": return (l as number) < (r as number);
        case ">=": return (l as number) >= (r as number);
        case "<=": return (l as number) <= (r as number);
        case "+": return (l as number) + (r as number);
        case "-": return (l as number) - (r as number);
        case "*": return (l as number) * (r as number);
        case "/": return (l as number) / (r as number);
        case "%": return (l as number) % (r as number);
        default: throw new Error(`Unknown operator "${ast.op}"`);
      }
    }
  }
}

/**
 * Evaluates a condition against the execution data.
 * An empty expression is true. A bad or disallowed expression is false.
 */
export function evaluateCondition(
  expression: string,
  data: Record<string, unknown>
): boolean {
  const source = (expression ?? "").trim();
  if (!source) return true;
  if (source.length > MAX_LENGTH) return false;

  try {
    return Boolean(evaluate(new Parser(tokenize(source)).parse(), data));
  } catch {
    return false;
  }
}
