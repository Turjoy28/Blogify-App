const { Router } = require('express');
const multer = require('multer');
const router = Router();
const path = require('path');
const Blog = require('../models/blog');
const Comment = require('../models/comment');
const { requireLogin } = require('../middlewares/authentication');

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  }
});
const upload = multer({ storage });

// -------------------- GET ROUTES --------------------

// Add new blog form
router.get('/add-new', requireLogin, (req, res) => {
  return res.render("addBlog", { user: req.user });
});

// View a blog with comments
router.get("/:id", async (req, res) => {
  try {
    // Fetch the blog along with its author
    const blog = await Blog.findById(req.params.id).populate("createdBy");

    // Fetch comments with their authors and the authors of replies
    const comments = await Comment.find({ blogId: req.params.id })
      .populate("createdBy")              // comment authors
      .populate("replies.createdBy")
      .sort({createdAt: -1});    // reply authors

    // Render template
    return res.render("blog", { user: req.user, blog, comments });
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
});


// -------------------- POST ROUTES --------------------

// Create a new blog
router.post('/', requireLogin, upload.single('coverImage'), async (req, res) => {
  const { title, body } = req.body;
  const blog = await Blog.create({
    title,
    body,
    createdBy: req.user._id,
    coverImgURL: `/uploads/${req.file.filename}`
  });
  res.redirect(`/blog/${blog._id}`);
});

// Add a comment to a blog
router.post('/comment/:blogId', requireLogin, async (req, res) => {
  const comment = await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id
  });
  res.redirect(`/blog/${req.params.blogId}`);
});

// Update a blog
router.post("/:id/update", requireLogin, upload.single('coverImage'), async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog || blog.createdBy.toString() !== req.user._id.toString())
    return res.status(403).send('Unauthorized');

  const { title, body } = req.body;
  if (title) blog.title = title;
  if (body) blog.body = body;
  if (req.file) blog.coverImgURL = `/uploads/${req.file.filename}`;
  await blog.save();
  res.redirect(`/blog/${blog._id}`);
});

// Delete a blog
router.post('/:id/delete', requireLogin, async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog || blog.createdBy.toString() !== req.user._id.toString())
    return res.status(403).send("Unauthorized");

  await blog.deleteOne();
  await Comment.deleteMany({ blogId: req.params.id });
  res.redirect('/');
});

// Delete a comment
router.post('/comment/:id/delete', requireLogin, async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.createdBy.toString() !== req.user._id.toString())
    return res.status(403).send('Unauthorized');

  await comment.deleteOne();
  res.redirect(`/blog/${comment.blogId}`);
});

// Add a reply to a comment
router.post('/comment/:commentId/reply', requireLogin, async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  comment.replies.push({ createdBy: req.user._id, content: req.body.content });
  await comment.save();
  res.redirect(`/blog/${comment.blogId}`);
});

// Delete a reply
router.post('/comment/:commentId/reply/:replyId/delete', requireLogin, async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  const reply = comment.replies.id(req.params.replyId);

  if (!reply || reply.createdBy.toString() !== req.user._id.toString())
    return res.status(403).send('Unauthorized');

  reply.deleteOne();
  await comment.save();
  res.redirect(`/blog/${comment.blogId}`);
});

module.exports = router;
