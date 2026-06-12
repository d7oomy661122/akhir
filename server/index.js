const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { execFile } = require('child_process');

const app = express();
app.use(cors());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests' }
});

app.use('/api/resolve-stream', limiter);

const YT_DLP_PATH = 'yt-dlp'; // Must be in PATH, or provide absolute path

app.get('/api/resolve-stream', (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const parsedUrl = new URL(url);
    const validDomains = [
      'youtube.com', 'www.youtube.com', 'youtu.be',
      'facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.watch'
    ];
    
    if (!validDomains.some(domain => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`))) {
      return res.status(400).json({ error: 'Unsupported domain' });
    }
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // execFile is used to prevent shell injection, passing arguments safely in an array
  execFile(YT_DLP_PATH, ['-g', '--no-playlist', '--format', 'best[ext=mp4]/best', url], { timeout: 15000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('yt-dlp error:', error);
      return res.status(500).json({ error: 'failed' });
    }
    
    const output = stdout.trim().split('\n');
    const streamUrl = output[0];
    
    if (!streamUrl) {
      return res.status(500).json({ error: 'failed' });
    }

    const type = streamUrl.includes('.m3u8') ? 'm3u8' : 'mp4';
    
    return res.json({ streamUrl, type });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
