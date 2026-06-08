const sanitizeHTML = (val) => {
  if (typeof val === 'string') {
    // Skip base64 image data to avoid corruption and overhead
    if (val.startsWith('data:image/')) return val;
    return val.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeHTML);
  }
  if (typeof val === 'object' && val !== null) {
    const clean = {};
    for (const key of Object.keys(val)) {
      clean[key] = sanitizeHTML(val[key]);
    }
    return clean;
  }
  return val;
};

module.exports = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeHTML(req.body);
  }
  next();
};
