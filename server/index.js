import express from 'express';
import { db } from './db.js';
import bodyParser from "body-parser";
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json()); // Enable JSON parsing

const PORT = 3000; // Set to 3000 for consistency

// ✅ GET: Fetch Users
app.get('/get-users', (req, res) => {
    const query = "SELECT * FROM users";
    db.query(query)
        .then(result => res.status(200).json({ users: result.rows }))
        .catch(err => res.status(500).json({ error: "Database error", details: err.message }));
});


  

// ✅ GET: Fetch Titles
app.get('/get-titles', (req, res) => {
    const query = "SELECT * FROM titles";
    db.query(query)
        .then(result => res.status(200).json({ titles: result.rows }))
        .catch(err => res.status(500).json({ error: "Database error", details: err.message }));
});


// ✅ GET: Fetch Lists
app.get('/get-lists', (req, res)=> {
    const query = "SELECT * FROM lists";
    db.query(query)
    .then(lists  => {
        res.status(200).json({ lists: lists.rows});
  })
});

// ✅ POST: Check User Login
app.post('/check-user', (req, res)=> {
    const { username, password } = req.body;

    const query = "SELECT * FROM users WHERE username =$1 AND password =$2";

    db.query(query, [username, password])
    .then(result => {
        if(result.rowCount > 0 ) {
            res.status(200).json({ exist: true });
        }

        else {
            res.status(200).json({ exist: false,  message: "Invalid username and password" });
        }
 }
    )
});



// ✅ POST: Register New User
app.post('/register', async (req, res) => {
    const { username, password, fname, lname } = req.body;

    try {
        const query = "INSERT INTO users (username, password, fname, lname) VALUES ($1, $2, $3, $4)";
        await db.query(query, [username, password, fname, lname]);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ success: false, message: "User registration failed." });
    }
});



// ✅ POST: Add To-Do
app.post('/add-to-do', (req, res) => {
    const { username, title, lists, status = false } = req.body;

    if (!(username && title && Array.isArray(lists) && lists.length)) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const titleQuery = "INSERT INTO titles (username, title, date_modified, status) VALUES ($1, $2, TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), $3) RETURNING id";
    const titleValues = [username, title, Boolean(status)];

    db.query(titleQuery, titleValues)
    .then(result => {
        const title_id = result.rows[0].id;
        const listValues = lists.map(list => [title_id, list, Boolean(status)]);
        return Promise.all(listValues.map(values => db.query("INSERT INTO lists (title_id, list_desc, status) VALUES ($1, $2, $3)", values)));
    })
    .then(() => res.json({ success: true, message: "To-Do item and Title added successfully!" }))
    .catch(error => {
        console.error("Database error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    });
});

app.post('/add-list', async (req, res) => {
    const { title_id, list_desc, status } = req.body;

    if (!title_id || !list_desc) {
        return res.status(400).json({ success: false, message: "Task ID and List description are required." });
    }

    try {
        const result = await db.query(
            "INSERT INTO lists (title_id, list_desc, status) VALUES ($1, $2, $3) RETURNING id",
            [title_id, list_desc, status]
        );

        res.json({ success: true, message: "List added successfully!", list_id: result.rows[0].id });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});


app.get("/done-tasks", async (req, res) => {
    try {
      // Fetch completed tasks
      const tasksResult = await db.query("SELECT * FROM titles WHERE status = true");
      const tasks = tasksResult.rows;
  
      // Fetch lists related to these completed tasks
      const listsResult = await db.query("SELECT * FROM lists");
      const lists = listsResult.rows;
  
      // Debugging: Log results
      console.log("✅ Fetched Tasks:", tasks);
      console.log("✅ Fetched Lists:", lists);
  
      // Attach lists to their respective tasks
      const formattedTasks = tasks.map(task => ({
        ...task,
        lists: lists.filter(list => list.title_id === task.id), // Linking lists to their tasks
      }));
  
      console.log("✅ Final Processed Tasks:", formattedTasks); // Check if lists are linked
  
      res.json({ success: true, tasks: formattedTasks });
    } catch (error) {
      console.error("❌ Error fetching completed tasks:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });
  



// ✅ POST: Delete To-Do
app.delete('/delete-todo/:titleId', (req, res) => {
    const { titleId } = req.params;
    if (!titleId) {
        return res.status(400).json({ success: false, message: "Title ID is required." });
    }

    db.query("DELETE FROM lists WHERE title_id = $1", [titleId])
    .then(() => db.query("DELETE FROM titles WHERE id = $1", [titleId]))
    .then(() => res.json({ success: true, message: "Task and lists deleted successfully!" }))
    .catch(error => {
        console.error("Database error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    });
});


app.post('/delete-lists', (req, res) => {
    const { listIds } = req.body; // Expecting an array of list IDs
    if (!listIds || listIds.length === 0) {
        return res.status(400).json({ success: false, message: "List IDs are required." });
    }

    db.query("DELETE FROM lists WHERE id = ANY($1)", [listIds])
    .then(() => res.json({ success: true, message: "Selected lists deleted successfully!" }))
    .catch(error => {
        console.error("Database error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    });
});



// ✅ POST: Update Status
app.post('/update-status', async (req, res) => {
    const { title_id, list_id, status } = req.body;

    if (!title_id || !list_id || typeof status !== "boolean") {
        return res.status(400).json({ success: false, message: "Invalid input." });
    }

    try {
        const result = await db.query("UPDATE lists SET status = $1 WHERE title_id = $2 AND id = $3", [status, title_id, list_id]);
        res.json(result.rowCount ? { success: true, message: "Status updated successfully!" } : { success: false, message: "No matching record found." });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

// ✅ POST: Update To-Do
app.post('/update-todo', async (req, res) => {
    const { title_id, list_id, list_desc } = req.body;  // Accept list_id for updates

    if (!title_id || !list_id || !list_desc) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    try {
        await db.query(
            "UPDATE lists SET list_desc = $1 WHERE id = $2 AND title_id = $3",
            [list_desc, list_id, title_id]
        );

        res.json({ success: true, message: "List updated successfully!" });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

app.post("/update-title/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { new_title } = req.body;
  
      if (!new_title) {
        return res.status(400).json({ success: false, message: "Title is required." });
      }
  
      // ✅ PostgreSQL Query
      const query = "UPDATE titles SET title = $1 WHERE id = $2 RETURNING *";
      const values = [new_title, id];
  
      const result = await db.query(query, values);
  
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: "Title not found." });
      }
  
      res.json({ success: true, message: "Title updated successfully." });
  
    } catch (error) {
      console.error("Error updating title:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });
  
app.post('/move-to-done/:id', async (req, res) => {
    const titleId = req.params.id; // The title_id
    const { status } = req.body; // Should be true (Done)

    try {
        // ✅ Step 1: Update the list status
        await db.query(
            "UPDATE lists SET status = $1 WHERE title_id = $2",
            [status === true, titleId]
        );

        // ✅ Step 2: Check if all lists under this title are done
        const result = await db.query(
            "SELECT COUNT(*) AS remaining FROM lists WHERE title_id = $1 AND status = false",
            [titleId]
        );

        const remaining = parseInt(result.rows[0].remaining);

        if (remaining === 0) {
            // ✅ Step 3: If no lists are pending, update the title to Done
            await db.query(
                "UPDATE titles SET status = true WHERE id = $1",
                [titleId]
            );

            console.log(`📢 Title ID ${titleId} moved to Done!`);
        }

        res.json({ success: true, message: "Task and related lists updated successfully!" });
    } catch (error) {
        console.error("❌ Error updating task:", error);
        res.status(500).json({ success: false, message: "Failed to update task" });
    }
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
