document.addEventListener('DOMContentLoaded', function () {
    const taskInput = document.getElementById('taskInput');
    const saveButton = document.getElementById('saveButton');
    const listContainer = document.getElementById('listContainer');
    const emptyMessage = document.getElementById('emptyMessage');
    const dateDisplay = document.getElementById('dateDisplay');
    const taskCount = document.getElementById('taskCount');

    // Load success sound
    const dingSound = new Audio('ding.mp3');

    // Show current date
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
            result.tasks.forEach(task => addTaskToDOM(task));
        }
        updateUI();
    });

    saveButton.addEventListener('click', function () {
        const taskVal = taskInput.value.trim();
        if (taskVal) {
            addTaskToDOM(taskVal);
            saveTask(taskVal);
            taskInput.value = '';
            updateUI();
        }
    });

    function addTaskToDOM(task) {
        const li = document.createElement('li');
        li.innerHTML = `<span class="task-text">${task}</span><button class="remove-btn">Remove</button>`;
        
        li.querySelector('.remove-btn').addEventListener('click', () => {
            dingSound.play(); // Play "Ding" sound
            li.style.opacity = '0';
            li.style.transition = '0.3s';
            setTimeout(() => {
                li.remove();
                removeTask(task);
                updateUI();
            }, 300);
        });
        listContainer.appendChild(li);
    }

    function saveTask(t) {
        chrome.storage.sync.get(['tasks'], r => {
            const ts = r.tasks ? [...r.tasks, t] : [t];
            chrome.storage.sync.set({tasks: ts});
        });
    }

    function removeTask(t) {
        chrome.storage.sync.get(['tasks'], r => {
            if (r.tasks) {
                chrome.storage.sync.set({tasks: r.tasks.filter(x => x !== t)});
            }
        });
    }
});