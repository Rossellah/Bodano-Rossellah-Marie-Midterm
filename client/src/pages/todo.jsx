import axios from "axios";
import { useState, useEffect } from "react";
import AddModal from "../components/AddModal";
import { FaCheck, FaTimes, FaEdit, FaPlus, FaTrash, FaCheckCircle  } from "react-icons/fa";


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
  const [taskLists, setTaskLists] = useState([]);
  const [showCompletedTaskModal, setShowCompletedTaskModal] = useState(false);

  

  useEffect(() => {
    fetchTasks();
  }, []); 
  
  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_ENDPOINT_URL}/get-titles`);
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
      const response = await axios.get(`${process.env.REACT_APP_ENDPOINT_URL}/get-lists`);
      console.log(response.data.lists); 
      const taskLists = response.data.lists.filter(list => list.title_id === titleId);
      console.log("Filtered task lists:", taskLists); 
      setTaskDetails(taskLists); 
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
        ? selectedLists.filter(id => id !== listId) 
        : [...selectedLists, listId]; 
  
    setSelectedLists(updatedLists);

    if (updatedLists.length === taskDetails.length) {
        console.log("✅ All lists checked! Moving task to 'Done'...");

        try {
            const response = await axios.post(
              `${process.env.REACT_APP_ENDPOINT_URL}/move-to-done/${selectedTask.id}`,
                { status: true }
            );

            if (response.data.success) {
                console.log("🎉 Task successfully moved to 'Done'!");

                setTitles(prev => prev.filter(task => task.id !== selectedTask.id));
                setDoneTasks(prev => [...prev, { ...selectedTask, status: "done" }]);

                fetchTasks(); 
                setShowDetailsModal(false); 
            }
        } catch (error) {
            console.error("❌ Error moving task:", error.response?.data || error.message);
        }
    }
};


const deleteList = async (listId) => {
  try {
    console.log("Deleting list with ID:", listId); 

    const response = await axios.post(`${process.env.REACT_APP_ENDPOINT_URL}/delete-lists`, {
      listIds: [listId], 
    });

    console.log("Delete response:", response.data);

    setTaskDetails(taskDetails.filter(item => item.id !== listId));
  } catch (error) {
    console.error("Error deleting list:", error.response?.data || error.message);
  }
};

const handleTitleUpdate = async () => {
  if (!editedTitle.trim()) return;

  try {
    const response = await fetch(`${process.env.REACT_APP_ENDPOINT_URL}/${selectedTask.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_title: editedTitle }),
    });

    const data = await response.json();
    if (data.success) {
      setShowDetailsModal(false); 
      fetchTasks(); 
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

  console.log(`✅ Updating list ${listId} with:`, updatedDesc); 

  try {
      const response = await fetch(`${process.env.REACT_APP_ENDPOINT_URL}/update-todo`, {
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
    const response = await fetch(`${process.env.REACT_APP_ENDPOINT_URL}/add-list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title_id: selectedTask.id, 
        list_desc: newList, 
        status: false, 
      }),
    });

    const data = await response.json();

    if (data.success) {
      setTaskDetails([...taskDetails, { id: data.list_id, list_desc: newList, status: false }]);
      setNewList(""); 
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
      await axios.delete(`${process.env.REACT_APP_ENDPOINT_URL}/delete-todo/${titleId}`);
      setShowDetailsModal(false);
      fetchTasks();
    } catch (error) {
      console.error("Error deleting title and lists:", error);
    }
  };



const handleCompletedTaskClick = async (task) => {
  setSelectedTask(task); 
  await fetchLists(task.id); 
  setShowCompletedTaskModal(true); 
};



  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-purple-200 via-pink-300 to-purple-400 text-pink-700 font-serif relative overflow-hidden">
    <header className="text-center mb-6">
       <h1 className="text-3xl font-extrabold text-pink-700 bg-white py-2 px-6 rounded-full inline-block shadow-md border-4 border-pink-300">
  To Do List 🎀
</h1>
    </header>
  
    <div className="max-w-3xl mx-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
  {/* Ongoing Tasks */}
  <div className="flex-1 bg-gradient-to-br from-purple-50 via-pink-100 to-purple-200 p-6 rounded-3xl shadow-xl border-4 border-[#ff99b4] overflow-hidden">
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
  .filter(task => task.status !== "done")
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
<div className="flex-1 bg-gradient-to-br from-purple-50 via-pink-100 to-purple-200 p-6 rounded-3xl shadow-xl border-4 border-[#ff99b4] overflow-hidden">
  <h2 className="text-2xl font-bold text-pink-700 mb-4 text-center">Done 💐</h2>
  <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-pink-100 transition-all duration-300 hover:overflow-y-scroll">
    <ul className="space-y-3">
      {doneTasks.length > 0 ? (
        doneTasks.map((task) => (
          <li
            key={task.id}
            className="p-3 bg-pink-200 rounded-xl text-pink-800 text-sm opacity-70 flex justify-between items-center cursor-pointer"
            onClick={() => handleCompletedTaskClick(task)} 
          >
            <span>{task.title}</span>
          </li>
        ))
      ) : (
        <li className="p-3 text-pink-600 text-center font-medium text-sm">
          No completed tasks yet. 💖
        </li>
      )}
    </ul>
  </div>
</div>
</div>
      {showCompletedTaskModal && selectedTask && (
  <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-opacity-50 p-4">
    <div className="bg-gradient-to-br from-purple-50 via-pink-100 to-purple-200 p-6 rounded-3xl shadow-xl w-full max-w-[380px] sm:max-w-[420px] border-4 border-[#ff99b4]">
      
      {/* Title Section */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#b00050] font-serif text-center w-full">
          {selectedTask.title || "Task Details"}
        </h2>

       
        {/* Exit Button to Close Modal */}
        <button
          className="ml-2 p-2 bg-gray-400 text-white rounded-full text-xs font-bold shadow-md hover:bg-gray-500 transition"
          onClick={() => setShowCompletedTaskModal(false)}
        >
          <FaTimes />
        </button>
      </div>

      {/* Task Lists */}
      <ul className="space-y-2 max-h-48 overflow-y-auto p-3 bg-white rounded-lg">
        {taskDetails.length > 0 ? (
          taskDetails.map((item, index) => (
            <li key={item.id} className={`flex items-center justify-between p-2 rounded-lg shadow-sm transition ${index % 2 === 0 ? 'bg-gradient-to-br from-[#ffd6e8] via-[#ffb3c9] to-[#ff99b4]' : 'bg-gradient-to-br from-[#ffb3c9] via-[#ff99b4] to-[#ff80a5]'}`}>
              
              {/* Checkmark icon */}
              <span className="mr-2 text-[#ff4d79]">
                <FaCheckCircle />
              </span>

              <span className="text-[#b00050] font-medium text-sm flex-1">
                {item.list_desc}
              </span>
            </li>
          ))
        ) : (
          <li className="text-[#ff4d79] text-center font-semibold text-sm">No details found for this task. 💕</li>
        )}
      </ul>

    </div>
  </div>
)}



      {/* Add Task Modal */}
      {showModal && <AddModal hide={() => { setShowModal(false); fetchTasks(); }} />}


      {showDetailsModal && selectedTask && (
  <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-opacity-50 p-4">
    <div className="bg-gradient-to-br from-purple-50 via-pink-100 to-purple-200 p-6 rounded-3xl shadow-xl w-full max-w-[380px] sm:max-w-[420px] border-4 border-[#ff99b4]">
      
      {/* ✅ Editable Title Section */}
      <div className="mb-4 flex items-center justify-between">
        {editingTitle ? (
          <input
            type="text"
            className="text-2xl font-bold text-[#b00050] bg-transparent border border-[#ffb3c9] px-3 py-1 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[#ff99b4] w-full"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
          />
        ) : (
          <h2
            className="text-2xl font-bold text-[#b00050] font-serif text-center w-full cursor-pointer"
            onClick={() => {
              setEditingTitle(true);
              setEditingLists(true);
            }}
          >
            {selectedTask.title || "Task Details"}
          </h2>
        )}

        {editingTitle ? (
          <div className="flex space-x-2">
            <button
              className="p-2 bg-[#ff99b4] text-white rounded-full text-xs font-bold shadow-md hover:bg-[#ff80a5] transition"
              onClick={handleTitleUpdate}
            >
              <FaCheck />
            </button>
            <button
              className="p-2 bg-gray-400 text-white rounded-full text-xs font-bold shadow-md hover:bg-gray-500 transition"
              onClick={() => {
                setEditingTitle(false);
                setEditingLists(false);
                setEditedTitle(selectedTask.title);
              }}
            >
              <FaTimes />
            </button>
          </div>
        ) : (
          <button
            className="ml-2 p-2 bg-[#ff99b4] text-white rounded-full text-xs font-bold shadow-md hover:bg-[#ff80a5] transition"
            onClick={() => {
              setEditingTitle(true);
              setEditingLists(true);
            }}
          >
            <FaEdit />
          </button>
        )}
      </div>

      {/* ✅ Editable Lists */}
      <ul className="space-y-2 max-h-48 overflow-y-auto p-3 bg-white rounded-lg">
        {taskDetails.length > 0 ? (
          taskDetails.map((item, index) => (
            <li key={item.id} className={`flex items-center justify-between p-2 rounded-lg shadow-sm transition ${
              index % 2 === 0 ? 'bg-gradient-to-br from-[#ffd6e8] via-[#ffb3c9] to-[#ff99b4]' : 'bg-gradient-to-br from-[#ffb3c9] via-[#ff99b4] to-[#ff80a5]'}`}
            >
              <input 
                type="checkbox" 
                className="mr-2 w-4 h-4 accent-[#ff4d79] cursor-pointer" 
                checked={selectedLists.includes(item.id)} 
                onChange={() => handleCheck(item.id)}
              />
              {editingLists ? (
                <input
                  type="text"
                  className="text-[#b00050] font-medium text-sm flex-1 bg-transparent border border-[#ffb3c9] px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff4d79]"
                  value={editedLists[item.id] !== undefined ? editedLists[item.id] : item.list_desc}
                  onChange={(e) =>
                    setEditedLists((prev) => ({
                      ...prev,
                      [item.id]: e.target.value,
                    }))
                  }
                />
              ) : (
                <span className="text-[#b00050] font-medium text-sm flex-1">
                  {item.list_desc}
                </span>
              )}

              {editingLists && (
                <button 
                  className="ml-2 p-2 bg-[#ffb3c9] text-white rounded-full text-xs font-bold shadow-md hover:bg-[#ff99b4] transition"
                  onClick={() => updateList(item.id)}
                >
                  <FaCheck />
                </button>
              )}

              <button 
                className="ml-2 p-2 bg-[#ff4d79] text-white rounded-full text-xs font-bold shadow-md hover:bg-[#e60050] transition"
                onClick={() => deleteList(item.id)}
              >
                <FaTrash />
              </button>
            </li>
          ))
        ) : (
          <li className="text-[#ff4d79] text-center font-semibold text-sm">No details found for this task. 💕</li>
        )}
      </ul>

      {/*  Add New List Input & Button */}
      <div className="flex items-center gap-2 mt-3">
        <input
          type="text"
          className="flex-1 p-2 border border-[#ffb3c9] rounded-lg text-sm focus:ring-2 focus:ring-[#ff4d79]"
          placeholder="Add a new list..."
          value={newList}
          onChange={(e) => setNewList(e.target.value)}
        />
        <button
          className="p-2 bg-[#ffb3c9] text-white rounded-lg text-xs font-bold shadow-md hover:bg-[#ff99b4] transition"
          onClick={addList}
        >
          <FaPlus />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex justify-between">
        <button 
          className="px-3 py-2 text-xs bg-[#ff99b4] text-white rounded-full font-bold shadow-md hover:bg-[#ff80a5] transition" 
          onClick={() => deleteTitleAndLists(selectedTask.id)}
        >
          <FaTrash />
        </button>

        <button 
          className="px-3 py-2 text-xs bg-[#b00050] text-white rounded-full font-bold shadow-md hover:bg-[#800033] transition" 
          onClick={() => setShowDetailsModal(false)}
        >
          <FaTimes /> 
        </button>
      </div>
    </div>
  </div>
)}



    </div>
  );
}

export default Todo;
