import MarkdownIt from 'markdown-it'
import fs from 'fs'
import hljs from 'highlight.js'

const copybtnstr = '<div class="position-absolute top-0 end-0 btn copyBtn">Test</div>' 
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
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return '<pre hidden></pre><div class="position-relative"><pre class="hljs"><code class="hljs">' + 
                        hljs.highlight(str, { language: lang }).value +
                        '</code></pre>' + copybtnstr + '</div>'
                } catch (_) { }
            }

        }

    })

    //read file and parse then write to 
    let rendered = md.render(fs.readFileSync(mdfilePath).toString())
    fs.writeFileSync(htmlfilePath, rendered.toString())
}