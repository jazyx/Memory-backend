/**
 * database/models/User.js
*/

const { Schema, Types, model } = require('mongoose')

const schema = Schema({
  name:       { type: String, required: true, unique:true },
  last_visit: { type: Number, default: 0 },
  contacts:   [{ type : Types.ObjectId, ref: 'User' }],
  groups:     [{ type: String }]
},

{ statics: {
    async getOrCreateByName(name) {
      const user = await this.findOneAndUpdate(
        { name },
        { $setOnInsert: { name } },
        { new: true, upsert: true, projection: { _id: 1 } }
      )

      return user._id.toString()
    },

    async joinGroup(name, group_name){
      const result = await this.updateOne(
        { name },
        { $addToSet: { groups: group_name } }
      )

      return result.modifiedCount === 1 // true if group was added
    },
    
    async getUsersInGroup(group){
      let users = await this
        .find(
          { groups: group },
          { name: 1, _id: 0 })
        .lean()
      console.log("*** USERS ***:", users)
      users = Array.from(users).map( user => user.name )
      console.log("*** ARRAY ***:", users)

      return users // [ <string name>, ... ]
    }
  }
})

const User = model("User", schema)

module.exports = User