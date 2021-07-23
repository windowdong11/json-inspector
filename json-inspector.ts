import * as fs from 'fs'

const source = './graphql.schema.json'
const dest = './result.json'

const data = JSON.parse(fs.readFileSync(source).toString())
fs.writeFileSync(dest, JSON.stringify(inspectObject(data), ToJSON, 4))
// console.log(JSON.stringify(inspectObject(data), ToJSON, 2))


type PrimitiveTypes = string | number | boolean | undefined//| function

interface InspectBaseType {
    type: string
    value: any
}

interface InspectNullType extends InspectBaseType {
    type: 'nullable',
    value: boolean
}

interface BasicType<T> extends InspectBaseType {
    type: string
    value: Set<T>
}

interface ObjectType<T> extends InspectBaseType {
    type: 'object'
    value: {
        [key: string]: InspectResultTypes<T>
    }
}

interface ArrayType<T> extends InspectBaseType {
    type: 'array'
    value: {
        [key: string]: BasicType<string> | BasicType<number> | BasicType<boolean> | ObjectType<T> | ArrayType<T>
        string: BasicType<string>
        number: BasicType<number>
        boolean: BasicType<boolean>
        //undefined: BasicType<undefined>
        object: ObjectType<T>
        array: ArrayType<T>
    }
}
type InspectResultTypes<T> = BasicType<T> | ObjectType<T> | ArrayType<T>

function isPrimitiveType(data: any): data is PrimitiveTypes {
    return typeof data !== 'object'
}

function isInspectBaseType(data: any): data is InspectBaseType {
    if (typeof data === 'object')
        return ('type' in data) && ('value' in data)
    return false
}

function isInspectBasicType(data: any): data is BasicType<PrimitiveTypes> {
    if (isInspectBaseType(data))
        return Object.prototype.toString.call(data.value).slice(8, -1) === 'Set'
    return false
}

function isInspectObjectType(data: any): data is ObjectType<PrimitiveTypes> {
    if (isInspectBaseType(data))
        return data.type === 'object'
    return false
}

function isInspectArrayType(data: any): data is ArrayType<PrimitiveTypes> {
    if (isInspectBaseType(data))
        return data.type === 'array'
    return false
}

function mergeInspectObject<T>(from: T, to: T): T {
    if (isInspectBasicType(from) && isInspectBasicType(to)) {
        from.value.forEach(e => to.value.add(e))
    }
    else if ((isInspectArrayType(from) && isInspectArrayType(to))
        || (isInspectObjectType(from) && isInspectObjectType(to))) {
        Object.keys(to.value).forEach(key => {
            mergeInspectObject(from.value[key], to.value[key])
        })
    }
    return to
}

function inspectObject(obj: PrimitiveTypes | { [key: string]: any } | Array<any>)
    : InspectResultTypes<any> {
    if (isPrimitiveType(obj)) {
        return {
            type: typeof obj,
            value: new Set([obj])
        } as BasicType<typeof obj>
    }
    else if (obj === null) {
        return {
            type: typeof undefined,
            value: new Set([undefined])
        } as BasicType<typeof undefined>
    }
    else if (Array.isArray(obj)) {
        return {
            type: 'array',
            value: (obj as any[]).reduce((res, elem, idx, arr) => {
                const type = typeof elem
                if (res[type])
                    res[type] = mergeInspectObject(inspectObject(elem), res[type])
                else
                    res[type] = inspectObject(elem)
                return res
            }, {} as ArrayType<any>['value'])
        } as ArrayType<any>
    }
    else if (obj) {
        return {
            type: 'object',
            value: Object.keys(obj).reduce((res, key, idx, arr) => {
                res[key] = inspectObject(obj[key])
                return res
            }, {} as ObjectType<any>['value'])
        } as ObjectType<any>
    }
    throw Error(`Error : In inspectObject, ${Object.prototype.toString.call(obj)} is not supported.`)
}

function ToJSON(key: any | Set<any>, value: any | Set<any>) {
    if (typeof value === 'object' && value instanceof Set) {
        const arr = Array<any>()
        value.forEach(val => arr.push(val))
        return arr
    }
    return value
}