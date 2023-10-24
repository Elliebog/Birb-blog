/**
 * Utility used for generating the Api Key
 * Only the keys hash will be stored so save the plain-text Api Key
 * Only the protected API needs Api Keys in the header
 */

import crypto from 'node:crypto'
import fs from 'fs'

const APIKEYLENGTH = 64
const alphabet = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '!', '#', '$', '%', '&', '*', '+', '-', '/', '?', '@', '<', '>', '=', '_', '~'
]

/**
 * Generates the API Key using random integers from node:crypto.randomInt()
 * @returns the API key as a string
 */
function genApiKey() {
    //an alphabet is used instead of just taking the ASCII code to ensure no special characters will mess anything up
    // shouldn't happen anyway and im probably being paranoid but javascript be silly sometimes
    let ApiKey = []
    for(let i = 0; i < APIKEYLENGTH; i++) {
        //get random int and convert it to the character from the specified alphabet
        ApiKey.push(alphabet[crypto.randomInt(alphabet.length)])
    }

    return ApiKey.join("")
}

/**
 * Creates and stores a newly generated ApiKey
 * @returns the generated API Key
 */
function addAPIKey() {
    const keyHashPath = 'auth/keyhashes.json'
    let apiKey = genApiKey()

    //Read keyhash file if it does exist else -> no hashes exist
    let hashes = []
    if(fs.existsSync(keyHashPath)) {
        hashes = JSON.parse(fs.readFileSync(keyHashPath).toString())
    } 

    //generate hash and compare it to other already existing hashes
    // If hash already exists -> regenerate API Key
    let hash = crypto.createHash('sha512')
    let currentHash = hash.update(apiKey).digest('hex')
    while(hashes.includes(currentHash)) {
        // lazy generate new hash since there so many possibilities
        apiKey = genApiKey()
        currentHash = hash.update(apiKey).digest('hex')
    }

    //Store the newly created Hash
    hashes.push(currentHash)
    fs.writeFileSync('auth/keyhashes.json', JSON.stringify(hashes))

    return apiKey
}

//Generate the Api Key
let apiKey = addAPIKey()
console.log('The generated API-Key is: ' + apiKey)
console.log('Save it!')
