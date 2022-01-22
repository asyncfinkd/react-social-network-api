const User = require('../../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { UserInputError, AuthenticationError } = require('apollo-server')
const {
  validateRegisterInput,
  validateLoginInput,
} = require('../../util/validators')
const checkAuth = require('../../util/check-auth')

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    'xm1lmxeqlwmxelqwmxeqmwkxemklqmxwe',
    { expiresIn: '1h' }
  )
}

module.exports = {
  Query: {
    async getUsers() {
      try {
        const users = await User.find()
        return users
      } catch (err) {
        throw new Error(err)
      }
    },

    async getFriendRequests(_, __, context) {
      const { id } = checkAuth(context)
      try {
        const user = await User.findById(id)
        const requests = user.friends.filter((el) => el.status === 'Pending')

        return requests
      } catch (err) {
        throw new Error(err)
      }
    },

    async getFriends(_, __, context) {
      const { id } = checkAuth(context)
      try {
        const user = await User.findById(id)
        const requests = user.friends.filter((el) => el.status !== 'Pending')

        return requests
      } catch (err) {
        throw new Error(err)
      }
    },
  },

  Mutation: {
    async login(_, { username, password }) {
      const { errors, valid } = validateLoginInput(username, password)
      const user = await User.findOne({ username })

      if (!valid) {
        throw new UserInputError('Errors', { errors })
      }

      if (!user) {
        errors.general = 'User not found'
        throw new UserInputError('Wrong credentials', { errors })
      }

      const match = await bcrypt.compare(password, user.password)

      if (!match) {
        errors.general = 'Wrong Credentials'
        throw new UserInputError('Wrong credentials', { errors })
      }

      const token = generateToken(user)

      return { ...user._doc, id: user._id, token }
    },

    async register(
      _,
      { registerInput: { username, email, password, confirmPassword } },
      context,
      info
    ) {
      const { valid, errors } = validateRegisterInput(
        username,
        email,
        password,
        confirmPassword
      )
      if (!valid) {
        throw new UserInputError('Errors', { errors })
      }

      const user = await User.findOne({ username })
      if (user) {
        throw new UserInputError('Username is taken', {
          errors: { username: 'This username is taken' },
        })
      }

      password = await bcrypt.hash(password, 12)

      const newUser = new User({
        email,
        username,
        password,
        createdAt: new Date().toISOString(),
      })

      const res = await newUser.save()

      const token = generateToken(res)

      return { ...res._doc, id: res._id, token }
    },

    async addFriend(_, { userId }, context) {
      const { username } = checkAuth(context)
      try {
        const user = await User.findById(userId)

        if (user) {
          user.friends.push({
            status: 'Pending',
            username,
            createdAt: new Date().toISOString(),
          })
        }

        await user.save()
        return user
      } catch (err) {}
    },

    async removeFriend(_, { userId, friendId }, context) {
      try {
        const { username } = checkAuth(context)

        const user = await User.findById(userId)

        if (user) {
          const friendIndex = user.friends.findIndex((c) => c.id === friendId)

          if (user.friends[friendIndex].username === username) {
            user.friends.splice(friendIndex, 1)
            await user.save()
            return user
          } else {
            throw new AuthenticationError('Action not allowed')
          }
        }
      } catch (err) {
        throw new UserInputError(err)
      }
    },

    async acceptFriendRequest(_, { friendId }, context) {
      const { id, username } = checkAuth(context)
      try {
        const user = await User.findById(id)

        const friendIndex = user.friends.findIndex((c) => c.id === friendId)

        if (user.friends[friendIndex].username === username) {
          user.friends[friendIndex].status = 'Accept'

          await user.save()
          return user
        } else {
          throw new AuthenticationError('Action not allowed')
        }
      } catch (err) {
        throw new Error(err)
      }
    },
  },
}
