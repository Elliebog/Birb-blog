import MarkdownIt from 'markdown-it'
import fs from 'fs'
import hljs from 'highlight.js'

/**
 * Renders the given markdown file into html and writes it to html file path
 * @param {string} mdfilePath 
 * @param {string} htmlfilePath 
 * @param {Function} callback 
 */
export function generateMarkdown(mdfilePath, htmlfilePath) {
    //setup markdown parser
    var md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
        highlight: function(str, lang) {
            if(lang && hljs.getLanguage(lang)) {
                return hljs.highlight(str, {language: lang}).value
            }
        }
    })

    //read file and parse then write to 
    let rendered = md.render(fs.readFileSync(mdfilePath).toString())
    fs.writeFileSync(htmlfilePath, rendered.toString())
}