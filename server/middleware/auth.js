const supabase = require('../lib/supabaseClient')

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'Access token required' })
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }

    // Attach user to request for use in controllers
    req.user = user
    next()

  } catch (error) {
    return res.status(500).json({ error: 'Authentication failed' })
  }
}

module.exports = { authenticateToken }