import { isJSONArrayType, isJSONObjectType, isJSONPrimitives, JSONTypes, readJSONFile, ToJSON, writeObjectToFile} from './json-parser'

function getType(obj: any): string {
    const type = typeof obj
    if (type === 'object') {
        return (Object.prototype.toString.call(obj) as string).slice(8, -1).toLowerCase()
    }
    return type
}

interface InspectType {
    types: Set<string>
    values: InspectValueType
}
type InspectObject = {[key: string] : InspectType}
interface InspectValueType {
    /**
     * * Set : 값을 저장
     * * boolean : 해당 타입 존재여부를 저장
     */
    [key: string] : Set<any> | boolean | InspectObject | InspectType | undefined
    number: Set<number>
    string: Set<string>
    boolean: boolean
    undefined: boolean
    null: boolean
    object: InspectObject
    array?: InspectType
}

function getBaseInspectValueObj() : InspectValueType {
    return {
        number: new Set<number>(),
        string: new Set<string>(),
        boolean: false,
        undefined: false,
        null: false,
        object: {}
    }
}
function getBaseInspectResultObj() : InspectType {
    return {
        types: new Set(),
        values: getBaseInspectValueObj()
    }
}
function isInspectType(obj: any) : obj is InspectType {
    return typeof obj === 'object'
        && 'types' in obj
        && 'values' in obj
        && typeof obj.values.boolean === 'boolean'
        && typeof obj.values.undefined === 'boolean'
        && typeof obj.values.null === 'boolean'
}
function mergeJSONInspect(from: InspectType, to: InspectType) : InspectType {
    to.values.boolean = to.values.boolean || from.values.boolean
    to.values.null = to.values.null || from.values.null
    to.values.undefined = to.values.undefined || from.values.undefined
    from.types.forEach(type => {
        to.types.add(type)
        if(type === 'number'){
            from.values.number.forEach((value) => {
                to.values.number.add(value)
            })
        }
        else if(type === 'string'){
            from.values.string.forEach((value) => {
                to.values.string.add(value)
            })
        }
        else if(type === 'object'){
            Object.keys(from.values.object).forEach(key => {
                to.values.object[key] = mergeJSONInspect(
                    from.values.object[key],
                    to.values.object[key] ? to.values.object[key] : getBaseInspectResultObj()
                )
            })
        }
        else if(type === 'array'){
            if(from.values.array)
                to.values.array = mergeJSONInspect(
                    from.values.array,
                    to.values.array ? to.values.array : getBaseInspectResultObj()
                )
        }
    })
    return to
}

function inspectJSON(obj: JSONTypes): InspectType {
    let result : InspectType = getBaseInspectResultObj()
    if (isJSONPrimitives(obj)) {
        if (obj === undefined) {
            result.values.undefined = true
        }
        else if (obj === null) {
            result.values.null = true
        }
        else if (typeof obj === 'boolean'){
            result.values.boolean = true
        }
        else {
            (result.values[typeof obj] as Set<typeof obj>).add(obj)
        }
        const type = getType(obj) as "string" | "number" | "boolean" | "undefined" | "null"
        result.types.add(type)
        return result
    }
    else if (isJSONArrayType(obj)) {
        result.types.add('array')
        const res = obj.reduce((res, cur, idx) => {
            const inspect = inspectJSON(cur)
            return res = mergeJSONInspect(inspect, res)
        }, result)
        console.log(res)
        return res
    }
    else if (isJSONObjectType(obj)) {
        result.types.add('object')
        Object.keys(obj).forEach(key => {
            result.values.object[key] = inspectJSON(obj[key])
        })
        return result
    }
    throw new Error(`Error : In inspectObject, ${getType(obj)} is not supported.`)
}

const data = readJSONFile('./graphql.schema.json')
// const data = readJSONFile('./test.json')
// console.log(data)
const result = inspectJSON(data)
// console.log(JSON.stringify(result, ToJSON, 4))
writeObjectToFile('./result.json', result)