const { ApolloServer } = require('apollo-server')
const { PubSub } = require('graphql-subscriptions')
const mongoose = require('mongoose')
const typeDefs = require('./graphql/typeDefs')
const resolvers = require('./graphql/resolvers')

const pubsub = new PubSub()

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ req, pubsub }),
})

mongoose
  .connect(
    'mongodb+srv://giga:vivomini@rest.nl9di.mongodb.net/networks?retryWrites=true&w=majority',
    { useNewUrlParser: true }
  )
  .then(() => {
    console.log('MongoDB Connected')
    return server.listen({ port: 3002 })
  })
  .then((res) => {
    console.log(`Server running at ${res.url}`)
  })
