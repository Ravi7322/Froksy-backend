const express = require('express');
const cors = require('cors');
const db = require('./config/db');
require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.json()); // No need for body-parser


app.get('/history', (req, res) => {
  const number = req.query.number; // Get number from query params

  if (!number) {
    return res.status(400).json({ error: 'User number is required' });
  }

  const sql = `
    SELECT ci.*  
    FROM cartitems ci 
    INNER JOIN login l ON ci.number = l.number 
    WHERE l.number = ? 
    ORDER BY ci.created_at DESC
  `;

  db.query(sql, [number], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
     console.log("Order History Results:", results);
  });
});


app.get('/users', (req, res) => {
  db.query('SELECT id,email, password,number FROM login', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results); // Now includes password
  });
});
app.post('/login', (req, res) => {
  const { email, password ,number} = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const sql = 'INSERT INTO login (email, password,number) VALUES (?,?,?)';
  db.query(sql, [email, password,number], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    return res.status(200).json({ message: 'Inserted successfully', result });
  });
});

app.post('/details',(req,res)=>{
  const {orderId,fullname,number,address}=req.body
  const sql='insert into BillingInformation (order_id,full_name,mobile_number,address) values (?,?,?,?)'
  db.query(sql,[orderId,fullname,number,address],(err,result)=>{
    if (err) return res.status(500).json({ error: err.message });
    return res.status(200).json({ message: 'Inserted successfully', result });
  })
})

app.post('/order', (req, res) => {
  const { orderId, number, items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).send("❌ No items provided.");
  }

  const sql = 'INSERT INTO cartitems (item_name, quantity, price, order_id, number) VALUES (?, ?, ?, ?, ?)';

  items.forEach((item, index) => {
    const values = [item.name, item.quantity, item.price, orderId, number];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("❌ DB insert error:", err);
        return res.status(500).send("❌ Failed to insert item");
      }

      // After last item inserted, send response once
      if (index === items.length - 1) {
        res.status(200).send("✅ Cart items inserted successfully.");
      }
    });
  });
});


app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
