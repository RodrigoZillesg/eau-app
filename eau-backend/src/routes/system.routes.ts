import { Router, Request, Response } from 'express';
import os from 'os';
import { authenticate, authorize } from '../middleware/auth';
import { USER_TYPES } from '../config/constants';

const router = Router();

/**
 * GET /api/v1/system/status
 * Get system status information (CPU, Memory, Disk)
 * Only accessible by Super Admins
 */
router.get('/status', authenticate, authorize(USER_TYPES.SUPER_ADMIN), async (_req: Request, res: Response) => {
  try {
    // Get memory usage
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);

    // Get CPU usage
    const cpus = os.cpus();
    const cpuCount = cpus.length;

    // Calculate average CPU usage
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const cpuUsagePercent = (100 - (totalIdle / totalTick) * 100).toFixed(2);

    // Get system uptime
    const uptime = os.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);

    // Get disk usage (Linux only - requires df command)
    let diskUsagePercent = 'N/A';
    let diskTotal = 'N/A';
    let diskUsed = 'N/A';
    let diskFree = 'N/A';

    if (process.platform === 'linux') {
      try {
        const { execSync } = require('child_process');
        const dfOutput = execSync("df -h / | tail -1 | awk '{print $2,$3,$4,$5}'").toString().trim();
        const [total, used, free, percent] = dfOutput.split(' ');
        diskTotal = total;
        diskUsed = used;
        diskFree = free;
        diskUsagePercent = percent.replace('%', '');
      } catch (error) {
        console.error('Error getting disk usage:', error);
      }
    }

    res.json({
      success: true,
      data: {
        status: 'online',
        backend: {
          status: 'running',
          uptime: `${uptimeHours}h ${uptimeMinutes}m`,
          uptimeSeconds: uptime
        },
        cpu: {
          cores: cpuCount,
          usage: parseFloat(cpuUsagePercent),
          usagePercent: `${cpuUsagePercent}%`
        },
        memory: {
          total: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
          used: `${(usedMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
          free: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
          usage: parseFloat(memoryUsagePercent),
          usagePercent: `${memoryUsagePercent}%`
        },
        disk: {
          total: diskTotal,
          used: diskUsed,
          free: diskFree,
          usage: diskUsagePercent === 'N/A' ? 0 : parseFloat(diskUsagePercent),
          usagePercent: diskUsagePercent === 'N/A' ? 'N/A' : `${diskUsagePercent}%`
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
