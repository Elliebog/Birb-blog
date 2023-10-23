import { hasProperties } from "./jsonhelper";

/**
 * Get the posts formatted as html from the given summary
 * @param {Array} summary 
 * @param {import("fastify").FastifyRequest} request 
 * @returns the resulting html section as a string 
 */
function getposts(summary, request) {
    const emptySummaryMsg = '<h1 style="text-align: center">No Posts yet :ε<h1/>'
    const postProps = ['filename', 'image', 'link', 'title', 'date', 'author', 'description', 'tags']

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

export const getPosts = getposts