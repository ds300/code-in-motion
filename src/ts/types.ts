// The code in this file is derived from Microsoft/TypeScript
// https://github.com/Microsoft/TypeScript
// The original license is at ./LICENSE.txt relative to this file

export enum DiagnosticCategory {
  Warning,
  Error,
  Suggestion,
  Message,
}

export interface DiagnosticMessage {
  key: string
  category: DiagnosticCategory
  code: number
  message: string
  reportsUnnecessary?: {}
}

// token > SyntaxKind.Identifier => token is a keyword
// Also, If you add a new SyntaxKind be sure to keep the `Markers` section at the bottom in sync
export const enum SyntaxKind {
  Unknown,
  EndOfFileToken,
  SingleLineCommentTrivia,
  MultiLineCommentTrivia,
  NewLineTrivia,
  WhitespaceTrivia,
  // We detect and preserve #! on the first line
  ShebangTrivia,
  // We detect and provide better error recovery when we encounter a git merge marker.  This
  // allows us to edit files with git-conflict markers in them in a much more pleasant manner.
  ConflictMarkerTrivia,
  // Literals
  NumericLiteral,
  StringLiteral,
  JsxText,
  JsxTextAllWhiteSpaces,
  RegularExpressionLiteral,
  NoSubstitutionTemplateLiteral,
  // Pseudo-literals
  TemplateHead,
  TemplateMiddle,
  TemplateTail,
  // Punctuation
  OpenBraceToken,
  CloseBraceToken,
  OpenParenToken,
  CloseParenToken,
  OpenBracketToken,
  CloseBracketToken,
  DotToken,
  DotDotDotToken,
  SemicolonToken,
  CommaToken,
  LessThanToken,
  LessThanSlashToken,
  GreaterThanToken,
  LessThanEqualsToken,
  GreaterThanEqualsToken,
  EqualsEqualsToken,
  ExclamationEqualsToken,
  EqualsEqualsEqualsToken,
  ExclamationEqualsEqualsToken,
  EqualsGreaterThanToken,
  PlusToken,
  MinusToken,
  AsteriskToken,
  AsteriskAsteriskToken,
  SlashToken,
  PercentToken,
  PlusPlusToken,
  MinusMinusToken,
  LessThanLessThanToken,
  GreaterThanGreaterThanToken,
  GreaterThanGreaterThanGreaterThanToken,
  AmpersandToken,
  BarToken,
  CaretToken,
  ExclamationToken,
  TildeToken,
  AmpersandAmpersandToken,
  BarBarToken,
  QuestionToken,
  ColonToken,
  AtToken,
  // Assignments
  EqualsToken,
  PlusEqualsToken,
  MinusEqualsToken,
  AsteriskEqualsToken,
  AsteriskAsteriskEqualsToken,
  SlashEqualsToken,
  PercentEqualsToken,
  LessThanLessThanEqualsToken,
  GreaterThanGreaterThanEqualsToken,
  GreaterThanGreaterThanGreaterThanEqualsToken,
  AmpersandEqualsToken,
  BarEqualsToken,
  CaretEqualsToken,
  // Identifiers
  Identifier,
  // Reserved words
  BreakKeyword,
  CaseKeyword,
  CatchKeyword,
  ClassKeyword,
  ConstKeyword,
  ContinueKeyword,
  DebuggerKeyword,
  DefaultKeyword,
  DeleteKeyword,
  DoKeyword,
  ElseKeyword,
  EnumKeyword,
  ExportKeyword,
  ExtendsKeyword,
  FalseKeyword,
  FinallyKeyword,
  ForKeyword,
  FunctionKeyword,
  IfKeyword,
  ImportKeyword,
  InKeyword,
  InstanceOfKeyword,
  NewKeyword,
  NullKeyword,
  ReturnKeyword,
  SuperKeyword,
  SwitchKeyword,
  ThisKeyword,
  ThrowKeyword,
  TrueKeyword,
  TryKeyword,
  TypeOfKeyword,
  VarKeyword,
  VoidKeyword,
  WhileKeyword,
  WithKeyword,
  // Strict mode reserved words
  ImplementsKeyword,
  InterfaceKeyword,
  LetKeyword,
  PackageKeyword,
  PrivateKeyword,
  ProtectedKeyword,
  PublicKeyword,
  StaticKeyword,
  YieldKeyword,
  // Contextual keywords
  AbstractKeyword,
  AsKeyword,
  AnyKeyword,
  AsyncKeyword,
  AwaitKeyword,
  BooleanKeyword,
  ConstructorKeyword,
  DeclareKeyword,
  GetKeyword,
  InferKeyword,
  IsKeyword,
  KeyOfKeyword,
  ModuleKeyword,
  NamespaceKeyword,
  NeverKeyword,
  ReadonlyKeyword,
  RequireKeyword,
  NumberKeyword,
  ObjectKeyword,
  SetKeyword,
  StringKeyword,
  SymbolKeyword,
  TypeKeyword,
  UndefinedKeyword,
  UniqueKeyword,
  FromKeyword,
  GlobalKeyword,
  OfKeyword, // LastKeyword and LastToken and LastContextualKeyword

  // Parse tree nodes

  // Names
  QualifiedName,
  ComputedPropertyName,
  // Signature elements
  TypeParameter,
  Parameter,
  Decorator,
  // TypeMember
  PropertySignature,
  PropertyDeclaration,
  MethodSignature,
  MethodDeclaration,
  Constructor,
  GetAccessor,
  SetAccessor,
  CallSignature,
  ConstructSignature,
  IndexSignature,
  // Type
  TypePredicate,
  TypeReference,
  FunctionType,
  ConstructorType,
  TypeQuery,
  TypeLiteral,
  ArrayType,
  TupleType,
  UnionType,
  IntersectionType,
  ConditionalType,
  InferType,
  ParenthesizedType,
  ThisType,
  TypeOperator,
  IndexedAccessType,
  MappedType,
  LiteralType,
  ImportType,
  // Binding patterns
  ObjectBindingPattern,
  ArrayBindingPattern,
  BindingElement,
  // Expression
  ArrayLiteralExpression,
  ObjectLiteralExpression,
  PropertyAccessExpression,
  ElementAccessExpression,
  CallExpression,
  NewExpression,
  TaggedTemplateExpression,
  TypeAssertionExpression,
  ParenthesizedExpression,
  FunctionExpression,
  ArrowFunction,
  DeleteExpression,
  TypeOfExpression,
  VoidExpression,
  AwaitExpression,
  PrefixUnaryExpression,
  PostfixUnaryExpression,
  BinaryExpression,
  ConditionalExpression,
  TemplateExpression,
  YieldExpression,
  SpreadElement,
  ClassExpression,
  OmittedExpression,
  ExpressionWithTypeArguments,
  AsExpression,
  NonNullExpression,
  MetaProperty,

  // Misc
  TemplateSpan,
  SemicolonClassElement,
  // Element
  Block,
  VariableStatement,
  EmptyStatement,
  ExpressionStatement,
  IfStatement,
  DoStatement,
  WhileStatement,
  ForStatement,
  ForInStatement,
  ForOfStatement,
  ContinueStatement,
  BreakStatement,
  ReturnStatement,
  WithStatement,
  SwitchStatement,
  LabeledStatement,
  ThrowStatement,
  TryStatement,
  DebuggerStatement,
  VariableDeclaration,
  VariableDeclarationList,
  FunctionDeclaration,
  ClassDeclaration,
  InterfaceDeclaration,
  TypeAliasDeclaration,
  EnumDeclaration,
  ModuleDeclaration,
  ModuleBlock,
  CaseBlock,
  NamespaceExportDeclaration,
  ImportEqualsDeclaration,
  ImportDeclaration,
  ImportClause,
  NamespaceImport,
  NamedImports,
  ImportSpecifier,
  ExportAssignment,
  ExportDeclaration,
  NamedExports,
  ExportSpecifier,
  MissingDeclaration,

  // Module references
  ExternalModuleReference,

  // JSX
  JsxElement,
  JsxSelfClosingElement,
  JsxOpeningElement,
  JsxClosingElement,
  JsxFragment,
  JsxOpeningFragment,
  JsxClosingFragment,
  JsxAttribute,
  JsxAttributes,
  JsxSpreadAttribute,
  JsxExpression,

  // Clauses
  CaseClause,
  DefaultClause,
  HeritageClause,
  CatchClause,

  // Property assignments
  PropertyAssignment,
  ShorthandPropertyAssignment,
  SpreadAssignment,

  // Enum
  EnumMember,
  // Top-level nodes
  SourceFile,
  Bundle,

  // JSDoc nodes
  JSDocTypeExpression,
  // The * type
  JSDocAllType,
  // The ? type
  JSDocUnknownType,
  JSDocNullableType,
  JSDocNonNullableType,
  JSDocOptionalType,
  JSDocFunctionType,
  JSDocVariadicType,
  JSDocComment,
  JSDocTypeLiteral,
  JSDocTag,
  JSDocAugmentsTag,
  JSDocClassTag,
  JSDocParameterTag,
  JSDocReturnTag,
  JSDocTypeTag,
  JSDocTemplateTag,
  JSDocTypedefTag,
  JSDocPropertyTag,

  // Synthesized list
  SyntaxList,

  // Transformation nodes
  NotEmittedStatement,
  PartiallyEmittedExpression,
  CommaListExpression,
  MergeDeclarationMarker,
  EndOfDeclarationMarker,

  // Enum value count
  Count,

  // Markers
  FirstAssignment = EqualsToken,
  LastAssignment = CaretEqualsToken,
  FirstCompoundAssignment = PlusEqualsToken,
  LastCompoundAssignment = CaretEqualsToken,
  FirstReservedWord = BreakKeyword,
  LastReservedWord = WithKeyword,
  FirstKeyword = BreakKeyword,
  LastKeyword = OfKeyword,
  FirstFutureReservedWord = ImplementsKeyword,
  LastFutureReservedWord = YieldKeyword,
  FirstTypeNode = TypePredicate,
  LastTypeNode = ImportType,
  FirstPunctuation = OpenBraceToken,
  LastPunctuation = CaretEqualsToken,
  FirstToken = Unknown,
  LastToken = LastKeyword,
  FirstTriviaToken = SingleLineCommentTrivia,
  LastTriviaToken = ConflictMarkerTrivia,
  FirstLiteralToken = NumericLiteral,
  LastLiteralToken = NoSubstitutionTemplateLiteral,
  FirstTemplateToken = NoSubstitutionTemplateLiteral,
  LastTemplateToken = TemplateTail,
  FirstBinaryOperator = LessThanToken,
  LastBinaryOperator = CaretEqualsToken,
  FirstNode = QualifiedName,
  FirstJSDocNode = JSDocTypeExpression,
  LastJSDocNode = JSDocPropertyTag,
  FirstJSDocTagNode = JSDocTag,
  LastJSDocTagNode = JSDocPropertyTag,
  /* @internal */ FirstContextualKeyword = AbstractKeyword,
  /* @internal */ LastContextualKeyword = OfKeyword,
}

/* @internal */
export const enum TokenFlags {
  None = 0,
  PrecedingLineBreak = 1 << 0,
  PrecedingJSDocComment = 1 << 1,
  Unterminated = 1 << 2,
  ExtendedUnicodeEscape = 1 << 3,
  Scientific = 1 << 4, // e.g. `10e2`
  Octal = 1 << 5, // e.g. `0777`
  HexSpecifier = 1 << 6, // e.g. `0x00000000`
  BinarySpecifier = 1 << 7, // e.g. `0b0110010000000000`
  OctalSpecifier = 1 << 8, // e.g. `0o777`
  ContainsSeparator = 1 << 9, // e.g. `0b1100_0101`
  BinaryOrOctalSpecifier = BinarySpecifier | OctalSpecifier,
  NumericLiteralFlags = Scientific |
    Octal |
    HexSpecifier |
    BinarySpecifier |
    OctalSpecifier |
    ContainsSeparator,
}

export type JsxTokenSyntaxKind =
  | SyntaxKind.LessThanSlashToken
  | SyntaxKind.EndOfFileToken
  | SyntaxKind.ConflictMarkerTrivia
  | SyntaxKind.JsxText
  | SyntaxKind.JsxTextAllWhiteSpaces
  | SyntaxKind.OpenBraceToken
  | SyntaxKind.LessThanToken

export type JsDocSyntaxKind =
  | SyntaxKind.EndOfFileToken
  | SyntaxKind.WhitespaceTrivia
  | SyntaxKind.AtToken
  | SyntaxKind.NewLineTrivia
  | SyntaxKind.AsteriskToken
  | SyntaxKind.OpenBraceToken
  | SyntaxKind.CloseBraceToken
  | SyntaxKind.LessThanToken
  | SyntaxKind.OpenBracketToken
  | SyntaxKind.CloseBracketToken
  | SyntaxKind.EqualsToken
  | SyntaxKind.CommaToken
  | SyntaxKind.DotToken
  | SyntaxKind.Identifier
  | SyntaxKind.NoSubstitutionTemplateLiteral
  | SyntaxKind.Unknown

export const enum ScriptTarget {
  ES3 = 0,
  ES5 = 1,
  ES2015 = 2,
  ES2016 = 3,
  ES2017 = 4,
  ES2018 = 5,
  ESNext = 6,
  Latest = ESNext,
}

export const enum LanguageVariant {
  Standard,
  JSX,
}

/* @internal */
export const enum CharacterCodes {
  nullCharacter = 0,
  maxAsciiCharacter = 0x7f,

  lineFeed = 0x0a, // \n
  carriageReturn = 0x0d, // \r
  lineSeparator = 0x2028,
  paragraphSeparator = 0x2029,
  nextLine = 0x0085,

  // Unicode 3.0 space characters
  space = 0x0020, // " "
  nonBreakingSpace = 0x00a0, //
  enQuad = 0x2000,
  emQuad = 0x2001,
  enSpace = 0x2002,
  emSpace = 0x2003,
  threePerEmSpace = 0x2004,
  fourPerEmSpace = 0x2005,
  sixPerEmSpace = 0x2006,
  figureSpace = 0x2007,
  punctuationSpace = 0x2008,
  thinSpace = 0x2009,
  hairSpace = 0x200a,
  zeroWidthSpace = 0x200b,
  narrowNoBreakSpace = 0x202f,
  ideographicSpace = 0x3000,
  mathematicalSpace = 0x205f,
  ogham = 0x1680,

  _ = 0x5f,
  $ = 0x24,

  _0 = 0x30,
  _1 = 0x31,
  _2 = 0x32,
  _3 = 0x33,
  _4 = 0x34,
  _5 = 0x35,
  _6 = 0x36,
  _7 = 0x37,
  _8 = 0x38,
  _9 = 0x39,

  a = 0x61,
  b = 0x62,
  c = 0x63,
  d = 0x64,
  e = 0x65,
  f = 0x66,
  g = 0x67,
  h = 0x68,
  i = 0x69,
  j = 0x6a,
  k = 0x6b,
  l = 0x6c,
  m = 0x6d,
  n = 0x6e,
  o = 0x6f,
  p = 0x70,
  q = 0x71,
  r = 0x72,
  s = 0x73,
  t = 0x74,
  u = 0x75,
  v = 0x76,
  w = 0x77,
  x = 0x78,
  y = 0x79,
  z = 0x7a,

  A = 0x41,
  B = 0x42,
  C = 0x43,
  D = 0x44,
  E = 0x45,
  F = 0x46,
  G = 0x47,
  H = 0x48,
  I = 0x49,
  J = 0x4a,
  K = 0x4b,
  L = 0x4c,
  M = 0x4d,
  N = 0x4e,
  O = 0x4f,
  P = 0x50,
  Q = 0x51,
  R = 0x52,
  S = 0x53,
  T = 0x54,
  U = 0x55,
  V = 0x56,
  W = 0x57,
  X = 0x58,
  Y = 0x59,
  Z = 0x5a,

  ampersand = 0x26, // &
  asterisk = 0x2a, // *
  at = 0x40, // @
  backslash = 0x5c, // \
  backtick = 0x60, // `
  bar = 0x7c, // |
  caret = 0x5e, // ^
  closeBrace = 0x7d, // }
  closeBracket = 0x5d, // ]
  closeParen = 0x29, // )
  colon = 0x3a, // :
  comma = 0x2c, // ,
  dot = 0x2e, // .
  doubleQuote = 0x22, // "
  equals = 0x3d, // =
  exclamation = 0x21, // !
  greaterThan = 0x3e, // >
  hash = 0x23, // #
  lessThan = 0x3c, // <
  minus = 0x2d, // -
  openBrace = 0x7b, // {
  openBracket = 0x5b, // [
  openParen = 0x28, // (
  percent = 0x25, // %
  plus = 0x2b, // +
  question = 0x3f, // ?
  semicolon = 0x3b, // ;
  singleQuote = 0x27, // '
  slash = 0x2f, // /
  tilde = 0x7e, // ~

  backspace = 0x08, // \b
  formFeed = 0x0c, // \f
  byteOrderMark = 0xfeff,
  tab = 0x09, // \t
  verticalTab = 0x0b, // \v
}

export interface TextRange {
  pos: number
  end: number
}
