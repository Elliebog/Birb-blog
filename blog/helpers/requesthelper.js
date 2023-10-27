import { hasProperties } from "./json.js";
import doT from 'dot'
import fs from 'fs'
import { generateMarkdown } from "./markdown.js";
import { FileNotFoundError } from "./error.js";
import { overviewTemplate } from "./templates.js";

/**
 * Get the posts formatted as html from the given summary
 * @param {Array} summary 
 * @returns the resulting html section as a string 
 */
export function getPosts(summary) {
    const emptySummaryMsg = '<h1 style="text-align: center">No Posts yet :ε<h1/>'
    const postProps = ['name', 'image', 'link', 'title', 'date', 'author', 'description', 'tags']

    let content = ''
    let posts = []

    //if Json is empty -> no Posts
    if (summary.length == 0) {
        content = emptySummaryMsg;
    }
    else {
        for (let i = 0; i < summary.length; i++) {
            const postentry = summary[i]
            //if the entry doesn't meet required properties -> continue to next entry (else push)
            if (!hasProperties(postProps, postentry)) {
                request.log.error('summary does not have all of the required properties at index ' + i)
                continue
            }

            posts.push(postentry)
        }

        //render with doT template

        content = overviewTemplate(posts)
    }
    return content
}
/**
 * @callback addPostCallback
 * @param {boolean} success the addition was successful 
 */
/**
 * Adds a postentry to the summary JSON file, if a post with the same name doesn't already exist
 * @param {object} postinfo 
 * @returns @true if the addition was successful
 */
export function addPost(postinfo, callback) {
    let summary = getSummary((summary) => {
        if (summary.some((post) => post.name == postinfo.name)) {
            callback(false)
        } else {
            summary.push({
                name: postinfo.name,
                image: postinfo.image_src,
                link: '/blog/posts/' + postinfo.name,
                title: postinfo.title,
                date: postinfo.date,
                author: postinfo.author,
                description: postinfo.description,
                tags: postinfo.tags
            })

            //write summary to file
            fs.writeFile('web/blogposts/summary.json', JSON.stringify(summary), (err) => {
                if (err) throw err
                callback(true)
            })
        }
    })
}

/**
 * @callback SummaryCallback
 * @param {object} summary
 */

/**
 * Get the summary from the summary.json file 
 * @param {import('fastify').FastifyRequest} request 
 * @param {ReadFileCallback} callback callback to execute after data has been read
 * @returns the summary array
 */
export function getSummary(callback) {
    const summaryFilePath = 'web/blogposts/summary.json'
    let summary = []

    fs.readFile(summaryFilePath, (err, data) => {
        if (err) throw err
        callback(JSON.parse(data))
    })
}

/**
 * @callback generatePostCallback
 * @param {err} err
*/

/**  
 * Generate the Html and Markdown files
 * @param {string} body
 * @param {string} filename 
 * @param {generatePostCallback} callback 
 */
export function generatePost(body, filename, callback) {
    let markdownpath = 'web/blogposts/markdown/' + filename + '.md'
    let htmlpath = 'web/blogposts/html/' + filename + '.html'

    //save body as file to blogposts
    fs.writeFile(markdownpath, body, (err) => {
        if (err) callback(err)
        generateMarkdown(markdownpath, htmlpath, (err) => {
            if (err) {
                //delete generated files
                fs.rmSync(markdownpath, { force: true })
                fs.rmSync(htmlpath, { force: true })

                //log error and raise http error
                request.log.error(err)
                callback(new MarkdownGenerationError("Couldn't generate Markdown/write body to html. Please check the syntax and docs"))
            } else {
                callback(err)
            }
        })
    })
}
export const ValidationSchemasParts = {
    createBlogPostQuery: {
        type: 'object',
        properties: {
            name: {
                type: 'string'
            },
            image_src: {
                type: 'string'
            },
            title: {
                type: 'string'
            },
            author: {
                type: 'string'
            },
            date: {
                type: 'string'
            },
            description: {
                type: 'string'
            },
            tags: {
                type: 'array',
                items: { type: 'string' }
            }
        },
        required: ['name', 'image_src', 'title', 'author', 'date', 'description', 'tags']
    },
    authenticationHeader: {
        type: 'object',
        properties: {
            apikey: { type: 'string' }
        },
        required: ['apikey']
    },
    editBlogPostQuery: {
        type: 'object',
        properties: {
            identifierName: {
                type: 'string'
            },
            newName: {
                type: 'string'
            },
            image_src: {
                type: 'string'
            },
            title: {
                type: 'string'
            },
            author: {
                type: 'string'
            },
            date: {
                type: 'string'
            },
            description: {
                type: 'string'
            },
            tags: {
                type: 'array',
                items: { type: 'string' }
            }
        },
        required: ['identifierName']
    }
}

export const ValidationSchemas = {
    createBlogPost: {
        query: ValidationSchemasParts.createBlogPostQuery,
        headers: ValidationSchemasParts.authenticationHeader
    },
    editBlogPost: {
        query: ValidationSchemasParts.editBlogPostQuery,
        headers: ValidationSchemasParts.authenticationHeader
    }
}