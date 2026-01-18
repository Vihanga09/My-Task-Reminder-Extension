document.addEventListener('DOMContentLoaded', function () {
    const taskInput = document.getElementById('taskInput');
    const saveButton = document.getElementById('saveButton');
    const listContainer = document.getElementById('listContainer');

    // 1. Storage eken parana tasks tika load karala screen ekata danna
    chrome.storage.sync.get(['tasks'], function (result) {
        if (result.tasks && Array.isArray(result.tasks)) {
            result.tasks.forEach(task => addTaskToDOM(task));
        }
    });

    // 2. Add Button eka click karama wena de
    saveButton.addEventListener('click', function () {
        const taskValue = taskInput.value.trim();

        if (taskValue !== "") {
            addTaskToDOM(taskValue);
            saveTaskToStorage(taskValue);
            taskInput.value = ''; // Input box eka clear karanawa
            taskInput.focus();     // Ayeth input ekata focus karanawa
        } else {
            alert("Please enter a task!");
        }
    });

    // 3. UI ekata (Screen ekata) task ekak lassanata ekathu karana hati
    function addTaskToDOM(task) {
        const li = document.createElement('li');

        li.innerHTML = `
            <span class="task-text">${task}</span>
            <button class="remove-btn">Remove</button>
        `;

        // Remove button eka click kalama storage eken saha screen eken ain kirima
        li.querySelector('.remove-btn').addEventListener('click', function () {
            li.style.opacity = '0';
            li.style.transform = 'translateX(20px)';
            setTimeout(() => {
                li.remove();
                removeTaskFromStorage(task);
            }, 200);
        });

        listContainer.appendChild(li);
    }

    // 4. Chrome Storage ekata task eka save kirima
    function saveTaskToStorage(task) {
        chrome.storage.sync.get(['tasks'], function (result) {
            let tasks = result.tasks ? [...result.tasks, task] : [task];
            chrome.storage.sync.set({ tasks: tasks }, function () {
                console.log('Task saved successfully!');
            });
        });
    }

    // 5. Chrome Storage eken task eka ain kirima
    function removeTaskFromStorage(taskToRemove) {
        chrome.storage.sync.get(['tasks'], function (result) {
            if (result.tasks) {
                const updatedTasks = result.tasks.filter(t => t !== taskToRemove);
                chrome.storage.sync.set({ tasks: updatedTasks });
            }
        });
    }
});
