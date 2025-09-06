module.exports = (app) => {
  app.get('/api/job-actions/ping', (req, res) => {
    res.json({ ok: true, router: 'tempJobActions' });
  });
};
