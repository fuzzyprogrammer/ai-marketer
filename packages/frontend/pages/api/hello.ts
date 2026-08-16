import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    res.status(200).json({ message: 'AI Marketer API' })
  } else {
    res.status(405).json({ message: 'Method Not Allowed' })
  }
}
