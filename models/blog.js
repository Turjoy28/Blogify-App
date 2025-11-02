const { model, Schema } = require('mongoose')

const blogSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    coverImgURL: {
        type: String
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
}, {
    timestamps: true
})

const Blog=model('blog',blogSchema)

module.exports=Blog;