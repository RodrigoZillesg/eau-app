import { Router, Request, Response } from 'express';
import { EmailLoggerService } from '../services/emailLogger.service';

const router = Router();

/**
 * Track email open via 1x1 transparent pixel
 */
router.get('/open/:messageId', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    // Track the open event
    await EmailLoggerService.trackOpen(messageId);

    // Return a 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache'
    });

    res.end(pixel);
  } catch (error) {
    console.error('Error tracking email open:', error);
    // Still return the pixel even if tracking fails
    res.status(200).send();
  }
});

/**
 * Track link clicks and redirect to original URL
 */
router.get('/click/:messageId', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).send('Invalid URL');
    }

    // Track the click event
    await EmailLoggerService.trackClick(messageId, url);

    // Redirect to the original URL
    res.redirect(url);
  } catch (error) {
    console.error('Error tracking email click:', error);
    // Still redirect even if tracking fails
    const { url } = req.query;
    if (url && typeof url === 'string') {
      res.redirect(url);
    } else {
      res.status(400).send('Invalid URL');
    }
  }
});

export default router;