import MarkdownIt from 'markdown-it'
import fs from 'fs'

/**
 * @callback genMarkdownCallback
 * @param {Error} err
 */

/**
 * Renders the given markdown file into html and writes it to html file path
 * @param {string} mdfilePath 
 * @param {string} htmlfilePath 
 * @param {genMarkdownCallback} callback 
 */
export function generateMarkdown(mdfilePath, htmlfilePath, callback) {
    //setup markdown parser
    var md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true
    })

    //read file and parse then write to 
    fs.readFile(mdfilePath, (err, data) => {
        if (err) callback(err)
        let rendered = md.render(data.toString())
        fs.writeFile(htmlfilePath, rendered.toString(), (err) => {
            callback(err)
        })
    })
}