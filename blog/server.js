import Fastify from 'fastify'
import fs from 'fs'
import doT from 'dot'
import fastify_static from '@fastify/static'
import path from 'node:path'
import qs from 'qs'
import { mainTemplate, postTemplate } from './helpers/templates.js'
import { addPost, generatePost, getPosts, getSummary, ValidationSchemas } from './helpers/requesthelper.js'
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
    getSummary((summary) => {
        let content = getPosts(summary)
        //embed it into main and send the reply back
        reply.type('text/html').send(mainTemplate(INCLUDEBLOGPOSTCSS, content))
    })
})

//list tagged blogs
fastify.get('/blog/tagged/:tag', async function handler(request, reply) {
    const { tag } = request.params

    //get summary and filter out posts that aren't tagged with that tag
    getSummary((summary) => {
        let filteredSummary = summary.filter((post) => post.tags.includes(tag))
        let content = getPosts(filteredSummary)
        let msg = '<h3 style="text-align: center"> Posts tagged with ' + tag + '</h3>'

        //embed into main and send reply
        reply.type('text/html').send(mainTemplate(INCLUDEBLOGPOSTCSS, msg.concat(content)))
    })
})

fastify.get('/blog/posts/:postname', async function handler(request, reply) {
    const { postname } = request.params
    const includes = '<link rel="stylesheet" href="/static/css/poststyle.css">'

    //display post
    //first embed post into post.html template then into main.html template
    let postinfo = getSummary((summary) => {
        let postinfo = summary.find((post) => post.name == postname)
        if (!postinfo) {
            throw new PostDoesntExistError("No Post with such a title exists")
        }

        //only display if such a post even exists
        fs.readFile('web/blogposts/html/' + postname + '.html', (err, data) => {
            if (err) throw err
            let result = mainTemplate(includes, postTemplate(postinfo, data.toString()))

            //send back
            reply.type('text/html').send(result)
        })
    })

})

fastify.get('/', async function handler(request, reply) {
    fs.readFile('web/test.html', (err, data) => {
        if (err) throw err
        //send the compiled file back
        reply.type('text/html').send(templateFn({ content: data.toString() }))
    })
})
//#endregion

//#region POST/PATCH requests
fastify.post('/blog/createPost', { schema: ValidationSchemas.createBlogPost }, async function handler(request, reply) {
    //check authorization

    checkApiKey(request.headers.apikey, (hasAuth) => {
        if (!hasAuth) {
            throw new AuthenticationError("This APIKey is not authorized to use this method")
        }
        addPost(request.query, (success) => {
            //Check if post already exists -> if not update summary
            if (!success) {
                throw new PostExistsError("Post with that name already exists. Use the PATCH request if you want to edit this post")
            }
        })
    })
    generatePost(request.body, request.query.name, (err) => {
        if (err) {
            request.log.error(err)
            throw err
        }

        reply.code(201).send({ link: '/blog/posts/' + request.query.name })
    })

})

fastify.patch('/blog/editPost', { schema: ValidationSchemas.editBlogPost }, async function handler(request, reply) {
    //check authorization
    checkApiKey(request.headers.apikey, (hasAuth) => {
        if (!hasAuth) {
            throw new AuthenticationError("This APIKey is not authorized to use this method")
        }
        getSummary((summary) => {
            let postidx = summary.findIndex((post) => post.name == request.query.identifierName)
            let postinfo = summary[postidx]

            if (!postinfo) {
                throw new PostDoesntExistError("Post with this name doesn't exist")
            }

            //safe identifier name for later use before deleting
            let identifierName = request.query.identifierName

            //build new dictionary based on query information and postinfo
            let editInfo = request.query
            delete editInfo['identifierName']
            for (let key in postinfo) {
                if (!editInfo[key]) {
                    editInfo[key] = postinfo[key]
                }
            }

            //replace info in summary
            summary[postidx] = editInfo

            //write back to summary json
            fs.writeFile('web/blogposts/summary.json', JSON.stringify(summary), (err) => {
                if (err) throw err
            })

            let oldhtmlFile = 'web/blogposts/html/' + identifierName + '.html'
            let oldmdFile = 'web/blogposts/markdown/' + identifierName + '.md'

            //if the name was changed -> change filenames
            if (identifierName != editInfo.name) {
                fs.renameSync(oldhtmlFile, 'web/blogposts/html/' + editInfo.name + '.html')
                fs.renameSync(oldmdFile, 'web/blogposts/markdown/' + editInfo.name + '.md')
            }

            //if the body is not empty -> regenerate files
            if (request.body) {
                //delete old files
                fs.rmSync(oldhtmlFile, { force: true })
                fs.rmSync(oldmdFile, { force: true })
                generatePost(request, editInfo.name)
            }

            reply.code(200).send({ link: 'web/blog/' + editInfo.name })
        })
    })
})
//#endregion

//start server
try {
    await fastify.listen({ port: 3000 })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}