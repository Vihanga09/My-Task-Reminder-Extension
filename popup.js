document.addEventListener('DOMContentLoaded', function () {
    const taskInput = document.getElementById('taskInput');
    const priorityInput = document.getElementById('priorityInput');
    const categoryInput = document.getElementById('categoryInput'); 
    const saveButton = document.getElementById('saveButton');
    const listContainer = document.getElementById('listContainer');
    const emptyMessage = document.getElementById('emptyMessage');
    const dateDisplay = document.getElementById('dateDisplay');
    const taskCount = document.getElementById('taskCount');
    const clearAllBtn = document.getElementById('clearAll');
    const searchInput = document.getElementById('searchInput');
    const themeToggle = document.getElementById('themeToggle');

    const dingSound = new Audio('ding.mp3');

    // Set current date on the header
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    dateDisplay.innerText = new Date().toLocaleDateString('en-US', options);

    // Initial UI and theme load
    updateUI();
    loadTheme();

    // Theme switching logic
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
        chrome.storage.sync.set({ theme: isDark ? 'dark' : 'light' });
    });

    // Update the task counter and empty message
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

    // Search functionality to filter tasks by text
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const tasks = listContainer.querySelectorAll('li');
        
        tasks.forEach(task => {
            const taskText = task.querySelector('.task-text').innerText.toLowerCase();
            task.style.display = taskText.includes(term) ? 'flex' : 'none';
        });
    });

    // Load and sort tasks by priority on startup
    chrome.storage.sync.get(['tasks'], function (result) {
        if (result.tasks) {
            const priorityOrder = { high: 1, medium: 2, low: 3 };
            const sortedTasks = result.tasks.sort((a, b) => {
                return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
            });

            sortedTasks.forEach(taskObj => {
                addTaskToDOM(taskObj.text, taskObj.completed, taskObj.priority, taskObj.category);
            });
        }
        updateUI();
    });

    // Event listener to save a new task
    saveButton.addEventListener('click', function () {
        const taskVal = taskInput.value.trim();
        const priorityVal = priorityInput.value;
        const categoryVal = categoryInput.value;

        if (taskVal) {
            const taskObj = { 
                text: taskVal, 
                completed: false, 
                priority: priorityVal,
                category: categoryVal 
            };
            addTaskToDOM(taskObj.text, taskObj.completed, taskObj.priority, taskObj.category);
            saveTask(taskObj);
            taskInput.value = '';
            updateUI();
        }
    });

    // Main function to build task item in the DOM
    function addTaskToDOM(text, completed = false, priority = 'medium', category = 'general') {
        const li = document.createElement('li');
        
        // Priority color border
        if (priority === 'high') li.style.borderLeft = '5px solid #ff7675';
        else if (priority === 'low') li.style.borderLeft = '5px solid #2ecc71';
        else li.style.borderLeft = '5px solid #3498db';
        
        // Task entry animation
        li.style.opacity = '0';
        li.style.transform = 'translateY(-10px)';
        li.style.transition = 'all 0.5s ease';
        setTimeout(() => { li.style.opacity = '1'; li.style.transform = 'translateY(0)'; }, 10);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = completed;
        checkbox.className = 'task-checkbox';

        // Priority tag element
        const tag = document.createElement('span');
        tag.innerText = priority.toUpperCase();
        tag.style.cssText = "font-size: 9px; padding: 2px 6px; border-radius: 4px; margin-right: 8px; font-weight: bold; color: white;";
        
        if (priority === 'high') tag.style.backgroundColor = '#ff7675';
        else if (priority === 'low') tag.style.backgroundColor = '#2ecc71';
        else tag.style.backgroundColor = '#3498db';

        // --- COMMIT 2: Visual Category Tag Implementation ---
        const catTag = document.createElement('span');
        catTag.className = 'category-tag';
        catTag.innerText = category.toUpperCase();

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

        // Checkbox status listener
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

        // Remove task listener
        removeBtn.addEventListener('click', () => {
            li.style.transform = 'translateX(20px)';
            li.style.opacity = '0';
            setTimeout(() => { 
                li.remove(); 
                removeTask(span.innerText); 
                updateUI(); 
            }, 300);
        });

        // Append everything to the list item
        li.appendChild(checkbox);
        li.appendChild(tag);
        li.appendChild(catTag); // Visual Category Tag
        li.appendChild(span);
        btnContainer.appendChild(editBtn);
        btnContainer.appendChild(removeBtn);
        li.appendChild(btnContainer);
        listContainer.appendChild(li);
    }

    // Storage utility functions
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