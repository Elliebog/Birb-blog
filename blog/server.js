import Fastify from 'fastify'
import fs from 'fs'
import doT from 'dot'
import fastify_static from '@fastify/static'
import path from 'node:path'
import generate from './markdownGen/generate.js'
import jsonhelper from './helpers/jsonhelper.js'
import templatehelper from './helpers/templatehelper.js'

const fastify = Fastify({ logger: true })

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

//Blog section
fastify.get('/', async function handler(request, reply) {
    let summaryFilePath = 'web/blogposts/summary.json'

    //if summary.json doesn't exist -> error
    let content = ''
    if (!fs.existsSync(summaryFilePath)) {
        request.log.error('no summary.json was found ')
        content = '<h1>No Posts yet :ε<h1/>'
    } else {
        let posts = []
        let summary = fs.readFileSync(summaryFilePath)
        let properties = ['filename', 'image', 'link', 'title', 'date', 'author', 'description', 'tags']

        for (let i = 0; i < summary.length; i++) {
            const postentry = summary[i]
            if (!jsonhelper.hasProperties(properties, summary)) {
                request.log.error('summary.json does not have all of the required properties at index ' + i)
                continue
            }

            // add to display queue
            posts.push(summary[i])
        }

        //render with doT template
        let overviewTemplate = doT.template(fs.readFileSync('web/pages/blog_overview.html').toString())
        content = overviewTemplate(posts)
    }
    
    //embed it into main 
    templatehelper.maintemplate('', content, 'web/templates/main.html')

    // //Update posts info file
    // // if it doesn't exist create it
    // const summaryPath = 'web/blogposts/summary.json'
    // if (fs.existsSync(summaryPath)) {
    //     let summary = JSON.parse(fs.readFileSync(summaryPath))

    //     //check if summaryData is up to date 
    //     let filenames = fs.readdirSync('web/blogposts/')
    //     filenames.pop('summary.json')

    //     for (let i = 0; i < summary.length; i++) {
    //         const post = summary[i];

    //         //check if last generated html is still up to date
    //         let modTime = fs.statSync('web/genblogposts/' + post.filename + '.html').mtime
    //         let genDate = Date.parse(post.genDate)

    //         //if the generated date is older than the modified date of the markdown file -> regenerate 
    //         if (genDate < modTime) {
    //             generate.generateMarkdown('web/blogposts/' + post.filename + '.md', 'web/genblogposts/' + post.filename + '.html')
    //         }

    //         post.genDate = 
    //     }
    // }
    // else {

    // }
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


try {
    await fastify.listen({ port: 3000 })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}