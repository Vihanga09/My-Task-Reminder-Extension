document.addEventListener('DOMContentLoaded', function () {
    const taskInput = document.getElementById('taskInput');
    const saveButton = document.getElementById('saveButton');
    const listContainer = document.getElementById('listContainer');

    // 1. Load tasks from Storage
    chrome.storage.sync.get(['tasks'], function (result) {
        if (result.tasks) {
            result.tasks.forEach(task => addTaskToDOM(task));
        }
    });

    // 2. Button click event (No more onclick in HTML)
    saveButton.addEventListener('click', function () {
        const taskValue = taskInput.value;
        if (taskValue.trim() !== "") {
            addTaskToDOM(taskValue);
            saveTaskToStorage(taskValue);
            taskInput.value = '';
        } else {
            alert("Poddak inna! Task ekak type karanna.");
        }
    });

    // 3. UI ekata list item ekak add kirima
    function addTaskToDOM(task) {
        const li = document.createElement('li');
        li.textContent = task;
        listContainer.appendChild(li);
    }

    // 4. Storage ekata save kirima
    function saveTaskToStorage(task) {
        chrome.storage.sync.get(['tasks'], function (result) {
            const tasks = result.tasks ? [...result.tasks, task] : [task];
            chrome.storage.sync.set({ tasks: tasks });
        });
    }
});