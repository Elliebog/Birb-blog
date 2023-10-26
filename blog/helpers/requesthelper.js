import { hasProperties } from "./json.js";
import doT from 'dot'
import fs from 'fs'

/**
 * Get the posts formatted as html from the given summary
 * @param {Array} summary 
 * @param {import("fastify").FastifyRequest} request 
 * @returns the resulting html section as a string 
 */
export function getPosts(summary, request) {
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
        let overviewTemplate = doT.template(fs.readFileSync('web/pages/blog_overview.html').toString())
        content = overviewTemplate({ posts: posts })
    }
    return content
}
/**
 * Adds a postentry to the summary JSON file, if a post with the same name doesn't already exist
 * @param {object} postinfo 
 * @returns @true if the addition was successful
 */
export function addPost(postinfo) {
    let summary = JSON.parse(fs.readFileSync('web/blogposts/summary.json'))
    if(summary.some((post) => post.name == postinfo.name)) {
        return false
    }

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
    fs.writeFileSync('web/blogposts/summary.json', JSON.stringify(summary))
    return true
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
    }
}

export const ValidationSchemas = {
    createBlogPost: {
        query: ValidationSchemasParts.createBlogPostQuery,
        headers: ValidationSchemasParts.authenticationHeader
    }
}