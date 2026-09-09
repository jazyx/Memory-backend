/// ARRAY FUNCTIONS ///


/**
 * Shuffle the original array
 */
const shuffle = a => {
  let ii = a.length

  while (ii) {
    const jj = Math.floor(Math.random() * ii)
    ii -= 1;
    [a[ii], a[jj]] = [a[jj], a[ii]]
  }

  return a // for chaining
}


/**
 * Leave original untouched: return a shuffled shallow clone
 */
const toShuffled = a => {
  return shuffle([...a])
}



/**
 * Choose and return `howMany` items at random from the input
 * array. The order of items in the original array may be changed.
 *
 * @param {array} array must be an array
 * @param {number} howMany is the number of random items to return
 * @param {number} toIgnore is the number of items at the end of
 *        array that should not be chosen.
 *        If array.length - toIgnore is less than howMany, only
 *        array.length - toIgnore will be returned
 * @param {number} moveToEnd: if true, all items that have been
 *        chosen to be returned will be moved to the end of the
 *        array, where they may be in the `toIgnore` range, the
 *        next time this function is called with the same source
 *        array
 *
 * Example:
 *
 *   const source = [ 0, 1, 2, 3, 4, 5, 6, 7, 8 ]
 *   let some = getSomeFrom(source, 3, 3 true)
 *   // [ 4, 5, 1 ]
 *   // source is now [ 0, 2, 3, 6, 7, 8,  4, 5, 1 ]
 *   some = getSomeFrom(source, 3, 3 true)
 *   // [ 2, 3, 6 ]
 *   // source is now [ 0, 7, 8,  4, 5, 1,  2, 3, 6 ]
 *
 * NOTE: getSomeFrom is good for small arrays, but may not scale
 * wellto thousands of items
 */
const getSomeFrom = (
  array,
  howMany,
  toIgnore=0,
  moveToEnd
) => {
  const allowed = array.slice(0, array.length - toIgnore)
  const some = shuffle(allowed).slice(0, howMany)

  if (moveToEnd) {
    some.forEach(( value ) => {
      const index = array.indexOf(value)
      array.splice(index, 1)
      array.push(value)
    })
  }

  return some
}


/**
 * Returns true if the two arrays differ in any way.
 *
 * @param {array} array1 and array2 must be arrays
 * @param {mixed} caseInsensitive can be any truthy value, or not
 */
const arraysDiffer = (array1, array2, caseInsensitive) => {
  if (!Array.isArray(array1) || !Array.isArray(array2)) {
    return Array.isArray(array1) !== Array.isArray(array2)
  }

  if (array1.length !== array2.length) {
    return true
  }

  const clone1 = cloned(array1, caseInsensitive)
  const clone2 = cloned(array2, caseInsensitive)

  return clone1.some((value, index) => value !== clone2[index])

  function cloned(array, lowercase) {
    return (lowercase)
      ? lowercased([...array]).sort()
      : [...array].sort()
  }

  function lowercased(array) {
    return array.map(value => (
      (typeof value === "string")
        ? value.toLowerCase()
        : value
    ))
  }
}



/**
 * Returns false if two values are the same. If two arrays are
 * compared, their entries must be in the same order. If you want
 * to check if two arrays hold the same items in a different order
 * use arraysDiffer, which also provides a case-insensitive
 * comparison.
 *
 * If objects or other values are compared, the comparison is
 * case-sensitive.
 *
 * NOTE: You can use this to compare NaN with NaN. A direct
 * comparison (NaN === NaN) will return false, but...
 *
 *   objectsDiffer(NaN, NaN)
 *
 * ... indicates that they do not differ; they are the same.
 */
const objectsDiffer = (object1, object2, ignore=[]) => {
  if (((typeof object1 === "object")
   !== (typeof object2 === "object"))
    // Distinguish between [] and { length: 0 }
    || (Array.isArray(object1) !== Array.isArray(object2))
    // Distinguish between null and {}
    || ((object1 === null) !== (object2 === null))
  ) {
    return true
  }

  if (object1 === null) {
    // If we get here, both objects will be null
    return false
  }

  const keys1 = Object.getOwnPropertyNames(object1)
  const keys2 = Object.getOwnPropertyNames(object2)

  // Remove any keys that are to be ignored
  let index
  ignore.forEach( key => {
    [keys1, keys2].forEach(keys => {
      index = keys.indexOf(key)
      if (index > -1) {
        keys.splice(index, 1)
      }
    })
  })

  if (keys1.length !== keys2.length) {
    return true
  }

  return keys1.some( key => {
    const value1 = object1[key]
    const value2 = object2[key]

    if (typeof value1 === "object") {
      return objectsDiffer(value1, value2)
    } else if (value1 !== value2 ){
      return true
    }
  })
}


/**
 * Checks if the two arrays have all the same values. Returns the
 * differences (case sensitive). The existence of multiple
 * identical values is ignored.
 * 
 * @depends on sanitizeArray() and getType(). This allows an Array
 *          to be compared with a Set.
 * 
 * @param {array} array1 and array2 should both be arrays
 * @returns an array of arrays:
 *          [ [<items only in array1>, ...],
 *            [<items only in array2>, ...]
 *          ]
 * 
 * Usage:
 *   const array1 = [1, 1, 2, 3, 5]
 *   const array2 = [4, 3, 2, 1, 0]
 *   const [absent, excess] = compareArrays(array1, array2)
 *   // absent: [5]
 *   // excess: [4, 0]
 * 
 *   const array1 = [1, 1, 2, 3, 5]
 *   const array2 = new Set([4, 3, 2, 1, 0])
 *   const [absent, excess] = compareArrays(array1, array2)
 *   // absent: [5]
 *   // excess: [4, 0]
 */
const compareArrays = (array1, array2, warn) => {
  array1 = sanitizeArray(array1, 1, warn)
  array2 = sanitizeArray(array2, 2, warn)

  const absent = array1.filter(value => array2.indexOf(value) < 0)
  const excess = array2.filter(value => array1.indexOf(value) < 0)
  
  if (warn?.length) {
    return [absent, excess, warn]
  }
  return [absent, excess]
}


function sanitizeArray(array, index, warn) {
  const type = getType(array)

  if (type !== "array") {
    if (Array.isArray(warn)) {
      if (type === "symbol") { array = String(array)}
      warn.push(
        `Argument ${index} not an array: ${array} (${type})`
      )
    }
    array = (type === "set" || type === "map")
      ? [...array]
      : []
  }

  return array
}


function getType(item) {
  switch (true) {
    case (typeof item === "string"):  return "string"
    case (typeof item === "boolean"): return "boolean"
    case (typeof item === "symbol"):  return "symbol"
    case (Array.isArray(item)):       return "array"
    case (item instanceof Set):       return "set"
    case (item instanceof Map):       return "map"
    case (item instanceof WeakMap):   return "weakmap"
    case (item instanceof WeakSet):   return "weakset"
    case (item === null):             return "null"
    case (item === undefined):        return "undefined"
    case (typeof item === "object"):  return "object"
    case (isNaN(item) && typeof item === "number"):
                                      return "NaN"
    case (item === Infinity || item === -Infinity) : 
                                      return "infinity"
    default:                          return "other"
  }
}


module.exports = {
  shuffle,
  toShuffled,
  getSomeFrom,
  arraysDiffer,
  objectsDiffer,
  compareArrays,
  sanitizeArray,
  getType
}