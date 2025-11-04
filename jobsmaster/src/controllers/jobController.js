const { recommendationsQueue } = require('../queue');

// POST /job
const createJob = async (req, res) => {
  try {
    const { propertyId, userId, filters} = req.body;

    if (!propertyId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'propertyId is required',
      });
    }

    const job = await recommendationsQueue.add(
      'generate-recommendations',
      {
        propertyId,
        userId,
        filters: filters || {},
        timestamp: new Date().toISOString(),
      },
      {
        jobId: `rec-${propertyId}-${Date.now()}`,
      }
    );

    console.log(`📝 Job created: ${job.id}`);

    res.status(201).json({
      jobId: job.id,
      status: 'queued',
      message: 'Job created successfully',
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create job',
    });
  }
};

// GET /job/:id
const getJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await recommendationsQueue.getJob(id);

    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found',
      });
    }

    const state = await job.getState();
    const response = {
      jobId: job.id,
      status: state,
      progress: job.progress || 0,
      data: job.data,
      createdAt: job.timestamp,
      processedAt: job.processedOn || null,
      finishedAt: job.finishedOn || null,
    };

    if (state === 'completed') {
      response.result = job.returnvalue;
    }

    if (state === 'failed') {
      response.error = job.failedReason;
    }

    res.json(response);
  } catch (error) {
    console.error('Error getting job:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve job',
    });
  }
};

// GET /heartbeat
const heartbeat = async (req, res) => {
  try {
    // Método correcto para BullMQ v5
    const client = await recommendationsQueue.client;
    await client.ping();

    const waiting = await recommendationsQueue.getWaitingCount();
    const active = await recommendationsQueue.getActiveCount();
    const completed = await recommendationsQueue.getCompletedCount();
    const failed = await recommendationsQueue.getFailedCount();

    res.json({
      status: true,
      timestamp: new Date().toISOString(),
      queue: { waiting, active, completed, failed },
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(503).json({
      status: false,
      error: 'Service Unavailable',
      message: error.message,
    });
  }
};

module.exports = { createJob, getJob, heartbeat };
