/**
 * Describes the protocol.json
 */
export interface Protocol {
  domains: Domain[];
  version: Version;
}

export interface Version {
  major: string;
  minor: string;
}

export interface Domain extends Describable {
  domain: string;
  commands: Command[];
  events?: Event[];
  types?: Type[];
}

export interface Command extends Describable {
  name: string;
  async?: boolean;
  parameters?: NamedTypeDescOrRef[];
  returns?: NamedTypeDescOrRef[];
  error?: TypeDescOrRef;
  redirect?: string;
  handlers?: string[];
}

export interface Event extends Describable {
  name: string;
  deprecated?: boolean;
  parameters?: NamedTypeDescOrRef[];
}

export type Type = Identified & TypeDesc;

export type NamedTypeDescOrRef = Named & TypeDescOrRef;

export type TypeDescOrRef = TypeDesc | TypeRef;

export interface ObjectDesc extends Describable {
  type: "object" | "any";
  properties?: NamedTypeDescOrRef[];
}

export function isObjectDesc(desc: TypeDesc): desc is ObjectDesc {
  return desc.type === "object" || desc.type === "any";
}

export interface StringDesc extends Describable {
  type: "string";
  enum?: string[];
}

export function isStringDesc(desc: TypeDesc): desc is StringDesc {
  return desc.type === "string";
}

export interface NumberDesc extends Describable {
  type: "number" | "integer";
}

export function isNumberDesc(desc: TypeDesc): desc is NumberDesc {
  return desc.type === "number" || desc.type === "integer";
}

export interface BooleanDesc extends Describable {
  type: "boolean";
}

export function isBooleanDesc(desc: TypeDesc): desc is BooleanDesc {
  return desc.type === "boolean";
}

export interface ArrayDesc extends Describable {
  type: "array";
  items: TypeDesc | TypeRef;
  minItems?: number;
  maxItems?: number;
}

export function isArrayDesc(desc: TypeDesc): desc is ArrayDesc {
  return desc.type === "array";
}

export type TypeDesc = ArrayDesc | BooleanDesc | NumberDesc | StringDesc | ObjectDesc;

export interface TypeRef extends Describable {
  $ref: string;
}

export function isTypeRef(desc: TypeDesc | TypeRef): desc is TypeRef {
  return (<TypeRef>desc).$ref != null;
}

function foo(desc: TypeDesc | TypeRef) {
  if (isTypeRef(desc)) {
    return desc.$ref;
  }
}

export interface Describable {
  description?: string;
  hidden?: boolean;
}

export interface Named {
  name: string;
  optional?: boolean;
}

export interface Identified {
  id: string;
}
