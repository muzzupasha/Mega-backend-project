import mongoose, {Schema} from 'mongoose';

const SubscriptionSchema = new Schema({
    Subscriber : {
        type: Schema.Types.ObjectId,  //subscriber
        ref: 'User',
    },
    channel : {
        type: Schema.Types.ObjectId,  //channel
        ref: 'User',
    }
}, {timestamps: true});

const Subscription = mongoose.model("Subscription", SubscriptionSchema);