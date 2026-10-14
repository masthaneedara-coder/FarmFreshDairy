
import { Router } from "express";

import {
  generateTodayDeliveriesService,
} from "../services/subscriptionDelivery.service.js";

import {
  autoAssignTodayDeliveriesService,
} from "../services/deliveryAssignment.service.js";

const router = Router();

router.get("/", async (req, res) => {
  const startedAt = Date.now();
  const requestId = `delivery-cron-${startedAt}`;

  // Fail closed if the secret is not configured.
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error(`[${requestId}] CRON_SECRET is missing`);

    return res.status(500).json({
      success: false,
      message: "Cron authorization is not configured",
    });
  }

  // Vercel sends this header when CRON_SECRET is configured.
  const authorization = req.headers.authorization;

  if (authorization !== `Bearer ${cronSecret}`) {
    console.warn(`[${requestId}] Unauthorized cron request`);

    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  console.log(`[${requestId}] DAILY DELIVERY JOB STARTED`, {
    startedAt: new Date().toISOString(),
    timezone: "Asia/Kolkata",
  });

  let generation;

  // 1. Generate deliveries first.
  try {
    console.log(`[${requestId}] Generating today's deliveries`);

    generation = await generateTodayDeliveriesService();

    console.log(`[${requestId}] GENERATION COMPLETED`, {
      created: generation?.created?.length ?? 0,
      updated: generation?.updated?.length ?? 0,
      skipped: generation?.skipped ?? 0,
    });
  } catch (error) {
    console.error(`[${requestId}] GENERATION FAILED`, {
      message: error?.message,
      durationMs: Date.now() - startedAt,
    });

    return res.status(500).json({
      success: false,
      stage: "generation",
      message: "Delivery generation failed; assignment was not started",
    });
  }

  // 2. Only assign after successful generation.
  try {
    console.log(`[${requestId}] Starting auto-assignment`);

    const assignment =
      await autoAssignTodayDeliveriesService();

    const result = {
      enabled: assignment.enabled,
      assigned: assignment.assigned,
      pending: assignment.pending,
      workload: assignment.workload,
    };

    console.log(`[${requestId}] ASSIGNMENT COMPLETED`, {
      enabled: result.enabled,
      assigned: result.assigned,
      pending: result.pending,
      workload: result.workload,
      durationMs: Date.now() - startedAt,
    });

    console.log(`[${requestId}] DAILY DELIVERY JOB COMPLETED`);

    return res.status(200).json({
      success: true,
      requestId,
      generation: {
        created: generation?.created?.length ?? 0,
        updated: generation?.updated?.length ?? 0,
        skipped: generation?.skipped ?? 0,
      },
      assignment: result,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error(`[${requestId}] ASSIGNMENT FAILED`, {
      message: error?.message,
      durationMs: Date.now() - startedAt,
    });

    return res.status(500).json({
      success: false,
      requestId,
      stage: "assignment",
      message: "Delivery generation completed, but assignment failed",
    });
  }
});

export default router;
