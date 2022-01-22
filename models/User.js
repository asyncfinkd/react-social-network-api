const { model, Schema } = require('mongoose')

const userSchema = new Schema({
  username: String,
  password: String,
  email: String,
  createdAt: String,
  friends: [
    {
      status: String,
      username: String,
      createdAt: String,
    },
  ],
})

module.exports = model('users', userSchema)
