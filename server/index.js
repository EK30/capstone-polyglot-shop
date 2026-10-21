

const express = require('express')
const cors = require('cors')
const sql = require('mssql')
const { CosmosClient } = require('@azure/cosmos')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// ===================================
// Azure Cosmos DB Connection
// ===================================

const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY
})

const productsContainer = cosmosClient
  .database(process.env.COSMOS_DATABASE)
  .container(process.env.COSMOS_CONTAINER)

// ===================================
// Azure SQL Database Configuration
// ===================================

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false
  },
  connectionTimeout: 15000
}

// ===================================
// Backend Health Check
// ===================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Capstone Shop backend is running'
  })
})

// ===================================
// Get Products from Azure Cosmos DB
// ===================================

app.get('/api/products', async (req, res) => {
  try {
    const query = {
      query: `
        SELECT c.id, c.name, c.category, c.price,
               c.brand, c.ram, c.storage, c.processor,
               c.wireless, c.dpi, c.color,
               c.switchType, c.backlit, c.connection
        FROM c
      `
    }

    const { resources } = await productsContainer.items
      .query(query)
      .fetchAll()

    res.json(resources)
  } catch (error) {
    console.error('Cosmos DB request failed:', error.message)

    res.status(500).json({
      error: 'Unable to retrieve products'
    })
  }
})

// ===================================
// Test Azure SQL Database Connection
// ===================================

app.get('/api/sql-test', async (req, res) => {
  let pool

  try {
    pool = await new sql.ConnectionPool(sqlConfig).connect()

    const result = await pool.request().query(`
      SELECT
        DB_NAME() AS database_name,
        COUNT(*) AS customer_count
      FROM dbo.Customers
    `)

    res.json({
      status: 'Connected',
      database: result.recordset[0].database_name,
      customers: result.recordset[0].customer_count
    })
  } catch (error) {
    console.error('Azure SQL connection failed:', error.message)

    res.status(500).json({
      error: 'Unable to connect to Azure SQL Database'
    })
  } finally {
    if (pool) {
      await pool.close()
    }
  }
})

// ===================================
// Start Express Backend
// ===================================

app.get('/api/customers', async (req, res) => {
  let pool

  try {
    pool = await new sql.ConnectionPool(sqlConfig).connect()

    const result = await pool.request().query(`
      SELECT
        customer_id,
        customer_name,
        customer_email
      FROM dbo.Customers
      ORDER BY customer_name
    `)

    res.json(result.recordset)
  } catch (error) {
    console.error('Unable to retrieve customers:', error.message)

    res.status(500).json({
      error: 'Unable to retrieve customers'
    })
  } finally {
    if (pool) {
      await pool.close()
    }
  }
})

app.post('/api/orders', async (req, res) => {
  const { customer_id, product_id } = req.body

  if (!Number.isInteger(customer_id) || typeof product_id !== 'string') {
    return res.status(400).json({
      error: 'Valid customer_id and product_id are required'
    })
  }

  let pool
  let transaction

  try {
    // Find the selected product in Cosmos DB
    const { resources } = await productsContainer.items
      .query({
        query: 'SELECT c.id, c.name FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: product_id }]
      })
      .fetchAll()

    if (resources.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const product = resources[0]

    pool = await new sql.ConnectionPool(sqlConfig).connect()
    transaction = new sql.Transaction(pool)
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE)

    // Verify customer and allocate an order ID safely
    const customerResult = await new sql.Request(transaction)
      .input('customerId', sql.Int, customer_id)
      .query(`
        SELECT customer_id
        FROM dbo.Customers
        WHERE customer_id = @customerId
      `)

    if (customerResult.recordset.length === 0) {
      await transaction.rollback()
      transaction = null
      return res.status(404).json({ error: 'Customer not found' })
    }

    const orderResult = await new sql.Request(transaction)
      .input('customerId', sql.Int, customer_id)
      .input('product', sql.VarChar(100), product.name)
      .query(`
        DECLARE @newOrderId INT;

        SELECT @newOrderId = ISNULL(MAX(order_id), 100) + 1
        FROM dbo.Orders WITH (UPDLOCK, HOLDLOCK);

        INSERT INTO dbo.Orders (order_id, customer_id, product)
        VALUES (@newOrderId, @customerId, @product);

        SELECT @newOrderId AS order_id;
      `)

    await transaction.commit()
    transaction = null

    res.status(201).json({
      status: 'Order created',
      order_id: orderResult.recordset[0].order_id,
      customer_id,
      product: product.name
    })
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback()
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError.message)
      }
    }

    console.error('Order creation failed:', error.message)
    res.status(500).json({ error: 'Unable to create order' })
  } finally {
    if (pool) await pool.close()
  }
})



app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend running at http://localhost:${PORT}`)
})
