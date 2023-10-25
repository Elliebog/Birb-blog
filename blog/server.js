import Fastify from 'fastify'
import fs from 'fs'
import doT from 'dot'
import fastify_static from '@fastify/static'
import path from 'node:path'
import qs from 'qs'
import { generateMarkdown } from './markdownGen/generate.js'
import { mainTemplate } from './helpers/templatehelper.js'
import { getPosts, ValidationSchemas } from './helpers/requesthelper.js'
import { checkApiKey } from './helpers/authhelper.js'
import { AuthenticationError } from './helpers/errorhelper.js'

//setup different querystring parser to be able to specify arrays with commas
const fastify = Fastify({
    logger: true,
    querystringParser: str => qs.parse(str, { comma: true })
})

//#region Resource Include Constants
const INCLUDEBLOGPOSTCSS = '<link rel="stylesheet" href="/static/css/poststyle.css">'
//#endregion

//#region Functions
/**
 * Get the summary from the summary.json file 
 * @param {import('fastify').FastifyRequest} request 
 * @returns the summary array
 */
function getSummary(request) {
    const summaryFilePath = 'web/blogposts/summary.json'
    let summary = []

    //if summary.json doesn't exist -> error
    if (!fs.existsSync(summaryFilePath)) {
        request.log.error('no summary.json was found')
    } else {
        summary = JSON.parse(fs.readFileSync(summaryFilePath))
    }
    return summary
}
//#endregion 


//setup Static files
fastify.register(fastify_static, {
    root: path.resolve('./web/static'),
    prefix: '/static'
})

//serve static files
fastify.get('/static/:filetype/:filename', async function handler(request, reply) {
    const { filetype, filename } = request.params

    reply.sendFile(filetype + '/' + filename)
    return reply
})

//#region GET requests
//Blog section
fastify.get('/blog/', async function handler(request, reply) {
    const includes = '<link rel="stylesheet" href="/static/css/poststyle.css">'

    //get the summary and from the summary get posts
    let summary = getSummary(request)
    let content = getPosts(summary, request)
    //embed it into main and send the reply back
    reply.type('text/html').send(mainTemplate(INCLUDEBLOGPOSTCSS, content, 'web/templates/main.html'))
})

//list tagged blogs
fastify.get('/blog/tagged/:tag', async function handler(request, reply) {
    const { tag } = request.params

    //get summary and filter out posts that aren't tagged with that tag
    let summary = getSummary(request).filter((post) => post.tags.includes(tag))
    let content = getPosts(summary, request)
    let msg = '<h3 style="text-align: center"> Posts tagged with ' + tag + '</h3>'

    //embed into main and send reply
    reply.type('text/html').send(mainTemplate(INCLUDEBLOGPOSTCSS, msg.concat(content), 'web/templates/main.html'))
})
//Post information in summary file
/**
 * filename: of the .md file
 * genDate: last time the corresponding html files were created
 * title
 * date
 * author
 * description
 * tags
 */

// Post information needed for summary template
/**
 * post:
 *  - image
 *  - link
 *  - title
 *  - date
 *  - author
 *  - description
 *  - tags [tag1,tag2,...]
 */

fastify.get('/', async function handler(request, reply) {
    const template = fs.readFileSync('web/templates/main.html')
    const contentdata = fs.readFileSync('web/test.html')
    //apply the Template
    var templateFn = doT.template(template.toString())

    request.log.info(contentdata.toString())

    //send the compiled file back
    reply.type('text/html').send(templateFn({ content: contentdata.toString() }))
    return reply
})
//#endregion

//#region POST/PATCH requests
fastify.post('/blog/createPost', { schema: ValidationSchemas.createBlogPost }, async function handler(request, reply) {
    //check authorization
    if(!checkApiKey(request.headers.apikey)) {
        throw new AuthenticationError("APIKey is not authorized to use this method")
    }
    request.log.info(request.query)
    request.log.info(request.headers)
    request.log.info(request.body)
})
//#endregion

//start server
try {
    await fastify.listen({ port: 3000 })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}