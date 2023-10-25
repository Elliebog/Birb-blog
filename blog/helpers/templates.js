import doT from 'dot'
import fs from 'fs'

/**
 * Applies the main template to the content
 * @param {string} includes includes needed for content
 * @param {string} content the content to be embedded
 * @param {string} templatePath File path of the template 
 * @returns The String after the applied template
 */
export function mainTemplate(includes, content, templatePath) {
    const mainTemplate = doT.template(fs.readFileSync(templatePath))
    return mainTemplate({ content: content, includes: includes })
}