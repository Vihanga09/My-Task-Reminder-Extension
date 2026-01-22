document.addEventListener('DOMContentLoaded', function () {
    const taskInput = document.getElementById('taskInput');
    const saveButton = document.getElementById('saveButton');
    const listContainer = document.getElementById('listContainer');
    const emptyMessage = document.getElementById('emptyMessage');
    const dateDisplay = document.getElementById('dateDisplay');
    const taskCount = document.getElementById('taskCount');

    const dingSound = new Audio('ding.mp3');

    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    dateDisplay.innerText = new Date().toLocaleDateString('en-US', options);

    function updateUI() {
        const count = listContainer.children.length;
        taskCount.innerText = `Tasks: ${count}`;
        emptyMessage.style.display = (count === 0) ? 'block' : 'none';
    }

    // Load tasks from storage (Tasks are now objects: {text, completed})
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
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.gap = '10px';

        // Create checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = completed;
        checkbox.className = 'task-checkbox';

        const span = document.createElement('span');
        span.className = 'task-text';
        span.innerText = text;
        span.style.flexGrow = '1';
        
        // Apply strike-through if already completed
        if (completed) {
            span.style.textDecoration = 'line-through';
            span.style.opacity = '0.5';
        }

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerText = 'Remove';

        // Checkbox click event (Mark as Done)
        checkbox.addEventListener('change', function() {
            if (checkbox.checked) {
                span.style.textDecoration = 'line-through';
                span.style.opacity = '0.5';
                dingSound.play(); // Play sound when marking as done
            } else {
                span.style.textDecoration = 'none';
                span.style.opacity = '1';
            }
            updateTaskStatus(text, checkbox.checked);
        });

        removeBtn.addEventListener('click', () => {
            li.style.opacity = '0';
            li.style.transition = '0.3s';
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