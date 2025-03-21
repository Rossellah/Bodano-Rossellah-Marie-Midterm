import axios from "axios";
import { useState, useEffect } from "react";
import AddModal from "../components/AddModal";

function Todo() {
  const [titles, setTitles] = useState([]);
  const [doneTasks, setDoneTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetails, setTaskDetails] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLists, setSelectedLists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newList, setNewList] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editingLists, setEditingLists] = useState(false);
  const [editedLists, setEditedLists] = useState({});

  useEffect(() => {
    fetchTasks();
  }, []); // ✅ Refresh when tasks update
  
  const fetchTasks = async () => {
    try {
      const response = await axios.get("http://localhost:3000/get-titles");
      const allTasks = response.data.titles;
  
      const ongoingTasks = allTasks.filter(task => !task.status);
      const doneTasks = allTasks.filter(task => task.status);
  
      setTitles(ongoingTasks);
      setDoneTasks(doneTasks);
    } catch (error) {
      console.error("❌ Error fetching tasks:", error);
    }
  };
  
  

  const fetchLists = async (titleId) => {
    try {
      const response = await axios.get("http://localhost:3000/get-lists");
      const taskLists = response.data.lists.filter(list => list.title_id === titleId);
      setTaskDetails(taskLists);
      setSelectedLists([]);
      console.log("Fetched lists:", taskLists);
    } catch (error) {
      console.error("Error fetching lists:", error);
    }
  };

  const handleTaskClick = async (task) => {
    setSelectedTask(task);
    await fetchLists(task.id);
    setShowDetailsModal(true);
  };

  const handleCheck = async (listId) => {
    const updatedLists = selectedLists.includes(listId)
        ? selectedLists.filter(id => id !== listId) // Uncheck
        : [...selectedLists, listId]; // Check
  
    setSelectedLists(updatedLists);

    // ✅ Move to 'Done' ONLY IF all lists are checked
    if (updatedLists.length === taskDetails.length) {
        console.log("✅ All lists checked! Moving task to 'Done'...");

        try {
            const response = await axios.post(
                `http://localhost:3000/move-to-done/${selectedTask.id}`,
                { status: true }
            );

            if (response.data.success) {
                console.log("🎉 Task successfully moved to 'Done'!");

                // ✅ Update the UI
                setTitles(prev => prev.filter(task => task.id !== selectedTask.id));
                setDoneTasks(prev => [...prev, { ...selectedTask, status: "done" }]);

                fetchTasks(); // Refresh tasks from the backend
                setShowDetailsModal(false); // Close modal
            }
        } catch (error) {
            console.error("❌ Error moving task:", error.response?.data || error.message);
        }
    }
};


  const moveToDone = async (taskId) => {
  try {
    const response = await axios.post(`http://localhost:3000/move-to-done/${taskId}`, { status: "done" });

    if (response.data.success) {
      console.log("🎉 Task moved to Done successfully!");

      // ✅ Move task from Ongoing to Done immediately
      const movedTask = titles.find(task => task.id === taskId);
      if (movedTask) {
        setTitles(prev => prev.filter(task => task.id !== taskId)); // Remove from Ongoing
        setDoneTasks(prev => [...prev, { ...movedTask, status: "done" }]); // Add to Done
      }

      // ✅ Fetch updated tasks to ensure data is accurate
      fetchTasks();
    } else {
      console.error("❌ Failed to move task to Done:", response.data.message);
    }
  } catch (error) {
    console.error("❌ Error moving task:", error.response?.data || error.message);
  }
};

const deleteList = async (listId) => {
  try {
    console.log("Deleting list with ID:", listId); // Debugging log

    const response = await axios.post("http://localhost:3000/delete-lists", {
      listIds: [listId], // Send as an array
    });

    console.log("Delete response:", response.data);

    // Update state to remove the deleted list from UI
    setTaskDetails(taskDetails.filter(item => item.id !== listId));
  } catch (error) {
    console.error("Error deleting list:", error.response?.data || error.message);
  }
};

const handleTitleUpdate = async () => {
  if (!editedTitle.trim()) return;

  try {
    const response = await fetch(`http://localhost:3000/update-title/${selectedTask.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_title: editedTitle }),
    });

    const data = await response.json();
    if (data.success) {
      setShowDetailsModal(false); // Close modal after update
      fetchTasks(); // Refresh the task list
    } else {
      console.error("Failed to update title:", data.message);
    }
  } catch (error) {
    console.error("Error updating title:", error);
  }
};

const updateList = async (listId) => {
  const updatedDesc = editedLists[listId];

  if (!updatedDesc) {
      console.log("⚠️ No changes detected.");
      return;
  }

  console.log(`✅ Updating list ${listId} with:`, updatedDesc); // Debugging log

  try {
      const response = await fetch("http://localhost:3000/update-todo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              title_id: selectedTask.id,
              list_id: listId,
              list_desc: updatedDesc
          }),
      });

      const data = await response.json();
      console.log("📡 Server Response:", data);

      if (data.success) {
          console.log("✅ List updated successfully!");
          setTaskDetails((prev) =>
              prev.map((item) =>
                  item.id === listId ? { ...item, list_desc: updatedDesc } : item
              )
          );
      } else {
          console.error("❌ Error updating list:", data.message);
      }
  } catch (error) {
      console.error("❌ Network error:", error);
  }
};


const addList = async () => {
  if (!newList.trim()) return alert("List description cannot be empty!");

  try {
    const response = await fetch("http://localhost:3000/add-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title_id: selectedTask.id, // The ID of the task
        list_desc: newList, // The new list item text
        status: false, // Default status (unchecked)
      }),
    });

    const data = await response.json();

    if (data.success) {
      setTaskDetails([...taskDetails, { id: data.list_id, list_desc: newList, status: false }]);
      setNewList(""); // Clear input after adding
    } else {
      alert("Failed to add list.");
    }
  } catch (error) {
    console.error("Error adding list:", error);
    alert("An error occurred while adding the list.");
  }
};


  const deleteTitleAndLists = async (titleId) => {
    try {
      await axios.delete(`http://localhost:3000/delete-todo/${titleId}`);
      setShowDetailsModal(false);
      fetchTasks();
    } catch (error) {
      console.error("Error deleting title and lists:", error);
    }
  };


  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-purple-100 via-pink-300 to-purple-300 text-pink-700 font-serif relative overflow-hidden">
    <header className="text-center mb-6">
       <h1 className="text-3xl font-extrabold text-pink-700 bg-white py-2 px-6 rounded-full inline-block shadow-md border-4 border-pink-300">
  To Do List 🎀
</h1>
    </header>
  
    <div className="max-w-3xl mx-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
  {/* Ongoing Tasks */}
<div className="flex-1 bg-white p-4 rounded-2xl shadow-md border-4 border-pink-300 overflow-hidden">
  <h2 className="text-2xl font-bold text-pink-700 mb-4 text-center">Ongoing 🌷</h2>
  <button 
    className="px-3 py-1 bg-pink-500 text-white font-bold rounded-full shadow-md hover:bg-pink-700 transition mb-3 w-auto text-sm"
    onClick={() => setShowModal(true)}
  >
    + Add Task
  </button>

  <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-pink-100 transition-all duration-300 hover:overflow-y-scroll">
    <ul className="space-y-3">
    {titles
  .filter(task => task.status !== "done") // ✅ Ensure only Ongoing tasks are shown
  .map(task => (
    <li key={task.id} 
        className="p-3 bg-pink-50 rounded-xl shadow-sm flex items-center cursor-pointer hover:bg-pink-200 transition"
        onClick={() => handleTaskClick(task)}
    >
      <span className="text-pink-800 flex-1 font-semibold text-sm">{task.title}</span>
    </li>
  ))}

    </ul>
  </div>
</div>
{/* Completed Tasks */}
<div className="flex-1 bg-white p-4 rounded-2xl shadow-md border-4 border-pink-300 overflow-hidden">
    <h2 className="text-2xl font-bold text-pink-700 mb-4 text-center">Done 💐</h2>
    <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-pink-100 transition-all duration-300 hover:overflow-y-scroll">
      <ul className="space-y-3">
        {doneTasks.length > 0 ? (
          doneTasks.map(task => (
            <li key={task.id} className="p-3 bg-pink-100 rounded-xl text-pink-800 text-sm cursor-not-allowed opacity-70">
  {task.title}
</li>

          ))
        ) : (
          <li className="p-3 text-pink-600 text-center font-medium text-sm">No completed tasks yet. 💖</li>
        )}
      </ul>
    </div>
  </div>
</div> 
      {/* Add Task Modal */}
      {showModal && <AddModal hide={() => { setShowModal(false); fetchTasks(); }} />}

{/* Task Details Modal */}
{showDetailsModal && selectedTask && (
  <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-opacity-60 p-3">
    <div className="bg-gradient-to-br from-purple-50 via-pink-200 to-purple-100 p-5 rounded-2xl shadow-2xl w-full max-w-[360px] sm:max-w-[400px] border-4 border-pink-400">
      
      {/* ✅ Editable Title Section */}
      <div className="mb-4 flex items-center justify-between">
        {editingTitle ? (
          <input
            type="text"
            className="text-2xl font-bold text-pink-800 bg-transparent border border-pink-400 px-2 py-1 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-pink-500 w-full"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
          />
        ) : (
          <h2
            className="text-2xl font-bold text-pink-800 font-serif text-center w-full cursor-pointer"
            onClick={() => {
              setEditingTitle(true);
              setEditingLists(true); // Enable list editing too
            }}
          >
            {selectedTask.title || "Task Details"}
          </h2>
        )}

        {editingTitle ? (
          <div className="flex space-x-2">
            <button
              className="px-2 py-1 bg-pink-500 text-white rounded-full text-xs font-bold shadow-md hover:bg-pink-600 transition"
              onClick={handleTitleUpdate}
            >
              ✅
            </button>
            <button
              className="px-2 py-1 bg-gray-400 text-white rounded-full text-xs font-bold shadow-md hover:bg-gray-500 transition"
              onClick={() => {
                setEditingTitle(false);
                setEditingLists(false); // Disable list editing
                setEditedTitle(selectedTask.title);
              }}
            >
              ❌
            </button>
          </div>
        ) : (
          <button
            className="ml-2 px-3 py-2 bg-pink-500 text-white rounded-full text-xs font-bold shadow-md hover:bg-pink-600 transition"
            onClick={() => {
              setEditingTitle(true);
              setEditingLists(true); // Enable list editing too
            }}
          >
            EDIT
          </button>
        )}
      </div>

      {/* ✅ Editable Lists (Pink + Purple Alternating) */}
<ul className="space-y-2 max-h-48 overflow-y-auto p-2 bg-white rounded-lg">
  {taskDetails.length > 0 ? (
    taskDetails.map((item, index) => (
      <li 
        key={item.id} 
        className={`flex items-center justify-between p-2 rounded-lg shadow-sm transition ${
          index % 2 === 0 ? 'bg-gradient-to-br from-purple-100 via-pink-300 to-purple-100' : 'bg-gradient-to-br from-pink-100 via-purple-300 to-pink-100'
        }`}
      >
        <input 
          type="checkbox" 
          className="mr-2 w-4 h-4 accent-purple-500 cursor-pointer" 
          checked={selectedLists.includes(item.id)} 
          onChange={() => handleCheck(item.id)}
        />

        {editingLists ? (
          <input
            type="text"
            className="text-purple-800 font-medium text-sm flex-1 bg-transparent border border-pink-400 px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={editedLists[item.id] || item.list_desc}
            onChange={(e) =>
              setEditedLists((prev) => ({
                ...prev,
                [item.id]: e.target.value,
              }))
            }
          />
        ) : (
          <span className="text-purple-800 font-medium text-sm flex-1">
            {item.list_desc}
          </span>
        )}

        {editingLists && (
          <button 
            className="ml-2 p-2 bg-pink-400 text-white rounded-full text-xs font-bold shadow-md hover:bg-pink-600 transition"
            onClick={() => updateList(item.id)}
          >
            ✅
          </button>
        )}

        <button 
          className="ml-2 p-2 bg-purple-500 text-white rounded-full text-xs font-bold shadow-md hover:bg-purple-700 transition"
          onClick={() => deleteList(item.id)}
        >
          🗑
        </button>
      </li>
    ))
  ) : (
    <li className="text-pink-600 text-center font-semibold text-sm">No details found for this task. 💕</li>
  )}
</ul>


      {/* ✅ Add New List Input & Button */}
      <div className="flex items-center gap-2 mt-3">
        <input
          type="text"
          className="flex-1 p-2 border border-pink-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-400"
          placeholder="Add a new list..."
          value={newList}
          onChange={(e) => setNewList(e.target.value)}
        />
        <button
          className="p-2 bg-purple-300 text-white rounded-lg text-xs font-bold shadow-md hover:bg-purple-600 transition"
          onClick={addList}
        >
          ➕
        </button>
      </div>

      {/* ✅ Action Buttons */}
      <div className="mt-4 flex justify-between">
        <button 
          className="px-3 py-2 text-xs bg-pink-400 text-white rounded-full font-bold shadow-md hover:bg-pink-500 transition" 
          onClick={() => deleteTitleAndLists(selectedTask.id)}
        >
         DELETE TITLE & LISTS🚮
        </button>

        <button 
          className="px-3 py-2 text-xs bg-purple-400 text-white rounded-full font-bold shadow-md hover:bg-purple-500 transition" 
          onClick={() => setShowDetailsModal(false)}
        >
          EXIT❌
        </button>
     
    
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default Todo;
