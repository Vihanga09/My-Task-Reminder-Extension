document.addEventListener('DOMContentLoaded', function () {
    const taskInput = document.getElementById('taskInput');
    const saveButton = document.getElementById('saveButton');
    const listContainer = document.getElementById('listContainer');
    const emptyMessage = document.getElementById('emptyMessage');
    const dateDisplay = document.getElementById('dateDisplay');
    const taskCount = document.getElementById('taskCount');
    const clearAllBtn = document.getElementById('clearAll'); // New Clear Button

    const dingSound = new Audio('ding.mp3');

    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    dateDisplay.innerText = new Date().toLocaleDateString('en-US', options);

    function updateUI() {
        const count = listContainer.children.length;
        taskCount.innerText = `Tasks: ${count}`;
        emptyMessage.style.display = (count === 0) ? 'block' : 'none';
    }

    // Load tasks from storage
    chrome.storage.sync.get(['tasks'], function (result) {
        if (result.tasks) {
            result.tasks.forEach(taskObj => addTaskToDOM(taskObj.text, taskObj.completed));
        }
        updateUI();
    });

    saveButton.addEventListener('click', function () {
        const taskVal = taskInput.value.trim();
        if (taskVal) {
            const taskObj = { text: taskVal, completed: false };
            addTaskToDOM(taskObj.text, taskObj.completed);
            saveTask(taskObj);
            taskInput.value = '';
            updateUI();
        }
    });

    function addTaskToDOM(text, completed = false) {
        const li = document.createElement('li');
        
        // Checkbox creation
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = completed;
        checkbox.className = 'task-checkbox';

        const span = document.createElement('span');
        span.className = 'task-text';
        span.innerText = text;
        
        if (completed) {
            span.style.textDecoration = 'line-through';
            span.style.opacity = '0.5';
        }

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerText = 'Remove';

        checkbox.addEventListener('change', function() {
            if (checkbox.checked) {
                span.style.textDecoration = 'line-through';
                span.style.opacity = '0.5';
                dingSound.play();
            } else {
                span.style.textDecoration = 'none';
                span.style.opacity = '1';
            }
            updateTaskStatus(text, checkbox.checked);
        });

        // Remove with Slide Animation
        removeBtn.addEventListener('click', () => {
            li.style.transform = 'translateX(20px)'; // Slide right
            li.style.opacity = '0';
            li.style.transition = '0.3s ease';
            
            setTimeout(() => {
                li.remove();
                removeTask(text);
                updateUI();
            }, 300);
        });

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(removeBtn);
        listContainer.appendChild(li);
    }

    // Function to clear only completed tasks
    clearAllBtn.addEventListener('click', () => {
        chrome.storage.sync.get(['tasks'], (result) => {
            if (result.tasks) {
                // Keep only tasks that are NOT completed
                const remainingTasks = result.tasks.filter(t => !t.completed);
                chrome.storage.sync.set({ tasks: remainingTasks }, () => {
                    // Reload the UI to show only remaining tasks
                    window.location.reload();
                });
            }
        });
    });

    function saveTask(taskObj) {
        chrome.storage.sync.get(['tasks'], r => {
            const ts = r.tasks ? [...r.tasks, taskObj] : [taskObj];
            chrome.storage.sync.set({ tasks: ts });
        });
    }

    function updateTaskStatus(text, isCompleted) {
        chrome.storage.sync.get(['tasks'], r => {
            if (r.tasks) {
                const updatedTasks = r.tasks.map(t => {
                    if (t.text === text) return { ...t, completed: isCompleted };
                    return t;
                });
                chrome.storage.sync.set({ tasks: updatedTasks });
            }
        });
    }

    function removeTask(text) {
        chrome.storage.sync.get(['tasks'], r => {
            if (r.tasks) {
                chrome.storage.sync.set({ tasks: r.tasks.filter(x => x.text !== text) });
            }
        });
    }
});