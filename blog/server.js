import Fastify from 'fastify'
import fs from 'fs'
import doT from 'dot'
import fastify_static from '@fastify/static'
import path from 'node:path'

const fastify = Fastify({ logger: true })

//setup Static files
fastify.register(fastify_static, {
    root: path.resolve('./web/static'),
    prefix: '/static'
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

fastify.get('/static/:filetype/:filename', async function handler(request, reply) {
    const { filetype , filename } = request.params
    
    reply.sendFile(filetype + '/' + filename)
    return reply
})

try {
    await fastify.listen({ port: 3000 })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}