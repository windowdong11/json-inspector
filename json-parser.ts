/**
 * ! Type Define
 * * Primitives (non-object or null): string, number, boolean, undefiend, null
 * (typeof null is 'object'. But in this project null is considered a primitive.)
 * * Object (object): object, array
 */
import * as fs from 'fs'

export function readJSONFile(dir: string) {
    return JSON.parse(fs.readFileSync(dir).toString()) as JSONObject
    // console.log(JSON.stringify(inspectObject(data), ToJSON, 2))
}
export function writeObjectToFile(dir: string, obj: object){
    fs.writeFileSync(dir, JSON.stringify(obj, ToJSON, 4))
} 

export type SupportedTypeString = 'string' | 'number' | 'boolean' | 'undefined' | 'null' | 'object' | 'array'
export type JSONPrimitives = string | number | boolean | undefined | null
export const primitiveTypesString = ['string', 'number', 'boolean', 'undefined', 'null']
export const objectTypesString = ['object', 'array']
export const supportedTypeStrings = [...primitiveTypesString, ...objectTypesString]

export function ToJSON(key: any, value: any, options?: { clear?: boolean}) {
    if (value instanceof Set) {
        if (options?.clear !== false && value.size === 0)
            return undefined
        let arr: any[] = []
        value.forEach(val => arr.push(val))
        return arr
    }
    else if (typeof value === 'boolean'){
        if (options?.clear !== false && value === false)
            return undefined
    }
    else if(typeof value === 'object'){
        if(options?.clear !== false && Object.keys(value).length === 0)
            return undefined
    }
    return value
}

export type JSONArray = Array<JSONArray | JSONObject | JSONPrimitives>
export type JSONObject = {
    [key: string]: JSONObject | JSONArray | JSONPrimitives
}

export type JSONTypes = JSONObject | JSONArray | JSONPrimitives

/**
 * * Inspect JSON
 */
export type SupportedTypes = JSONPrimitives | JSONObject | JSONArray
export type NeverUnsupportTypes = Function | bigint | symbol



export function isJSONPrimitives(obj: JSONTypes): obj is JSONPrimitives {
    return typeof obj !== 'object' || obj === null
}
export function isJSONArrayType(obj: JSONTypes): obj is JSONArray {
    return typeof obj === 'object' && Array.isArray(obj)
}
export function isJSONObjectType(obj: JSONTypes): obj is JSONObject {
    return typeof obj === 'object' && !Array.isArray(obj)
}
export function isSupportedType(obj: string): obj is SupportedTypeString {
    return obj in supportedTypeStrings
}