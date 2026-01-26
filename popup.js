document.addEventListener('DOMContentLoaded', function () {
    const taskInput = document.getElementById('taskInput');
    const priorityInput = document.getElementById('priorityInput');
    const saveButton = document.getElementById('saveButton');
    const listContainer = document.getElementById('listContainer');
    const emptyMessage = document.getElementById('emptyMessage');
    const dateDisplay = document.getElementById('dateDisplay');
    const taskCount = document.getElementById('taskCount');
    const clearAllBtn = document.getElementById('clearAll');
    const searchInput = document.getElementById('searchInput');
    const themeToggle = document.getElementById('themeToggle');

    const dingSound = new Audio('ding.mp3');

    // Display current date
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    dateDisplay.innerText = new Date().toLocaleDateString('en-US', options);

    // Initialize UI and theme preference
    updateUI();
    loadTheme();

    // Theme Toggle Logic
    function loadTheme() {
        chrome.storage.sync.get(['theme'], (result) => {
            if (result.theme === 'dark') {
                document.body.classList.add('dark-mode');
                themeToggle.innerText = '☀️';
            }
        });
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        themeToggle.innerText = isDark ? '☀️' : '🌙';
        
        // Save current theme to storage
        chrome.storage.sync.set({ theme: isDark ? 'dark' : 'light' });
    });

    // Update UI based on task count
    function updateUI() {
        const count = listContainer.children.length;
        taskCount.innerText = `Tasks: ${count}`;
        
        if (count === 0) {
            emptyMessage.style.display = 'block';
            taskCount.style.color = '#2ecc71'; 
        } else {
            emptyMessage.style.display = 'none';
            taskCount.style.color = '#95a5a6';
        }
    }

    // Search Functionality
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const tasks = listContainer.querySelectorAll('li');
        
        tasks.forEach(task => {
            const taskText = task.querySelector('.task-text').innerText.toLowerCase();
            if (taskText.includes(term)) {
                task.style.display = 'flex';
            } else {
                task.style.display = 'none';
            }
        });
    });

    // Load tasks from storage and SORT them by priority
    chrome.storage.sync.get(['tasks'], function (result) {
        if (result.tasks) {
            const priorityOrder = { high: 1, medium: 2, low: 3 };
            
            const sortedTasks = result.tasks.sort((a, b) => {
                return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
            });

            sortedTasks.forEach(taskObj => {
                addTaskToDOM(taskObj.text, taskObj.completed, taskObj.priority);
            });
        }
        updateUI();
    });

    // Save task event
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

    // Helper to add task elements to UI
    function addTaskToDOM(text, completed = false, priority = 'medium') {
        const li = document.createElement('li');
        
        // Apply priority color borders
        if (priority === 'high') li.style.borderLeft = '5px solid #ff7675';
        else if (priority === 'low') li.style.borderLeft = '5px solid #2ecc71';
        else li.style.borderLeft = '5px solid #3498db';
        
        // Entry animation
        li.style.opacity = '0';
        li.style.transform = 'translateY(-10px)';
        li.style.transition = 'all 0.5s ease';
        setTimeout(() => { li.style.opacity = '1'; li.style.transform = 'translateY(0)'; }, 10);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = completed;
        checkbox.className = 'task-checkbox';

        // Create priority tag
        const tag = document.createElement('span');
        tag.innerText = priority.toUpperCase();
        tag.style.fontSize = '9px';
        tag.style.padding = '2px 6px';
        tag.style.borderRadius = '4px';
        tag.style.marginRight = '8px';
        tag.style.fontWeight = 'bold';
        tag.style.color = 'white';
        
        if (priority === 'high') tag.style.backgroundColor = '#ff7675';
        else if (priority === 'low') tag.style.backgroundColor = '#2ecc71';
        else tag.style.backgroundColor = '#3498db';

        const span = document.createElement('span');
        span.className = 'task-text';
        span.innerText = text;
        if (completed) { span.style.textDecoration = 'line-through'; span.style.opacity = '0.5'; }

        const btnContainer = document.createElement('div');
        btnContainer.className = 'action-btns';

        const editBtn = document.createElement('button');
        editBtn.innerText = 'Edit';
        editBtn.className = 'edit-btn';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerText = 'Remove';

        // Edit listener
        editBtn.addEventListener('click', () => {
            const newText = prompt("Edit your task:", span.innerText);
            if (newText !== null && newText.trim() !== "") {
                const oldText = span.innerText;
                span.innerText = newText;
                updateTaskText(oldText, newText);
            }
        });

        // Checkbox listener
        checkbox.addEventListener('change', function() {
            if (checkbox.checked) { 
                span.style.textDecoration = 'line-through'; 
                span.style.opacity = '0.5'; 
                dingSound.play(); 
            } else { 
                span.style.textDecoration = 'none'; 
                span.style.opacity = '1'; 
            }
            updateTaskStatus(span.innerText, checkbox.checked);
        });

        // Remove listener
        removeBtn.addEventListener('click', () => {
            li.style.transform = 'translateX(20px)';
            li.style.opacity = '0';
            setTimeout(() => { 
                li.remove(); 
                removeTask(span.innerText); 
                updateUI(); 
            }, 300);
        });

        li.appendChild(checkbox);
        li.appendChild(tag);
        li.appendChild(span);
        btnContainer.appendChild(editBtn);
        btnContainer.appendChild(removeBtn);
        li.appendChild(btnContainer);
        listContainer.appendChild(li);
    }

    // Clear completed tasks
    clearAllBtn.addEventListener('click', () => {
        chrome.storage.sync.get(['tasks'], (r) => {
            if (r.tasks) {
                const remaining = r.tasks.filter(t => !t.completed);
                chrome.storage.sync.set({ tasks: remaining }, () => {
                    listContainer.innerHTML = '';
                    remaining.forEach(t => addTaskToDOM(t.text, t.completed, t.priority));
                    updateUI();
                });
            }
        });
    });

    // Storage helpers
    function saveTask(taskObj) {
        chrome.storage.sync.get(['tasks'], r => {
            const ts = r.tasks ? [...r.tasks, taskObj] : [taskObj];
            chrome.storage.sync.set({ tasks: ts });
        });
    }

    function updateTaskStatus(text, isCompleted) {
        chrome.storage.sync.get(['tasks'], r => {
            if (r.tasks) {
                const updatedTasks = r.tasks.map(t => (t.text === text ? { ...t, completed: isCompleted } : t));
                chrome.storage.sync.set({ tasks: updatedTasks });
            }
        });
    }

    function updateTaskText(oldText, newText) {
        chrome.storage.sync.get(['tasks'], r => {
            if (r.tasks) {
                const updatedTasks = r.tasks.map(t => (t.text === oldText ? { ...t, text: newText } : t));
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