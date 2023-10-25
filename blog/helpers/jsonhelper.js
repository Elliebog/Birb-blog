/**
 * Checks if a json object has all properties
 * @param {string[]} propertynames the properties to check for
 * @param {object} object the object to check
 * @returns true if all properties exist in the object, false if not
 */
export function hasProperties(propertynames, object) {
    if (!object) {
        return false
    }
    for (let i = 0; i < propertynames.length; i++) {
        if (!object.hasOwnProperty(propertynames[i])) {
            return false
        }
    }

    return true
}