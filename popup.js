document.addEventListener('DOMContentLoaded', function () {
    const taskInput = document.getElementById('taskInput');
    const saveButton = document.getElementById('saveButton');
    const listContainer = document.getElementById('listContainer');
    const emptyMessage = document.getElementById('emptyMessage');
    const dateDisplay = document.getElementById('dateDisplay');

    // 1. Ada Date eka lassanata penna hadamu
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('en-US', options);
    dateDisplay.innerText = today;

    // 2. Storage load - Load weddith empty da kiyala check karanawa
    chrome.storage.sync.get(['tasks'], function (result) {
        if (result.tasks && result.tasks.length > 0) {
            result.tasks.forEach(task => addTaskToDOM(task));
            emptyMessage.style.display = 'none';
        } else {
            emptyMessage.style.display = 'block';
        }
    });

    taskInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            saveButton.click();
        }
    });

    saveButton.addEventListener('click', function () {
        const taskValue = taskInput.value.trim();
        if (taskValue !== "") {
            addTaskToDOM(taskValue);
            saveTaskToStorage(taskValue);
            taskInput.value = '';
            emptyMessage.style.display = 'none'; // Task ekak dapu gaman empty msg eka ain karanawa
        }
    });

    function addTaskToDOM(task) {
        const li = document.createElement('li');

        li.style.cssText = `
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            background: #f1f8ff; 
            margin-bottom: 10px; 
            padding: 10px 15px; 
            border-radius: 10px; 
            border-left: 5px solid #3498db;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        `;

        li.innerHTML = `
            <span class="task-text" style="color: #2c3e50; font-size: 14px; flex: 1; font-weight: 500;">${task}</span>
            <div style="display: flex; gap: 8px; align-items: center;">
                <button class="edit-btn" style="background: #f1c40f; color: white; border: none; border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 11px; font-weight: bold; transition: 0.2s;">Edit</button>
                <button class="remove-btn" style="background: #ff7675; color: white; border: none; border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 11px; font-weight: bold; transition: 0.2s;">Remove</button>
            </div>
        `;

        // EDIT FUNCTION
        li.querySelector('.edit-btn').addEventListener('click', function () {
            taskInput.value = task;
            taskInput.focus();
            li.remove();
            removeTaskFromStorage(task);
            checkIfEmpty(); // Edit karala ain weddi list eka check karanawa
        });

        // REMOVE FUNCTION
        li.querySelector('.remove-btn').addEventListener('click', function () {
            li.style.opacity = '0';
            li.style.transform = 'scale(0.95)';
            setTimeout(() => {
                li.remove();
                removeTaskFromStorage(task);
                checkIfEmpty(); // Task eka remove unama list eka check karanawa
            }, 200);
        });

        listContainer.appendChild(li);
    }

    // List eka empty da kiyala check karana podi function ekak
    function checkIfEmpty() {
        if (listContainer.children.length === 0) {
            emptyMessage.style.display = 'block';
        }
    }

    function saveTaskToStorage(task) {
        chrome.storage.sync.get(['tasks'], function (result) {
            let tasks = result.tasks ? [...result.tasks, task] : [task];
            chrome.storage.sync.set({ tasks: tasks });
        });
    }

    function removeTaskFromStorage(taskToRemove) {
        chrome.storage.sync.get(['tasks'], function (result) {
            if (result.tasks) {
                const updatedTasks = result.tasks.filter(t => t !== taskToRemove);
                chrome.storage.sync.set({ tasks: updatedTasks });
            }
        });
    }
});