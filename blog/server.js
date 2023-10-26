import Fastify from 'fastify'
import fs from 'fs'
import doT from 'dot'
import fastify_static from '@fastify/static'
import path from 'node:path'
import qs from 'qs'
import { generateMarkdown } from './helpers/markdown.js'
import { mainTemplate, postTemplate } from './helpers/templates.js'
import { addPost, getPosts, ValidationSchemas } from './helpers/requesthelper.js'
import { checkApiKey } from './helpers/authentication.js'
import { AuthenticationError, MarkdownGenerationError, PostDoesntExistError, PostExistsError } from './helpers/error.js'

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


//setup common redirection in case people mistype url
fastify.get('/blog/', async function handler(request, reply) {
    reply.code(303).redirect('/blog')
})

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
fastify.get('/blog', async function handler(request, reply) {
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

fastify.get('/blog/posts/:postname', async function handler(request, reply) {
    const { postname } = request.params
    const includes = '<link rel="stylesheet" href="/static/css/poststyle.css">'

    //display post
    //first embed post into post.html template then into main.html template
    let postinfo = getSummary(request).find((post) => post.name == postname)
    if(postinfo === undefined) {
        throw new PostDoesntExistError("No Post with such a title exists")
    }
    //only display if such a post even exists
    let htmlContent = fs.readFileSync('web/blogposts/html/' + postname + '.html').toString()
    let result = mainTemplate(includes, postTemplate(postinfo, htmlContent))
    
    //send back
    reply.type('text/html').send(result)
})

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
    if (!checkApiKey(request.headers.apikey)) {
        throw new AuthenticationError("This APIKey is not authorized to use this method")
    }

    //Check if post already exists -> if not update summary
    if (!addPost(request.query)) {
        throw new PostExistsError("Post with that name already exists. Use the PATCH request if you want to edit this post")
    }

    let markdownpath = 'web/blogposts/markdown/' + request.query.name + '.md'
    let htmlpath = 'web/blogposts/html/' + request.query.name + '.html'
    try {
        //Body = Markdown-file
        //save Body as file to blogposts
        fs.writeFileSync(markdownpath, request.body)

        //generate Html file from that markdown
        generateMarkdown(markdownpath, htmlpath)
    } catch (err) {
        //delete generated files
        fs.rmSync(markdownpath)
        fs.rmSync(htmlpath)

        //log error and raise http error
        request.log.error(err)
        throw new MarkdownGenerationError("Couldn't generate Markdown. Please check the syntax and docs")
    }

    reply.code(201).send({ link: '/blog/posts/' + request.query.name })
})
//#endregion

//start server
try {
    await fastify.listen({ port: 3000 })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}