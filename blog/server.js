import Fastify from 'fastify'
import fs from 'fs'

const fastify = Fastify({ logger: true })

fastify.get('/', async function handler(request, reply) {
    sendFile(reply, 'text/html', 'web/test.html')
    return reply
})

try {
    await fastify.listen({ port: 3000 })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}

/**
 * Sends a file using the reply object
 * @param {FastifyReply} reply 
 * @param {String} applicationType 
 * @param {String} filePath 
 */
async function sendFile(reply, applicationType, filePath) {
    const stream = fs.createReadStream(filePath)
    reply.type(applicationType).send(stream)
}