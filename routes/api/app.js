const express = require('express');
const { User, Submission, App } = require('../../db');
const fileUpload = require('express-fileupload');
const router = express.Router();

module.exports = router;

router.use(fileUpload({}));

router.param('id', async (req, res, next, id) => {
  if (!/^[0-9]+$/.test(id) || isNaN(parseInt(id, 10))) {
    next(401);
  }
  id = parseInt(id, 10);

  const user = req.user;
  const app = await App.findOne({
    where: {
      UserId: user.id,
      id: id,
    },
  });

  if (!app) {
    next(new Error(401));
  }

  res.locals.app = app;

  next();
});

router.get('/:id', async (req, res) => {
  /** @type {User} */
  const user = req.user;

  const app = { ...res.locals.app.get() };
  app.data = Array.from(app.data || []);

  res.json({
    app,
    user: {
      viewAs: user.viewAs,
    },
  });
});

router.get('/:id/submissions', async (req, res) => {
  let { page = 0 } = req.query;
  page = parseInt(page, 10);

  const submissions = await res.locals.app.getSubmissions({
    limit: 20,
    offset: 20 * page,
    order: [['createdAt', 'DESC']],
  });
  submissions.forEach((_) => (_.data = Array.from(_.data || [])));

  res.json(submissions);
});

router.post('/:id', async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const app = res.locals.app;
  const file = req.files.file;
  app.data = Buffer.from(file.data);
  await app.save();
  res.send(true);
});

// app/1/submission/1
router.delete('/:id/submission/:sId', async (req, res) => {
  const id = parseInt(req.params.sId, 10);
  await Submission.destroy({
    where: {
      AppId: res.locals.app.id,
      id,
    },
  });
  res.json(true);
});
