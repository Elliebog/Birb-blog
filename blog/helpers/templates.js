import doT from 'dot'
import fs from 'fs'
const mainTemplatefn = doT.template(fs.readFileSync('web/templates/main.html'))
const postTemplatefn = doT.template(fs.readFileSync('web/templates/post.html'))
const overviewTemplatefn = doT.template(fs.readFileSync('web/templates/blog_overview.html'))

/**
 * Applies the main template to the content
 * @param {string} includes includes needed for content
 * @param {string} content the content to be embedded
 * @param {string} templatePath File path of the template 
 * @returns The String after the applied template
 */
export function mainTemplate(includes, content) {
    return mainTemplatefn({ content: content, includes: includes })
}
export function overviewTemplate(posts) {
    return overviewTemplatefn({ posts: posts })
}
export function postTemplate(metainfo, content) {
    return postTemplatefn({
        title: metainfo.title,
        link: metainfo.link,
        author: metainfo.author,
        date: metainfo.date,
        tags: metainfo.tags,
        content: content
    })
}