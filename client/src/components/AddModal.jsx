import { useState } from "react";

export default function AddModal({ hide }) {
    const [username, setUsername] = useState("");
    const [title, setTitle] = useState("");
    const [tasks, setTasks] = useState([""]);
    const [loading, setLoading] = useState(false);

    const addTask = () => setTasks([...tasks, ""]);
    const removeTask = (index) => setTasks(tasks.filter((_, i) => i !== index));

    const handleSubmit = async () => {
        if (!username.trim() || !title.trim() || tasks.every(task => !task.trim())) {
            alert("⚠️ Please fill in all fields.");
            return;
        }

        setLoading(true);
        console.log("🟡 Submitting:", { username, title, tasks });

        try {
            const response = await fetch("http://localhost:3000/add-to-do", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, title, lists: tasks, status: false }),
            });

            const result = await response.json();
            console.log("🟢 Response:", result);

            if (!response.ok) throw new Error(result.message || "Failed to add task.");
            
            alert("✅ Task added successfully!");
            setTitle("");
            setTasks([""]);
            setUsername("");
            hide();
        } catch (error) {
            console.error("❌ Error:", error);
            alert(`⚠️ ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm  bg-opacity-70">
            <div className="relative w-full max-w-sm p-5 bg-white rounded-2xl shadow-lg border-4 border-pink-300">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-pink-700 text-center flex-1">Add Task ✨</h3>
                    <button onClick={hide} className="text-pink-500 hover:text-pink-700 text-lg">✖</button>
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-pink-700">Username</label>
                    <input
                        type="text"
                        className="w-full p-2 border-2 border-pink-300 rounded-lg shadow-sm focus:ring-2 focus:ring-pink-500 text-sm"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>

                <div className="space-y-3 mt-2">
                    <label className="block text-sm font-semibold text-pink-700">Task Title</label>
                    <input
                        type="text"
                        className="w-full p-2 border-2 border-pink-300 rounded-lg shadow-sm focus:ring-2 focus:ring-pink-500 text-sm"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div className="mt-2">
                    <label className="block text-sm font-semibold text-pink-700">Task List</label>
                    <div className="space-y-2">
                        {tasks.map((task, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    className="p-2 border-2 border-pink-300 rounded-lg w-full text-sm"
                                    placeholder={`Task ${index + 1}`}
                                    value={task}
                                    onChange={(e) => {
                                        const newTasks = [...tasks];
                                        newTasks[index] = e.target.value;
                                        setTasks(newTasks);
                                    }}
                                />
                                {tasks.length > 1 && (
                                    <button 
                                        onClick={() => removeTask(index)}
                                        className="px-2 py-1 bg-red-400 text-white rounded-lg text-xs hover:bg-red-500"
                                    >
                                        ✖
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between mt-4">
                    <button 
                        onClick={addTask} 
                        className="px-3 py-2 bg-pink-500 text-white rounded-lg text-sm shadow-md hover:bg-pink-600"
                    >
                        + Add Task
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        className={`px-4 py-2 text-white rounded-lg text-sm shadow-md ${loading ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"}`}
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Submit"}
                    </button>
                </div>
            </div>
        </div>
    );
}
