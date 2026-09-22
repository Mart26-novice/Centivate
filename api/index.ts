import app from './app.js';

// Vercel's Node.js runtime invokes this with a plain (req, res) signature —
// the same shape an Express app already is, so it can be exported directly.
// (serverless-http, previously used here, translates AWS Lambda's
// event/context calling convention instead, which doesn't match what Vercel
// actually calls this with.)
export default app;

