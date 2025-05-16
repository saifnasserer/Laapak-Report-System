const express = require('express');
const { Sequelize, Op } = require('sequelize');
const { Report, Client } = require('../models');

const router = express.Router();

// GET /reports - get all reports
router.get('/', async (req, res) => {
  try {
    const reports = await Report.findAll({
      include: {
        model: Client,
        attributes: ['id', 'name'],
      },
      order: [['createdAt', 'DESC']],
    });
    res.json(reports);
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reports/:id - get report by ID
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id, {
      include: {
        model: Client,
        attributes: ['id', 'name'],
      },
    });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    console.error('Failed to fetch report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /reports - create a new report
router.post('/', async (req, res) => {
  const { clientId, title, description, data } = req.body;

  if (!clientId || !title) {
    return res.status(400).json({ error: 'clientId and title are required' });
  }

  try {
    const newReport = await Report.create({
      clientId,
      title,
      description,
      data,
    });
    res.status(201).json(newReport);
  } catch (error) {
    console.error('Failed to create report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /reports/:id - update a report
router.put('/:id', async (req, res) => {
  const { clientId, title, description, data } = req.body;

  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (clientId !== undefined) report.clientId = clientId;
    if (title !== undefined) report.title = title;
    if (description !== undefined) report.description = description;
    if (data !== undefined) report.data = data;

    await report.save();
    res.json(report);
  } catch (error) {
    console.error('Failed to update report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /reports/:id - delete a report
router.delete('/:id', async (req, res) => {
  try {
    const deletedCount = await Report.destroy({
      where: { id: req.params.id },
    });
    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Failed to delete report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reports/search?q=term - search reports by title or description
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const reports = await Report.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${q}%` } },
          { description: { [Op.iLike]: `%${q}%` } },
        ],
      },
      include: {
        model: Client,
        attributes: ['id', 'name'],
      },
      order: [['createdAt', 'DESC']],
    });
    res.json(reports);
  } catch (error) {
    console.error('Failed to search reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
