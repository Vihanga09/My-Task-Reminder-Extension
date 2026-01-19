document.addEventListener('DOMContentLoaded', function () {
    const taskInput = document.getElementById('taskInput');
    const saveButton = document.getElementById('saveButton');
    const listContainer = document.getElementById('listContainer');

    // 1. Storage load
    chrome.storage.sync.get(['tasks'], function (result) {
        if (result.tasks) {
            result.tasks.forEach(task => addTaskToDOM(task));
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
        }
    });

    function addTaskToDOM(task) {
        const li = document.createElement('li');

        // LI structure 
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
                <button class="edit-btn" style="
                    background: #f1c40f; 
                    color: white; 
                    border: none; 
                    border-radius: 6px; 
                    padding: 6px 12px; 
                    cursor: pointer; 
                    font-size: 11px; 
                    font-weight: bold;
                    transition: 0.2s;
                ">Edit</button>
                <button class="remove-btn" style="
                    background: #ff7675; 
                    color: white; 
                    border: none; 
                    border-radius: 6px; 
                    padding: 6px 12px; 
                    cursor: pointer; 
                    font-size: 11px; 
                    font-weight: bold;
                    transition: 0.2s;
                ">Remove</button>
            </div>
        `;

        // EDIT FUNCTION
        li.querySelector('.edit-btn').addEventListener('click', function () {
            taskInput.value = task;
            taskInput.focus();
            li.remove();
            removeTaskFromStorage(task);
        });

        // REMOVE FUNCTION
        li.querySelector('.remove-btn').addEventListener('click', function () {
            li.style.opacity = '0';
            li.style.transform = 'scale(0.95)';
            setTimeout(() => {
                li.remove();
                removeTaskFromStorage(task);
            }, 200);
        });

        listContainer.appendChild(li);
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
