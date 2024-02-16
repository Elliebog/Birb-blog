import crypto from 'node:crypto'
import fs from 'fs'


/**
 * Checks whether the given ApiKey is authorized to do a request. Returns a boolean value
 * @param {string} apiKey 
 * @returns true if the hash of the key is included in the keyhashes file
 */
export function checkApiKey(apiKey) {
    //compute hash of key and compare to keyhash file
    let hash = crypto.createHash('sha512')
   
    let apiKeyHash = hash.update(apiKey).digest('hex')
    if(!fs.existsSync('auth/keyhashes.json')) {
        return false
    }    

    //return true if hash is included
    let hashes = JSON.parse(fs.readFileSync('auth/keyhashes.json'))
    return hashes.includes(apiKeyHash)
}