const asyncHandler = require('express-async-handler')
const Transaction = require('../models/Transaction')
const { parseNonZeroPositiveIntOrDefault } = require('../utils')
const router = require('express').Router()

router.get('/', asyncHandler(async (req, res, next) => {
  const ethersProvider = req.app.get('ethers')
  let { maxgap } = req.query
  const latestBlock = await ethersProvider.getBlockNumber()

  const [latest, tx] = await Promise.all([
    ethersProvider.getBlockWithTransactions(latestBlock),
    Transaction.findOne({}).sort('-blockNumber').select('blockNumber').exec()
  ])

  const difference = latest.number - tx.blockNumber

  maxgap = parseNonZeroPositiveIntOrDefault(maxgap, false)

  res.set('Access-Control-Allow-Origin', '*')

  const status = {
    latestBlockNumber: latest.number,
    latestScrapedBlockNumber: tx.blockNumber,
    difference
  }

  if (maxgap && difference > maxgap) {
    res.status(503)
    res.json({
      status: 'ERROR',
      data: { status }
    })
    return
  }

  res.json({
    status: 'OK',
    data: { status }
  })
}))

module.exports = router
