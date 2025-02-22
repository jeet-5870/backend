import mongoose { schema } from "mongoose"


const subscriptionSchema = new mongoose.Schema({
  subscriber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true })

export const subscription = mongoose.model("subscription", subscriptionSchema)