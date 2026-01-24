document.addEventListener('DOMContentLoaded', function () {
    const taskInput = document.getElementById('taskInput');
    const priorityInput = document.getElementById('priorityInput');
    const saveButton = document.getElementById('saveButton');
    const listContainer = document.getElementById('listContainer');
    const emptyMessage = document.getElementById('emptyMessage');
    const dateDisplay = document.getElementById('dateDisplay');
    const taskCount = document.getElementById('taskCount');
    const clearAllBtn = document.getElementById('clearAll');

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
            result.tasks.forEach(taskObj => addTaskToDOM(taskObj.text, taskObj.completed, taskObj.priority));
        }
        updateUI();
    });

    saveButton.addEventListener('click', function () {
        const taskVal = taskInput.value.trim();
        const priorityVal = priorityInput.value;

        if (taskVal) {
            const taskObj = { text: taskVal, completed: false, priority: priorityVal };
            addTaskToDOM(taskObj.text, taskObj.completed, taskObj.priority);
            saveTask(taskObj);
            taskInput.value = '';
            updateUI();
        }
    });

    function addTaskToDOM(text, completed = false, priority = 'medium') {
        const li = document.createElement('li');
        
        // Priority Border Colors
        if (priority === 'high') {
            li.style.borderLeft = '5px solid #ff7675'; // Red
        } else if (priority === 'low') {
            li.style.borderLeft = '5px solid #2ecc71'; // Green
        } else {
            li.style.borderLeft = '5px solid #3498db'; // Blue
        }
        
        // Fade-in Animation
        li.style.opacity = '0';
        li.style.transform = 'translateY(-10px)';
        li.style.transition = 'all 0.5s ease';
        
        setTimeout(() => {
            li.style.opacity = '1';
            li.style.transform = 'translateY(0)';
        }, 10);

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

        removeBtn.addEventListener('click', () => {
            li.style.transform = 'translateX(20px)';
            li.style.opacity = '0';
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

    clearAllBtn.addEventListener('click', () => {
        chrome.storage.sync.get(['tasks'], (result) => {
            if (result.tasks) {
                const remainingTasks = result.tasks.filter(t => !t.completed);
                chrome.storage.sync.set({ tasks: remainingTasks }, () => {
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